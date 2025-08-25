-- Fix Critical Privilege Escalation Vulnerability in user_roles table
-- Add UPDATE and DELETE policies to prevent users from modifying their own roles

-- Add UPDATE policy to prevent role escalation
CREATE POLICY "Prevent users from updating their own roles" 
ON public.user_roles 
FOR UPDATE 
USING (false);

-- Add DELETE policy to prevent role deletion by users  
CREATE POLICY "Prevent users from deleting their own roles"
ON public.user_roles 
FOR DELETE
USING (false);

-- Fix Database Function Security Gaps - Add search_path protection to all functions

-- 1. Update handle_referral_signup function
CREATE OR REPLACE FUNCTION public.handle_referral_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    referrer_id UUID;
    reward_amount DECIMAL(10,2) := 10.00; -- 10 credits for referral
BEGIN
    -- Check if user was referred by someone
    IF NEW.referred_by IS NOT NULL THEN
        -- Find the referrer
        SELECT user_id INTO referrer_id
        FROM public.profiles
        WHERE referral_code = NEW.referred_by;
        
        -- If referrer exists, give them credits
        IF referrer_id IS NOT NULL THEN
            UPDATE public.profiles
            SET credits = credits + reward_amount
            WHERE user_id = referrer_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 2. Update get_user_current_subscription function
CREATE OR REPLACE FUNCTION public.get_user_current_subscription(user_id_param uuid)
 RETURNS TABLE(plan_name text, daily_survey_limit integer, status text, end_date timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT 
    sp.name,
    sp.daily_survey_limit,
    s.status,
    s.end_date
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON s.plan_id = sp.id
  WHERE s.user_id = user_id_param
    AND s.status = 'active'
    AND s.end_date > now()
  ORDER BY s.created_at DESC
  LIMIT 1;
$function$;

-- 3. Update get_daily_survey_count function
CREATE OR REPLACE FUNCTION public.get_daily_survey_count(user_id_param uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.daily_survey_access
  WHERE user_id = user_id_param
    AND access_date = CURRENT_DATE;
$function$;

-- 4. Update generate_referral_code function
CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate 8 character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_check;
        
        -- If code doesn't exist, we can use it
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$function$;

-- 5. Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    public.generate_referral_code(),
    NEW.raw_user_meta_data ->> 'referred_by'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- 6. Update can_access_survey function
CREATE OR REPLACE FUNCTION public.can_access_survey(user_id_param uuid, survey_id_param uuid, survey_reward numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    has_completed boolean := false;
    last_completion_time timestamp with time zone;
    user_subscription record;
    daily_count integer;
    is_free_survey boolean := false;
    recent_low_reward_count integer := 0;
BEGIN
    -- Check if it's the free demographics survey
    SELECT title = 'Free Demographics Survey' INTO is_free_survey
    FROM public.surveys 
    WHERE id = survey_id_param;
    
    -- Check if user has already completed this survey
    SELECT EXISTS(
        SELECT 1 FROM public.survey_responses 
        WHERE user_id = user_id_param AND survey_id = survey_id_param
    ) INTO has_completed;
    
    -- If it's the free demographics survey and completed, don't allow access
    IF is_free_survey AND has_completed THEN
        RETURN false;
    END IF;
    
    -- If it's the free demographics survey and not completed, allow access
    IF is_free_survey AND NOT has_completed THEN
        RETURN true;
    END IF;
    
    -- For surveys with reward below 50, check 24-hour rule (1 per 24 hours for all users)
    IF survey_reward < 50 THEN
        -- If already completed this specific survey, check 24-hour rule
        IF has_completed THEN
            SELECT MAX(completed_at) INTO last_completion_time
            FROM public.survey_responses 
            WHERE user_id = user_id_param AND survey_id = survey_id_param;
            
            -- Allow access if more than 24 hours have passed
            IF last_completion_time < (now() - interval '24 hours') THEN
                RETURN true;
            ELSE
                RETURN false;
            END IF;
        END IF;
        
        -- Count how many surveys with reward < 50 were completed in the last 24 hours (excluding free demographics)
        SELECT COUNT(*) INTO recent_low_reward_count
        FROM public.survey_responses sr
        JOIN public.surveys s ON sr.survey_id = s.id
        WHERE sr.user_id = user_id_param 
        AND sr.completed_at > (now() - interval '24 hours')
        AND s.reward < 50
        AND s.title != 'Free Demographics Survey';
        
        -- Allow access if haven't done any low-reward survey in the last 24 hours
        IF recent_low_reward_count = 0 THEN
            RETURN true;
        ELSE
            RETURN false;
        END IF;
    END IF;
    
    -- For premium surveys (50+), check subscription
    SELECT * INTO user_subscription
    FROM public.get_user_current_subscription(user_id_param);
    
    -- If no active subscription, deny access
    IF user_subscription IS NULL THEN
        RETURN false;
    END IF;
    
    -- For premium surveys, if already completed, check 24-hour rule
    IF has_completed THEN
        SELECT MAX(completed_at) INTO last_completion_time
        FROM public.survey_responses 
        WHERE user_id = user_id_param AND survey_id = survey_id_param;
        
        -- Allow access if more than 24 hours have passed
        IF last_completion_time < (now() - interval '24 hours') THEN
            -- Check daily survey limit for premium surveys
            SELECT public.get_daily_survey_count(user_id_param) INTO daily_count;
            RETURN daily_count < user_subscription.daily_survey_limit;
        ELSE
            RETURN false;
        END IF;
    END IF;
    
    -- Check daily survey limit for premium surveys (first time completion)
    SELECT public.get_daily_survey_count(user_id_param) INTO daily_count;
    
    -- Allow access if within daily limit
    RETURN daily_count < user_subscription.daily_survey_limit;
END;
$function$;

-- 7. Update has_role function  
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 8. Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    action text NOT NULL,
    table_name text,
    record_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);
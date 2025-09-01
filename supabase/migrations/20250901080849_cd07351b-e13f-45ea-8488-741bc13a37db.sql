-- Fix Premium 1500 plan daily survey limit (should be 16, not 25)
UPDATE public.subscription_plans 
SET daily_survey_limit = 16 
WHERE name = 'Premium Plus' AND price = 1500;

-- Fix referral reward amount (should be 5 credits, not 10)
CREATE OR REPLACE FUNCTION public.handle_referral_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    referrer_id UUID;
    reward_amount DECIMAL(10,2) := 5.00; -- 5 credits for referral (fixed from 10)
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

-- Create tables for missing gamification features
CREATE TABLE public.daily_logins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    login_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bonus_credits DECIMAL(10,2) DEFAULT 1.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, login_date)
);

CREATE TABLE public.user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.extra_survey_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    credits_used INTEGER DEFAULT 10,
    surveys_unlocked INTEGER DEFAULT 1,
    unlock_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_survey_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_logins
CREATE POLICY "Users can view own daily logins" ON public.daily_logins
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own daily logins" ON public.daily_logins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_streaks
CREATE POLICY "Users can view own streaks" ON public.user_streaks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own streaks" ON public.user_streaks
    FOR ALL USING (auth.uid() = user_id);

-- RLS policies for extra_survey_unlocks
CREATE POLICY "Users can view own unlocks" ON public.extra_survey_unlocks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own unlocks" ON public.extra_survey_unlocks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle daily login bonus
CREATE OR REPLACE FUNCTION public.handle_daily_login(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    login_exists BOOLEAN;
    bonus_credits DECIMAL(10,2) := 1.00;
    result JSONB;
BEGIN
    -- Check if user already logged in today
    SELECT EXISTS(
        SELECT 1 FROM public.daily_logins 
        WHERE user_id = user_id_param AND login_date = CURRENT_DATE
    ) INTO login_exists;
    
    -- If not logged in today, give bonus
    IF NOT login_exists THEN
        -- Insert daily login record
        INSERT INTO public.daily_logins (user_id, bonus_credits)
        VALUES (user_id_param, bonus_credits);
        
        -- Update user credits
        UPDATE public.profiles 
        SET credits = credits + bonus_credits
        WHERE user_id = user_id_param;
        
        result := jsonb_build_object('bonus_awarded', true, 'credits', bonus_credits);
    ELSE
        result := jsonb_build_object('bonus_awarded', false, 'message', 'Already logged in today');
    END IF;
    
    RETURN result;
END;
$function$;

-- Create function to unlock extra surveys with credits
CREATE OR REPLACE FUNCTION public.unlock_extra_survey(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    user_credits DECIMAL(10,2);
    credits_needed INTEGER := 10;
    result JSONB;
BEGIN
    -- Get user's current credits
    SELECT credits INTO user_credits
    FROM public.profiles
    WHERE user_id = user_id_param;
    
    -- Check if user has enough credits
    IF user_credits >= credits_needed THEN
        -- Deduct credits
        UPDATE public.profiles 
        SET credits = credits - credits_needed
        WHERE user_id = user_id_param;
        
        -- Record the unlock
        INSERT INTO public.extra_survey_unlocks (user_id, credits_used)
        VALUES (user_id_param, credits_needed);
        
        result := jsonb_build_object('success', true, 'surveys_unlocked', 1, 'credits_used', credits_needed);
    ELSE
        result := jsonb_build_object('success', false, 'message', 'Insufficient credits', 'required', credits_needed, 'available', user_credits);
    END IF;
    
    RETURN result;
END;
$function$;

-- Update can_access_survey function to include credit-based extra surveys
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
    extra_surveys_unlocked integer := 0;
    total_allowed_surveys integer;
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
    
    -- Get count of extra surveys unlocked today with credits
    SELECT COALESCE(SUM(surveys_unlocked), 0) INTO extra_surveys_unlocked
    FROM public.extra_survey_unlocks
    WHERE user_id = user_id_param AND unlock_date = CURRENT_DATE;
    
    -- Calculate total allowed surveys (subscription limit + extra unlocked)
    total_allowed_surveys := user_subscription.daily_survey_limit + extra_surveys_unlocked;
    
    -- For premium surveys, if already completed, check 24-hour rule
    IF has_completed THEN
        SELECT MAX(completed_at) INTO last_completion_time
        FROM public.survey_responses 
        WHERE user_id = user_id_param AND survey_id = survey_id_param;
        
        -- Allow access if more than 24 hours have passed
        IF last_completion_time < (now() - interval '24 hours') THEN
            -- Check daily survey limit (including extra surveys from credits)
            SELECT public.get_daily_survey_count(user_id_param) INTO daily_count;
            RETURN daily_count < total_allowed_surveys;
        ELSE
            RETURN false;
        END IF;
    END IF;
    
    -- Check daily survey limit for premium surveys (first time completion)
    SELECT public.get_daily_survey_count(user_id_param) INTO daily_count;
    
    -- Allow access if within daily limit (including extra surveys from credits)
    RETURN daily_count < total_allowed_surveys;
END;
$function$;
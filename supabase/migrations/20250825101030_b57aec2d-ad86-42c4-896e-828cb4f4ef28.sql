-- Update can_access_survey function to fix premium survey access rules
-- Premium surveys (>=50) only need subscription, not credits
-- Daily count should only track completed surveys
CREATE OR REPLACE FUNCTION public.can_access_survey(user_id_param uuid, survey_id_param uuid, survey_reward numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
    has_completed boolean := false;
    last_completion_time timestamp with time zone;
    user_subscription record;
    daily_count integer;
    is_free_survey boolean := false;
    recent_low_reward_count integer := 0;
    user_credits numeric := 0;
BEGIN
    -- Check if it's the free demographics survey
    SELECT title = 'Free Demographics Survey' INTO is_free_survey
    FROM surveys 
    WHERE id = survey_id_param;
    
    -- Check if user has already completed this survey
    SELECT EXISTS(
        SELECT 1 FROM survey_responses 
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
    
    -- For surveys with reward below 50, check 24-hour rule and credit requirements
    IF survey_reward < 50 THEN
        -- If already completed this specific survey, check 24-hour rule
        IF has_completed THEN
            SELECT MAX(completed_at) INTO last_completion_time
            FROM survey_responses 
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
        FROM survey_responses sr
        JOIN surveys s ON sr.survey_id = s.id
        WHERE sr.user_id = user_id_param 
        AND sr.completed_at > (now() - interval '24 hours')
        AND s.reward < 50
        AND s.title != 'Free Demographics Survey';
        
        -- Allow access if haven't done any low-reward survey in the last 24 hours
        IF recent_low_reward_count = 0 THEN
            RETURN true;
        END IF;
        
        -- If they've done their free survey, check if they have credits for additional surveys
        SELECT credits INTO user_credits
        FROM profiles
        WHERE user_id = user_id_param;
        
        -- Allow access if they have enough credits (50 credits per survey)
        IF user_credits >= 50 THEN
            RETURN true;
        ELSE
            RETURN false;
        END IF;
    END IF;
    
    -- For premium surveys (50+), only check subscription - NO CREDITS NEEDED
    SELECT * INTO user_subscription
    FROM get_user_current_subscription(user_id_param);
    
    -- If no active subscription, deny access
    IF user_subscription IS NULL THEN
        RETURN false;
    END IF;
    
    -- For premium surveys, if already completed, check 24-hour rule
    IF has_completed THEN
        SELECT MAX(completed_at) INTO last_completion_time
        FROM survey_responses 
        WHERE user_id = user_id_param AND survey_id = survey_id_param;
        
        -- Allow access if more than 24 hours have passed
        IF last_completion_time < (now() - interval '24 hours') THEN
            -- Check daily survey limit for premium surveys (only count completed surveys)
            SELECT COUNT(*) INTO daily_count
            FROM survey_responses sr
            JOIN surveys s ON sr.survey_id = s.id
            WHERE sr.user_id = user_id_param
            AND sr.completed_at::date = CURRENT_DATE
            AND s.reward >= 50;
            
            RETURN daily_count < user_subscription.daily_survey_limit;
        ELSE
            RETURN false;
        END IF;
    END IF;
    
    -- Check daily survey limit for premium surveys (first time completion)
    -- Only count completed surveys, not just access
    SELECT COUNT(*) INTO daily_count
    FROM survey_responses sr
    JOIN surveys s ON sr.survey_id = s.id
    WHERE sr.user_id = user_id_param
    AND sr.completed_at::date = CURRENT_DATE
    AND s.reward >= 50;
    
    -- Allow access if within daily limit
    RETURN daily_count < user_subscription.daily_survey_limit;
END;
$function$

-- Update get_daily_survey_count to only count completed surveys, not access
CREATE OR REPLACE FUNCTION public.get_daily_survey_count(user_id_param uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM survey_responses sr
  JOIN surveys s ON sr.survey_id = s.id
  WHERE sr.user_id = user_id_param
    AND sr.completed_at::date = CURRENT_DATE
    AND s.reward >= 50;
$function$
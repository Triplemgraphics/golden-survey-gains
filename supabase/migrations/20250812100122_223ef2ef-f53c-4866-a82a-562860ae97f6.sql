-- Update the can_access_survey function to implement the new access rules
CREATE OR REPLACE FUNCTION public.can_access_survey(user_id_param uuid, survey_id_param uuid, survey_reward numeric)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
    has_completed boolean := false;
    last_access_date date;
    user_subscription record;
    daily_count integer;
    is_free_survey boolean := false;
    daily_low_reward_count integer := 0;
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
    
    -- If already completed any other survey, check 24-hour rule
    IF has_completed THEN
        SELECT MAX(DATE(completed_at)) INTO last_access_date
        FROM survey_responses 
        WHERE user_id = user_id_param AND survey_id = survey_id_param;
        
        -- Allow access if more than 24 hours have passed
        IF last_access_date < CURRENT_DATE THEN
            RETURN true;
        ELSE
            RETURN false;
        END IF;
    END IF;
    
    -- For surveys with reward below 50, check daily limit (1 per day for all users)
    IF survey_reward < 50 THEN
        -- Count how many surveys with reward < 50 were completed today (excluding free demographics)
        SELECT COUNT(*) INTO daily_low_reward_count
        FROM survey_responses sr
        JOIN surveys s ON sr.survey_id = s.id
        WHERE sr.user_id = user_id_param 
        AND DATE(sr.completed_at) = CURRENT_DATE
        AND s.reward < 50
        AND s.title != 'Free Demographics Survey';
        
        -- Allow access if haven't done any low-reward survey today
        IF daily_low_reward_count = 0 THEN
            RETURN true;
        ELSE
            RETURN false;
        END IF;
    END IF;
    
    -- For premium surveys (50+), check subscription
    SELECT * INTO user_subscription
    FROM get_user_current_subscription(user_id_param);
    
    -- If no active subscription, deny access
    IF user_subscription IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check daily survey limit for premium surveys
    SELECT get_daily_survey_count(user_id_param) INTO daily_count;
    
    -- Allow access if within daily limit
    RETURN daily_count < user_subscription.daily_survey_limit;
END;
$function$;
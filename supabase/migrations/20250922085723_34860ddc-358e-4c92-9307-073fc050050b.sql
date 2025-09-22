-- Fix the get_user_current_subscription function to use the correct parameter
DROP FUNCTION IF EXISTS public.get_user_current_subscription(uuid);

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
    AND s.end_date > now()
  ORDER BY s.created_at DESC
  LIMIT 1;
$function$
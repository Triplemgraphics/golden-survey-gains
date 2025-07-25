-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  daily_survey_limit INTEGER NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, expired, rejected
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  mpesa_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID
);

-- Create daily survey access tracking table
CREATE TABLE public.daily_survey_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  survey_id UUID NOT NULL REFERENCES public.surveys(id),
  access_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, survey_id, access_date)
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_survey_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans (public read access)
CREATE POLICY "Anyone can view subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for daily_survey_access
CREATE POLICY "Users can view their own daily access" 
ON public.daily_survey_access 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily access" 
ON public.daily_survey_access 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily access" 
ON public.daily_survey_access 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updating subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, price, daily_survey_limit, duration_days) VALUES
('Basic Premium', 300, 5, 30),
('Standard Premium', 500, 10, 30),
('Premium Plus', 1000, 25, 30);

-- Add function to get user's current subscription
CREATE OR REPLACE FUNCTION public.get_user_current_subscription(user_id_param UUID)
RETURNS TABLE (
  plan_name TEXT,
  daily_survey_limit INTEGER,
  status TEXT,
  end_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
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
$$;

-- Add function to get daily survey count
CREATE OR REPLACE FUNCTION public.get_daily_survey_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.daily_survey_access
  WHERE user_id = user_id_param
    AND access_date = CURRENT_DATE;
$$;
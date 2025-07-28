-- Update subscription plans pricing and add withdrawal benefits
UPDATE public.subscription_plans 
SET 
  price = 500,
  name = 'Basic Premium'
WHERE name = 'Basic Premium';

UPDATE public.subscription_plans 
SET 
  price = 1000,
  name = 'Standard Premium'
WHERE name = 'Standard Premium';

UPDATE public.subscription_plans 
SET 
  price = 1500,
  name = 'Premium Plus'
WHERE name = 'Premium Plus';

-- Add benefits column to store withdrawal minimums and other benefits
ALTER TABLE public.subscription_plans 
ADD COLUMN benefits JSONB DEFAULT '[]'::jsonb;

-- Update plans with withdrawal benefits
UPDATE public.subscription_plans 
SET benefits = '["Minimum withdrawal Ksh 3,500"]'::jsonb
WHERE name = 'Basic Premium';

UPDATE public.subscription_plans 
SET benefits = '["Minimum withdrawal Ksh 3,000"]'::jsonb
WHERE name = 'Standard Premium';

UPDATE public.subscription_plans 
SET benefits = '["Minimum withdrawal Ksh 2,500"]'::jsonb
WHERE name = 'Premium Plus';
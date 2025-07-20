-- Add fields to profiles table for credits, referral system, and test completion
ALTER TABLE public.profiles 
ADD COLUMN credits DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN test_survey_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN referred_by TEXT REFERENCES public.profiles(referral_code);

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('bank_transfer', 'paypal', 'mpesa')),
  details JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_methods
CREATE POLICY "Users can manage their own payment methods" 
ON public.payment_methods 
FOR ALL 
USING (auth.uid() = user_id);

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Update handle_new_user function to generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    generate_referral_code()
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create function to handle referral rewards
CREATE OR REPLACE FUNCTION handle_referral_signup()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for referral rewards
CREATE TRIGGER referral_reward_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_referral_signup();

-- Update surveys with more questions and premium flag
UPDATE public.surveys 
SET questions = CASE 
    WHEN title = 'Consumer Spending Habits' THEN 
    '[
        {"id": 1, "text": "What is your monthly household income range?", "type": "multiple_choice", "options": ["Below Ksh 20,000", "Ksh 20,000-50,000", "Ksh 50,000-100,000", "Above Ksh 100,000"]},
        {"id": 2, "text": "How much do you spend on groceries monthly?", "type": "multiple_choice", "options": ["Below Ksh 5,000", "Ksh 5,000-10,000", "Ksh 10,000-20,000", "Above Ksh 20,000"]},
        {"id": 3, "text": "Which retail chains do you visit most frequently?", "type": "multiple_choice", "options": ["Naivas", "Carrefour", "Quickmart", "Tuskys", "Local shops"]},
        {"id": 4, "text": "What percentage of your shopping is done online?", "type": "multiple_choice", "options": ["0-25%", "26-50%", "51-75%", "76-100%"]},
        {"id": 5, "text": "Which payment method do you prefer for shopping?", "type": "multiple_choice", "options": ["Cash", "M-Pesa", "Credit/Debit Card", "Bank Transfer"]},
        {"id": 6, "text": "How often do you purchase luxury items?", "type": "multiple_choice", "options": ["Never", "Rarely", "Sometimes", "Frequently"]},
        {"id": 7, "text": "What influences your purchasing decisions most?", "type": "multiple_choice", "options": ["Price", "Quality", "Brand", "Reviews", "Recommendations"]}
    ]'::jsonb
    WHEN title = 'Digital Banking Preferences' THEN 
    '[
        {"id": 1, "text": "Which bank do you primarily use for digital services?", "type": "multiple_choice", "options": ["Equity Bank", "KCB", "Cooperative Bank", "NCBA", "Absa", "Standard Chartered"]},
        {"id": 2, "text": "How often do you use mobile banking?", "type": "multiple_choice", "options": ["Daily", "Weekly", "Monthly", "Rarely", "Never"]},
        {"id": 3, "text": "What digital banking feature do you use most?", "type": "multiple_choice", "options": ["Balance inquiry", "Money transfer", "Bill payment", "Loan application", "Investment"]},
        {"id": 4, "text": "How satisfied are you with your bank''s mobile app?", "type": "multiple_choice", "options": ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"]},
        {"id": 5, "text": "What concerns you most about digital banking?", "type": "multiple_choice", "options": ["Security", "Transaction fees", "App reliability", "Customer support", "Internet connectivity"]},
        {"id": 6, "text": "Do you use digital lending services?", "type": "multiple_choice", "options": ["Yes, frequently", "Yes, occasionally", "Rarely", "Never", "Don''t know about them"]},
        {"id": 7, "text": "Which digital payment platform do you trust most?", "type": "multiple_choice", "options": ["M-Pesa", "Airtel Money", "T-Kash", "Bank apps", "PayPal"]}
    ]'::jsonb
    WHEN title = 'E-commerce Experience' THEN 
    '[
        {"id": 1, "text": "Which e-commerce platform do you use most?", "type": "multiple_choice", "options": ["Jumia", "Kilimall", "Masoko", "Jiji", "Local online stores"]},
        {"id": 2, "text": "How often do you shop online?", "type": "multiple_choice", "options": ["Daily", "Weekly", "Monthly", "Few times a year", "Never"]},
        {"id": 3, "text": "What do you buy online most frequently?", "type": "multiple_choice", "options": ["Electronics", "Clothing", "Books", "Groceries", "Home items"]},
        {"id": 4, "text": "What is your biggest concern when shopping online?", "type": "multiple_choice", "options": ["Product quality", "Delivery time", "Security", "Return policy", "Customer service"]},
        {"id": 5, "text": "How do you prefer to pay for online purchases?", "type": "multiple_choice", "options": ["M-Pesa", "Credit card", "Cash on delivery", "Bank transfer", "Digital wallets"]},
        {"id": 6, "text": "What delivery timeframe do you expect?", "type": "multiple_choice", "options": ["Same day", "Next day", "2-3 days", "Within a week", "Doesn''t matter"]},
        {"id": 7, "text": "How important are customer reviews in your purchase decision?", "type": "multiple_choice", "options": ["Very important", "Important", "Somewhat important", "Not important", "I don''t read them"]}
    ]'::jsonb
    WHEN title = 'Transportation Preferences' THEN 
    '[
        {"id": 1, "text": "What is your primary mode of transportation in Nairobi?", "type": "multiple_choice", "options": ["Matatu", "Uber/Bolt", "Personal car", "Boda boda", "Walking"]},
        {"id": 2, "text": "How much do you spend on transport daily?", "type": "multiple_choice", "options": ["Below Ksh 100", "Ksh 100-200", "Ksh 200-500", "Ksh 500-1000", "Above Ksh 1000"]},
        {"id": 3, "text": "Which ride-hailing app do you prefer?", "type": "multiple_choice", "options": ["Uber", "Bolt", "Little Cab", "Faras", "None"]},
        {"id": 4, "text": "What time do you usually commute to work?", "type": "multiple_choice", "options": ["6:00-7:00 AM", "7:00-8:00 AM", "8:00-9:00 AM", "9:00-10:00 AM", "Work from home"]},
        {"id": 5, "text": "How satisfied are you with public transport?", "type": "multiple_choice", "options": ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"]},
        {"id": 6, "text": "What would improve your commuting experience?", "type": "multiple_choice", "options": ["Better roads", "More matatus", "Cheaper fares", "Digital payment", "Better safety"]},
        {"id": 7, "text": "Do you use cashless payment for transport?", "type": "multiple_choice", "options": ["Always", "Often", "Sometimes", "Rarely", "Never"]}
    ]'::jsonb
    WHEN title = 'Food Delivery Services' THEN 
    '[
        {"id": 1, "text": "Which food delivery app do you use most?", "type": "multiple_choice", "options": ["Uber Eats", "Glovo", "Bolt Food", "Jumia Food", "Local delivery"]},
        {"id": 2, "text": "How often do you order food delivery?", "type": "multiple_choice", "options": ["Daily", "Weekly", "Monthly", "Rarely", "Never"]},
        {"id": 3, "text": "What type of food do you order most?", "type": "multiple_choice", "options": ["Fast food", "Local cuisine", "International", "Healthy options", "Desserts"]},
        {"id": 4, "text": "What is your average spending per food order?", "type": "multiple_choice", "options": ["Below Ksh 500", "Ksh 500-1000", "Ksh 1000-1500", "Ksh 1500-2000", "Above Ksh 2000"]},
        {"id": 5, "text": "What influences your restaurant choice?", "type": "multiple_choice", "options": ["Price", "Ratings", "Delivery time", "Cuisine type", "Promotions"]},
        {"id": 6, "text": "How important is delivery time to you?", "type": "multiple_choice", "options": ["Very important", "Important", "Somewhat important", "Not important", "I don''t mind waiting"]},
        {"id": 7, "text": "What would make you order more frequently?", "type": "multiple_choice", "options": ["Lower prices", "Faster delivery", "More restaurants", "Better packaging", "Loyalty rewards"]}
    ]'::jsonb
END;

-- Add trigger for updated_at on payment_methods
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
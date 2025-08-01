-- Allow users to create their own earnings records
CREATE POLICY "Users can create their own earnings" 
ON public.earnings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
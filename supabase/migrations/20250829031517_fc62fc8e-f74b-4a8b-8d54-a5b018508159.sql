-- Create reading plan table
CREATE TABLE public.reading_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id BIGINT NOT NULL,
  order_position INTEGER NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reading_plan ENABLE ROW LEVEL SECURITY;

-- Create policies for reading plan
CREATE POLICY "Users can view their own reading plan" 
ON public.reading_plan 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading plan entries" 
ON public.reading_plan 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading plan" 
ON public.reading_plan 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading plan entries" 
ON public.reading_plan 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create AI chat history table
CREATE TABLE public.ai_chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id BIGINT,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for AI chat
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies for AI chat
CREATE POLICY "Users can view their own AI chat history" 
ON public.ai_chat_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI chat entries" 
ON public.ai_chat_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_reading_plan_user_id ON public.reading_plan(user_id);
CREATE INDEX idx_reading_plan_order ON public.reading_plan(user_id, order_position);
CREATE INDEX idx_ai_chat_user_book ON public.ai_chat_history(user_id, book_id);

-- Create storage bucket for book screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-screenshots', 'book-screenshots', true);
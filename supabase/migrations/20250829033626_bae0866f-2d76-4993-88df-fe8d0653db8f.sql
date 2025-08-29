-- Ativar RLS nas tabelas críticas
ALTER TABLE book_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Políticas para book_favorites
CREATE POLICY "Users can view their own favorites" 
ON book_favorites 
FOR SELECT 
USING (auth.uid()::text = user_ip OR ('user-' || auth.uid()::text) = user_ip);

CREATE POLICY "Users can create their own favorites" 
ON book_favorites 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_ip OR ('user-' || auth.uid()::text) = user_ip);

CREATE POLICY "Users can delete their own favorites" 
ON book_favorites 
FOR DELETE 
USING (auth.uid()::text = user_ip OR ('user-' || auth.uid()::text) = user_ip);

-- Políticas para book_reading_progress  
CREATE POLICY "Users can view their own reading progress" 
ON book_reading_progress 
FOR SELECT 
USING (auth.uid()::text = user_ip OR ('user-' || auth.uid()::text) = user_ip);

CREATE POLICY "Users can create their own reading progress" 
ON book_reading_progress 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_ip OR ('user-' || auth.uid()::text) = user_ip);

CREATE POLICY "Users can update their own reading progress" 
ON book_reading_progress 
FOR UPDATE 
USING (auth.uid()::text = user_ip OR ('user-' || auth.uid()::text) = user_ip);

-- Políticas para reading_plan
CREATE POLICY "Users can view their own reading plan" 
ON reading_plan 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading plan" 
ON reading_plan 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading plan" 
ON reading_plan 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading plan" 
ON reading_plan 
FOR DELETE 
USING (auth.uid() = user_id);

-- Verificar se a tabela reading_plan existe, se não, criar
CREATE TABLE IF NOT EXISTS reading_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id BIGINT NOT NULL,
  order_position INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
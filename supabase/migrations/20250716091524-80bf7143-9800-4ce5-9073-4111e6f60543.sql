-- Create table for storing AI conversations
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_session VARCHAR(255) NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_ai_conversations_session ON public.ai_conversations(user_session);
CREATE INDEX idx_ai_conversations_created_at ON public.ai_conversations(created_at);
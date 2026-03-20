
-- Criar tabela para lançamentos do fluxo de caixa
CREATE TABLE public.cash_flow_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID REFERENCES public.projects,
  week_number INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saida')),
  description_category TEXT NOT NULL,
  item_description TEXT NOT NULL,
  location TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('transferencia', 'pix', 'cartao_credito')),
  transaction_date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  item_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS à tabela
ALTER TABLE public.cash_flow_entries ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own cash flow entries" 
  ON public.cash_flow_entries 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cash flow entries" 
  ON public.cash_flow_entries 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash flow entries" 
  ON public.cash_flow_entries 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash flow entries" 
  ON public.cash_flow_entries 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX idx_cash_flow_entries_user_id ON public.cash_flow_entries(user_id);
CREATE INDEX idx_cash_flow_entries_week ON public.cash_flow_entries(week_number, week_start_date);
CREATE INDEX idx_cash_flow_entries_date ON public.cash_flow_entries(transaction_date);

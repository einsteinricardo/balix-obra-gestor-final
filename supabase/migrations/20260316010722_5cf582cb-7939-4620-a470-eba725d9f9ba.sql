
-- Add admin bypass RLS policies to all data tables
-- Using has_role() security definer function to avoid recursion

-- projects
CREATE POLICY "admin_all_projects"
ON public.projects FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- documents
CREATE POLICY "admin_all_documents"
ON public.documents FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- financial_records
CREATE POLICY "admin_all_financial_records"
ON public.financial_records FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- cash_flow_entries
CREATE POLICY "admin_all_cash_flow_entries"
ON public.cash_flow_entries FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- gantt_tasks
CREATE POLICY "admin_all_gantt_tasks"
ON public.gantt_tasks FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- project_stages
CREATE POLICY "admin_all_project_stages"
ON public.project_stages FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- work_diary
CREATE POLICY "admin_all_work_diary"
ON public.work_diary FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- orcamentos
CREATE POLICY "admin_all_orcamentos"
ON public.orcamentos FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- orcamento_atividades
CREATE POLICY "admin_all_orcamento_atividades"
ON public.orcamento_atividades FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- cronograma_execucoes
CREATE POLICY "admin_all_cronograma_execucoes"
ON public.cronograma_execucoes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

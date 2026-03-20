
-- Add obra_users-based RLS policies for orcamento_atividades
CREATE POLICY "obra_users_select_orcamento_atividades"
ON public.orcamento_atividades FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orcamentos o
    JOIN obra_users ou ON ou.obra_id = o.project_id
    WHERE o.id = orcamento_atividades.orcamento_id
      AND ou.usuario_id = auth.uid()
  )
);

CREATE POLICY "obra_users_insert_orcamento_atividades"
ON public.orcamento_atividades FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orcamentos o
    JOIN obra_users ou ON ou.obra_id = o.project_id
    WHERE o.id = orcamento_atividades.orcamento_id
      AND ou.usuario_id = auth.uid()
  )
);

CREATE POLICY "obra_users_update_orcamento_atividades"
ON public.orcamento_atividades FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orcamentos o
    JOIN obra_users ou ON ou.obra_id = o.project_id
    WHERE o.id = orcamento_atividades.orcamento_id
      AND ou.usuario_id = auth.uid()
  )
);

CREATE POLICY "obra_users_delete_orcamento_atividades"
ON public.orcamento_atividades FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orcamentos o
    JOIN obra_users ou ON ou.obra_id = o.project_id
    WHERE o.id = orcamento_atividades.orcamento_id
      AND ou.usuario_id = auth.uid()
  )
);

-- Add obra_users-based RLS policies for cronograma_execucoes
CREATE POLICY "obra_users_select_cronograma_execucoes"
ON public.cronograma_execucoes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orcamento_atividades oa
    JOIN orcamentos o ON o.id = oa.orcamento_id
    JOIN obra_users ou ON ou.obra_id = o.project_id
    WHERE oa.id = cronograma_execucoes.atividade_id
      AND ou.usuario_id = auth.uid()
  )
);

CREATE POLICY "obra_users_insert_cronograma_execucoes"
ON public.cronograma_execucoes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orcamento_atividades oa
    JOIN orcamentos o ON o.id = oa.orcamento_id
    JOIN obra_users ou ON ou.obra_id = o.project_id
    WHERE oa.id = cronograma_execucoes.atividade_id
      AND ou.usuario_id = auth.uid()
  )
);

CREATE POLICY "obra_users_update_cronograma_execucoes"
ON public.cronograma_execucoes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orcamento_atividades oa
    JOIN orcamentos o ON o.id = oa.orcamento_id
    JOIN obra_users ou ON ou.obra_id = o.project_id
    WHERE oa.id = cronograma_execucoes.atividade_id
      AND ou.usuario_id = auth.uid()
  )
);

CREATE POLICY "obra_users_delete_cronograma_execucoes"
ON public.cronograma_execucoes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orcamento_atividades oa
    JOIN orcamentos o ON o.id = oa.orcamento_id
    JOIN obra_users ou ON ou.obra_id = o.project_id
    WHERE oa.id = cronograma_execucoes.atividade_id
      AND ou.usuario_id = auth.uid()
  )
);

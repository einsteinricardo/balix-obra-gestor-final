
-- Allow admins to read all profiles (needed for user management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add missing permissions: export and approve for modules that need them
-- Add export for modules missing it
INSERT INTO rbac_permissions (modulo, acao, descricao)
SELECT m, a, m || ' - ' || a
FROM (VALUES 
  ('dashboard', 'export'),
  ('documentacao', 'export'),
  ('cronograma', 'export'),
  ('cronograma_fisico_financeiro', 'export'),
  ('diario_obra', 'export'),
  ('fluxo_caixa', 'export'),
  ('arquivos', 'export'),
  ('projetos', 'export'),
  ('usuarios_obra', 'export')
) AS t(m, a)
WHERE NOT EXISTS (
  SELECT 1 FROM rbac_permissions WHERE modulo = t.m AND acao = t.a
);

-- Add approve for modules missing it
INSERT INTO rbac_permissions (modulo, acao, descricao)
SELECT m, a, m || ' - ' || a
FROM (VALUES 
  ('dashboard', 'approve'),
  ('documentacao', 'approve'),
  ('cronograma', 'approve'),
  ('cronograma_fisico_financeiro', 'approve'),
  ('diario_obra', 'approve'),
  ('fluxo_caixa', 'approve'),
  ('arquivos', 'approve'),
  ('projetos', 'approve'),
  ('relatorios', 'approve'),
  ('configuracoes', 'approve'),
  ('usuarios_obra', 'approve'),
  ('relatorios', 'create'),
  ('relatorios', 'update'),
  ('relatorios', 'delete'),
  ('configuracoes', 'create'),
  ('configuracoes', 'delete'),
  ('dashboard', 'create'),
  ('dashboard', 'update'),
  ('dashboard', 'delete')
) AS t(m, a)
WHERE NOT EXISTS (
  SELECT 1 FROM rbac_permissions WHERE modulo = t.m AND acao = t.a
);

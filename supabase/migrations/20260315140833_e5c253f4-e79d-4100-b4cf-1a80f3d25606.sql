
-- Seed roles
INSERT INTO public.rbac_roles (nome, descricao) VALUES
  ('Administrador', 'Acesso total ao sistema'),
  ('Gestor da Obra', 'Gerencia todos os aspectos da obra'),
  ('Engenheiro', 'Acesso técnico à obra'),
  ('Financeiro', 'Acesso ao módulo financeiro'),
  ('Cliente', 'Acesso somente leitura');

-- Seed permissions for all modules x actions
INSERT INTO public.rbac_permissions (modulo, acao, descricao) VALUES
  ('dashboard', 'read', 'Visualizar dashboard'),
  ('projetos', 'create', 'Criar projetos'), ('projetos', 'read', 'Visualizar projetos'), ('projetos', 'update', 'Editar projetos'), ('projetos', 'delete', 'Excluir projetos'),
  ('documentacao', 'create', 'Criar documentos'), ('documentacao', 'read', 'Visualizar documentos'), ('documentacao', 'update', 'Editar documentos'), ('documentacao', 'delete', 'Excluir documentos'),
  ('orcamento', 'create', 'Criar orçamento'), ('orcamento', 'read', 'Visualizar orçamento'), ('orcamento', 'update', 'Editar orçamento'), ('orcamento', 'delete', 'Excluir orçamento'), ('orcamento', 'export', 'Exportar orçamento'), ('orcamento', 'approve', 'Aprovar orçamento'),
  ('cronograma', 'create', 'Criar cronograma'), ('cronograma', 'read', 'Visualizar cronograma'), ('cronograma', 'update', 'Editar cronograma'), ('cronograma', 'delete', 'Excluir cronograma'),
  ('cronograma_fisico_financeiro', 'create', 'Criar cronograma físico-financeiro'), ('cronograma_fisico_financeiro', 'read', 'Visualizar cronograma físico-financeiro'), ('cronograma_fisico_financeiro', 'update', 'Editar cronograma físico-financeiro'), ('cronograma_fisico_financeiro', 'delete', 'Excluir cronograma físico-financeiro'),
  ('diario_obra', 'create', 'Criar diário de obra'), ('diario_obra', 'read', 'Visualizar diário de obra'), ('diario_obra', 'update', 'Editar diário de obra'), ('diario_obra', 'delete', 'Excluir diário de obra'),
  ('financeiro', 'create', 'Criar lançamento financeiro'), ('financeiro', 'read', 'Visualizar financeiro'), ('financeiro', 'update', 'Editar financeiro'), ('financeiro', 'delete', 'Excluir financeiro'), ('financeiro', 'export', 'Exportar financeiro'), ('financeiro', 'approve', 'Aprovar financeiro'),
  ('fluxo_caixa', 'create', 'Criar fluxo de caixa'), ('fluxo_caixa', 'read', 'Visualizar fluxo de caixa'), ('fluxo_caixa', 'update', 'Editar fluxo de caixa'), ('fluxo_caixa', 'delete', 'Excluir fluxo de caixa'),
  ('arquivos', 'create', 'Upload de arquivos'), ('arquivos', 'read', 'Visualizar arquivos'), ('arquivos', 'update', 'Editar arquivos'), ('arquivos', 'delete', 'Excluir arquivos'),
  ('relatorios', 'read', 'Visualizar relatórios'), ('relatorios', 'export', 'Exportar relatórios'),
  ('configuracoes', 'read', 'Visualizar configurações'), ('configuracoes', 'update', 'Editar configurações'),
  ('usuarios_obra', 'create', 'Adicionar usuários à obra'), ('usuarios_obra', 'read', 'Visualizar usuários da obra'), ('usuarios_obra', 'update', 'Editar usuários da obra'), ('usuarios_obra', 'delete', 'Remover usuários da obra');

-- Assign ALL permissions to Administrador
INSERT INTO public.rbac_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.rbac_roles r, public.rbac_permissions p WHERE r.nome = 'Administrador';

-- Assign permissions to Gestor da Obra
INSERT INTO public.rbac_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.rbac_roles r, public.rbac_permissions p
WHERE r.nome = 'Gestor da Obra'
  AND ((p.modulo IN ('orcamento','cronograma','cronograma_fisico_financeiro','diario_obra','financeiro','fluxo_caixa','arquivos','relatorios') AND p.acao IN ('create','read','update','delete'))
    OR (p.modulo = 'dashboard' AND p.acao = 'read')
    OR (p.modulo = 'projetos' AND p.acao IN ('read','update'))
    OR (p.modulo = 'usuarios_obra' AND p.acao IN ('create','read','update','delete'))
    OR (p.modulo = 'configuracoes' AND p.acao IN ('read','update'))
    OR (p.modulo = 'documentacao' AND p.acao IN ('create','read','update','delete')));

-- Assign permissions to Engenheiro
INSERT INTO public.rbac_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.rbac_roles r, public.rbac_permissions p
WHERE r.nome = 'Engenheiro'
  AND ((p.modulo IN ('diario_obra','cronograma','cronograma_fisico_financeiro','arquivos') AND p.acao IN ('create','read','update'))
    OR (p.modulo IN ('dashboard','projetos','orcamento') AND p.acao = 'read'));

-- Assign permissions to Financeiro
INSERT INTO public.rbac_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.rbac_roles r, public.rbac_permissions p
WHERE r.nome = 'Financeiro'
  AND ((p.modulo IN ('financeiro','fluxo_caixa','relatorios') AND p.acao IN ('create','read','update'))
    OR (p.modulo IN ('dashboard','projetos','orcamento') AND p.acao = 'read'));

-- Assign permissions to Cliente (read-only)
INSERT INTO public.rbac_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.rbac_roles r, public.rbac_permissions p
WHERE r.nome = 'Cliente'
  AND p.acao = 'read'
  AND p.modulo IN ('dashboard','orcamento','cronograma','cronograma_fisico_financeiro','diario_obra','financeiro','fluxo_caixa','arquivos','relatorios');

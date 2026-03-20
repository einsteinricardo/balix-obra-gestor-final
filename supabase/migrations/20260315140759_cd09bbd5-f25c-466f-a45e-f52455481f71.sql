
-- 1. Create roles table
CREATE TABLE public.rbac_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar NOT NULL UNIQUE,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create permissions table
CREATE TABLE public.rbac_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo varchar NOT NULL,
  acao varchar NOT NULL,
  descricao text,
  UNIQUE(modulo, acao)
);

-- 3. Create role_permissions junction table
CREATE TABLE public.rbac_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.rbac_roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.rbac_permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- 4. Create obra_users table (links users to projects with a role)
CREATE TABLE public.obra_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.rbac_roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(obra_id, usuario_id)
);

-- 5. Enable RLS on all new tables
ALTER TABLE public.rbac_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_users ENABLE ROW LEVEL SECURITY;

-- 6. RLS for rbac_roles: authenticated users can read, admins can manage
CREATE POLICY "Authenticated can read roles" ON public.rbac_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage roles" ON public.rbac_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. RLS for rbac_permissions: authenticated users can read, admins can manage
CREATE POLICY "Authenticated can read permissions" ON public.rbac_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage permissions" ON public.rbac_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. RLS for rbac_role_permissions: authenticated users can read, admins can manage
CREATE POLICY "Authenticated can read role_permissions" ON public.rbac_role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage role_permissions" ON public.rbac_role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. RLS for obra_users: users can see their own associations, admins and project owners can manage
CREATE POLICY "Users can view own obra associations" ON public.obra_users
  FOR SELECT TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "Project owners can view obra_users" ON public.obra_users
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = obra_users.obra_id AND projects.user_id = auth.uid()));

CREATE POLICY "Admins can manage obra_users" ON public.obra_users
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Project owners can manage obra_users" ON public.obra_users
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = obra_users.obra_id AND projects.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = obra_users.obra_id AND projects.user_id = auth.uid()));

-- 10. Security definer function to check RBAC permissions
CREATE OR REPLACE FUNCTION public.check_rbac_permission(
  _user_id uuid,
  _obra_id uuid,
  _modulo varchar,
  _acao varchar
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM obra_users ou
    JOIN rbac_role_permissions rp ON rp.role_id = ou.role_id
    JOIN rbac_permissions p ON p.id = rp.permission_id
    WHERE ou.usuario_id = _user_id
      AND ou.obra_id = _obra_id
      AND p.modulo = _modulo
      AND p.acao = _acao
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- 11. Function to get user's role for a specific obra
CREATE OR REPLACE FUNCTION public.get_user_obra_role(
  _user_id uuid,
  _obra_id uuid
)
RETURNS TABLE(role_id uuid, role_nome varchar)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ou.role_id, r.nome
  FROM obra_users ou
  JOIN rbac_roles r ON r.id = ou.role_id
  WHERE ou.usuario_id = _user_id
    AND ou.obra_id = _obra_id
  LIMIT 1;
$$;

-- 12. Function to get all permissions for a user in an obra
CREATE OR REPLACE FUNCTION public.get_user_obra_permissions(
  _user_id uuid,
  _obra_id uuid
)
RETURNS TABLE(modulo varchar, acao varchar)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.modulo, p.acao
  FROM obra_users ou
  JOIN rbac_role_permissions rp ON rp.role_id = ou.role_id
  JOIN rbac_permissions p ON p.id = rp.permission_id
  WHERE ou.usuario_id = _user_id
    AND ou.obra_id = _obra_id;
$$;

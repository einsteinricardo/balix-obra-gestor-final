
-- Create a security definer function to check obra_users without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_member_of_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.obra_users
    WHERE usuario_id = _user_id
      AND obra_id = _project_id
  );
$$;

-- Drop the recursive policy on projects
DROP POLICY IF EXISTS "obra_users_select_projects" ON public.projects;

-- Recreate it using the security definer function (no recursion)
CREATE POLICY "obra_users_select_projects" ON public.projects
  FOR SELECT TO authenticated
  USING (public.is_member_of_project(auth.uid(), id));

-- Also fix obra_users policies that reference projects to use security definer
DROP POLICY IF EXISTS "Project owners can manage obra_users" ON public.obra_users;
DROP POLICY IF EXISTS "Project owners can view obra_users" ON public.obra_users;

-- Create a function to check project ownership without RLS
CREATE OR REPLACE FUNCTION public.is_project_owner(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = _project_id
      AND user_id = _user_id
  );
$$;

-- Recreate obra_users policies using security definer function
CREATE POLICY "Project owners can manage obra_users" ON public.obra_users
  FOR ALL TO authenticated
  USING (public.is_project_owner(auth.uid(), obra_id))
  WITH CHECK (public.is_project_owner(auth.uid(), obra_id));

CREATE POLICY "Project owners can view obra_users" ON public.obra_users
  FOR SELECT TO authenticated
  USING (public.is_project_owner(auth.uid(), obra_id));


-- Step 1: Migrate orphan data - assign project_id to records that don't have one
DO $$
DECLARE
  _user_id uuid;
  _project_id uuid;
BEGIN
  -- Find users with data but no project_id assigned
  FOR _user_id IN 
    SELECT DISTINCT user_id FROM financial_records WHERE project_id IS NULL
    UNION
    SELECT DISTINCT user_id FROM cash_flow_entries WHERE project_id IS NULL
    UNION
    SELECT DISTINCT user_id FROM orcamentos WHERE project_id IS NULL
    UNION
    SELECT DISTINCT user_id FROM project_stages WHERE project_id IS NULL
    UNION
    SELECT DISTINCT user_id FROM work_diary WHERE project_id IS NULL
    UNION
    SELECT DISTINCT user_id FROM gantt_tasks WHERE project_id IS NULL
  LOOP
    -- Check if user already has a project
    SELECT id INTO _project_id FROM projects WHERE user_id = _user_id LIMIT 1;
    
    -- If no project exists, create a default one
    IF _project_id IS NULL THEN
      INSERT INTO projects (user_id, name, address, technical_manager, status)
      VALUES (_user_id, 'Obra Principal', 'Endereço não informado', 'Não informado', 'em_andamento')
      RETURNING id INTO _project_id;
    END IF;
    
    -- Update all orphan records for this user
    UPDATE financial_records SET project_id = _project_id WHERE user_id = _user_id AND project_id IS NULL;
    UPDATE cash_flow_entries SET project_id = _project_id WHERE user_id = _user_id AND project_id IS NULL;
    UPDATE orcamentos SET project_id = _project_id WHERE user_id = _user_id AND project_id IS NULL;
    UPDATE project_stages SET project_id = _project_id WHERE user_id = _user_id AND project_id IS NULL;
    UPDATE work_diary SET project_id = _project_id WHERE user_id = _user_id AND project_id IS NULL;
    UPDATE gantt_tasks SET project_id = _project_id WHERE user_id = _user_id AND project_id IS NULL;
  END LOOP;
END;
$$;

-- Step 2: Make project_id NOT NULL on all tables
ALTER TABLE financial_records ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE cash_flow_entries ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE orcamentos ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE project_stages ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE work_diary ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE gantt_tasks ALTER COLUMN project_id SET NOT NULL;

-- Step 3: Add foreign keys where missing
ALTER TABLE financial_records DROP CONSTRAINT IF EXISTS financial_records_project_id_fkey;
ALTER TABLE financial_records ADD CONSTRAINT financial_records_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE cash_flow_entries DROP CONSTRAINT IF EXISTS cash_flow_entries_project_id_fkey;
ALTER TABLE cash_flow_entries ADD CONSTRAINT cash_flow_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS orcamentos_project_id_fkey;
ALTER TABLE orcamentos ADD CONSTRAINT orcamentos_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE project_stages DROP CONSTRAINT IF EXISTS project_stages_project_id_fkey;
ALTER TABLE project_stages ADD CONSTRAINT project_stages_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE work_diary DROP CONSTRAINT IF EXISTS work_diary_project_id_fkey;
ALTER TABLE work_diary ADD CONSTRAINT work_diary_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE gantt_tasks DROP CONSTRAINT IF EXISTS gantt_tasks_project_id_fkey;
ALTER TABLE gantt_tasks ADD CONSTRAINT gantt_tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Step 4: Add indexes on project_id
CREATE INDEX IF NOT EXISTS idx_financial_records_project_id ON financial_records(project_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_project_id ON cash_flow_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_project_id ON orcamentos(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stages_project_id ON project_stages(project_id);
CREATE INDEX IF NOT EXISTS idx_work_diary_project_id ON work_diary(project_id);
CREATE INDEX IF NOT EXISTS idx_gantt_tasks_project_id ON gantt_tasks(project_id);

-- Step 5: Add RLS policies for obra_users access (SELECT)
CREATE POLICY "obra_users_select_financial" ON financial_records FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = financial_records.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_insert_financial" ON financial_records FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = financial_records.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_update_financial" ON financial_records FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = financial_records.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_delete_financial" ON financial_records FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = financial_records.project_id AND obra_users.usuario_id = auth.uid()));

-- cash_flow_entries
CREATE POLICY "obra_users_select_cashflow" ON cash_flow_entries FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = cash_flow_entries.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_insert_cashflow" ON cash_flow_entries FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = cash_flow_entries.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_update_cashflow" ON cash_flow_entries FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = cash_flow_entries.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_delete_cashflow" ON cash_flow_entries FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = cash_flow_entries.project_id AND obra_users.usuario_id = auth.uid()));

-- orcamentos
CREATE POLICY "obra_users_select_orcamentos" ON orcamentos FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = orcamentos.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_insert_orcamentos" ON orcamentos FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = orcamentos.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_update_orcamentos" ON orcamentos FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = orcamentos.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_delete_orcamentos" ON orcamentos FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = orcamentos.project_id AND obra_users.usuario_id = auth.uid()));

-- project_stages
CREATE POLICY "obra_users_select_stages" ON project_stages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = project_stages.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_insert_stages" ON project_stages FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = project_stages.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_update_stages" ON project_stages FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = project_stages.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_delete_stages" ON project_stages FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = project_stages.project_id AND obra_users.usuario_id = auth.uid()));

-- work_diary
CREATE POLICY "obra_users_select_diary" ON work_diary FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = work_diary.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_insert_diary" ON work_diary FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = work_diary.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_update_diary" ON work_diary FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = work_diary.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_delete_diary" ON work_diary FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = work_diary.project_id AND obra_users.usuario_id = auth.uid()));

-- gantt_tasks
CREATE POLICY "obra_users_select_gantt" ON gantt_tasks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = gantt_tasks.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_insert_gantt" ON gantt_tasks FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = gantt_tasks.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_update_gantt" ON gantt_tasks FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = gantt_tasks.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_delete_gantt" ON gantt_tasks FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = gantt_tasks.project_id AND obra_users.usuario_id = auth.uid()));

-- documents
CREATE POLICY "obra_users_select_docs" ON documents FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = documents.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_insert_docs" ON documents FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = documents.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_update_docs" ON documents FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = documents.project_id AND obra_users.usuario_id = auth.uid()));

CREATE POLICY "obra_users_delete_docs" ON documents FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = documents.project_id AND obra_users.usuario_id = auth.uid()));

-- projects: allow obra_users to view projects they are assigned to
CREATE POLICY "obra_users_select_projects" ON projects FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM obra_users WHERE obra_users.obra_id = projects.id AND obra_users.usuario_id = auth.uid()));

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/auth/Register';
import Index from './pages/Index';
import ProjectsList from './pages/projects/ProjectsList';
import ProjectDetails from './pages/projects/ProjectDetails';
import DocumentsList from './pages/documents/DocumentsList';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import Profile from './pages/Profile';
import ProjectFinancials from './pages/financial/ProjectFinancials';
import ProjectProgress from './pages/progress/ProjectProgress';
import ProjectStageDetails from './pages/progress/ProjectStageDetails';
import ChangePassword from './pages/ChangePassword';
import WorkDiary from './pages/progress/WorkDiary';
import GanttChart from './pages/progress/GanttChart';
import Budget from './pages/budget/Budget';
import ScheduleFinancial from './pages/budget/ScheduleFinancial';
import CashFlow from './pages/financial/CashFlow';
import RolesManagement from './pages/admin/RolesManagement';
import ObraUsers from './pages/admin/ObraUsers';

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/configuracoes/alterar-senha" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          
          <Route path="/projects" element={<ProtectedRoute><ProjectsList /></ProtectedRoute>} />
          <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
          
          <Route path="/projects/:projectId/documents" element={<ProtectedRoute><DocumentsList /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><DocumentsList /></ProtectedRoute>} />
          
          <Route path="/projects/:projectId/financial" element={<ProtectedRoute><ProjectFinancials /></ProtectedRoute>} />
          <Route path="/financeiro/lancamentos" element={<ProtectedRoute><ProjectFinancials /></ProtectedRoute>} />
          <Route path="/financeiro/fluxo-de-caixa" element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
          
          <Route path="/projects/:projectId/progress" element={<ProtectedRoute><ProjectProgress /></ProtectedRoute>} />
          <Route path="/acompanhamento/etapas" element={<ProtectedRoute><ProjectProgress /></ProtectedRoute>} />
          <Route path="/acompanhamento/etapas/:stageId" element={<ProtectedRoute><ProjectStageDetails /></ProtectedRoute>} />
          
          <Route path="/projects/:projectId/diary" element={<ProtectedRoute><WorkDiary /></ProtectedRoute>} />
          <Route path="/acompanhamento/diario-de-obra" element={<ProtectedRoute><WorkDiary /></ProtectedRoute>} />
          
          <Route path="/projects/:projectId/gantt" element={<ProtectedRoute bannedProjectRoles={['Cliente']} requiredPermission={{ module: 'cronograma', action: 'read' }}><GanttChart /></ProtectedRoute>} />
          <Route path="/acompanhamento/gantt" element={<ProtectedRoute bannedProjectRoles={['Cliente']} requiredPermission={{ module: 'cronograma', action: 'read' }}><GanttChart /></ProtectedRoute>} />
          
          <Route path="/acompanhamento/orcamento" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
          <Route path="/acompanhamento/cronograma-fisico-financeiro" element={<ProtectedRoute bannedProjectRoles={['Cliente']} requiredPermission={{ module: 'cronograma', action: 'read' }}><ScheduleFinancial /></ProtectedRoute>} />

          <Route path="/admin/papeis" element={<ProtectedRoute requiredRoles={['admin']}><RolesManagement /></ProtectedRoute>} />
          <Route path="/admin/usuarios-obra" element={<ProtectedRoute requiredRoles={['admin']}><ObraUsers /></ProtectedRoute>} />
        </Routes>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;

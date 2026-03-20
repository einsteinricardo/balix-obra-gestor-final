
import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Menu, LogOut, User, Building2 } from 'lucide-react';
import AppSidebar from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import RoleBadge from '@/components/rbac/RoleBadge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { iconeLogo } from '@/assets';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { profile, signOut } = useAuth();
  const { projects, selectedProjectId, selectProject, selectedProject, currentRole, permissionsLoading } = useProject();

  const roleName = currentRole?.role_nome || null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="bg-balix-primary border-b border-border/50 p-4 flex items-center justify-between">
            <div className="flex items-center">
              <SidebarTrigger>
                <Menu className="h-5 w-5 text-balix-light mr-4" />
              </SidebarTrigger>
              <div className="flex items-center">
                <img src={iconeLogo} alt="Balix Construtora" className="h-8 mr-3" />
                <h1 className="text-xl font-playfair" style={{ color: '#8b4a12' }}>
                  Balix Construtora
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Project Selector */}
              {projects.length > 0 && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-balix-accent" />
                  <Select value={selectedProjectId || ''} onValueChange={selectProject}>
                    <SelectTrigger className="w-[200px] bg-balix-secondary border-border/50 text-balix-light text-sm">
                      <SelectValue placeholder="Selecione uma obra" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {profile && (
                <>
                  {!permissionsLoading && <RoleBadge roleName={roleName} />}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 text-balix-light">
                        <span className="hidden md:inline-block">
                          {profile.full_name}
                        </span>
                        <div className="h-8 w-8 rounded-full bg-balix-accent flex items-center justify-center text-white">
                          {profile.full_name?.charAt(0) || 'U'}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                      {selectedProject && (
                        <>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            <div>Projeto: <span className="font-medium text-foreground">{selectedProject.name}</span></div>
                            {roleName && <div>Papel: <span className="font-medium text-foreground">{roleName}</span></div>}
                          </div>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </header>

          {/* No project selected warning */}
          {projects.length === 0 && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800">
              ⚠️ Nenhuma obra encontrada. Crie um projeto em <a href="/projects" className="underline font-semibold">Projetos</a> para começar.
            </div>
          )}

          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;

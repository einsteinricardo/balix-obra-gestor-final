import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { Home, FolderOpen, FileText, DollarSign, BarChart3, Settings, ChevronRight, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useProject } from '@/contexts/ProjectContext';

interface NavChild {
  name: string;
  href: string;
  requiredModule?: string;
  requiredAction?: string;
  bannedRoles?: string[];
}

interface NavItem {
  name: string;
  href?: string;
  icon: any;
  children?: NavChild[];
  requiredModule?: string;
  requiredAction?: string;
  bannedRoles?: string[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Projetos', href: '/projects', icon: FolderOpen },
  { name: 'Documentos', href: '/documents', icon: FileText },
  {
    name: 'Financeiro',
    icon: DollarSign,
    children: [
      { name: 'Lançamentos', href: '/financeiro/lancamentos' },
      { name: 'Fluxo de Caixa', href: '/financeiro/fluxo-de-caixa' },
    ],
  },
  {
    name: 'Acompanhamento',
    icon: BarChart3,
    children: [
      { name: 'Orçamento', href: '/acompanhamento/orcamento' },
      { name: 'Cronograma Físico-Financeiro', href: '/acompanhamento/cronograma-fisico-financeiro', requiredModule: 'cronograma', requiredAction: 'read', bannedRoles: ['Cliente'] },
      { name: 'Etapas e Progresso', href: '/acompanhamento/etapas' },
      { name: 'Diário de Obra', href: '/acompanhamento/diario-de-obra' },
      { name: 'Gráfico de Gantt', href: '/acompanhamento/gantt', requiredModule: 'cronograma', requiredAction: 'read', bannedRoles: ['Cliente'] },
    ],
  },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

const adminNavigation: NavItem[] = [
  {
    name: 'Administração',
    icon: Shield,
    children: [
      { name: 'Papéis e Permissões', href: '/admin/papeis' },
      { name: 'Usuários da Obra', href: '/admin/usuarios-obra' },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const { role: globalRole } = useUserRole();
  const { hasPermission, currentRole } = useProject();
  const [openItems, setOpenItems] = useState<string[]>(['Acompanhamento', 'Financeiro']);

  const allNavigation = globalRole === 'admin' 
    ? [...navigation, ...adminNavigation] 
    : navigation;

  const toggleItem = (itemName: string) => {
    setOpenItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (children: NavChild[]) => children.some(child => isActive(child.href));

  const isItemVisible = (item: { requiredModule?: string; requiredAction?: string; bannedRoles?: string[] }) => {
    if (item.bannedRoles && currentRole?.role_nome) {
      if (item.bannedRoles.includes(currentRole.role_nome)) return false;
    }
    if (!item.requiredModule || !item.requiredAction) return true;
    if (globalRole === 'admin') return true;
    return hasPermission(item.requiredModule, item.requiredAction);
  };

  return (
    <Sidebar className="bg-balix-primary border-r border-border/50">
      <SidebarContent className="pt-6">
        <SidebarMenu>
          {allNavigation.map((item) => {
            if (!isItemVisible(item)) return null;

            if (item.children) {
              const visibleChildren = item.children.filter(isItemVisible);
              if (visibleChildren.length === 0) return null;

              const isOpen = openItems.includes(item.name);
              const isCurrentParentActive = isParentActive(visibleChildren);
              
              return (
                <SidebarMenuItem key={item.name}>
                  <Collapsible open={isOpen} onOpenChange={() => toggleItem(item.name)}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton 
                        className={`text-balix-light hover:bg-balix-secondary hover:text-white w-full justify-between ${
                          isCurrentParentActive ? 'bg-balix-secondary text-white' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleChildren.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.name}>
                            <SidebarMenuSubButton 
                              asChild
                              className={`text-balix-light hover:bg-balix-secondary hover:text-white ml-4 ${
                                isActive(subItem.href) ? 'bg-balix-accent text-white' : ''
                              }`}
                            >
                              <Link to={subItem.href}>
                                {subItem.name}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              );
            }

            const href = item.href || '/';
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton 
                  asChild
                  className={`text-balix-light hover:bg-balix-secondary hover:text-white ${
                    isActive(href) ? 'bg-balix-accent text-white' : ''
                  }`}
                >
                  <Link to={href}>
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

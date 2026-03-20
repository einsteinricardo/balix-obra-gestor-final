
import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface NavItemProps {
  title: string;
  icon?: React.ReactNode;
  href: string;
  isActive: boolean;
  subItems?: {
    title: string;
    href: string;
    isActive: boolean;
  }[];
}

interface SidebarNavProps {
  items: NavItemProps[];
}

const SidebarNav: React.FC<SidebarNavProps> = ({ items }) => {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();

  // Track active submenu items and automatically open their parent menus
  useEffect(() => {
    const newOpenMenus = { ...openMenus };
    
    items.forEach(item => {
      if (item.subItems) {
        const hasActiveChild = item.subItems.some(subItem => subItem.isActive);
        if (hasActiveChild) {
          newOpenMenus[item.title] = true;
        }
      }
    });
    
    setOpenMenus(newOpenMenus);
  }, [location.pathname]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Replace :projectId in routes with actual projectId if available
  const getFixedPath = (path: string) => {
    if (projectId && path.includes(':projectId')) {
      return path.replace(':projectId', projectId);
    } else if (path.includes(':projectId')) {
      // If path needs projectId but we don't have one, 
      // use the alternative path that doesn't require projectId
      if (path.includes('/projects/:projectId/diary')) {
        return '/acompanhamento/diario-de-obra';
      } else if (path.includes('/projects/:projectId/progress')) {
        return '/acompanhamento/etapas';
      } else if (path.includes('/projects/:projectId/gantt')) {
        return '/acompanhamento/gantt';
      } else if (path.includes('/projects/:projectId/financial')) {
        return '/financeiro/lancamentos';
      } else if (path.includes('/projects/:projectId/documents')) {
        return '/documents';
      } else {
        return '/projects';
      }
    }
    return path;
  };

  return (
    <nav className="flex flex-col gap-1 px-2">
      {items.map((item) => (
        <div key={item.title} className="flex flex-col">
          {item.subItems ? (
            <>
              <button
                className={cn(
                  'nav-link',
                  item.isActive && 'active',
                  'justify-between'
                )}
                onClick={() => toggleMenu(item.title)}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {item.title}
                </span>
                {openMenus[item.title] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {openMenus[item.title] && (
                <div className="ml-8 mt-1 flex flex-col gap-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.title}
                      to={getFixedPath(subItem.href)}
                      className={cn(
                        'nav-link text-sm py-1.5',
                        subItem.isActive && 'active'
                      )}
                    >
                      {subItem.title}
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Link
              to={getFixedPath(item.href)}
              className={cn('nav-link', item.isActive && 'active')}
            >
              {item.icon}
              {item.title}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default SidebarNav;


import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import AppLayout from '@/components/layout/AppLayout';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <AppLayout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-card rounded-xl border border-border/40 shadow-lg animate-fade-in">
          <h1 className="text-7xl font-bold text-balix-accent mb-4">404</h1>
          <p className="text-xl text-balix-light mb-6">Página não encontrada</p>
          <p className="text-balix-light/70 mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>
          <a 
            href="/" 
            className="px-6 py-3 bg-balix-accent text-white rounded-md hover:bg-balix-accent/90 transition-colors inline-block"
          >
            Voltar para Home
          </a>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotFound;

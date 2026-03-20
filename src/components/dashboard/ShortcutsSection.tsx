
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ShortcutButton from '@/components/dashboard/ShortcutButton';

const ShortcutsSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-4">Ações Rápidas</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
        <ShortcutButton
          icon="file-plus"
          label="Projetos"
          onClick={() => navigate('/projects')}
        />
        <ShortcutButton
          icon="file-text"
          label="Documentos"
          onClick={() => navigate('/documents')}
        />
        <ShortcutButton
          icon="dollar-sign"
          label="Financeiro"
          onClick={() => navigate('/financeiro/lancamentos')}
        />
        <ShortcutButton
          icon="bar-chart-2"
          label="Progresso"
          onClick={() => navigate('/acompanhamento/etapas')}
        />
        <ShortcutButton
          icon="book"
          label="Diário de Obra"
          onClick={() => navigate('/acompanhamento/diario-de-obra')}
        />
      </div>
    </div>
  );
};

export default ShortcutsSection;

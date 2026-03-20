
import { supabase } from '@/integrations/supabase/client';

// Sample data generator for demonstration
export const generateSampleData = async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found. Please login first.');
      return false;
    }

    // Check if we already have data
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id);

    if (existingProjects && existingProjects.length > 0) {
      console.log('Sample data already exists.');
      return true;
    }

    // 1. Create 5 projects
    const projects = [
      {
        name: 'Residencial Villa Serena',
        address: 'Av. das Flores, 1500, São Paulo, SP',
        status: 'em_andamento',
        technical_manager: 'Maria Silva',
        user_id: user.id
      },
      {
        name: 'Edifício Comercial Horizonte',
        address: 'Rua dos Negócios, 233, Rio de Janeiro, RJ',
        status: 'aguardando',
        technical_manager: 'João Santos',
        user_id: user.id
      },
      {
        name: 'Condomínio Solar',
        address: 'Alameda das Palmeiras, 450, Belo Horizonte, MG',
        status: 'concluido',
        technical_manager: 'Ana Costa',
        user_id: user.id
      },
      {
        name: 'Residencial Parque das Árvores',
        address: 'Rua dos Ipês, 789, Curitiba, PR',
        status: 'em_andamento',
        technical_manager: 'Carlos Mendes',
        user_id: user.id
      },
      {
        name: 'Centro Empresarial Moderna',
        address: 'Av. Paulista, 1000, São Paulo, SP',
        status: 'aguardando',
        technical_manager: 'Patricia Alves',
        user_id: user.id
      }
    ];

    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .insert(projects)
      .select();

    if (projectsError) {
      console.error('Error creating projects:', projectsError);
      return false;
    }

    // 2. Add documents
    if (projectsData && projectsData.length > 0) {
      const documents = [
        {
          title: 'Projeto Arquitetônico',
          document_type: 'arquitetonico',
          file_url: 'https://placehold.co/600x400?text=Projeto+Arquitetônico.pdf',
          project_id: projectsData[0].id,
          user_id: user.id
        },
        {
          title: 'Licença Ambiental',
          document_type: 'licenca',
          file_url: 'https://placehold.co/600x400?text=Licença+Ambiental.pdf',
          project_id: projectsData[0].id,
          user_id: user.id
        },
        {
          title: 'ART Estrutural',
          document_type: 'art_rrt',
          file_url: 'https://placehold.co/600x400?text=ART+Estrutural.pdf',
          project_id: projectsData[0].id,
          user_id: user.id
        }
      ];

      const { error: documentsError } = await supabase
        .from('documents')
        .insert(documents);

      if (documentsError) {
        console.error('Error creating documents:', documentsError);
      }

      // 3. Add project stages
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(now.getDate() - 14);

      const projectStages = [
        {
          project_id: projectsData[0].id,
          stage_name: 'Fundação',
          status: 'concluido',
          description: 'Início da fundação',
          start_date: twoWeeksAgo.toISOString().split('T')[0],
          end_date: oneWeekAgo.toISOString().split('T')[0],
          execution_percentage: 100,
          image_url: 'https://placehold.co/600x400?text=Início+da+fundação',
          user_id: user.id
        },
        {
          project_id: projectsData[0].id,
          stage_name: 'Estrutura',
          status: 'em_andamento',
          description: 'Entrega da estrutura',
          start_date: oneWeekAgo.toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0],
          execution_percentage: 50,
          image_url: 'https://placehold.co/600x400?text=Entrega+da+estrutura',
          user_id: user.id
        }
      ];

      const { error: stagesError } = await supabase
        .from('project_stages')
        .insert(projectStages);

      if (stagesError) {
        console.error('Error creating project stages:', stagesError);
      }

      // 4. Add financial records
      const financialRecords = [
        {
          project_id: projectsData[0].id,
          type: 'entrada',
          category: 'outros',
          description: 'Investimento inicial',
          amount: 100000,
          date: twoWeeksAgo.toISOString().split('T')[0],
          user_id: user.id
        },
        {
          project_id: projectsData[0].id,
          type: 'entrada',
          category: 'outros',
          description: 'Pagamento cliente fase 1',
          amount: 50000,
          date: twoWeeksAgo.toISOString().split('T')[0],
          user_id: user.id
        },
        {
          project_id: projectsData[0].id,
          type: 'entrada',
          category: 'outros',
          description: 'Pagamento cliente fase 2',
          amount: 75000,
          date: oneWeekAgo.toISOString().split('T')[0],
          user_id: user.id
        },
        {
          project_id: projectsData[0].id,
          type: 'saida',
          category: 'materiais',
          description: 'Compra de materiais',
          amount: 30000,
          date: oneWeekAgo.toISOString().split('T')[0],
          user_id: user.id
        },
        {
          project_id: projectsData[0].id,
          type: 'saida',
          category: 'mao_de_obra',
          description: 'Mão de obra',
          amount: 20000,
          date: now.toISOString().split('T')[0],
          user_id: user.id
        },
        {
          project_id: projectsData[0].id,
          type: 'saida',
          category: 'outros',
          description: 'Licenciamento e taxas',
          amount: 10000,
          date: now.toISOString().split('T')[0],
          user_id: user.id
        }
      ];

      const { error: financialError } = await supabase
        .from('financial_records')
        .insert(financialRecords);

      if (financialError) {
        console.error('Error creating financial records:', financialError);
      }
    }

    console.log('Sample data generated successfully!');
    return true;
  } catch (error) {
    console.error('Error generating sample data:', error);
    return false;
  }
};

// Nunca execute geração automática ao importar este módulo.
// Qualquer cadastro deve ocorrer apenas por ação explícita do usuário.
export default generateSampleData;

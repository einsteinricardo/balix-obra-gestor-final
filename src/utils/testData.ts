
import { supabase } from '@/integrations/supabase/client';

// Adiciona projetos de teste
export async function addTestProjects(userId: string) {
  try {
    const testProjects = [
      {
        name: "Residencial Vila Serena",
        address: "Rua das Flores, 123, São Paulo - SP",
        technical_manager: "Eng. Carlos Silva",
        status: "em_andamento",
        user_id: userId
      },
      {
        name: "Edifício Comercial Horizonte",
        address: "Av. Paulista, 1000, São Paulo - SP",
        technical_manager: "Eng. Ana Costa",
        status: "aguardando",
        user_id: userId
      },
      {
        name: "Condomínio Parque das Árvores",
        address: "Estrada do Parque, 500, Campinas - SP",
        technical_manager: "Eng. Roberto Martins",
        status: "concluido",
        user_id: userId
      }
    ];
    
    const results = [];
    for (const project of testProjects) {
      const { data, error } = await supabase.from('projects').insert(project).select();
      
      if (error) {
        console.error(`Error adding test project "${project.name}":`, error);
        throw error;
      }
      
      if (data && data.length > 0) {
        results.push(data[0]);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error adding test projects:', error);
    throw error;
  }
}

// Adiciona dados de progresso de obra de teste
export async function addTestProgressData(projectId: string, userId: string) {
  try {
    const today = new Date();
    const testProgress = [
      {
        stage_name: "Fundação",
        description: "Início da escavação e preparação das fundações",
        execution_percentage: 80,
        start_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15).toISOString().split('T')[0],
        end_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString().split('T')[0],
        status: "concluido",
        project_id: projectId,
        user_id: userId
      },
      {
        stage_name: "Estrutura",
        description: "Montagem das vigas e pilares",
        execution_percentage: 30,
        start_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString().split('T')[0],
        end_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString().split('T')[0],
        status: "em_andamento",
        project_id: projectId,
        user_id: userId
      },
      {
        stage_name: "Alvenaria",
        description: "Construção das paredes",
        execution_percentage: 0,
        start_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString().split('T')[0],
        end_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21).toISOString().split('T')[0],
        status: "pendente",
        project_id: projectId,
        user_id: userId
      }
    ];
    
    const results = [];
    for (const progress of testProgress) {
      const { data, error } = await supabase.from('project_stages').insert(progress).select();
      
      if (error) {
        console.error(`Error adding test progress "${progress.stage_name}":`, error);
        throw error;
      }
      
      if (data && data.length > 0) {
        results.push(data[0]);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error adding test progress data:', error);
    throw error;
  }
}

// Adiciona diários de obra de teste
export async function addTestWorkDiary(projectId: string, responsibleName: string, userId: string) {
  try {
    const today = new Date();
    const testDiaries = [
      {
        description: "Concretagem da fundação concluída. Equipe completa presente.",
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10).toISOString().split('T')[0],
        project_id: projectId,
        responsible: responsibleName,
        weather: "sunny",
        user_id: userId
      },
      {
        description: "Início da montagem das formas para pilares. Chuva leve durante a tarde.",
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString().split('T')[0],
        project_id: projectId,
        responsible: responsibleName,
        weather: "rainy",
        user_id: userId
      },
      {
        description: "Concretagem dos pilares do primeiro pavimento.",
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString().split('T')[0],
        project_id: projectId,
        responsible: responsibleName,
        weather: "cloudy",
        user_id: userId
      }
    ];
    
    const results = [];
    for (const diary of testDiaries) {
      const { data, error } = await supabase.from('work_diary').insert(diary).select();
      
      if (error) {
        console.error('Error adding test work diary:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        results.push(data[0]);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error adding test work diary:', error);
    throw error;
  }
}

// Adiciona documentos de teste
export async function addTestDocuments(projectId: string, userId: string) {
  try {
    const testDocuments = [
      {
        title: 'Projeto Arquitetônico',
        document_type: 'arquitetonico',
        file_url: 'https://placehold.co/600x400?text=Projeto+Arquitetônico.pdf',
        project_id: projectId,
        user_id: userId
      },
      {
        title: 'Licença de Obra',
        document_type: 'licenca',
        file_url: 'https://placehold.co/600x400?text=Licença+de+Obra.pdf',
        project_id: projectId,
        user_id: userId
      },
      {
        title: 'ART Estrutural',
        document_type: 'art_rrt',
        file_url: 'https://placehold.co/600x400?text=ART+Estrutural.pdf',
        project_id: projectId,
        user_id: userId
      }
    ];
    
    const results = [];
    for (const doc of testDocuments) {
      const { data, error } = await supabase.from('documents').insert(doc).select();
      
      if (error) {
        console.error('Error adding test document:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        results.push(data[0]);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error adding test documents:', error);
    throw error;
  }
}

// Função principal para adicionar todos os dados de teste
export async function addAllTestData(userId: string) {
  try {
    // Adicionar projetos
    const projects = await addTestProjects(userId);
    
    if (projects && projects.length > 0) {
      const projectId = projects[0].id;
      
      // Adicionar documentos para o primeiro projeto
      await addTestDocuments(projectId, userId);
      
      // Adicionar dados de progresso
      const progressData = await addTestProgressData(projectId, userId);
      
      // Adicionar diário de obra
      await addTestWorkDiary(projectId, "João Silva", userId);
      
      // Adicionar dados financeiros
      await addTestFinancialData(projectId, userId);
    }
    
    return { success: true, message: "Todos os dados de teste foram adicionados com sucesso." };
  } catch (error: any) {
    console.error('Error adding all test data:', error);
    return { success: false, message: error.message };
  }
}

// Adiciona dados financeiros de teste
export async function addTestFinancialData(projectId: string, userId: string) {
  try {
    const testRecords = [
      {
        type: "entrada",
        category: "outros",
        description: 'Investimento inicial',
        amount: 100000,
        date: '2025-05-01',
        project_id: projectId,
        user_id: userId
      },
      {
        type: "entrada",
        category: "outros",
        description: 'Pagamento cliente fase 1',
        amount: 50000,
        date: '2025-05-05',
        project_id: projectId,
        user_id: userId
      },
      {
        type: "entrada",
        category: "outros",
        description: 'Pagamento cliente fase 2',
        amount: 75000,
        date: '2025-05-10',
        project_id: projectId,
        user_id: userId
      },
      {
        type: "saida",
        category: "materiais",
        description: 'Compra de materiais',
        amount: 30000,
        date: '2025-05-12',
        project_id: projectId,
        user_id: userId
      },
      {
        type: "saida",
        category: "mao_de_obra",
        description: 'Mão de obra',
        amount: 20000,
        date: '2025-05-15',
        project_id: projectId,
        user_id: userId
      },
      {
        type: "saida",
        category: "outros",
        description: 'Licenciamento e taxas',
        amount: 10000,
        date: '2025-05-18',
        project_id: projectId,
        user_id: userId
      }
    ];
    
    for (const record of testRecords) {
      const { error } = await supabase.from('financial_records').insert(record);
      if (error) {
        console.error('Error adding test financial record:', error);
        throw error;
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error adding test financial data:', error);
    throw error;
  }
}

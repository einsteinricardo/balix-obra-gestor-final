
import { supabase } from '@/integrations/supabase/client';

/**
 * Error logger utility that logs errors to the database
 */
export const logError = async (
  component: string,
  action: string,
  error: string | Error,
  metadata?: Record<string, any>
) => {
  try {
    const errorMessage = error instanceof Error ? error.message : error;
    
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    const payload = {
      component,
      action,
      error_message: errorMessage,
      user_id: userId || null,
      metadata: metadata || {},
    };
    
    // Using any to bypass TypeScript issues until types are regenerated
    const { error: logError } = await (supabase as any)
      .from('error_logs')
      .insert(payload);
      
    if (logError) {
      console.error('Failed to log error to database:', logError);
    }
    
    // Also log to console for development
    console.error(`[${component}] ${action}: ${errorMessage}`, metadata);
    
  } catch (err) {
    // Fallback to console if error logging fails
    console.error('Error logging failed:', err);
    console.error('Original error:', error);
  }
};

/**
 * Create a toast error with logging to database
 */
export const handleError = async (
  toast: any, 
  component: string,
  action: string, 
  error: any,
  metadata?: Record<string, any>
) => {
  const errorMessage = error instanceof Error ? error.message : 
    typeof error === 'string' ? error : 'Ocorreu um erro inesperado';
    
  // Log error to database
  await logError(component, action, errorMessage, metadata);
  
  // Show toast
  toast({
    title: 'Erro',
    description: errorMessage,
    variant: 'destructive',
  });
};

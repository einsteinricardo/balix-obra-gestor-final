import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Search, Loader2, Filter } from 'lucide-react';
import { format } from 'date-fns';

type ErrorLog = {
  id: string;
  component: string;
  action: string;
  error_message: string;
  created_at: string;
  user_id: string | null;
  project_id?: string | null;
  metadata?: Record<string, any> | null;
};

type ErrorFilter = {
  component: string | null;
  timeframe: string;
  search: string;
};

const ErrorLogs = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [components, setComponents] = useState<string[]>([]);
  const [filters, setFilters] = useState<ErrorFilter>({
    component: null,
    timeframe: '7d',
    search: '',
  });
  const { toast } = useToast();

  const fetchComponents = async () => {
    try {
      // Using any to bypass TypeScript issues until types are regenerated
      const { data, error } = await (supabase as any)
        .from('error_logs')
        .select('component')
        .order('component')
        .is('component', 'not.null');

      if (error) throw error;

      if (data) {
        // Get unique component names with proper typing
        const componentNames = data.map((log: any) => log.component as string);
        const uniqueComponents = Array.from(new Set<string>(componentNames));
        setComponents(uniqueComponents);
      }
    } catch (err: any) {
      console.error('Error fetching components:', err);
    }
  };

  const fetchErrorLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Using any to bypass TypeScript issues until types are regenerated
      let query = (supabase as any)
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply component filter
      if (filters.component) {
        query = query.eq('component', filters.component);
      }

      // Apply timeframe filter
      if (filters.timeframe) {
        let date = new Date();
        switch (filters.timeframe) {
          case '24h':
            date.setHours(date.getHours() - 24);
            break;
          case '7d':
            date.setDate(date.getDate() - 7);
            break;
          case '30d':
            date.setDate(date.getDate() - 30);
            break;
          case 'all':
            // No date filtering
            break;
          default:
            date.setDate(date.getDate() - 7);
        }

        if (filters.timeframe !== 'all') {
          query = query.gte('created_at', date.toISOString());
        }
      }

      // Apply search if present
      if (filters.search) {
        query = query.or(`error_message.ilike.%${filters.search}%,action.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query.limit(100);

      if (fetchError) throw fetchError;

      setErrorLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching error logs:', err);
      setError(err.message || 'Erro ao buscar registros de erros');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os logs de erro',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
    fetchErrorLogs();
  }, []);

  const handleRefresh = () => {
    fetchErrorLogs();
  };

  const handleFilterChange = (key: keyof ErrorFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchErrorLogs();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Logs de Erros</h2>
            <p className="text-muted-foreground">
              Monitoramento de erros do sistema
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="component" className="block text-sm font-medium mb-1">
                  Componente
                </label>
                <Select
                  value={filters.component || ''}
                  onValueChange={(value) => handleFilterChange('component', value === 'all' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os componentes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os componentes</SelectItem>
                    {components.map((component) => (
                      <SelectItem key={component} value={component}>
                        {component}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="timeframe" className="block text-sm font-medium mb-1">
                  Período
                </label>
                <Select
                  value={filters.timeframe}
                  onValueChange={(value) => handleFilterChange('timeframe', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Últimas 24 horas</SelectItem>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label htmlFor="search" className="block text-sm font-medium mb-1">
                    Pesquisar
                  </label>
                  <Input
                    id="search"
                    placeholder="Buscar nos logs..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
                <Button onClick={applyFilters} className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  <span>Filtrar</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registros de Erro</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-balix-accent" />
              </div>
            ) : errorLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum erro registrado no período selecionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Componente</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead className="w-1/3">Mensagem</TableHead>
                      <TableHead>Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>{log.component}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell className="break-words">
                          <div className="max-w-xs">{log.error_message}</div>
                        </TableCell>
                        <TableCell>{log.user_id?.substring(0, 8) || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ErrorLogs;

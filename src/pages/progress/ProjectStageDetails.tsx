import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { usePermissions } from '@/hooks/usePermissions';
import ImageUpload from '@/components/common/ImageUpload';

export default function ProjectStageDetails() {
  const { stageId } = useParams<{ stageId: string }>(); // stageId here is actually orcamento_id
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedProjectId } = useProject();
  const { canUpdate } = usePermissions(selectedProjectId);
  const canEdit = canUpdate('cronograma');
  
  const [atividadePrincipalNome, setAtividadePrincipalNome] = useState('');
  const [progressoGeral, setProgressoGeral] = useState<any>(null);
  const [subatividades, setSubatividades] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (stageId) loadAllData();
  }, [stageId]);

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchContextData()
    ]);
    setIsLoading(false);
  };

  const fetchContextData = async () => {
    // 1. Get Orcamento Name
    const { data: orcData } = await supabase.from('orcamentos').select('atividade_principal').eq('id', stageId).single();
    if (orcData) setAtividadePrincipalNome(orcData.atividade_principal);

    // 2. Get Overall Progress Record (might not exist yet)
    let pid = null;
    const { data: progData } = await supabase.from('atividade_progresso').select('*').eq('orcamento_id', stageId).maybeSingle();
    
    if (progData) {
      setProgressoGeral(progData);
      pid = progData.id;
    } else {
      setProgressoGeral({
        id: null,
        orcamento_id: stageId,
        status: 'pendente',
        data_inicio: '',
        data_fim: '',
        progresso: 0,
      });
    }

    // 3. Get Subactivities directly from orcamento_atividades
    const { data: subsData } = await supabase
      .from('orcamento_atividades')
      .select(`
        id,
        descricao,
        ordem,
        atividade_secundaria_progresso (
          id,
          progresso
        )
      `)
      .eq('orcamento_id', stageId)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: true });

    if (subsData) {
      const mappedSubs = subsData.map(item => {
        const p = Array.isArray(item.atividade_secundaria_progresso) ? item.atividade_secundaria_progresso[0] : item.atividade_secundaria_progresso;
        return {
          orcamento_atividade_id: item.id,
          nome: item.descricao,
          progresso_id: p?.id || null,
          progresso: p?.progresso || 0
        };
      });
      setSubatividades(mappedSubs);
    }

    // 4. Get Images if pid exists
    if (pid) {
      const { data: imgsData } = await supabase.from('atividade_imagens').select('*').eq('atividade_progresso_id', pid).order('created_at', { ascending: true });
      if (imgsData) setImages(imgsData);
    }
  };

  const ensureAtividadeProgressoExists = async () => {
    if (progressoGeral.id) return progressoGeral.id;
    
    const { data, error } = await supabase.from('atividade_progresso').insert({
        orcamento_id: stageId,
        atividade_principal: atividadePrincipalNome || 'Desconhecida',
        status: progressoGeral.status,
        data_inicio: progressoGeral.data_inicio || null,
        data_fim: progressoGeral.data_fim || null,
        progresso: progressoGeral.progresso
    }).select().single();
    
    if (!error && data) {
        setProgressoGeral(data);
        return data.id;
    }
    return null;
  };

  const updateStageField = async (field: string, value: any) => {
    const updated = { ...progressoGeral, [field]: value };
    setProgressoGeral(updated);
    
    const pid = await ensureAtividadeProgressoExists();
    if (pid) {
        await supabase.from('atividade_progresso').update({ [field]: value || null }).eq('id', pid);
    }
  };

  const updateSubProgress = async (orcamento_atividade_id: string, novoProgresso: number) => {
    const pct = Math.min(100, Math.max(0, Math.round(novoProgresso)));
    
    // Update local state temporarily for immediate HMR visualization
    const novasSubs = subatividades.map(s => 
        s.orcamento_atividade_id === orcamento_atividade_id 
            ? { ...s, progresso: pct } 
            : s
    );
    setSubatividades(novasSubs);
    
    const pid = await ensureAtividadeProgressoExists();
    if (!pid) return;

    const sub = subatividades.find(s => s.orcamento_atividade_id === orcamento_atividade_id);
    
    if (sub.progresso_id) {
        await supabase.from('atividade_secundaria_progresso').update({ progresso: pct }).eq('id', sub.progresso_id);
    } else {
        const { data } = await supabase.from('atividade_secundaria_progresso').insert({
            atividade_progresso_id: pid,
            orcamento_atividade_id: orcamento_atividade_id,
            descricao: sub.nome,
            progresso: pct
        }).select().single();
        
        if (data) {
           const finalSubs = novasSubs.map(s => s.orcamento_atividade_id === orcamento_atividade_id ? { ...s, progresso_id: data.id } : s);
           setSubatividades(finalSubs);
        }
    }
    
    // Recalcular Progresso Geral Média Simples
    const total = novasSubs.reduce((acc, curr) => acc + curr.progresso, 0);
    const avg = novasSubs.length > 0 ? Math.round(total / novasSubs.length) : 0;
    
    setProgressoGeral((prev: any) => ({ ...prev, progresso: avg }));
    await supabase.from('atividade_progresso').update({ progresso: avg }).eq('id', pid);
  };

  const handleImagesUploaded = async (urls: string[]) => {
    const pid = await ensureAtividadeProgressoExists();
    if (!pid) return;

    const existingUrls = images.map(img => img.url_imagem);
    const newUrls = urls.filter((url: string) => !existingUrls.includes(url));
    
    for (const url of newUrls) {
      const { data } = await supabase.from('atividade_imagens').insert({
        atividade_progresso_id: pid,
        url_imagem: url,
        descricao: ''
      }).select().single();
      
      if (data) setImages(prev => [...prev, data]);
    }
  };

  const updateImageDescription = async (id: string, description: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, description } : img));
    await supabase.from('atividade_imagens').update({ description }).eq('id', id);
  };

  const deleteImage = async (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    await supabase.from('atividade_imagens').delete().eq('id', id);
  };

  if (isLoading || !progressoGeral) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-balix-accent"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/acompanhamento/etapas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-balix-dark">{atividadePrincipalNome}</h2>
            <p className="text-muted-foreground">Atividade central vinculada intimamente ao seu orçamento base.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={progressoGeral.status || 'pendente'} onValueChange={(val) => updateStageField('status', val)} disabled={!canEdit}>
                    <SelectTrigger className="bg-background/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input 
                    type="date" 
                    value={progressoGeral.data_inicio || ''} 
                    onChange={(e) => updateStageField('data_inicio', e.target.value)} 
                    className="bg-background/80" 
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Fim</Label>
                  <Input 
                    type="date" 
                    value={progressoGeral.data_fim || ''} 
                    onChange={(e) => updateStageField('data_fim', e.target.value)} 
                    className="bg-background/80" 
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progresso da Atividade</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 h-[calc(100%-4rem)]">
              <div className="text-4xl font-bold text-balix-accent">
                {progressoGeral.progresso || 0}%
              </div>
              <Progress value={progressoGeral.progresso || 0} className="w-full h-3" />
              <p className="text-xs text-muted-foreground text-center px-4">
                Média calculada automaticamente a partir das atividades secundárias abaixo.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Atividades Secundárias do Orçamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome e Descrição</TableHead>
                    <TableHead className="w-[200px]">Progresso (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subatividades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                        Esta atividade matriz não possui nenhum item cadastrado no setor do orçamento.
                      </TableCell>
                    </TableRow>
                  ) : subatividades.map((sub) => (
                    <TableRow key={sub.orcamento_atividade_id}>
                      <TableCell className="font-medium text-balix-dark">{sub.nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            min="0" max="100" 
                            className="w-20 font-bold"
                            value={sub.progresso}
                            onChange={(e) => updateSubProgress(sub.orcamento_atividade_id, parseInt(e.target.value) || 0)}
                            disabled={!canEdit}
                          />
                          <Progress value={sub.progresso} className="w-20" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Galeria de Imagens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {canEdit && (
              <div className="bg-secondary/20 p-4 rounded-xl border border-border">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-foreground">
                  <ImageIcon className="h-4 w-4" /> Enviar Novas Imagens
                </h4>
                {user && (
                  <ImageUpload 
                    onUpload={handleImagesUploaded} 
                    existingImages={[]} 
                    multiple={true} 
                    userId={user.id} 
                    clearOnSuccess={true}
                  />
                )}
              </div>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((img) => (
                  <div key={img.id} className="border rounded-xl overflow-hidden bg-card shadow-sm flex flex-col group relative">
                    {canEdit && (
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => deleteImage(img.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="h-48 w-full bg-secondary/50 flex items-center justify-center overflow-hidden cursor-pointer">
                          <img src={img.url_imagem} alt="Registro da etapa" className="w-full h-full object-cover transition-transform hover:scale-105" />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-2 bg-transparent border-none shadow-none">
                        <img src={img.url_imagem} alt="Ampliada" className="w-full h-auto max-h-[90vh] object-contain rounded-md" />
                        {img.descricao && <p className="text-white text-center mt-2 font-medium text-lg drop-shadow-md">{img.descricao}</p>}
                      </DialogContent>
                    </Dialog>
                    <div className="p-3">
                      <Label className="text-xs text-muted-foreground mb-1 block">Descrição da Imagem</Label>
                      <Input 
                        placeholder={canEdit ? "Ex: Armação das vigas pronta..." : "Sem descrição"} 
                        value={img.descricao || ''}
                        onChange={(e) => updateImageDescription(img.id, e.target.value)}
                        disabled={!canEdit}
                        className="text-sm bg-background border-none shadow-none px-0 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {images.length === 0 && (
               <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                 Nenhuma imagem adicionada para esse centro de acompanhamento ainda.
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

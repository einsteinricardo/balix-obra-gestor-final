
import React from 'react';
import { WorkDiaryEntry } from '@/types/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Cloud, Sun, CloudRain, CloudDrizzle, Calendar, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PermissionGuard from '@/components/rbac/PermissionGuard';
import { useProject } from '@/contexts/ProjectContext';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface WorkDiaryCardsProps {
  entries: WorkDiaryEntry[];
  onEdit: (entry: WorkDiaryEntry) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const WorkDiaryCards: React.FC<WorkDiaryCardsProps> = ({ entries, onEdit, onDelete, isLoading }) => {
  const { selectedProjectId } = useProject();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<WorkDiaryEntry | null>(null);
  const [imageIndex, setImageIndex] = React.useState(0);

  const openGallery = (entry: WorkDiaryEntry) => {
    setSelectedEntry(entry);
    setImageIndex(0);
    setModalOpen(true);
  };

  const nextImage = React.useCallback(() => {
    if (!selectedEntry) return;
    const imagesArray = selectedEntry.diario_imagens?.length ? selectedEntry.diario_imagens.map(i => i.url_imagem) : (selectedEntry.image_url ? selectedEntry.image_url.split(',') : []);
    setImageIndex((prev) => (prev + 1) % imagesArray.length);
  }, [selectedEntry]);

  const prevImage = React.useCallback(() => {
    if (!selectedEntry) return;
    const imagesArray = selectedEntry.diario_imagens?.length ? selectedEntry.diario_imagens.map(i => i.url_imagem) : (selectedEntry.image_url ? selectedEntry.image_url.split(',') : []);
    setImageIndex((prev) => (prev === 0 ? imagesArray.length - 1 : prev - 1));
  }, [selectedEntry]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalOpen) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, nextImage, prevImage]);

  const getWeatherIcon = (weather?: string) => {
    switch (weather) {
      case 'sunny': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'cloudy': return <Cloud className="h-4 w-4 text-gray-500" />;
      case 'rainy': return <CloudRain className="h-4 w-4 text-blue-500" />;
      case 'partly_cloudy': return <CloudDrizzle className="h-4 w-4 text-gray-400" />;
      default: return <Sun className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getWeatherLabel = (weather?: string): string => {
    const weatherMap: Record<string, string> = {
      'sunny': 'Ensolarado', 'cloudy': 'Nublado',
      'rainy': 'Chuvoso', 'partly_cloudy': 'Parcialmente nublado'
    };
    return weather ? weatherMap[weather] || weather : 'Não informado';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dda23a] mx-auto"></div>
          <p className="mt-2 text-sm text-[#d6d6d6]">Carregando entradas do diário...</p>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-[#1e2914] rounded-xl p-8 max-w-md mx-auto border border-[#2f3b24]">
          <h3 className="text-lg font-medium text-white mb-2">Nenhuma entrada encontrada</h3>
          <p className="text-[#d6d6d6] mb-4">Ainda não há entradas no diário de obras para este período.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {entries.map((entry) => {
        const imagesList = entry.diario_imagens?.length ? entry.diario_imagens.map(i => i.url_imagem) : (entry.image_url ? entry.image_url.split(',') : []);
        const hasImages = imagesList.length > 0;
        
        return (
        <Card key={entry.id} className="bg-[#1e2914] border-[#2f3b24] overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-[#dda23a]/30">
          {hasImages ? (
            <div className="aspect-video w-full overflow-hidden cursor-pointer group relative" onClick={() => openGallery(entry)}>
              <img src={imagesList[0]} alt={`Diário ${format(new Date(entry.date), 'dd/MM/yyyy')}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {imagesList.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium">
                  + {imagesList.length - 1} foto{imagesList.length - 1 !== 1 ? 's' : ''}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <Eye className="text-white opacity-0 group-hover:opacity-100 h-8 w-8 drop-shadow-md" />
              </div>
            </div>
          ) : (
            <div className="aspect-video w-full bg-[#262d1f] flex items-center justify-center">
              <Calendar className="h-12 w-12 text-[#dda23a]/50" />
            </div>
          )}

          <div className="p-4 space-y-3">
            <div>
              <h4 className="text-[#8b4a12] font-semibold text-sm mb-1">Descrição das Atividades</h4>
              <p className="text-white text-sm leading-relaxed line-clamp-3">{entry.description}</p>
            </div>

            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(entry.date), 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                {getWeatherIcon(entry.weather)}
                <span>{getWeatherLabel(entry.weather)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[#d6d6d6] text-sm">
              <User className="h-4 w-4" />
              <span>Responsável: {entry.responsible}</span>
            </div>

            <div className="flex gap-2 pt-2">
              {hasImages && (
                <Button size="sm" variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10" onClick={() => openGallery(entry)}>
                  <Eye className="h-3 w-3 mr-1" />{imagesList.length} Foto{imagesList.length !== 1 ? 's' : ''}
                </Button>
              )}
              
              <PermissionGuard module="diario_obra" action="update" obraId={selectedProjectId}>
                <Button size="sm" onClick={() => onEdit(entry)} className="flex-1 bg-[#dda23a] hover:bg-[#e8b949] text-[#151f0e]">
                  <Edit className="h-3 w-3 mr-1" />Editar
                </Button>
              </PermissionGuard>
              
              <PermissionGuard module="diario_obra" action="delete" obraId={selectedProjectId}>
                <Button size="sm" onClick={() => onDelete(entry.id)} className="flex-1 bg-[#e74c3c] hover:bg-[#c0392b] text-white">
                  <Trash2 className="h-3 w-3 mr-1" />Excluir
                </Button>
              </PermissionGuard>
            </div>
          </div>
        </Card>
      );
      })}

      {/* Interactive Carousel Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[80vw] md:max-w-4xl p-0 bg-black/95 border-none shadow-2xl overflow-hidden [&>button]:hidden">
          {selectedEntry && (() => {
            const activeImages = selectedEntry.diario_imagens?.length ? selectedEntry.diario_imagens.map(i => i.url_imagem) : (selectedEntry.image_url ? selectedEntry.image_url.split(',') : []);
            
            return (
              <div className="relative w-full h-[85vh] flex flex-col justify-center items-center">
                {/* Close Button Top */}
                <button 
                  onClick={() => setModalOpen(false)}
                  className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
                
                {/* Header Indicator */}
                <div className="absolute top-4 left-4 z-50 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white/90 text-sm font-medium">
                  Imagem {imageIndex + 1} de {activeImages.length}
                </div>

                {/* Main Image Viewport Area (Click outside closes image, clicks on image bubble differently but we keep it simple here by making the image wrap large) */}
                <div className="flex-1 w-full h-full flex items-center justify-center p-4" onClick={(e) => {
                  if (e.target === e.currentTarget) setModalOpen(false);
                }}>
                  <img 
                    src={activeImages[imageIndex]} 
                    alt={`Preview ${imageIndex + 1}`}
                    className="max-w-full max-h-[70vh] object-contain select-none shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-md transition-opacity duration-300"
                  />
                </div>

                {/* Arrows */}
                {activeImages.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all shadow-xl"
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all shadow-xl"
                    >
                      <ChevronRight className="h-8 w-8" />
                    </button>
                  </>
                )}

                {/* Thumbnails */}
                {activeImages.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
                    {activeImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setImageIndex(idx); }}
                        className={`relative h-16 w-24 flex-shrink-0 rounded-md overflow-hidden transition-all snap-center ${
                          idx === imageIndex ? 'ring-2 ring-[#dda23a] opacity-100 scale-105' : 'opacity-40 hover:opacity-100'
                        }`}
                      >
                        <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkDiaryCards;

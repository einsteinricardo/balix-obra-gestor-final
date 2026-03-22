import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';

interface RecentImagesGalleryProps {
  images: any[];
}

const RecentImagesGallery: React.FC<RecentImagesGalleryProps> = ({ images }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const openGallery = (idx: number) => {
    setImageIndex(idx);
    setModalOpen(true);
  };

  const nextImage = React.useCallback(() => {
    setImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = React.useCallback(() => {
    setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalOpen) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, nextImage, prevImage]);

  if (!images || images.length === 0) {
    return (
      <Card className="h-full bg-white/[0.02] border border-white/[0.08] rounded-[16px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] backdrop-blur-[6px] transition-all duration-300 hover:translate-y-[-2px] flex flex-col pt-2 overflow-hidden">
        <CardHeader className="pb-4 flex-shrink-0">
          <CardTitle className="text-[18px] font-semibold tracking-[0.3px] text-white/90 font-playfair flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-[#a2632a]" /> Acompanhamento Visual
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center min-h-[300px] pt-0 px-8">
          <div className="text-sm text-white/40 text-center border border-dashed rounded-xl border-white/10 p-12 w-full">
            Nenhuma foto recente anexada ao diário de obra.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white/[0.02] border border-white/[0.08] rounded-[16px] shadow-[0_6px_24px_rgba(0,0,0,0.25)] backdrop-blur-[6px] transition-all duration-300 hover:translate-y-[-2px] flex flex-col overflow-hidden pt-2 group">
      <CardHeader className="pb-6 flex-shrink-0">
        <CardTitle className="text-[18px] font-semibold tracking-[0.3px] text-white/90 font-playfair flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-[#a2632a]" /> Acompanhamento Visual Diário
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pt-0 pb-8 px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div 
              key={img.id} 
              className="aspect-[4/3] bg-secondary/30 rounded-xl overflow-hidden cursor-pointer group/item relative shadow-sm hover:shadow-xl transition-all duration-300"
              onClick={() => openGallery(idx)}
            >
              <img 
                src={img.url_imagem} 
                alt="Progresso da Obra" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity flex items-end p-3">
                 <span className="text-white text-[10px] font-bold uppercase tracking-widest bg-balix-accent/80 px-3 py-1.5 rounded-full backdrop-blur-md">Ver Detalhes</span>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-[80vw] md:max-w-4xl p-0 bg-black/95 border-none shadow-2xl overflow-hidden [&>button]:hidden">
            <DialogTitle className="sr-only">Galeria da Obra</DialogTitle>
            {images.length > 0 && (
              <div className="relative w-full h-[85vh] flex flex-col justify-center items-center">
                <button 
                  onClick={() => setModalOpen(false)}
                  className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
                
                <div className="absolute top-4 left-4 z-50 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white/90 text-sm font-medium">
                  Imagem {imageIndex + 1} de {images.length}
                </div>

                <div className="flex-1 w-full h-full flex items-center justify-center p-4" onClick={(e) => {
                  if (e.target === e.currentTarget) setModalOpen(false);
                }}>
                  <img 
                    src={images[imageIndex]?.url_imagem} 
                    alt={`Preview`}
                    className="max-w-full max-h-[70vh] object-contain select-none shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-md transition-opacity duration-300"
                  />
                  {images[imageIndex]?.descricao && (
                     <div className="absolute bottom-20 bg-black/70 backdrop-blur text-white px-4 py-2 rounded-lg max-w-lg text-center font-medium">
                        {images[imageIndex].descricao}
                     </div>
                  )}
                </div>

                {images.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-all shadow-xl hover:scale-105"
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-all shadow-xl hover:scale-105"
                    >
                      <ChevronRight className="h-8 w-8" />
                    </button>
                  </>
                )}

                {images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={(e) => { e.stopPropagation(); setImageIndex(idx); }}
                        className={`relative h-16 w-24 flex-shrink-0 rounded-md overflow-hidden transition-all snap-center ${
                          idx === imageIndex ? 'ring-2 ring-primary opacity-100 scale-105' : 'opacity-40 hover:opacity-100'
                        }`}
                      >
                        <img src={img.url_imagem} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
export default RecentImagesGallery;

import { useEffect, useState } from "react";
import { BookItem } from "@/pages/Index";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Download, X, Heart, Crown, Timer, Lock, Plus } from "lucide-react";
import { AddToReadingPlan } from './AddToReadingPlan';
import { YouTubePlayer } from "./YouTubePlayer";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { isYouTubeUrl, extractYouTubeId } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface BookDetailProps {
  book: BookItem;
  onBack: () => void;
  onFavorite?: (bookId: number, isFavorite: boolean) => void;
  isFavorite?: boolean;
}
export const BookDetail = ({
  book,
  onBack,
  onFavorite,
  isFavorite = false
}: BookDetailProps) => {
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const [showReader, setShowReader] = useState(false);
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showWaitModal, setShowWaitModal] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canReadToday, setCanReadToday] = useState(true);
  const [hasUsedFreeRead, setHasUsedFreeRead] = useState(false);
  const { readingProgress, markAsReading, stopReading } = useReadingProgress();
  useEffect(() => {
    window.scrollTo(0, 0);
    checkDailyFreeRead();
  }, [user]);

  const checkDailyFreeRead = async () => {
    if (!user) return;
    // Simplified for now - will be implemented with working database
    setCanReadToday(true);
    setHasUsedFreeRead(false);
  };
  const handleReadNow = async () => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para ler os livros.',
        variant: 'destructive',
      });
      return;
    }

    // Check subscription status
    if (subscription.subscribed) {
      // Subscribed users get immediate access
      startReading();
      await recordBookAccess();
      return;
    }

    // Free users need to wait 30 seconds and can only read 1 book per day
    if (!canReadToday) {
      toast({
        title: 'Limite diário atingido',
        description: 'Você já leu um livro hoje. Assine um plano para leitura ilimitada.',
        variant: 'destructive',
      });
      setShowPremiumModal(true);
      return;
    }

    // Start countdown for free users
    setShowWaitModal(true);
    setCountdown(30);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowWaitModal(false);
          startReading();
          recordDailyFreeRead();
          recordBookAccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startReading = () => {
    if (book.link) {
      if (isYouTubeUrl(book.link)) {
        const id = extractYouTubeId(book.link);
        if (id) {
          setVideoId(id);
          setIsVideo(true);
          setShowReader(true);
        }
      } else {
        setContentUrl(book.link);
        setIsVideo(false);
        setShowReader(true);
      }
    }
  };

  const recordDailyFreeRead = async () => {
    // Simplified for now
    setHasUsedFreeRead(true);
    setCanReadToday(false);
  };

  const recordBookAccess = async () => {
    // Simplified for now
    console.log('Book accessed:', book.id);
  };
  const handleDownload = () => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para baixar livros.',
        variant: 'destructive',
      });
      return;
    }

    if (subscription.subscription_tier === 'premium') {
      // Premium users can download
      if (book.download) {
        window.open(book.download, '_blank');
      } else {
        toast({
          title: 'Download não disponível',
          description: 'Este livro não tem download disponível.',
          variant: 'destructive',
        });
      }
    } else {
      // Show premium upgrade modal
      setShowPremiumModal(true);
    }
  };
  if (showReader) {
    return <div className="fixed inset-0 bg-background z-50">
        <div className="fixed top-4 left-4 right-4 z-60 flex justify-between">
          <Button 
            onClick={async () => {
              await markAsReading(book.id);
              toast({
                title: 'Livro marcado como lendo',
                description: 'Você pode ver seus livros em andamento na página "Lendo".',
              });
            }}
            className="bg-primary/20 backdrop-blur-sm border border-primary/30 text-foreground hover:bg-primary/30"
          >
            <Plus className="h-4 w-4 mr-2" />
            Lendo
          </Button>
          <Button onClick={() => {
            setShowReader(false);
            setContentUrl(null);
            setVideoId(null);
            setIsVideo(false);
          }} className="bg-primary/20 backdrop-blur-sm border border-primary/30 text-foreground hover:bg-primary/30">
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
        <div className="w-full h-full">
          <div className="w-full h-full">
            {isVideo && videoId ? <YouTubePlayer videoId={videoId} onVideoEnd={() => setShowReader(false)} onVideoStart={() => {}} /> : contentUrl ? <iframe src={contentUrl} className="w-full h-full border-0" title={book.livro} sandbox="allow-same-origin allow-scripts allow-popups allow-forms" /> : null}
          </div>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 text-foreground hover:bg-primary/30">
        <ArrowLeft className="h-4 w-4" />
        Voltar para biblioteca
      </Button>

      {/* Book Cover and Action Buttons */}
      <Card className="overflow-hidden">
        <CardContent className="p-6 px-[20px]">
          <div className="flex flex-col gap-6">
            {/* Book Cover - Centralized */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-48 h-64 bg-gradient-primary rounded-lg flex items-center justify-center overflow-hidden shadow-lg">
                  {book.imagem ? <img src={book.imagem} alt={book.livro} className="w-full h-full object-cover" /> : <BookOpen className="h-16 w-16 text-primary-foreground" />}
                </div>
                {/* Favorite Heart */}
                {onFavorite && <button onClick={() => onFavorite(book.id, !isFavorite)} className="absolute -top-2 -right-2 w-10 h-10 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-border hover:bg-background transition-all duration-200 shadow-lg">
                    <Heart className={`h-5 w-5 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground hover:text-red-500'}`} />
                  </button>}
              </div>
            </div>
            
            {/* Book Title and Author - After Cover */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {book.livro}
              </h1>
              <p className="text-lg text-primary font-medium">
                por {book.autor}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-2 justify-center max-w-md mx-auto">
                <Button 
                  onClick={handleReadNow} 
                  disabled={!book.link || (!user && !subscription.subscribed)} 
                  className="flex-1 flex items-center gap-2"
                >
                  {!user ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Faça Login
                    </>
                  ) : !subscription.subscribed && !canReadToday ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Limite Diário
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4" />
                      {subscription.subscribed ? 'Ler Agora' : 'Ler Grátis (30s)'}
                    </>
                  )}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handleDownload} 
                  className="flex-1 flex items-center gap-2"
                  disabled={!user}
                >
                  <Download className="h-4 w-4" />
                  {subscription.subscription_tier === 'premium' ? 'Download' : 'Premium'}
                </Button>
              </div>
              
              <div className="flex justify-center">
                <AddToReadingPlan bookId={book.id} />
              </div>
            </div>

            {/* Book Details */}
            <div className="space-y-6">
              {/* About the Book */}
              {book.sobre && <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Sobre o Livro
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {book.sobre}
                  </p>
                </div>}

              {/* Benefits */}
              {book.beneficios && <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Benefícios da Leitura
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {book.beneficios}
                  </p>
                </div>}

              {/* Additional Info */}
              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Autor:</span>
                    <span className="ml-2 text-foreground font-medium">{book.autor}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categoria:</span>
                    <span className="ml-2 text-foreground font-medium">Clássico</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Leitura Online:</span>
                    <span className="ml-2 text-foreground font-medium">
                      {book.link ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Download:</span>
                    <span className="ml-2 text-foreground font-medium">
                      {book.download ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wait Modal for Free Users */}
      {showWaitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-gradient-card border-primary/30 shadow-luxury">
            <CardContent className="p-6">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <Timer className="h-8 w-8 text-primary-foreground" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Aguarde um momento...
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Sua leitura gratuita será liberada em:
                  </p>
                </div>
                
                <div className="text-4xl font-bold text-primary">
                  {countdown}s
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Usuários premium têm acesso imediato sem espera
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-gradient-card border-primary/30 shadow-luxury">
            <CardContent className="p-6">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <button
                    onClick={() => setShowPremiumModal(false)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-surface-luxury/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-border hover:bg-surface-luxury transition-all duration-200"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Desbloqueie Todo o Potencial
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Escolha um plano e tenha acesso imediato e downloads
                  </p>
                </div>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm text-foreground">Leitura imediata sem espera</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm text-foreground">Livros ilimitados por dia</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm text-foreground">Downloads em PDF (Premium)</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => window.location.pathname = '/assinaturas'}
                    className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Ver Planos
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowPremiumModal(false)}
                    className="w-full"
                  >
                    Continuar Grátis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
    </div>;
};
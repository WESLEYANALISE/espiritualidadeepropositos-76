import { useState } from 'react';
import { ArrowLeft, Heart, Play, Clock, User, Download, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookItem } from '@/pages/Index';
import { AITeacher } from '@/components/AITeacher';
import { FloatingTeacherButton } from '@/components/FloatingTeacherButton';

interface BookDetailWithAIProps {
  book: BookItem;
  onBack: () => void;
  onFavorite: (bookId: number, isFavorite: boolean) => void;
  isFavorite: boolean;
}

export const BookDetailWithAI = ({ book, onBack, onFavorite, isFavorite }: BookDetailWithAIProps) => {
  const [showAITeacher, setShowAITeacher] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  const handleReadNow = () => {
    setShowAITeacher(true);
    setShowFloatingButton(true);
    // Open the book link
    if (book.link) {
      window.open(book.link, '_blank');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        
        <Button
          variant={isFavorite ? "default" : "outline"}
          onClick={() => onFavorite(book.id, !isFavorite)}
          className="flex items-center gap-2 transition-all duration-300"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          {isFavorite ? 'Favoritado' : 'Favoritar'}
        </Button>
      </div>

      <Card className="bg-gradient-card border-primary/20 shadow-elevated">
        <CardHeader className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-shrink-0">
              {book.imagem ? (
                <img 
                  src={book.imagem} 
                  alt={book.livro}
                  className="w-full lg:w-48 h-64 lg:h-72 object-cover rounded-lg shadow-book"
                />
              ) : (
                <div className="w-full lg:w-48 h-64 lg:h-72 bg-gradient-primary rounded-lg flex items-center justify-center shadow-book">
                  <span className="text-primary-foreground text-4xl font-bold">
                    {book.livro.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <CardTitle className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                {book.livro}
              </CardTitle>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium">{book.autor}</span>
              </div>

              {book.area && (
                <Badge variant="secondary" className="w-fit">
                  {book.area}
                </Badge>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button 
                  onClick={handleReadNow}
                  className="bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground shadow-glow transition-all duration-300 hover:scale-105"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Ler Agora
                </Button>
                
                {book.download && (
                  <Button variant="outline" asChild>
                    <a href={book.download} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                )}
                
                {book.link && (
                  <Button variant="outline" asChild>
                    <a href={book.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Link Externo
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Sobre o Livro</h3>
            <p className="text-muted-foreground leading-relaxed">
              {book.sobre || 'Descrição não disponível.'}
            </p>
          </div>

          {book.beneficios && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Benefícios da Leitura</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {book.beneficios}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showAITeacher && (
        <AITeacher 
          book={book} 
          onClose={() => setShowAITeacher(false)}
          autoOpen={true}
        />
      )}
      
      {/* Floating Teacher Button - Only show when reading but chat is closed */}
      {showFloatingButton && !showAITeacher && (
        <FloatingTeacherButton 
          onClick={() => setShowAITeacher(true)}
        />
      )}
    </div>
  );
};
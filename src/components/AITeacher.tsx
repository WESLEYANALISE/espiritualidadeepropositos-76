import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Image, X, Loader2, BookOpen, Lightbulb, HelpCircle, Star, Brain, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BookItem } from '@/pages/Index';

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  hasImage?: boolean;
}

interface AITeacherProps {
  book: BookItem;
  onClose: () => void;
  autoOpen?: boolean;
}

export const AITeacher = ({ book, onClose, autoOpen = false }: AITeacherProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userName = user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'amigo';

  const quickCommands = [
    {
      icon: BookOpen,
      label: "Explicar livro",
      message: "Pode me explicar do que se trata este livro de forma resumida?",
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20"
    },
    {
      icon: Lightbulb,
      label: "Curiosidades",
      message: "Conte-me algumas curiosidades interessantes sobre este livro ou autor.",
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    },
    {
      icon: HelpCircle,
      label: "Dúvidas frequentes",
      message: "Quais são as principais dúvidas que leitores têm sobre este livro?",
      color: "bg-green-500/10 text-green-600 border-green-500/20"
    },
    {
      icon: Star,
      label: "Principais pontos",
      message: "Quais são os pontos mais importantes e lições deste livro?",
      color: "bg-purple-500/10 text-purple-600 border-purple-500/20"
    },
    {
      icon: Brain,
      label: "Análise profunda",
      message: "Faça uma análise mais profunda dos temas e conceitos abordados.",
      color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
    },
    {
      icon: MessageSquare,
      label: "Dicas de leitura",
      message: "Que dicas você daria para aproveitar melhor a leitura deste livro?",
      color: "bg-pink-500/10 text-pink-600 border-pink-500/20"
    }
  ];

  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
    }
  }, [autoOpen]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleSendMessage = async () => {
    if ((!currentMessage.trim() && !selectedImage) || isLoading) return;

    setIsLoading(true);
    const messageId = Date.now().toString();
    
    try {
      let imageData = null;
      if (selectedImage) {
        // Convert image to base64
        const reader = new FileReader();
        imageData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(selectedImage);
        });
      }

      // Call AI teacher edge function
      const { data, error } = await supabase.functions.invoke('ai-teacher', {
        body: {
          message: currentMessage || null,
          bookId: book.id,
          imageData,
          userId: user?.id,
        },
      });

      if (error) throw error;

      const newMessage: ChatMessage = {
        id: messageId,
        message: currentMessage || 'Análise de imagem',
        response: data.response,
        timestamp: new Date(),
        hasImage: !!selectedImage,
      };

      setMessages(prev => [...prev, newMessage]);
      setCurrentMessage('');
      setSelectedImage(null);

      toast({
        title: 'Resposta recebida!',
        description: 'A professora respondeu sua pergunta.',
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'Por favor, selecione uma imagem menor que 5MB.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedImage(file);
    }
  };

  const sendQuickCommand = (command: typeof quickCommands[0]) => {
    setCurrentMessage(command.message);
    setTimeout(() => handleSendMessage(), 100);
  };

  const ChatInterface = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <Card className="w-full max-w-2xl h-[90vh] md:h-[85vh] bg-gradient-card border-primary/30 shadow-luxury overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg font-bold text-foreground truncate">
                  📚 Professora IA
                </CardTitle>
                <p className="text-xs text-muted-foreground truncate">
                  {book.livro}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-9 w-9 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex flex-col h-full p-4 md:p-6 overflow-hidden">
          <ScrollArea className="flex-1 mb-6">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-gradient-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Olá, {userName}! 👋
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
                      Sou sua professora particular de leitura. Estou aqui para te ajudar a compreender melhor este livro e aproveitar ao máximo sua leitura!
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      Comandos rápidos para começar:
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {quickCommands.map((command, index) => {
                        const Icon = command.icon;
                        return (
                          <Button
                            key={index}
                            variant="outline"
                            onClick={() => sendQuickCommand(command)}
                            className={`h-auto p-3 flex flex-col items-center gap-2 hover:scale-105 transition-all ${command.color} border`}
                            disabled={isLoading}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs font-medium text-center">{command.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="space-y-3">
                    <div className="bg-primary/10 rounded-2xl p-4 ml-auto max-w-[85%] border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-primary">{userName}</span>
                      </div>
                      <p className="text-sm text-foreground">{msg.message}</p>
                      {msg.hasImage && (
                        <Badge variant="secondary" className="mt-2">
                          📷 Imagem anexada
                        </Badge>
                      )}
                    </div>
                    <div className="bg-accent/50 rounded-2xl p-4 mr-auto max-w-[85%] border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                          <MessageCircle className="h-3 w-3 text-primary-foreground" />
                        </div>
                        <span className="text-xs font-medium text-primary">Professora</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{msg.response}</p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="bg-accent/50 rounded-2xl p-4 mr-auto max-w-[85%] border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                      <MessageCircle className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Preparando uma resposta especial para você...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="space-y-4 border-t border-border/50 pt-4">
            {selectedImage && (
              <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-xl border border-border/50">
                <Image className="h-5 w-5 text-primary" />
                <span className="text-sm text-foreground flex-1 font-medium">
                  {selectedImage.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedImage(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex gap-3">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder={`Pergunte algo sobre o livro, ${userName}...`}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
                className="flex-1 h-12 text-base"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-12 w-12"
              >
                <Image className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || (!currentMessage.trim() && !selectedImage)}
                size="icon"
                className="h-12 w-12 bg-gradient-primary hover:bg-gradient-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {isOpen && <ChatInterface />}
    </>
  );
};
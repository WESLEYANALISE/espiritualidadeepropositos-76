import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Success() {
  const { checkSubscription, subscription } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Verificação mais robusta da assinatura após pagamento
    const verifySubscription = async () => {
      console.log('[SUCCESS] Iniciando verificação da assinatura...');
      setIsChecking(true);
      
      // Primeira verificação imediata
      await checkSubscription();
      
      // Se ainda não estiver ativo, tenta algumas vezes com delay
      let attempts = 0;
      const maxAttempts = 6;
      
      const checkLoop = async () => {
        attempts++;
        console.log(`[SUCCESS] Tentativa ${attempts} de verificação...`);
        
        await checkSubscription();
        
        if (!subscription.subscribed && attempts < maxAttempts) {
          setTimeout(checkLoop, 2000); // Tenta novamente em 2 segundos
        } else {
          console.log('[SUCCESS] Verificação finalizada:', subscription);
          setIsChecking(false);
        }
      };
      
      // Inicia o loop de verificação após 1 segundo
      setTimeout(checkLoop, 1000);
    };
    
    verifySubscription();
  }, []); // Sem dependência para evitar loops

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gradient-card border-primary/30 shadow-luxury">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Pagamento Confirmado!
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Sua assinatura foi ativada com sucesso
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div className="space-y-3">
            {isChecking ? (
              <div className="flex items-center justify-center gap-2 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Ativando Premium...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-primary">
                <Crown className="h-5 w-5" />
                <span className="font-medium">
                  {subscription.subscribed ? 'Acesso Premium Ativado' : 'Processando Pagamento...'}
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {isChecking 
                ? 'Aguarde enquanto ativamos sua assinatura...' 
                : subscription.subscribed 
                  ? 'Agora você pode aproveitar todos os benefícios da sua assinatura'
                  : 'Seu pagamento foi processado. A ativação pode levar alguns minutos.'
              }
            </p>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              Começar a Ler
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/assinaturas'}
              className="w-full"
            >
              Ver Minha Assinatura
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>
              Você receberá um e-mail de confirmação em breve.
              Se tiver dúvidas, entre em contato conosco.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
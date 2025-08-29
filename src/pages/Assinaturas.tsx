import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Check, Loader2, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ResponsiveNavigation } from '@/components/ResponsiveNavigation';
import { StripeCheckout } from '@/components/StripeCheckout';

export default function Assinaturas() {
  const { user, subscription, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  // Verificar se o usuário cancelou o pagamento
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('canceled') === 'true') {
      toast({
        title: 'Pagamento Cancelado',
        description: 'Você pode tentar novamente quando quiser.',
        variant: 'destructive',
      });
      // Remove o parâmetro da URL
      window.history.replaceState({}, document.title, '/assinaturas');
    }
  }, [toast]);

  const handleSubscribe = async (plan: 'basic' | 'premium') => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para assinar um plano.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(plan);
    try {
      console.log(`[FRONTEND] Iniciando assinatura do plano: ${plan}`);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan }
      });

      console.log('[FRONTEND] Resposta da função:', { data, error });

      if (error) {
        console.error('[FRONTEND] Erro na função:', error);
        throw error;
      }

      if (data?.error) {
        console.error('[FRONTEND] Erro retornado pela função:', data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        console.log('[FRONTEND] Abrindo checkout:', data.url);
        setCheckoutUrl(data.url);
      } else {
        throw new Error('URL do checkout não foi retornada');
      }
    } catch (error: any) {
      console.error('[FRONTEND] Erro ao processar assinatura:', error);
      
      let errorMessage = 'Não foi possível processar a assinatura. Tente novamente.';
      let errorTitle = 'Erro na Assinatura';
      
      if (error.message) {
        // Use the detailed error message from the backend if available
        if (typeof error.message === 'string') {
          errorMessage = error.message;
        }
        
        // Customize title based on error type
        if (error.message.includes('Configuração de pagamento')) {
          errorTitle = 'Erro de Configuração';
        } else if (error.message.includes('autenticação') || error.message.includes('login')) {
          errorTitle = 'Erro de Autenticação';
        } else if (error.message.includes('Plano')) {
          errorTitle = 'Erro no Plano';
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setLoading('manage');
    try {
      console.log('[FRONTEND] Abrindo portal de gerenciamento');
      
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      console.log('[FRONTEND] Resposta do portal:', { data, error });

      if (error) {
        console.error('[FRONTEND] Erro na função customer-portal:', error);
        throw error;
      }

      if (data?.error) {
        console.error('[FRONTEND] Erro retornado pela função customer-portal:', data.error);
        throw new Error(data.error);
      }

      if (data?.url) {
        console.log('[FRONTEND] Abrindo portal:', data.url);
        setCheckoutUrl(data.url);
      } else {
        throw new Error('URL do portal não foi retornada');
      }
    } catch (error: any) {
      console.error('[FRONTEND] Erro ao abrir portal:', error);
      
      let errorMessage = 'Não foi possível abrir o portal de gerenciamento. Tente novamente.';
      let errorTitle = 'Erro no Portal';
      
      if (error.message) {
        if (typeof error.message === 'string') {
          errorMessage = error.message;
        }
        
        if (error.message.includes('Configuração de pagamento')) {
          errorTitle = 'Erro de Configuração';
        } else if (error.message.includes('autenticação') || error.message.includes('login')) {
          errorTitle = 'Erro de Autenticação';
        } else if (error.message.includes('assinatura') || error.message.includes('Assine')) {
          errorTitle = 'Assinatura Necessária';
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleRefreshSubscription = async () => {
    setLoading('refresh');
    try {
      await checkSubscription();
      toast({
        title: 'Status atualizado',
        description: 'Status da assinatura foi atualizado.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-6 pb-20">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-muted-foreground text-lg">
            Tenha acesso ilimitado aos livros com os melhores planos
          </p>
        </div>

        {/* Current Subscription Status */}
        {user && (
          <Card className="mb-8 bg-gradient-card border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Status da Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground font-medium">
                    {subscription.subscribed ? (
                      <>Status: <span className="text-primary">Ativo ({subscription.subscription_tier})</span></>
                    ) : (
                      <>Status: <span className="text-muted-foreground">Gratuito</span></>
                    )}
                  </p>
                  {subscription.subscription_end && (
                    <p className="text-sm text-muted-foreground">
                      Válido até: {new Date(subscription.subscription_end).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshSubscription}
                    disabled={loading === 'refresh'}
                  >
                    {loading === 'refresh' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Atualizar'
                    )}
                  </Button>
                  {subscription.subscribed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManageSubscription}
                      disabled={loading === 'manage'}
                    >
                      {loading === 'manage' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Settings className="h-4 w-4 mr-1" />
                          Gerenciar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Free Plan */}
          <Card className="bg-gradient-surface border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-foreground">Gratuito</CardTitle>
              <div className="text-3xl font-bold text-foreground">R$ 0</div>
              <p className="text-muted-foreground">Para sempre</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">1 livro por dia</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Espera de 30 segundos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Acesso básico</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                disabled
              >
                Plano Atual
              </Button>
            </CardContent>
          </Card>

          {/* Basic Plan */}
          <Card className="bg-gradient-card border-primary/30 relative">
            <CardHeader className="text-center">
              <CardTitle className="text-foreground">Leitura Imediata</CardTitle>
              <div className="text-3xl font-bold text-primary">R$ 5,99</div>
              <p className="text-muted-foreground">por mês</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Leitura imediata sem espera</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Livros ilimitados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Anotações pessoais</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Favoritos</span>
                </div>
              </div>
              <Button 
                onClick={() => handleSubscribe('basic')}
                disabled={loading === 'basic' || subscription.subscription_tier === 'basic'}
                className="w-full bg-gradient-primary hover:shadow-glow"
              >
                {loading === 'basic' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : subscription.subscription_tier === 'basic' ? (
                  'Plano Atual'
                ) : (
                  'Assinar Agora'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="bg-gradient-luxury border-primary/50 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Mais Popular
              </div>
            </div>
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-foreground flex items-center justify-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Premium
              </CardTitle>
              <div className="text-3xl font-bold text-primary">R$ 9,99</div>
              <p className="text-muted-foreground">por mês</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Tudo do plano anterior</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Download de PDFs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Leitura offline</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Acesso prioritário</span>
                </div>
              </div>
              <Button 
                onClick={() => handleSubscribe('premium')}
                disabled={loading === 'premium' || subscription.subscription_tier === 'premium'}
                className="w-full bg-gradient-primary hover:shadow-glow"
              >
                {loading === 'premium' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : subscription.subscription_tier === 'premium' ? (
                  'Plano Atual'
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Assinar Premium
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {!user && (
          <Card className="bg-gradient-card border-primary/30">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Faça login para escolher um plano e começar a ler
              </p>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="bg-gradient-primary"
              >
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Stripe Checkout Modal */}
      {checkoutUrl && (
        <StripeCheckout
          checkoutUrl={checkoutUrl}
          onClose={() => setCheckoutUrl(null)}
          onSuccess={() => {
            setCheckoutUrl(null);
            handleRefreshSubscription();
          }}
        />
      )}
      
      <ResponsiveNavigation />
    </div>
  );
}
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, ExternalLink, Loader2 } from 'lucide-react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function Desktop() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleReceberAcesso = async () => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para receber acesso ao desktop.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      const userName = profileData?.full_name || user.email?.split('@')[0] || 'Usuário';
      const userEmail = user.email || '';

      // Call edge function to add to Google Sheets
      const { data, error } = await supabase.functions.invoke('google-sheets', {
        body: {
          name: userName,
          email: userEmail,
        },
      });

      if (error) {
        console.error('Error calling google-sheets function:', error);
        throw error;
      }

      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação de acesso ao desktop foi registrada. Em breve entraremos em contato.',
      });

    } catch (error) {
      console.error('Error requesting desktop access:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar sua solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcessarSite = () => {
    window.open('https://www.livrosdesucesso.com.br', '_blank');
  };

  return (
    <ResponsiveLayout className="pt-6 pb-20">
      <div className="mb-6 text-center">
        <Monitor className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Versão Desktop
        </h1>
        <p className="text-muted-foreground">
          Acesse nossa biblioteca completa no computador
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-foreground">
              Leia no Computador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center">
              Tenha acesso completo à nossa biblioteca de livros diretamente no seu computador com uma experiência otimizada para desktop.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleReceberAcesso}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Receber Acesso'
                )}
              </Button>
              
              <Button 
                onClick={handleAcessarSite}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Acessar Site
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Site: www.livrosdesucesso.com.br
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2">
              Vantagens da Versão Desktop:
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Interface otimizada para telas maiores</li>
              <li>• Navegação mais rápida e intuitiva</li>
              <li>• Melhor experiência de leitura</li>
              <li>• Acesso a funcionalidades exclusivas</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </ResponsiveLayout>
  );
}
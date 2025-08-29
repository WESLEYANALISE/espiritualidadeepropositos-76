import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, fullName);
      }

      if (result.error) {
        if (result.error.message?.includes('Email not confirmed')) {
          toast({
            title: 'Verifique seu email',
            description: 'Foi enviado um link de confirmação para seu email.',
          });
        } else if (result.error.message?.includes('User already registered')) {
          toast({
            title: 'Usuário já cadastrado',
            description: 'Faça login com suas credenciais ou recupere sua senha.',
            variant: 'destructive',
          });
        } else if (result.error.message?.includes('Invalid login credentials')) {
          toast({
            title: 'Credenciais inválidas',
            description: 'Email ou senha incorretos.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro',
            description: result.error.message || 'Ocorreu um erro. Tente novamente.',
            variant: 'destructive',
          });
        }
      } else {
        if (isLogin) {
          window.location.href = '/';
        } else {
          toast({
            title: 'Conta criada com sucesso!',
            description: 'Verifique seu email para confirmar a conta.',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Books Carousel */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 opacity-20 animate-pulse">
          <div className="w-24 h-32 bg-gradient-primary/30 rounded-lg shadow-lg transform -rotate-12"></div>
        </div>
        <div className="absolute top-20 right-20 opacity-15 animate-pulse delay-1000">
          <div className="w-20 h-28 bg-accent/40 rounded-lg shadow-lg transform rotate-12"></div>
        </div>
        <div className="absolute bottom-20 left-20 opacity-10 animate-pulse delay-2000">
          <div className="w-28 h-36 bg-primary/20 rounded-lg shadow-lg transform rotate-6"></div>
        </div>
        <div className="absolute bottom-10 right-10 opacity-25 animate-pulse delay-500">
          <div className="w-22 h-30 bg-gradient-to-br from-primary/30 to-accent/30 rounded-lg shadow-lg transform -rotate-6"></div>
        </div>
      </div>

      <Card className="w-full max-w-md bg-gradient-card/95 backdrop-blur-md border-primary/30 shadow-luxury relative z-10 animate-fade-in">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow animate-scale-in">
            <BookOpen className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="space-y-3">
            <CardTitle className="text-3xl font-bold text-foreground">
              {isLogin ? 'Bem-vindo de volta' : 'Junte-se a nós'}
            </CardTitle>
            <p className="text-lg text-primary font-medium">
              {isLogin ? 'Sua jornada literária continua aqui' : 'Transforme sua vida através da leitura'}
            </p>
            <p className="text-muted-foreground">
              {isLogin ? 'Acesse sua biblioteca pessoal e continue explorando' : 'Descubra um mundo infinito de conhecimento'}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Button>
          </form>
          
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
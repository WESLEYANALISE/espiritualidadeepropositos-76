import { Home, BookOpen, Heart, Calendar, Settings, Crown, User, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'desktop' | 'tablet';
}

export const Sidebar = ({ isOpen, onClose, variant = 'desktop' }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, subscription } = useAuth();

  const navItems = [
    {
      icon: Home,
      label: 'Início',
      path: '/',
    },
    {
      icon: BookOpen,
      label: 'Lendo',
      path: '/lendo',
    },
    {
      icon: Calendar,
      label: 'Plano de Leitura',
      path: '/plano-leitura',
    },
    {
      icon: Heart,
      label: 'Favoritos',
      path: '/favoritos',
    },
    {
      icon: Settings,
      label: 'Configurações',
      path: '/configuracoes',
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'tablet') {
      onClose();
    }
  };

  if (variant === 'desktop') {
    return (
      <div className={cn(
        "fixed left-0 top-0 h-full bg-surface-elevated border-r border-border/50 z-40 transition-transform duration-300",
        "w-64 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <h2 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Espiritualidade
          </h2>
          <p className="text-sm text-muted-foreground">& Propósitos</p>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.user_metadata?.name?.split(' ')[0] || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {subscription.subscribed ? `${subscription.subscription_tier}` : 'Gratuito'}
                </p>
              </div>
            </div>
            
            {!subscription.subscribed && (
              <Button 
                size="sm" 
                variant="default"
                onClick={() => navigate('/assinaturas')}
                className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "w-full justify-start gap-3 h-12 transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary border-l-2 border-primary pl-3" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            © 2024 Espiritualidade & Propósitos
          </p>
        </div>
      </div>
    );
  }

  // Tablet variant - sliding overlay
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={onClose}
        />
      )}
      
      <div className={cn(
        "fixed left-0 top-0 h-full bg-surface-elevated border-r border-border/50 z-50 transition-transform duration-300",
        "w-72 flex flex-col shadow-luxury",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header with close */}
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Espiritualidade
            </h2>
            <p className="text-sm text-muted-foreground">& Propósitos</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-9 w-9 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-foreground truncate">
                  {user.user_metadata?.name?.split(' ')[0] || user.email?.split('@')[0]}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {subscription.subscribed ? `Plano ${subscription.subscription_tier}` : 'Usuário gratuito'}
                </p>
              </div>
            </div>
            
            {!subscription.subscribed && (
              <Button 
                size="default" 
                variant="default"
                onClick={() => navigate('/assinaturas')}
                className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground"
              >
                <Crown className="h-4 w-4 mr-2" />
                Fazer Upgrade
              </Button>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-6">
          <div className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "w-full justify-start gap-4 h-14 text-base transition-all duration-200 rounded-xl",
                    isActive 
                      ? "bg-primary/10 text-primary shadow-glow border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:scale-[1.02]"
                  )}
                >
                  <Icon className="h-6 w-6 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            © 2024 Espiritualidade & Propósitos
          </p>
        </div>
      </div>
    </>
  );
};
import { BookOpen, Heart, Calendar, Home, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  className?: string;
}

export const BottomNavigation = ({ className }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

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
      label: 'Plano',
      path: '/plano-leitura',
    },
    {
      icon: Heart,
      label: 'Favoritos',
      path: '/favoritos',
    },
    {
      icon: Settings,
      label: 'Config',
      path: '/configuracoes',
    },
  ];

  return (
    <div className={cn("fixed bottom-2 left-2 right-2 z-50", className)}>
      <div className="mx-auto max-w-sm">
        <div className="bg-surface-elevated/95 backdrop-blur-md rounded-2xl border border-border/50 shadow-luxury px-2 py-3">
          <div className="flex justify-between">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center gap-1 h-auto py-3 px-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? 'text-primary bg-primary/10 shadow-glow border border-primary/20 scale-105' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium leading-none">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Sidebar } from '@/components/Sidebar';
import { cn } from '@/lib/utils';

interface ResponsiveNavigationProps {
  className?: string;
}

export const ResponsiveNavigation = ({ className }: ResponsiveNavigationProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        setScreenSize('desktop');
        setSidebarOpen(true); // Always open on desktop
      } else if (width >= 768) {
        setScreenSize('tablet');
        setSidebarOpen(false);
      } else {
        setScreenSize('mobile');
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Mobile: Bottom navigation
  if (screenSize === 'mobile') {
    return <BottomNavigation className={className} />;
  }

  // Desktop & Tablet: Sidebar + trigger
  return (
    <div className={cn("relative", className)}>
      {/* Sidebar trigger for tablet */}
      {screenSize === 'tablet' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 bg-surface-elevated/90 backdrop-blur-sm border border-border/50 shadow-card hover:shadow-elevated transition-all duration-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Desktop sidebar trigger - always visible when sidebar is closed */}
      {screenSize === 'desktop' && !sidebarOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 bg-surface-elevated/90 backdrop-blur-sm border border-border/50 shadow-card hover:shadow-elevated transition-all duration-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant={screenSize === 'desktop' ? 'desktop' : 'tablet'}
      />

      {/* Content padding for desktop when sidebar is open */}
      {screenSize === 'desktop' && sidebarOpen && (
        <div className="pl-64 transition-all duration-300" />
      )}
    </div>
  );
};
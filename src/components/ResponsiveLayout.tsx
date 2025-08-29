import { ReactNode } from 'react';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveLayout = ({ children, className = '' }: ResponsiveLayoutProps) => {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Mobile: Full width with padding */}
      <div className="block lg:hidden">
        <div className="container mx-auto max-w-full px-4 py-4">
          {children}
        </div>
      </div>
      
      {/* Tablet: Constrained width */}
      <div className="hidden lg:block xl:hidden">
        <div className="container mx-auto max-w-5xl px-6 py-6">
          {children}
        </div>
      </div>
      
      {/* Desktop: Wide layout with sidebars */}
      <div className="hidden xl:block">
        <div className="container mx-auto max-w-7xl px-8 py-8">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-2">
              {/* Left sidebar space for future features */}
            </div>
            <div className="col-span-8">
              {children}
            </div>
            <div className="col-span-2">
              {/* Right sidebar space for future features */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
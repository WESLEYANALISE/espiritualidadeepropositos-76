import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingTeacherButtonProps {
  onClick: () => void;
  className?: string;
}

export const FloatingTeacherButton = ({ onClick, className = "" }: FloatingTeacherButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={`fixed bottom-32 right-6 h-16 w-16 rounded-full bg-gradient-primary shadow-luxury hover:scale-110 transition-all duration-300 z-40 animate-pulse-glow ${className}`}
      size="icon"
    >
      <MessageCircle className="h-7 w-7 text-primary-foreground" />
    </Button>
  );
};
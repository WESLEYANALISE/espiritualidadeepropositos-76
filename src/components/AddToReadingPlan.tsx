import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AddToReadingPlanProps {
  bookId: number;
  className?: string;
}

export const AddToReadingPlan = ({ bookId, className = '' }: AddToReadingPlanProps) => {
  const { user } = useAuth();
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddToPlan = async () => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para adicionar livros ao plano de leitura.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Get the highest order position
      const { data: existingItems, error: fetchError } = await supabase
        .from('reading_plan')
        .select('order_position')
        .eq('user_id', user.id)
        .order('order_position', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const nextPosition = existingItems.length > 0 ? existingItems[0].order_position + 1 : 1;

      // Add to reading plan
      const { error } = await supabase
        .from('reading_plan')
        .insert({
          user_id: user.id,
          book_id: bookId,
          order_position: nextPosition,
          is_completed: false,
        });

      if (error) throw error;

      setIsAdded(true);
      toast({
        title: 'Adicionado ao plano!',
        description: 'Livro adicionado ao seu plano de leitura.',
      });

    } catch (error) {
      console.error('Error adding to reading plan:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o livro ao plano.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isAdded) {
    return (
      <Button 
        variant="outline" 
        disabled 
        className={`transition-all duration-300 ${className}`}
      >
        <Check className="h-4 w-4 mr-2" />
        Adicionado ao Plano
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleAddToPlan}
      disabled={loading || !user}
      className={`transition-all duration-300 ${className}`}
    >
      <Plus className="h-4 w-4 mr-2" />
      {loading ? 'Adicionando...' : 'Adicionar ao Plano'}
    </Button>
  );
};
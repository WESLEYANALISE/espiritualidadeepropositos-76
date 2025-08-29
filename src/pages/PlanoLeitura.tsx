import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Check, Plus, Trash2, GripVertical, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { toast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface ReadingPlanItem {
  id: string;
  book_id: number;
  order_position: number;
  is_completed: boolean;
  completed_at?: string;
  book_title?: string;
  book?: {
    id: number;
    livro: string;
    autor: string;
    imagem: string;
  };
}

export default function PlanoLeitura() {
  const { user } = useAuth();
  const [planItems, setPlanItems] = useState<ReadingPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReadingPlan();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchReadingPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('reading_plan')
        .select('*')
        .eq('user_id', user!.id)
        .order('order_position', { ascending: true });

      if (error) throw error;

      // Get book details for each plan item
      const planWithBooks = await Promise.all(
        (data || []).map(async (item) => {
          const { data: bookData } = await supabase
            .from('01. LIVROS-APP-NOVO')
            .select('id, livro, autor, imagem')
            .eq('id', item.book_id)
            .single();
          
          return {
            ...item,
            book: bookData
          };
        })
      );

      setPlanItems(planWithBooks);
    } catch (error) {
      console.error('Error fetching reading plan:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seu plano de leitura.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCompletion = async (itemId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('reading_plan')
        .update({
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', itemId);

      if (error) throw error;

      setPlanItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                is_completed: !isCompleted,
                completed_at: !isCompleted ? new Date().toISOString() : undefined,
              }
            : item
        )
      );

      toast({
        title: !isCompleted ? 'Livro marcado como lido!' : 'Marcação removida',
        description: !isCompleted ? 'Parabéns pela leitura!' : 'Livro desmarcado como lido.',
      });
    } catch (error) {
      console.error('Error updating completion:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do livro.',
        variant: 'destructive',
      });
    }
  };

  const removeFromPlan = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('reading_plan')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setPlanItems(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: 'Removido do plano',
        description: 'Livro removido do seu plano de leitura.',
      });
    } catch (error) {
      console.error('Error removing from plan:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o livro do plano.',
        variant: 'destructive',
      });
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(planItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for better UX
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_position: index + 1,
    }));
    setPlanItems(updatedItems);

    // Update database
    try {
      const updates = updatedItems.map((item, index) => ({
        id: item.id,
        order_position: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('reading_plan')
          .update({ order_position: update.order_position })
          .eq('id', update.id);
      }

      toast({
        title: 'Ordem atualizada',
        description: 'A ordem do seu plano de leitura foi salva.',
      });
    } catch (error) {
      console.error('Error updating order:', error);
      // Revert on error
      fetchReadingPlan();
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a nova ordem.',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-6 pb-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Faça login para ver seu plano
            </h2>
            <p className="text-muted-foreground">
              Entre em sua conta para organizar seu plano de leitura
            </p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <ResponsiveLayout className="pt-6 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Plano de Leitura
        </h1>
        <p className="text-muted-foreground">
          Organize a ordem dos livros que você quer ler
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-12 h-16 bg-muted rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : planItems.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Nenhum livro no plano
          </h2>
          <p className="text-muted-foreground mb-4">
            Adicione livros aos seus favoritos para criar seu plano de leitura
          </p>
          <Button onClick={() => window.history.back()}>
            <Plus className="h-4 w-4 mr-2" />
            Explorar Livros
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="reading-plan">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {planItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all duration-200 ${
                          snapshot.isDragging ? 'shadow-luxury scale-105' : ''
                        } ${item.is_completed ? 'opacity-60' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="relative">
                              {item.book?.imagem ? (
                                <img 
                                  src={item.book.imagem} 
                                  alt={item.book.livro}
                                  className="w-12 h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-16 bg-gradient-primary rounded flex items-center justify-center">
                                  <BookOpen className="h-4 w-4 text-primary-foreground" />
                                </div>
                              )}
                              <div
                                {...provided.dragHandleProps}
                                className="absolute -top-1 -left-1 cursor-grab active:cursor-grabbing bg-background/80 rounded p-1"
                              >
                                <GripVertical className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
                                {item.book?.livro || `Livro ID: ${item.book_id}`}
                              </h3>
                              {item.book?.autor && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                  {item.book.autor}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant={item.is_completed ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleCompletion(item.id, item.is_completed)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Check className="h-3 w-3" />
                                    {item.is_completed ? 'Lido' : 'Marcar'}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeFromPlan(item.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <span className="text-xs text-muted-foreground">#{item.order_position}</span>
                              </div>
                              
                              {item.completed_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Concluído: {new Date(item.completed_at).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      
      <BottomNavigation />
    </ResponsiveLayout>
  );
}
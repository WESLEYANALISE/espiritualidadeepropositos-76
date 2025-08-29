import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';

interface FavoriteBook {
  id: string;
  book_id: number;
  user_ip: string;
  created_at: string;
  book?: {
    id: number;
    livro: string;
    autor: string;
    imagem: string;
  };
}

export default function Favoritos() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      try {
        // First get favorites
        const { data: favoritesData, error: favError } = await supabase
          .from('book_favorites')
          .select('*')
          .eq('user_ip', user.id)
          .order('created_at', { ascending: false });

        if (favError) throw favError;

        // Then get book details for each favorite
        const favoritesWithBooks = await Promise.all(
          (favoritesData || []).map(async (fav) => {
            const { data: bookData } = await supabase
              .from('01. LIVROS-APP-NOVO')
              .select('id, livro, autor, imagem')
              .eq('id', fav.book_id)
              .single();
            
            return {
              ...fav,
              book: bookData
            };
          })
        );

        setFavorites(favoritesWithBooks);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleRemoveFavorite = async (bookId: number) => {
    try {
      await supabase
        .from('book_favorites')
        .delete()
        .eq('user_ip', user!.id)
        .eq('book_id', bookId);
      
      setFavorites(prev => prev.filter(fav => fav.book_id !== bookId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-6 pb-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Faça login para ver seus favoritos
            </h2>
            <p className="text-muted-foreground">
              Entre em sua conta para acessar seus livros favoritos
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
          Meus Favoritos
        </h1>
        <p className="text-muted-foreground">
          Seus livros marcados como favoritos
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3">
                <div className="h-20 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Nenhum favorito ainda
          </h2>
          <p className="text-muted-foreground">
            Marque livros como favoritos para vê-los aqui
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {favorites.map((favorite) => (
            <Card key={favorite.id} className="bg-gradient-card border-primary/20 hover:shadow-elevated transition-all duration-300 group">
              <CardContent className="p-3">
                {favorite.book?.imagem ? (
                  <div className="aspect-[3/4] mb-2 overflow-hidden rounded">
                    <img 
                      src={favorite.book.imagem} 
                      alt={favorite.book.livro}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/4] flex items-center justify-center bg-gradient-primary rounded mb-2">
                    <BookOpen className="h-6 w-6 text-primary-foreground" />
                  </div>
                )}
                
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">
                    {favorite.book?.livro || `Livro ID: ${favorite.book_id}`}
                  </h3>
                  {favorite.book?.autor && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {favorite.book.autor}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Heart className="h-2 w-2 text-red-500 fill-red-500" />
                      <span className="text-xs">
                        {new Date(favorite.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(favorite.book_id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    >
                      <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <BottomNavigation />
    </ResponsiveLayout>
  );
}
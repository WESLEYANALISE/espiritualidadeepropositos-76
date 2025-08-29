import { useState, useEffect } from "react";
import { BooksGrid } from "@/components/BooksGrid";
import { BookDetail } from "@/components/BookDetail";
import { Header } from "@/components/Header";
import { AreasGrid } from "@/components/AreasGrid";
import { FloatingButton } from "@/components/FloatingButton";
import { ResponsiveNavigation } from "@/components/ResponsiveNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { User, Crown } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
export interface BookItem {
  id: number;
  livro: string;
  autor: string;
  sobre: string;
  imagem: string;
  link: string;
  download?: string;
  beneficios?: string;
  area?: string;
  isRead?: boolean;
}
const Index = () => {
  const { user, subscription } = useAuth();
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [readBooks, setReadBooks] = useState<Set<number>>(new Set());
  const [favoriteBooks, setFavoriteBooks] = useState<Set<number>>(new Set());
  const [recentBooks, setRecentBooks] = useState<BookItem[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [availableBooks, setAvailableBooks] = useState(0);
  const [highlightedBookId, setHighlightedBookId] = useState<number | null>(null);


  // Load favorites and recent books from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteBooks');
    const savedRecent = localStorage.getItem('recentBooks');
    if (savedFavorites) {
      setFavoriteBooks(new Set(JSON.parse(savedFavorites)));
    }
    if (savedRecent) {
      setRecentBooks(JSON.parse(savedRecent));
    }
  }, []);
  const handleBookSelect = (book: BookItem, area: string) => {
    setSelectedArea(area);
    setHighlightedBookId(book.id);

    // Smooth scroll to highlighted book after area loads
    setTimeout(() => {
      const bookElement = document.querySelector(`[data-book-id="${book.id}"]`);
      if (bookElement) {
        bookElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 500);

    // Remove highlight after 5 seconds
    setTimeout(() => {
      setHighlightedBookId(null);
    }, 5000);
  };
  const handleBookClick = async (book: BookItem) => {
    // Add to recent books
    setRecentBooks(prev => {
      const filtered = prev.filter(b => b.id !== book.id);
      const newRecent = [book, ...filtered].slice(0, 10);
      localStorage.setItem('recentBooks', JSON.stringify(newRecent));
      return newRecent;
    });
    setReadBooks(prev => new Set(prev.add(book.id)));
    
    // Mark as currently reading in database if user is logged in
    if (user) {
      try {
        await supabase
          .from('book_reading_progress')
          .upsert({
            user_ip: user.id,
            book_id: book.id,
            started_reading_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
            is_currently_reading: true,
          }, {
            onConflict: 'user_ip,book_id',
          });
      } catch (error) {
        console.error('Error updating reading progress:', error);
      }
    }
    
    setSelectedBook(book);
  };
  const handleFavorite = async (bookId: number, isFavorite: boolean) => {
    setFavoriteBooks(prev => {
      const newFavorites = new Set(prev);
      if (isFavorite) {
        newFavorites.add(bookId);
      } else {
        newFavorites.delete(bookId);
      }
      localStorage.setItem('favoriteBooks', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });

    // Save to database if user is logged in
    if (user) {
      try {
        if (isFavorite) {
            await supabase
              .from('book_favorites')
              .insert({
                user_ip: user.id,
                book_id: bookId,
              });
        } else {
            await supabase
              .from('book_favorites')
              .delete()
              .eq('user_ip', user.id)
              .eq('book_id', bookId);
        }
      } catch (error) {
        console.error('Error updating favorites:', error);
      }
    }
  };
  const favoriteBookItems = recentBooks.filter(book => favoriteBooks.has(book.id));
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6 xl:pl-64">
      {!selectedArea && !selectedBook && (
        <>
          <Header totalBooks={totalBooks} availableBooks={availableBooks} />
          
        <div className="pb-4 md:pb-0">
          <div className="container mx-auto max-w-4xl px-4 py-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {user ? (
                  <div 
                    className="flex items-center gap-3 animate-fade-in-left cursor-pointer hover:bg-accent/50 rounded-lg p-2 transition-all duration-300"
                    onClick={() => window.location.pathname = '/configuracoes'}
                  >
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow transition-all duration-300 hover:scale-110">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Olá, {user.user_metadata?.name?.split(' ')[0] || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {subscription.subscribed ? `Plano ${subscription.subscription_tier || 'Premium'}` : 'Usuário gratuito'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => window.location.pathname = '/auth'} 
                    variant="outline"
                    className="animate-fade-in-left"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Fazer Login
                  </Button>
                )}
              </div>
              {!subscription.subscribed && (
                <Button 
                  onClick={() => window.location.pathname = '/assinaturas'} 
                  variant="default"
                  className="animate-fade-in-left bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Planos
                </Button>
              )}
          </div>
        </div>
          </div>
        </>
      )}
      <main className="container mx-auto py-6 max-w-4xl px-[8px] md:pb-0">
        {selectedBook ? <BookDetail book={selectedBook} onBack={() => setSelectedBook(null)} onFavorite={handleFavorite} isFavorite={favoriteBooks.has(selectedBook.id)} /> : selectedArea ? <BooksGrid selectedArea={selectedArea} onBookClick={handleBookClick} onBack={() => {
        setSelectedArea(null);
        setHighlightedBookId(null);
      }} readBooks={readBooks} onStatsUpdate={(total, available) => {
        setTotalBooks(total);
        setAvailableBooks(available);
      }} highlightedBookId={highlightedBookId} onFavorite={handleFavorite} favoriteBooks={favoriteBooks} /> : <AreasGrid onAreaClick={setSelectedArea} onBookSelect={handleBookSelect} />}
      </main>
      
      {!selectedBook && (
        <>
          <FloatingButton recentBooks={recentBooks} favoriteBooks={favoriteBookItems} onBookClick={handleBookClick} />
          <ResponsiveNavigation />
        </>
      )}
    </div>
  );
};
export default Index;
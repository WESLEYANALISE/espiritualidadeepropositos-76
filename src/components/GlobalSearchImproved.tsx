import { useState, useEffect, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookItem } from '@/pages/Index';

interface GlobalSearchImprovedProps {
  onBookSelect: (book: BookItem, area: string) => void;
  allBooks: { [area: string]: BookItem[] };
}

export const GlobalSearchImproved = ({ onBookSelect, allBooks }: GlobalSearchImprovedProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ book: BookItem; area: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const availableFilters = Object.keys(allBooks);

  useEffect(() => {
    if (searchTerm.length > 1) {
      const filtered: Array<{ book: BookItem; area: string }> = [];
      
      Object.entries(allBooks).forEach(([area, books]) => {
        if (selectedFilters.length === 0 || selectedFilters.includes(area)) {
          books.forEach(book => {
            const searchText = `${book.livro} ${book.autor} ${book.sobre}`.toLowerCase();
            if (searchText.includes(searchTerm.toLowerCase())) {
              filtered.push({ book, area });
            }
          });
        }
      });

      setSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, allBooks, selectedFilters]);

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const handleBookClick = (book: BookItem, area: string) => {
    setSearchTerm('');
    setShowSuggestions(false);
    onBookSelect(book, area);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Busque por livro, autor ou tema..."
          className="pl-10 pr-12 h-12 text-base bg-background/95 backdrop-blur-sm border-primary/20 focus:border-primary/40 transition-all duration-300"
          onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setShowSuggestions(false);
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>
        {availableFilters.map(filter => (
          <Badge
            key={filter}
            variant={selectedFilters.includes(filter) ? "default" : "outline"}
            className="cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => toggleFilter(filter)}
          >
            {filter}
          </Badge>
        ))}
        {selectedFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 bg-background/95 backdrop-blur-md border-primary/20 shadow-luxury animate-fade-in">
          <CardContent className="p-2">
            <div className="space-y-1">
              {suggestions.map(({ book, area }, index) => (
                <div
                  key={`${book.id}-${area}`}
                  onClick={() => handleBookClick(book, area)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
                >
                  {book.imagem && (
                    <img
                      src={book.imagem}
                      alt={book.livro}
                      className="w-12 h-16 object-cover rounded shadow-sm group-hover:shadow-md transition-shadow duration-200"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
                      {book.livro}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {book.autor}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {area}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            {suggestions.length === 8 && (
              <div className="text-center pt-2 border-t border-border/50 mt-2">
                <span className="text-xs text-muted-foreground">
                  Mostrando 8 de muitos resultados. Seja mais específico para melhores resultados.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No results */}
      {showSuggestions && searchTerm.length > 1 && suggestions.length === 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 bg-background/95 backdrop-blur-md border-primary/20 shadow-luxury">
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">
              Nenhum livro encontrado para "{searchTerm}"
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente buscar por outro termo ou limpe os filtros
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
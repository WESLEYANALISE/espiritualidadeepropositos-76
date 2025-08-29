import { useState } from 'react';
import { BookCard } from '@/components/BookCard';
import { BookItem } from '@/pages/Index';

interface BookGridProps {
  books: BookItem[];
  onBookClick: (book: BookItem) => void;
  readBooks: Set<number>;
  favoriteBooks: Set<number>;
  onFavorite: (bookId: number, isFavorite: boolean) => void;
  highlightedBookId?: number | null;
}

export const BookGrid = ({ 
  books, 
  onBookClick, 
  readBooks, 
  favoriteBooks, 
  onFavorite,
  highlightedBookId 
}: BookGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
      {books.map((book) => (
        <div
          key={book.id}
          data-book-id={book.id}
          className={`cursor-pointer transition-all duration-300 ${
            highlightedBookId === book.id ? 'ring-2 ring-primary shadow-glow' : ''
          }`}
          onClick={() => onBookClick(book)}
        >
          <BookCard
            book={book}
            onClick={() => onBookClick(book)}
            isFavorite={favoriteBooks.has(book.id)}
            onFavorite={onFavorite}
          />
        </div>
      ))}
    </div>
  );
};
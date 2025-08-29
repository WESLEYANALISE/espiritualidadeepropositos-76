import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReadingProgress {
  id: string;
  book_id: number;
  user_ip: string;
  started_reading_at: string;
  last_accessed_at: string;
  is_currently_reading: boolean;
}

export const useReadingProgress = () => {
  const { user } = useAuth();
  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReadingProgress();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchReadingProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('book_reading_progress')
        .select('*')
        .eq('user_ip', user!.id)
        .eq('is_currently_reading', true)
        .order('last_accessed_at', { ascending: false });

      if (error) throw error;
      setReadingProgress(data || []);
    } catch (error) {
      console.error('Error fetching reading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsReading = async (bookId: number) => {
    if (!user) return;

    try {
      await supabase
        .from('book_reading_progress')
        .upsert({
          user_ip: user.id,
          book_id: bookId,
          started_reading_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
          is_currently_reading: true,
        }, {
          onConflict: 'user_ip,book_id',
        });

      await fetchReadingProgress();
    } catch (error) {
      console.error('Error marking as reading:', error);
    }
  };

  const stopReading = async (bookId: number) => {
    if (!user) return;

    try {
      await supabase
        .from('book_reading_progress')
        .update({ is_currently_reading: false })
        .eq('user_ip', user.id)
        .eq('book_id', bookId);

      await fetchReadingProgress();
    } catch (error) {
      console.error('Error stopping reading:', error);
    }
  };

  return {
    readingProgress,
    loading,
    markAsReading,
    stopReading,
    refetch: fetchReadingProgress,
  };
};
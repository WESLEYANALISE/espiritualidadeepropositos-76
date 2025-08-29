import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  subscription: {
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
  };
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState({
    subscribed: false,
    subscription_tier: null as string | null,
    subscription_end: null as string | null,
  });

  const checkSubscription = async () => {
    if (!session) {
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('[AUTH] Erro na função check-subscription:', error);
        throw error;
      }
      
      const newSubscription = {
        subscribed: data.subscribed || false,
        subscription_tier: data.subscription_tier || null,
        subscription_end: data.subscription_end || null,
      };
      
      setSubscription(newSubscription);
    } catch (error) {
      console.error('[AUTH] Erro ao verificar assinatura:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          // Auto-check subscription on login with proper timing
          setTimeout(async () => {
            try {
              const { data, error } = await supabase.functions.invoke('check-subscription');
              
              if (!error && data) {
                const newSubscription = {
                  subscribed: data.subscribed || false,
                  subscription_tier: data.subscription_tier || null,
                  subscription_end: data.subscription_end || null,
                };
                setSubscription(newSubscription);
              }
            } catch (error) {
              console.error('[AUTH] Erro ao verificar assinatura:', error);
            }
          }, 500);
        } else {
          setSubscription({
            subscribed: false,
            subscription_tier: null,
            subscription_end: null,
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        // Auto-check subscription for existing session
        setTimeout(async () => {
          try {
            const { data, error } = await supabase.functions.invoke('check-subscription');
            
            if (!error && data) {
              const newSubscription = {
                subscribed: data.subscribed || false,
                subscription_tier: data.subscription_tier || null,
                subscription_end: data.subscription_end || null,
              };
              setSubscription(newSubscription);
            }
          } catch (error) {
            console.error('[AUTH] Erro ao verificar assinatura:', error);
          }
        }, 500);
      }
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AUTH] Tentativa de login para:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('[AUTH] Erro no login:', error);
        return { error };
      }
      
      console.log('[AUTH] Login bem-sucedido, aguardando verificação automática de assinatura');
      return { error: null };
    } catch (error) {
      console.error('[AUTH] Erro inesperado no login:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || '',
          }
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    subscription,
    checkSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
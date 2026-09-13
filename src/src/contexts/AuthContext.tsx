import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  negocioId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, nombre: string, nombreNegocio: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function cargarNegocioId(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('negocio_id')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setNegocioId(data.negocio_id);
    }
  }

  useEffect(() => {
    // Sesión actual al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        cargarNegocioId(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de sesión (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        cargarNegocioId(session.user.id);
      } else {
        setNegocioId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? traducirError(error.message) : null };
  }

  async function signUp(email: string, password: string, nombre: string, nombreNegocio: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          nombre_negocio: nombreNegocio,
        },
      },
    });
    return { error: error ? traducirError(error.message) : null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user, negocioId, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

// Traduce mensajes comunes de error de Supabase al español
function traducirError(mensaje: string): string {
  const mapa: Record<string, string> = {
    'Invalid login credentials': 'Email o contraseña incorrectos',
    'User already registered': 'Ya existe una cuenta con ese email',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Email not confirmed': 'Falta confirmar el email. Revisá tu casilla de correo',
  };
  return mapa[mensaje] || mensaje;
}

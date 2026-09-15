import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Login from './Login';
import Dashboard from './Dashboard';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // 1. Verificar si ya existe una sesión guardada
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCargando(false);
    });

    // 2. Escuchar cambios en la autenticación (Login / Logout en tiempo real)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCargando(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (cargando) {
    return (
      <div
        style={{
          background: '#0a0a0a',
          color: '#66fcf1',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <h2>Iniciando sistema TWINS GAMER...</h2>
      </div>
    );
  }

  return (
    <>
      {!session ? (
        <Login />
      ) : (
        <Dashboard session={session} onLogout={handleLogout} />
      )}
    </>
  );
}

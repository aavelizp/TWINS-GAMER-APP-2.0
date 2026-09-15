import React, { useState } from 'react';
import { supabase } from './supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        alert('Error de acceso: ' + error.message);
      }
    } catch (err) {
      alert('Error de red. Verifica tu conexión o reinicia el servidor local.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        /* NUEVO: Imagen de fondo expandida */
        backgroundImage: 'url("/logo-twins.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* CAPA DE CRISTAL OSCURO SOBRE EL FONDO (Hace que el fondo se vea borroso y oscuro) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 5, 20, 0.75)', // Tinte oscuro
          backdropFilter: 'blur(12px)', // Desenfoque del fondo
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 1,
        }}
      />

      {/* TARJETA CENTRAL DE LOGIN */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          background: 'rgba(20, 15, 40, 0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '40px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
          textAlign: 'center',
        }}
      >
        {/* IMAGEN DEL LOGO NEÓN (Miniatura) */}
        <img
          src="/logo-twins.jpg"
          alt="Twins Gamer Logo"
          style={{
            width: '90px',
            height: '90px',
            objectFit: 'cover',
            borderRadius: '16px',
            margin: '0 auto 20px auto',
            display: 'block',
            boxShadow: '0 0 25px rgba(155, 81, 224, 0.6)',
          }}
        />

        {/* TÍTULOS */}
        <h1
          style={{
            margin: '0 0 5px 0',
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: '900',
            letterSpacing: '1.5px',
          }}
        >
          TWINS GAMER
        </h1>
        <p
          style={{
            margin: '0 0 35px 0',
            color: '#887bb0',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          Sistema POS Integrado
        </p>

        {/* FORMULARIO */}
        <form
          onSubmit={handleLogin}
          style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#685a96"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
            </div>
            <input
              type="email"
              placeholder="Correo administrador"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 14px 14px 45px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border 0.3s',
              }}
            />
          </div>

          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <div
              style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#685a96"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <input
              type="password"
              placeholder="Contraseña secreta"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 14px 14px 45px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border 0.3s',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(90deg, #a126ff, #00d2ff)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 15px rgba(161, 38, 255, 0.3)',
              transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Verificando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

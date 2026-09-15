import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function TabClubGamer() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Configuración del Club
  const META_HORAS = 10; // Cada 10 horas ganan un premio

  useEffect(() => {
    cargarRanking();
  }, []);

  const cargarRanking = async () => {
    setCargando(true);
    // Traemos a los clientes ordenados por quién ha jugado más horas
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('horas_jugadas', { ascending: false });

    if (data) setClientes(data);
    setCargando(false);
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.alias && c.alias.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '24px',
              color: '#00d2ff',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textShadow: '0 0 10px rgba(0,210,255,0.5)',
            }}
          >
            🏆 Ranking Club Gamer
          </h2>
          <p
            style={{ margin: '5px 0 0 0', color: '#887bb0', fontSize: '13px' }}
          >
            Clientes ordenados por sus horas de juego acumuladas.
          </p>
        </div>

        {/* BUSCADOR */}
        <div style={{ position: 'relative', width: '250px' }}>
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.5,
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar VIP..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(20, 15, 40, 0.6)',
              border: '1px solid #3c2a7a',
              color: '#fff',
              padding: '10px 10px 10px 35px',
              borderRadius: '20px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div
        style={{
          background: 'rgba(21, 14, 40, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(60, 42, 122, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* CABECERA DE LA TABLA */}
        <div
          style={{
            display: 'flex',
            padding: '15px 20px',
            background: 'rgba(13, 9, 26, 0.8)',
            borderBottom: '1px solid #251b45',
            fontSize: '11px',
            color: '#887bb0',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          <div style={{ width: '60px', textAlign: 'center' }}>Rank</div>
          <div style={{ flex: 1 }}>Gamer</div>
          <div style={{ flex: 1.5 }}>Progreso ({META_HORAS}H)</div>
          <div style={{ width: '150px', textAlign: 'center' }}>
            Premios Disp.
          </div>
          <div style={{ width: '100px', textAlign: 'center' }}>Acción</div>
        </div>

        {/* LISTA DE CLIENTES */}
        {cargando ? (
          <div
            style={{ textAlign: 'center', padding: '40px', color: '#887bb0' }}
          >
            Calculando ranking...
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div
            style={{ textAlign: 'center', padding: '40px', color: '#887bb0' }}
          >
            Nadie coincide con tu búsqueda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {clientesFiltrados.map((c, index) => {
              // Matemáticas del Club Gamer
              const horas = Number(c.horas_jugadas) || 0;
              const porcentaje = ((horas % META_HORAS) / META_HORAS) * 100;
              const premiosGanados = Math.floor(horas / META_HORAS);

              // Medallas para el Top 3
              let medalla = (
                <span style={{ color: '#887bb0', fontWeight: 'bold' }}>
                  #{index + 1}
                </span>
              );
              if (index === 0)
                medalla = <span style={{ fontSize: '22px' }}>🥇</span>;
              if (index === 1)
                medalla = <span style={{ fontSize: '22px' }}>🥈</span>;
              if (index === 2)
                medalla = <span style={{ fontSize: '22px' }}>🥉</span>;

              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '15px 20px',
                    borderBottom: '1px solid rgba(37, 27, 69, 0.3)',
                    transition: 'background 0.2s',
                    cursor: 'default',
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background =
                      'rgba(255,255,255,0.02)')
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  {/* RANKING */}
                  <div style={{ width: '60px', textAlign: 'center' }}>
                    {medalla}
                  </div>

                  {/* NOMBRE */}
                  <div style={{ flex: 1, paddingRight: '15px' }}>
                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: '15px',
                        color: index === 0 ? '#f39c12' : '#fff',
                      }}
                    >
                      {c.nombre}
                    </div>
                    {c.alias && (
                      <div style={{ fontSize: '11px', color: '#00d2ff' }}>
                        @{c.alias}
                      </div>
                    )}
                  </div>

                  {/* BARRA DE PROGRESO */}
                  <div style={{ flex: 1.5, paddingRight: '20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#887bb0',
                        marginBottom: '5px',
                      }}
                    >
                      <span>{(horas % META_HORAS).toFixed(1)} hrs</span>
                      <span>Meta: {META_HORAS} hrs</span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        background: '#090514',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '1px solid #251b45',
                      }}
                    >
                      <div
                        style={{
                          width: `${porcentaje}%`,
                          height: '100%',
                          background:
                            'linear-gradient(90deg, #9b51e0, #00d2ff)',
                          borderRadius: '4px',
                          boxShadow: '0 0 10px rgba(0,210,255,0.5)',
                        }}
                      />
                    </div>
                  </div>

                  {/* PREMIOS (CORONAS) */}
                  <div style={{ width: '150px', textAlign: 'center' }}>
                    {premiosGanados > 0 ? (
                      <div
                        style={{
                          background: 'rgba(243, 156, 18, 0.1)',
                          border: '1px solid #f39c12',
                          color: '#f39c12',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          display: 'inline-block',
                          fontWeight: 'bold',
                          fontSize: '12px',
                        }}
                      >
                        🎁 {premiosGanados} Disponibles
                      </div>
                    ) : (
                      <span style={{ color: '#55497a', fontSize: '12px' }}>
                        0
                      </span>
                    )}
                  </div>

                  {/* ACCIONES */}
                  <div style={{ width: '100px', textAlign: 'center' }}>
                    <button
                      disabled={premiosGanados === 0}
                      style={{
                        background:
                          premiosGanados > 0 ? '#a126ff' : 'transparent',
                        border:
                          premiosGanados > 0 ? 'none' : '1px solid #251b45',
                        color: premiosGanados > 0 ? '#fff' : '#55497a',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: premiosGanados > 0 ? 'pointer' : 'not-allowed',
                        opacity: premiosGanados > 0 ? 1 : 0.5,
                      }}
                    >
                      Canjear
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

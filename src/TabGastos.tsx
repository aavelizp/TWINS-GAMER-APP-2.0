import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface TabGastosProps {
  tasa: number;
  cajeroId: string;
  onGastoRealizado: () => void;
}

export default function TabGastos({
  tasa,
  cajeroId,
  onGastoRealizado,
}: TabGastosProps) {
  const [gastos, setGastos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'lista' | 'nuevo'>('lista');

  // Métricas
  const [metricas, setMetricas] = useState({ hoy: 0, mes: 0, historico: 0 });

  // Filtros del Historial
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroDia, setFiltroDia] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  // Formulario Nuevo Gasto
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Servicios');
  const [montoUSD, setMontoUSD] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo_usd');

  useEffect(() => {
    cargarGastos();
  }, []);

  const obtenerInicioJornada = () => {
    const ahora = new Date();
    const inicio = new Date(ahora);
    if (ahora.getHours() < 6) inicio.setDate(inicio.getDate() - 1);
    inicio.setHours(6, 0, 0, 0);
    return inicio.toISOString();
  };

  const cargarGastos = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('gastos')
      .select('*')
      .order('creado_en', { ascending: false });

    if (data) {
      setGastos(data);

      // Calcular métricas
      const inicioHoy = obtenerInicioJornada();
      const hoyObj = new Date();
      const inicioMes = new Date(
        hoyObj.getFullYear(),
        hoyObj.getMonth(),
        1
      ).toISOString();

      let tHoy = 0,
        tMes = 0,
        tHist = 0;
      data.forEach((g) => {
        const monto = Number(g.monto_usd);
        tHist += monto;
        if (g.creado_en >= inicioMes) tMes += monto;
        if (g.creado_en >= inicioHoy) tHoy += monto;
      });

      setMetricas({ hoy: tHoy, mes: tMes, historico: tHist });
    }
    setCargando(false);
  };

  const guardarGasto = async () => {
    if (!descripcion.trim() || Number(montoUSD) <= 0) {
      return alert('Por favor ingresa una descripción y un monto válido.');
    }

    const usd = Number(montoUSD);
    const bs = usd * tasa;

    const { error } = await supabase.from('gastos').insert({
      descripcion,
      categoria,
      monto_usd: usd,
      monto_bs: bs,
      metodo_pago: metodoPago,
      cajero_id: cajeroId,
    });

    if (error) {
      alert('Error al registrar el gasto: ' + error.message);
      return;
    }

    setDescripcion('');
    setMontoUSD('');
    setCategoria('Servicios');
    setVista('lista');
    cargarGastos();
    onGastoRealizado();
  };

  const eliminarGasto = async (id: number) => {
    if (
      !window.confirm(
        '¿Estás seguro de eliminar este gasto? Esto afectará el cuadre de caja.'
      )
    )
      return;
    await supabase.from('gastos').delete().eq('id', id);
    cargarGastos();
    onGastoRealizado();
  };

  // Lógica de Filtrado
  const gastosFiltrados = gastos.filter((g) => {
    let pasa = true;
    if (filtroCategoria !== 'Todas' && g.categoria !== filtroCategoria)
      pasa = false;
    if (filtroMes) {
      const mesGasto = g.creado_en.substring(0, 7); // YYYY-MM
      if (mesGasto !== filtroMes) pasa = false;
    }
    if (filtroDia) {
      const diaGasto = g.creado_en.substring(0, 10); // YYYY-MM-DD
      if (diaGasto !== filtroDia) pasa = false;
    }
    return pasa;
  });

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      {vista === 'lista' && (
        <>
          {/* TARJETAS DE MÉTRICAS (Como en la Imagen 1) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '25px',
            }}
          >
            <div
              style={{
                background: 'rgba(21, 14, 40, 0.8)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#887bb0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Gastos Hoy
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '900',
                  color: '#ef4444',
                  marginTop: '5px',
                }}
              >
                ${metricas.hoy.toFixed(2)}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(21, 14, 40, 0.8)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(60, 42, 122, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#887bb0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Gastos del Mes
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '900',
                  color: '#fff',
                  marginTop: '5px',
                }}
              >
                ${metricas.mes.toFixed(2)}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(21, 14, 40, 0.8)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(60, 42, 122, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#887bb0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Total Histórico
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '900',
                  color: '#fff',
                  marginTop: '5px',
                }}
              >
                ${metricas.historico.toFixed(2)}
              </div>
            </div>
          </div>

          {/* BOTÓN REGISTRAR GASTO */}
          <button
            onClick={() => setVista('nuevo')}
            style={{
              width: '100%',
              background: 'rgba(21, 14, 40, 0.8)',
              border: '1px solid #3c2a7a',
              color: '#fff',
              padding: '15px 20px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backdropFilter: 'blur(10px)',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = 'rgba(37, 27, 69, 0.8)')
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = 'rgba(21, 14, 40, 0.8)')
            }
          >
            <span style={{ color: '#a126ff', fontSize: '20px' }}>+</span>{' '}
            Registrar Gasto
          </button>

          {/* HISTORIAL Y FILTROS */}
          <div
            style={{
              background: 'rgba(21, 14, 40, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(60, 42, 122, 0.5)',
              padding: '25px',
            }}
          >
            <h3
              style={{
                margin: '0 0 20px 0',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ color: '#ef4444' }}>Filter</span> Historial de
              Gastos
            </h3>

            {/* Fila de Filtros */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '25px',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#887bb0',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Filtrar por mes
                </label>
                <input
                  type="month"
                  value={filtroMes}
                  onChange={(e) => {
                    setFiltroMes(e.target.value);
                    setFiltroDia('');
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(9, 5, 20, 0.5)',
                    border: '1px solid #251b45',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '8px',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#887bb0',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Filtrar por día
                </label>
                <input
                  type="date"
                  value={filtroDia}
                  onChange={(e) => {
                    setFiltroDia(e.target.value);
                    setFiltroMes('');
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(9, 5, 20, 0.5)',
                    border: '1px solid #251b45',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '8px',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#887bb0',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Categoría
                </label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(9, 5, 20, 0.5)',
                    border: '1px solid #251b45',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                >
                  <option value="Todas">Todas</option>
                  <option value="Servicios">
                    Servicios (Luz, Internet...)
                  </option>
                  <option value="Inventario">Inventario / Snacks</option>
                  <option value="Mantenimiento">Mantenimiento Consolas</option>
                  <option value="Personal">Personal / Nómina</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
            </div>

            {/* Tabla de Historial */}
            <div
              style={{
                display: 'flex',
                padding: '10px 20px',
                background: 'rgba(13, 9, 26, 0.8)',
                borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '11px',
                color: '#887bb0',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderRadius: '8px 8px 0 0',
              }}
            >
              <div style={{ flex: 1 }}>Fecha</div>
              <div style={{ flex: 2 }}>Descripción</div>
              <div style={{ flex: 1.5 }}>Categoría</div>
              <div style={{ flex: 1.5 }}>Método</div>
              <div style={{ flex: 1, textAlign: 'right' }}>Monto</div>
              <div style={{ width: '40px', textAlign: 'center' }}></div>
            </div>

            {cargando ? (
              <div
                style={{
                  textAlign: 'center',
                  color: '#887bb0',
                  padding: '40px',
                }}
              >
                Cargando historial...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {gastosFiltrados.map((g) => (
                  <div
                    key={g.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '15px 20px',
                      borderBottom: '1px solid rgba(37, 27, 69, 0.3)',
                    }}
                  >
                    <div
                      style={{ flex: 1, color: '#a092c4', fontSize: '12px' }}
                    >
                      {new Date(g.creado_en).toLocaleDateString('es-VE')}
                    </div>
                    <div
                      style={{
                        flex: 2,
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '13px',
                      }}
                    >
                      {g.descripcion}
                    </div>
                    <div
                      style={{ flex: 1.5, color: '#887bb0', fontSize: '12px' }}
                    >
                      {g.categoria || 'General'}
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <span
                        style={{
                          background: 'rgba(37, 27, 69, 0.5)',
                          color: '#00d2ff',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          border: '1px solid #3c2a7a',
                        }}
                      >
                        {g.metodo_pago.replace('_', ' ')}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        textAlign: 'right',
                        color: '#ef4444',
                        fontWeight: '900',
                        fontSize: '15px',
                      }}
                    >
                      -${Number(g.monto_usd).toFixed(2)}
                    </div>
                    <div style={{ width: '40px', textAlign: 'right' }}>
                      <button
                        onClick={() => eliminarGasto(g.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '14px',
                          opacity: 0.7,
                        }}
                        title="Eliminar gasto"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                {gastosFiltrados.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#887bb0',
                      padding: '40px',
                    }}
                  >
                    No hay gastos para estos filtros.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* FORMULARIO DE NUEVO GASTO (Como en la Imagen 2) */}
      {vista === 'nuevo' && (
        <div
          style={{
            maxWidth: '450px',
            margin: '40px auto',
            background: 'rgba(21, 14, 40, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 42, 133, 0.3)',
            padding: '40px 30px',
            boxShadow: '0 0 30px rgba(255, 42, 133, 0.15)',
          }}
        >
          <h3
            style={{
              color: '#fff',
              textAlign: 'center',
              margin: '0 0 25px 0',
              fontSize: '20px',
            }}
          >
            Registrar Gasto del Local
          </h3>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#887bb0',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                ¿En qué se gastó el dinero? *
              </label>
              <input
                type="text"
                placeholder="Ej: Pago de Internet, Compra de hielo..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(9, 5, 20, 0.5)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#887bb0',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Categoría *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(9, 5, 20, 0.5)',
                  border: '1px solid #3c2a7a',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="Servicios">Servicios (Luz, Internet...)</option>
                <option value="Inventario">Inventario / Snacks</option>
                <option value="Mantenimiento">Mantenimiento Consolas</option>
                <option value="Personal">Personal / Nómina</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#887bb0',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Monto exacto (USD) *
              </label>
              <input
                type="number"
                placeholder="Ej: 15.00"
                value={montoUSD}
                onChange={(e) => setMontoUSD(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(9, 5, 20, 0.5)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  padding: '14px',
                  borderRadius: '12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              <div
                style={{ fontSize: '12px', color: '#887bb0', marginTop: '8px' }}
              >
                Equivalente que saldrá de caja: Bs{' '}
                {(Number(montoUSD) * tasa).toFixed(2)}
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#887bb0',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                ¿De qué caja salió el dinero?
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(9, 5, 20, 0.5)',
                  border: '1px solid #3c2a7a',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="efectivo_usd">
                  💵 Gaveta Físico Dólares ($)
                </option>
                <option value="efectivo_bs">
                  💵 Gaveta Físico Bolívares (Bs)
                </option>
                <option value="pago_movil">
                  📱 Cuenta Banco / Pago Móvil (Bs)
                </option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button
                onClick={() => setVista('lista')}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid #3c2a7a',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarGasto}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                }}
              >
                Registrar Salida
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

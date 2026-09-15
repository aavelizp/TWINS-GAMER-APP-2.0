import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface TabVentasHoyProps {
  tasa: number;
  rol: string;
}

export default function TabVentasHoy({ tasa, rol }: TabVentasHoyProps) {
  const [ventas, setVentas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [resumen, setResumen] = useState({
    usdFisico: 0,
    pagoMovil: 0,
    bsFisico: 0,
    fiado: 0,
  });

  const [metaMensual, setMetaMensual] = useState(260);
  const [ingresosMes, setIngresosMes] = useState(0);

  const mesActual = new Date().toLocaleString('es-VE', {
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    cargarVentas();
    cargarMetaMensual();
  }, []);

  const cargarMetaMensual = async () => {
    const metaGuardada = localStorage.getItem('metaGastosFijos');
    if (metaGuardada) setMetaMensual(Number(metaGuardada));

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('ventas')
      .select('monto_usd, metodo_pago')
      .gte('creado_en', inicioMes.toISOString());
    if (data) {
      const totalMes = data.reduce(
        (acc, curr) =>
          acc + (curr.metodo_pago !== 'fiado' ? Number(curr.monto_usd) : 0),
        0
      );
      setIngresosMes(totalMes);
    }
  };

  const editarMeta = () => {
    if (rol !== 'admin')
      return alert('Solo administradores pueden editar la meta.');
    const nueva = prompt(
      'Ingresa la meta de gastos fijos mensuales ($):',
      metaMensual.toString()
    );
    if (nueva && !isNaN(Number(nueva))) {
      setMetaMensual(Number(nueva));
      localStorage.setItem('metaGastosFijos', nueva);
    }
  };

  const cargarVentas = async () => {
    setCargando(true);
    const ahora = new Date();
    const inicio = new Date(ahora);
    if (ahora.getHours() < 6) inicio.setDate(inicio.getDate() - 1);
    inicio.setHours(6, 0, 0, 0);

    const { data, error } = await supabase
      .from('ventas')
      .select('*, consolas(nombre), clientes(nombre)')
      .gte('creado_en', inicio.toISOString())
      .order('creado_en', { ascending: false });

    if (data) {
      setVentas(data);
      let usdFisico = 0,
        pagoMovil = 0,
        bsFisico = 0,
        fiado = 0;
      data.forEach((v: any) => {
        const usd = Number(v.monto_usd);
        const bs = Number(v.monto_bs);
        if (v.metodo_pago === 'efectivo_usd') usdFisico += usd;
        else if (v.metodo_pago === 'pago_movil') pagoMovil += bs;
        else if (v.metodo_pago === 'efectivo_bs') bsFisico += bs;
        else if (
          v.metodo_pago === 'mixto_pago_movil' ||
          v.metodo_pago === 'mixto'
        ) {
          usdFisico += usd;
          pagoMovil += bs;
        } else if (v.metodo_pago === 'mixto_efectivo_bs') {
          usdFisico += usd;
          bsFisico += bs;
        } else if (v.metodo_pago === 'fiado') fiado += usd;
      });
      setResumen({ usdFisico, pagoMovil, bsFisico, fiado });
    }
    setCargando(false);
  };

  // --- LÓGICA DE ELIMINAR BLINDADA CONTRA ERRORES SILENCIOSOS ---
  const eliminarVenta = async (venta: any) => {
    if (rol !== 'admin')
      return alert('Solo los administradores pueden anular ventas.');
    if (
      !window.confirm(
        '⚠️ ¿Estás totalmente seguro de anular esta venta? El dinero se descontará del cuadre de caja de hoy.'
      )
    )
      return;

    // Si fue fiado por error, le restamos la deuda a la cuenta del cliente
    if (venta.metodo_pago === 'fiado' && venta.cliente_id) {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('deuda_usd')
        .eq('id', venta.cliente_id)
        .single();
      if (cliente) {
        const nuevaDeuda = Math.max(
          0,
          Number(cliente.deuda_usd) - Number(venta.monto_usd)
        );
        await supabase
          .from('clientes')
          .update({ deuda_usd: nuevaDeuda })
          .eq('id', venta.cliente_id);
      }
    }

    // El .select() al final obliga a Supabase a devolver lo que borró.
    const { data, error } = await supabase
      .from('ventas')
      .delete()
      .eq('id', venta.id)
      .select();

    if (error)
      return alert('Error de conexión al anular la venta: ' + error.message);

    // Si la BD devuelve vacío, significa que lo bloqueó silenciosamente
    if (!data || data.length === 0) {
      return alert(
        '❌ NO SE PUDO ELIMINAR: La base de datos lo bloqueó por seguridad. Debes ejecutar el comando SQL (DISABLE ROW LEVEL SECURITY) que te envié.'
      );
    }

    alert('✅ Venta anulada y eliminada exitosamente.');
    cargarVentas(); // Refrescamos la caja
  };

  const obtenerOrigen = (v: any) => {
    if (v.descripcion?.includes('Inscripción')) return 'Inscripción Torneo';
    if (v.consola_id) return 'Consola';
    return 'Venta Rápida';
  };

  const obtenerDetalle = (v: any) => {
    if (v.descripcion) return v.descripcion;
    if (v.consola_id) return `Sesión en ${v.consolas?.nombre || 'Consola'}`;
    return 'Snacks / Extras';
  };

  const getMetodoBadge = (metodo: string, banco: string) => {
    let colorBg = '#374151',
      colorText = '#d1d5db',
      text = 'Otro';
    if (metodo === 'efectivo_usd') {
      colorBg = '#064e3b';
      colorText = '#34d399';
      text = '💵 Efectivo $';
    }
    if (metodo === 'pago_movil') {
      colorBg = '#1e3a8a';
      colorText = '#60a5fa';
      text = '📱 Pago Móvil';
    }
    if (metodo === 'efectivo_bs') {
      colorBg = '#7c2d12';
      colorText = '#fb923c';
      text = '💵 Efectivo Bs';
    }
    if (metodo === 'fiado') {
      colorBg = '#78350f';
      colorText = '#fbbf24';
      text = '🤝 Fiado';
    }
    if (metodo.startsWith('mixto')) {
      colorBg = '#4c1d95';
      colorText = '#a78bfa';
      text = '🔀 Mixto';
    }

    return (
      <span
        style={{
          background: colorBg,
          color: colorText,
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '10px',
          fontWeight: 'bold',
        }}
      >
        {text} {banco ? `(${banco})` : ''}
      </span>
    );
  };

  const porcentajeMeta = Math.min(
    100,
    Math.round((ingresosMes / metaMensual) * 100)
  );

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '1100px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
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
            }}
          >
            📊 Ventas de la Jornada
          </h2>
          <p
            style={{ margin: '5px 0 0 0', color: '#887bb0', fontSize: '13px' }}
          >
            Desglose de ingresos desde el inicio del turno (6:00 AM)
          </p>
        </div>
        <button
          onClick={cargarVentas}
          style={{
            background: 'transparent',
            border: '1px solid #00d2ff',
            color: '#00d2ff',
            padding: '8px 15px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      <div
        style={{
          background: '#0b0815',
          border: '1px solid #3c2a7a',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '25px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ color: '#ef4444' }}>🎯</span> Termómetro de
            Rentabilidad ({mesActual.toUpperCase()})
          </span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span
              style={{ color: '#00e676', fontWeight: 'bold', fontSize: '14px' }}
            >
              ${ingresosMes.toFixed(2)}
            </span>
            <span style={{ color: '#887bb0', fontSize: '12px' }}>
              / ${metaMensual.toFixed(2)}
            </span>
            {rol === 'admin' && (
              <button
                onClick={editarMeta}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#00d2ff',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Editar Meta
              </button>
            )}
          </div>
        </div>
        <div
          style={{
            background: '#251b45',
            height: '8px',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${porcentajeMeta}%`,
              background:
                porcentajeMeta >= 100
                  ? '#00e676'
                  : 'linear-gradient(90deg, #ef4444, #f59e0b, #00e676)',
              height: '100%',
              transition: 'width 1s ease-in-out',
            }}
          />
        </div>
        <div style={{ fontSize: '10px', color: '#887bb0', marginTop: '5px' }}>
          Ingresos netos del mes vs. Gastos fijos operativos
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '15px',
          marginBottom: '25px',
        }}
      >
        <div
          style={{
            background: 'rgba(0, 230, 118, 0.1)',
            border: '1px solid #00e676',
            padding: '20px',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#00e676',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            💵 GAVETA: DÓLARES FÍSICOS
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff' }}>
            ${resumen.usdFisico.toFixed(2)}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(0, 210, 255, 0.1)',
            border: '1px solid #00d2ff',
            padding: '20px',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#00d2ff',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            📱 BANCO: PAGO MÓVIL
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff' }}>
            Bs {resumen.pagoMovil.toFixed(2)}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            padding: '20px',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#ef4444',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            💵 GAVETA: BOLÍVARES FÍSICOS
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff' }}>
            Bs {resumen.bsFisico.toFixed(2)}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid #f59e0b',
            padding: '20px',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#f59e0b',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            🤝 FIADO HOY (POR COBRAR)
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff' }}>
            ${resumen.fiado.toFixed(2)}
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'rgba(21, 14, 40, 0.6)',
          border: '1px solid #3c2a7a',
          borderRadius: '16px',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            padding: '15px 20px',
            background: 'rgba(11, 8, 21, 0.8)',
            fontSize: '10px',
            color: '#887bb0',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          <div style={{ width: '80px' }}>Hora</div>
          <div style={{ flex: 1 }}>Origen</div>
          <div style={{ flex: 2 }}>Detalle</div>
          <div style={{ flex: 1 }}>Método de Pago</div>
          <div style={{ width: '100px', textAlign: 'right', color: '#00e676' }}>
            Monto USD
          </div>
          <div style={{ width: '100px', textAlign: 'right', color: '#00d2ff' }}>
            Monto Bs
          </div>
          {rol === 'admin' && (
            <div style={{ width: '60px', textAlign: 'center' }}>Anular</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {cargando ? (
            <div
              style={{ padding: '30px', textAlign: 'center', color: '#887bb0' }}
            >
              Cargando movimientos...
            </div>
          ) : ventas.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: '#55497a',
                fontStyle: 'italic',
              }}
            >
              No hay ventas registradas en este turno todavía.
            </div>
          ) : (
            ventas.map((v) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  padding: '15px 20px',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(60,42,122,0.3)',
                  fontSize: '12px',
                }}
              >
                <div style={{ width: '80px', color: '#a092c4' }}>
                  {new Date(v.creado_en).toLocaleTimeString('es-VE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </div>
                <div style={{ flex: 1, color: '#d946ef', fontWeight: 'bold' }}>
                  {obtenerOrigen(v)}
                </div>
                <div style={{ flex: 2, color: '#fff' }}>
                  {obtenerDetalle(v)}
                  {v.clientes?.nombre && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        color: '#887bb0',
                        marginTop: '3px',
                      }}
                    >
                      👤 {v.clientes.nombre}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  {getMetodoBadge(v.metodo_pago, v.banco)}
                </div>
                <div
                  style={{
                    width: '100px',
                    textAlign: 'right',
                    color: '#00e676',
                    fontWeight: '900',
                  }}
                >
                  ${Number(v.monto_usd).toFixed(2)}
                </div>
                <div
                  style={{
                    width: '100px',
                    textAlign: 'right',
                    color: '#00d2ff',
                  }}
                >
                  Bs {Number(v.monto_bs).toFixed(2)}
                </div>
                {rol === 'admin' && (
                  <div style={{ width: '60px', textAlign: 'center' }}>
                    <button
                      onClick={() => eliminarVenta(v)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '16px',
                        opacity: 0.8,
                      }}
                      title="Eliminar venta por error"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

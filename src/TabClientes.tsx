import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface TabClientesProps {
  tasa: number;
  cajeroId: string;
  modo: 'clientes' | 'fiados';
  onPagoRealizado: () => void;
}

export default function TabClientes({
  tasa,
  cajeroId,
  modo,
  onPagoRealizado,
}: TabClientesProps) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoAlias, setNuevoAlias] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');

  useEffect(() => {
    cargarClientes();
  }, [modo]);

  const cargarClientes = async () => {
    setCargando(true);
    let query = supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });

    if (modo === 'fiados') {
      query = query.gt('deuda_usd', 0);
    }

    const { data } = await query;
    if (data) setClientes(data);
    setCargando(false);
  };

  const guardarCliente = async () => {
    if (!nuevoNombre.trim()) return alert('El nombre es obligatorio');

    const { error } = await supabase.from('clientes').insert({
      nombre: nuevoNombre,
      alias: nuevoAlias,
      telefono: nuevoTelefono,
      horas_jugadas: 0,
      deuda_usd: 0,
    });

    if (error) return alert('Error al guardar: ' + error.message);

    setMostrarModal(false);
    setNuevoNombre('');
    setNuevoAlias('');
    setNuevoTelefono('');
    cargarClientes();
  };

  const eliminarCliente = async (id: number, nombre: string) => {
    if (
      !window.confirm(
        `⚠️ ¿Estás totalmente seguro de ELIMINAR a ${nombre} del directorio?`
      )
    )
      return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) return alert('Error al eliminar: ' + error.message);
    cargarClientes();
  };

  const perdonarDeuda = async (id: number, nombre: string) => {
    if (
      !window.confirm(
        `🩹 ¿Deseas ANULAR la deuda de ${nombre}? Su cuenta quedará en $0 y este dinero NO ingresará a la caja.`
      )
    )
      return;
    const { error } = await supabase
      .from('clientes')
      .update({ deuda_usd: 0 })
      .eq('id', id);
    if (error) return alert('Error al anular deuda: ' + error.message);
    cargarClientes();
  };

  const registrarPago = async (cliente: any) => {
    const montoStr = window.prompt(
      `¿Cuánto dinero va a abonar ${
        cliente.nombre
      }?\n\nDeuda actual: $${cliente.deuda_usd.toFixed(2)}`,
      cliente.deuda_usd.toString()
    );
    if (!montoStr) return;

    const monto = Number(montoStr);
    if (isNaN(monto) || monto <= 0) return alert('Monto inválido');

    let metodo = window.prompt(
      '¿Cómo está pagando?\nEscribe el número:\n\n1 = Efectivo USD\n2 = Pago Móvil\n3 = Efectivo Bs'
    );
    let metodoStr = 'efectivo_usd';
    let bancoSeleccionado = null; // --- NUEVO: Capturar Banco ---

    if (metodo === '2') {
      metodoStr = 'pago_movil';
      bancoSeleccionado = window.prompt(
        '¿Desde qué banco se emitió el pago Móvil?\n(Ej: Banesco, Venezuela, Provincial...)'
      );
      if (!bancoSeleccionado)
        return alert('Cobro cancelado. Debe especificar el banco.');
    } else if (metodo === '3') {
      metodoStr = 'efectivo_bs';
    } else if (metodo !== '1') {
      return alert('Cobro cancelado.');
    }

    let montoBs = 0;
    if (metodoStr === 'pago_movil' || metodoStr === 'efectivo_bs') {
      montoBs = monto * tasa;
    }

    const { error: errPago } = await supabase.from('pagos_deudas').insert({
      cliente_id: cliente.id,
      monto_usd: monto,
      monto_bs: montoBs,
      metodo_pago: metodoStr,
      tasa_cambio: tasa,
      cajero_id: cajeroId,
      banco: bancoSeleccionado, // --- NUEVO: Enviando a BD ---
    });
    if (errPago) return alert('Error al procesar el pago: ' + errPago.message);

    const nuevaDeuda = Math.max(0, cliente.deuda_usd - monto);
    await supabase
      .from('clientes')
      .update({ deuda_usd: nuevaDeuda })
      .eq('id', cliente.id);

    alert('✅ ¡Pago registrado correctamente! El dinero ya está en la caja.');
    cargarClientes();
    onPagoRealizado();
  };

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
          marginBottom: '30px',
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
            {modo === 'clientes'
              ? '👥 Directorio de Clientes'
              : '📝 Control de Fiados'}
          </h2>
          <p
            style={{ margin: '5px 0 0 0', color: '#887bb0', fontSize: '13px' }}
          >
            {modo === 'clientes'
              ? 'Gestiona a los jugadores de tu Club Gamer.'
              : 'Jugadores que tienen deudas pendientes en el local.'}
          </p>
        </div>
        {modo === 'clientes' && (
          <button
            onClick={() => setMostrarModal(true)}
            style={{
              background: 'linear-gradient(90deg, #d946ef, #9333ea)',
              border: 'none',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            + Nuevo Cliente
          </button>
        )}
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', color: '#887bb0', padding: '40px' }}>
          Cargando directorio...
        </div>
      ) : clientes.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: '#55497a',
            padding: '60px',
            border: '1px dashed #3c2a7a',
            borderRadius: '16px',
          }}
        >
          No hay registros para mostrar.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {clientes.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'rgba(21, 14, 40, 0.6)',
                border: '1px solid #3c2a7a',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#fff',
                  }}
                >
                  {c.alias ? `${c.alias} (${c.nombre})` : c.nombre}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#887bb0',
                    marginTop: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  📞 {c.telefono || 'Sin registro'}
                </div>
              </div>

              <div
                style={{ display: 'flex', alignItems: 'center', gap: '25px' }}
              >
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#887bb0',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '3px',
                    }}
                  >
                    Estatus
                  </div>
                  {c.deuda_usd > 0 ? (
                    <div
                      style={{
                        color: '#ef4444',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}
                    >
                      Debe ${Number(c.deuda_usd).toFixed(2)}
                    </div>
                  ) : (
                    <div
                      style={{
                        color: '#00e676',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}
                    >
                      Solvente
                    </div>
                  )}
                </div>

                <div
                  style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  {c.deuda_usd > 0 && (
                    <>
                      <button
                        onClick={() => registrarPago(c)}
                        style={{
                          background: 'rgba(0, 230, 118, 0.1)',
                          border: '1px solid #00e676',
                          color: '#00e676',
                          padding: '8px 15px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          transition: 'all 0.2s',
                        }}
                      >
                        Cobrar
                      </button>
                      <button
                        onClick={() => perdonarDeuda(c.id, c.nombre)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #f59e0b',
                          color: '#f59e0b',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          transition: 'all 0.2s',
                        }}
                      >
                        Anular Deuda
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => eliminarCliente(c.id, c.nombre)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '18px',
                      cursor: 'pointer',
                      padding: '8px',
                      opacity: 0.7,
                      transition: 'opacity 0.2s',
                    }}
                    title="Eliminar Cliente"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {mostrarModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            backdropFilter: 'blur(5px)',
          }}
        >
          <div
            style={{
              background: '#0b0815',
              padding: '30px',
              borderRadius: '20px',
              width: '350px',
              border: '1px solid #3c2a7a',
              boxShadow: '0 25px 50px rgba(217, 70, 239, 0.2)',
            }}
          >
            <h3
              style={{
                margin: '0 0 20px 0',
                color: '#d946ef',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              👤 Nuevo Cliente
            </h3>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
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
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(21, 14, 40, 0.8)',
                    border: '1px solid #251b45',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
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
                  Alias (GamerTag)
                </label>
                <input
                  type="text"
                  value={nuevoAlias}
                  onChange={(e) => setNuevoAlias(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(21, 14, 40, 0.8)',
                    border: '1px solid #251b45',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
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
                  Teléfono (Opcional)
                </label>
                <input
                  type="text"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(21, 14, 40, 0.8)',
                    border: '1px solid #251b45',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => setMostrarModal(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid #3c2a7a',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarCliente}
                  style={{
                    flex: 1,
                    background: '#d946ef',
                    border: 'none',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

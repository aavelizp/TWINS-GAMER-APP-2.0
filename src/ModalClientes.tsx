import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface ModalClientesProps {
  tasa: number;
  cajeroId: string;
  onClose: () => void;
  onPagoRealizado: () => void; // Para actualizar la caja en el Dashboard
}

export default function ModalClientes({
  tasa,
  cajeroId,
  onClose,
  onPagoRealizado,
}: ModalClientesProps) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'lista' | 'nuevo' | 'pagar'>('lista');

  // Formulario Nuevo Cliente
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [alias, setAlias] = useState('');

  // Formulario Pago
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState<
    'efectivo_usd' | 'efectivo_bs' | 'pago_movil'
  >('efectivo_usd');

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });
    if (data) setClientes(data);
    setCargando(false);
  };

  const guardarCliente = async () => {
    if (!nombre.trim()) return alert('El nombre es obligatorio');
    const { error } = await supabase
      .from('clientes')
      .insert({ nombre, telefono, alias });
    if (error) return alert('Error al guardar cliente');
    setNombre('');
    setTelefono('');
    setAlias('');
    setVista('lista');
    cargarClientes();
  };

  const procesarPagoDeuda = async () => {
    if (!clienteSeleccionado || Number(montoPago) <= 0) return;

    const montoUsd = Number(montoPago);
    const montoBs = montoUsd * tasa;

    if (montoUsd > clienteSeleccionado.deuda_usd) {
      return alert(`El cliente solo debe $${clienteSeleccionado.deuda_usd}`);
    }

    // 1. Registrar el ingreso del dinero
    const { error: errPago } = await supabase.from('pagos_deudas').insert({
      cliente_id: clienteSeleccionado.id,
      monto_usd: montoUsd,
      monto_bs: montoBs,
      metodo_pago: metodoPago,
      cajero_id: cajeroId,
    });

    if (errPago) return alert('Error al registrar el pago');

    // 2. Descontar la deuda del cliente
    const nuevaDeuda = clienteSeleccionado.deuda_usd - montoUsd;
    await supabase
      .from('clientes')
      .update({ deuda_usd: nuevaDeuda })
      .eq('id', clienteSeleccionado.id);

    alert('✅ Pago registrado exitosamente');
    setMontoPago('');
    setVista('lista');
    cargarClientes();
    onPagoRealizado(); // Avisa al Dashboard que entró dinero
  };

  const bgPrincipal = '#0f0a1c';
  const colorAcento = '#a126ff';

  return (
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
          background: bgPrincipal,
          borderRadius: '16px',
          width: '450px',
          border: `1px solid ${colorAcento}50`,
          color: '#fff',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #251b45',
            background: '#150e28',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '900',
              color: colorAcento,
            }}
          >
            👥 Directorio de Clientes
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#887bb0',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            padding: '20px',
            minHeight: '300px',
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
        >
          {vista === 'lista' && (
            <>
              <button
                onClick={() => setVista('nuevo')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #9b51e0, #a126ff)',
                  border: 'none',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginBottom: '20px',
                }}
              >
                + Registrar Nuevo Cliente
              </button>

              {cargando ? (
                <div style={{ textAlign: 'center', color: '#887bb0' }}>
                  Cargando...
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {clientes.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        background: '#1c1335',
                        padding: '15px',
                        borderRadius: '12px',
                        border: '1px solid #251b45',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                          {c.nombre}{' '}
                          {c.alias && (
                            <span
                              style={{ color: '#887bb0', fontSize: '12px' }}
                            >
                              ({c.alias})
                            </span>
                          )}
                        </div>
                        {c.telefono && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#887bb0',
                              marginTop: '4px',
                            }}
                          >
                            📞 {c.telefono}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#887bb0',
                            textTransform: 'uppercase',
                          }}
                        >
                          Deuda Actual
                        </div>
                        <div
                          style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: c.deuda_usd > 0 ? '#f39c12' : '#00e676',
                          }}
                        >
                          ${Number(c.deuda_usd).toFixed(2)}
                        </div>
                        {c.deuda_usd > 0 && (
                          <button
                            onClick={() => {
                              setClienteSeleccionado(c);
                              setVista('pagar');
                            }}
                            style={{
                              background: '#f39c12',
                              border: 'none',
                              color: '#000',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              marginTop: '5px',
                            }}
                          >
                            Abonar Pago
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {clientes.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        color: '#887bb0',
                        marginTop: '20px',
                      }}
                    >
                      No hay clientes registrados
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {vista === 'nuevo' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#887bb0',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090514',
                    border: '1px solid #251b45',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '6px',
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
                    marginBottom: '5px',
                  }}
                >
                  Alias / Apodo (Opcional)
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090514',
                    border: '1px solid #251b45',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '6px',
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
                    marginBottom: '5px',
                  }}
                >
                  Teléfono (Opcional)
                </label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090514',
                    border: '1px solid #251b45',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => setVista('lista')}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid #251b45',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarCliente}
                  style={{
                    flex: 1,
                    background: colorAcento,
                    border: 'none',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          {vista === 'pagar' && clienteSeleccionado && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              <div
                style={{
                  background: '#1c1335',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #f39c12',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: '#f39c12',
                    textTransform: 'uppercase',
                  }}
                >
                  Cobrando deuda a:
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {clienteSeleccionado.nombre}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#887bb0',
                    marginTop: '5px',
                  }}
                >
                  Deuda Total:{' '}
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>
                    ${clienteSeleccionado.deuda_usd}
                  </span>
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#887bb0',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  Monto a abonar (USD)
                </label>
                <input
                  type="number"
                  placeholder="Ej: 2.00"
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090514',
                    border: '1px solid #251b45',
                    color: '#00e676',
                    fontWeight: 'bold',
                    padding: '10px',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    fontSize: '11px',
                    color: '#887bb0',
                    marginTop: '5px',
                  }}
                >
                  Equivalente: Bs {(Number(montoPago) * tasa).toFixed(2)}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#887bb0',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  ¿Cómo está pagando?
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as any)}
                  style={{
                    width: '100%',
                    background: '#090514',
                    border: '1px solid #251b45',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '6px',
                  }}
                >
                  <option value="efectivo_usd">Efectivo ($)</option>
                  <option value="pago_movil">Pago Móvil (Bs)</option>
                  <option value="efectivo_bs">Efectivo (Bs)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => setVista('lista')}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid #251b45',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={procesarPagoDeuda}
                  style={{
                    flex: 1,
                    background: '#00e676',
                    border: 'none',
                    color: '#000',
                    padding: '10px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Registrar Pago
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

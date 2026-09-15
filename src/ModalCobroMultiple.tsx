import React, { useState, useEffect } from 'react';

interface ModalCobroMultipleProps {
  consolas: any[];
  tasa: number;
  calcularDeuda: (consola: any) => number;
  onClose: () => void;
  onConfirm: (
    metodo: string,
    detalles: any,
    consolasSeleccionadas: number[]
  ) => void;
}

export default function ModalCobroMultiple({
  consolas,
  tasa,
  calcularDeuda,
  onClose,
  onConfirm,
}: ModalCobroMultipleProps) {
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [tab, setTab] = useState<'completo' | 'mixto' | 'fiado'>('completo');
  const [metodoCompleto, setMetodoCompleto] = useState<
    'efectivo_usd' | 'pago_movil' | 'efectivo_bs'
  >('efectivo_usd');

  const [banco, setBanco] = useState('');
  const [clienteBuscador, setClienteBuscador] = useState('');

  const [mixtoUsd, setMixtoUsd] = useState('');
  const [mixtoPmBs, setMixtoPmBs] = useState('');
  const [mixtoEfectivoBs, setMixtoEfectivoBs] = useState('');

  // Solo mostrar consolas que están ocupadas
  const consolasOcupadas = consolas.filter((c) => c.estado === 'ocupado');

  const toggleConsola = (id: number) => {
    if (seleccionadas.includes(id)) {
      setSeleccionadas(seleccionadas.filter((c) => c !== id));
    } else {
      setSeleccionadas([...seleccionadas, id]);
    }
  };

  // Calcular totales en vivo
  let totalUSD = 0;
  seleccionadas.forEach((id) => {
    const c = consolas.find((cons) => cons.id === id);
    totalUSD += calcularDeuda(c);
  });
  const totalBS = totalUSD * tasa;

  const esPagoMovilIncompleto =
    tab === 'completo' && metodoCompleto === 'pago_movil' && banco === '';

  const handleConfirmar = () => {
    if (seleccionadas.length === 0)
      return alert('Selecciona al menos una consola.');
    if (esPagoMovilIncompleto) return;

    if (tab === 'completo') {
      onConfirm(metodoCompleto, { banco_emisor: banco }, seleccionadas);
    } else if (tab === 'mixto') {
      onConfirm(
        'mixto',
        {
          monto_usd: Number(mixtoUsd) || 0,
          monto_bs: (Number(mixtoPmBs) || 0) + (Number(mixtoEfectivoBs) || 0),
        },
        seleccionadas
      );
    } else if (tab === 'fiado') {
      onConfirm('fiado', {}, seleccionadas);
    }
  };

  const bgPrincipal = '#0f0a1c';
  const bgInput = '#090514';
  const bordeInactivo = '#251b45';
  const bordeActivo = '#a126ff';
  const colorAcento = '#ff007f';

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
          width: '420px',
          border: `1px solid ${bordeInactivo}`,
          boxShadow: '0 15px 50px rgba(0,0,0,0.6)',
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: '#a126ff' }}>📚</span> Cobro Múltiple
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
            padding: '0 20px 20px 20px',
            maxHeight: '75vh',
            overflowY: 'auto',
          }}
        >
          {/* SELECCIÓN DE CONSOLAS */}
          <div
            style={{
              background: bgInput,
              borderRadius: '12px',
              padding: '15px',
              border: `1px solid ${bordeInactivo}`,
              marginBottom: '20px',
            }}
          >
            <label
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#887bb0',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              SELECCIONA CONSOLAS:
            </label>

            {consolasOcupadas.length === 0 ? (
              <div style={{ color: '#ff4d4d', fontSize: '13px' }}>
                No hay consolas ocupadas para cobrar.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                }}
              >
                {consolasOcupadas.map((c) => (
                  <label
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: bgPrincipal,
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${
                        seleccionadas.includes(c.id)
                          ? bordeActivo
                          : bordeInactivo
                      }`,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={seleccionadas.includes(c.id)}
                      onChange={() => toggleConsola(c.id)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: bordeActivo,
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: '#fff',
                        fontSize: '13px',
                      }}
                    >
                      {c.nombre}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* SÓLO MOSTRAR TOTALES Y COBRO SI HAY SELECCIONADAS */}
          {seleccionadas.length > 0 && (
            <>
              {/* TOTALES */}
              <div
                style={{
                  background: bgInput,
                  borderRadius: '12px',
                  padding: '15px',
                  border: `1px solid ${bordeInactivo}`,
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: '#ccc',
                    marginBottom: '8px',
                  }}
                >
                  <span>Tiempos Unidos</span>
                  <span>${totalUSD.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: '#ccc',
                    marginBottom: '15px',
                  }}
                >
                  <span>Extras y Snacks</span>
                  <span>$0.00</span>
                </div>
                <hr
                  style={{
                    borderTop: `1px solid ${bordeInactivo}`,
                    margin: '0 0 15px 0',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '900',
                        letterSpacing: '1px',
                      }}
                    >
                      TOTAL GLOBAL
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: colorAcento,
                        marginTop: '2px',
                      }}
                    >
                      En Bs
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '22px',
                        fontWeight: '900',
                        color: '#a126ff',
                      }}
                    >
                      ${totalUSD.toFixed(2)}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: colorAcento,
                        marginTop: '2px',
                      }}
                    >
                      Bs {totalBS.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* TABS Y MÉTODOS (Calcado del ModalCobro original) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                <button
                  onClick={() => setTab('completo')}
                  style={{
                    background:
                      tab === 'completo' ? bordeActivo : 'transparent',
                    border: `1px solid ${
                      tab === 'completo' ? bordeActivo : bordeInactivo
                    }`,
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Completo
                </button>
                <button
                  onClick={() => setTab('mixto')}
                  style={{
                    background: tab === 'mixto' ? bordeActivo : 'transparent',
                    border: `1px solid ${
                      tab === 'mixto' ? bordeActivo : bordeInactivo
                    }`,
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Mixto
                </button>
                <button
                  onClick={() => setTab('fiado')}
                  style={{
                    background: tab === 'fiado' ? bordeActivo : 'transparent',
                    border: `1px solid ${
                      tab === 'fiado' ? bordeActivo : bordeInactivo
                    }`,
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Fiado
                </button>
              </div>

              {tab === 'completo' && (
                <div
                  style={{
                    background: bgInput,
                    padding: '15px',
                    borderRadius: '12px',
                    border: `1px solid ${bordeInactivo}`,
                  }}
                >
                  <label
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: colorAcento,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '12px',
                    }}
                  >
                    ¿CÓMO PAGÓ?
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      marginBottom: '15px',
                    }}
                  >
                    {[
                      { id: 'efectivo_usd', label: 'Efectivo $' },
                      { id: 'pago_movil', label: 'Pago Móvil Bs' },
                      { id: 'efectivo_bs', label: 'Efectivo Bs 💵' },
                    ].map((opcion) => (
                      <div
                        key={opcion.id}
                        onClick={() => setMetodoCompleto(opcion.id as any)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 15px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: `1px solid ${
                            metodoCompleto === opcion.id
                              ? bordeActivo
                              : bordeInactivo
                          }`,
                          background: bgPrincipal,
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: `2px solid ${
                              metodoCompleto === opcion.id
                                ? bordeActivo
                                : '#555'
                            }`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {metodoCompleto === opcion.id && (
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: bordeActivo,
                              }}
                            />
                          )}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          {opcion.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  {metodoCompleto === 'pago_movil' && (
                    <div
                      style={{
                        background: bgPrincipal,
                        padding: '15px',
                        borderRadius: '8px',
                        border: `1px solid ${bordeInactivo}`,
                      }}
                    >
                      <label
                        style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: bordeActivo,
                          display: 'block',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                        }}
                      >
                        Banco Emisor *
                      </label>
                      <select
                        value={banco}
                        onChange={(e) => setBanco(e.target.value)}
                        style={{
                          width: '100%',
                          background: bgInput,
                          border: `1px solid ${bordeInactivo}`,
                          color: '#fff',
                          padding: '12px',
                          borderRadius: '8px',
                          boxSizing: 'border-box',
                          outline: 'none',
                          appearance: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">Seleccione banco...</option>
                        <option value="Banesco">Banesco</option>
                        <option value="Mercantil">Mercantil</option>
                        <option value="Venezuela">Venezuela</option>
                        <option value="Provincial">Provincial</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {tab === 'mixto' && (
                <div
                  style={{
                    background: bgInput,
                    padding: '20px',
                    borderRadius: '12px',
                    border: `1px solid ${bordeInactivo}`,
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: '#00e676',
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      >
                        EFECTIVO ($)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={mixtoUsd}
                        onChange={(e) => setMixtoUsd(e.target.value)}
                        style={{
                          width: '100%',
                          background: bgPrincipal,
                          border: `1px solid ${bordeInactivo}`,
                          color: '#fff',
                          padding: '10px',
                          borderRadius: '8px',
                          boxSizing: 'border-box',
                          textAlign: 'center',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: '#00f2fe',
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      >
                        PAGO MÓVIL (BS)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={mixtoPmBs}
                        onChange={(e) => setMixtoPmBs(e.target.value)}
                        style={{
                          width: '100%',
                          background: bgPrincipal,
                          border: `1px solid ${bordeInactivo}`,
                          color: '#fff',
                          padding: '10px',
                          borderRadius: '8px',
                          boxSizing: 'border-box',
                          textAlign: 'center',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: '#00e676',
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      >
                        EFECTIVO (BS)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={mixtoEfectivoBs}
                        onChange={(e) => setMixtoEfectivoBs(e.target.value)}
                        style={{
                          width: '100%',
                          background: bgPrincipal,
                          border: `1px solid ${bordeInactivo}`,
                          color: '#fff',
                          padding: '10px',
                          borderRadius: '8px',
                          boxSizing: 'border-box',
                          textAlign: 'center',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div
          style={{
            padding: '20px',
            borderTop: `1px solid ${bordeInactivo}`,
            display: 'flex',
            gap: '15px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'transparent',
              border: `1px solid ${bordeInactivo}`,
              color: '#fff',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={seleccionadas.length === 0 || esPagoMovilIncompleto}
            style={{
              flex: 1,
              background:
                seleccionadas.length === 0 || esPagoMovilIncompleto
                  ? '#3c2a7a'
                  : `linear-gradient(90deg, ${bordeActivo}, #d946ef)`,
              border: 'none',
              color: '#fff',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor:
                seleccionadas.length === 0 || esPagoMovilIncompleto
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                seleccionadas.length === 0 || esPagoMovilIncompleto ? 0.6 : 1,
            }}
          >
            <span style={{ marginRight: '5px' }}>$</span> Confirmar Cobro
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

interface ModalGastosProps {
  tasa: number;
  onClose: () => void;
  onConfirm: (
    descripcion: string,
    montoUSD: number,
    montoBS: number,
    metodo: string
  ) => void;
}

export default function ModalGastos({
  tasa,
  onClose,
  onConfirm,
}: ModalGastosProps) {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState<'usd' | 'bs'>('usd');
  const [metodo, setMetodo] = useState<
    'efectivo_usd' | 'efectivo_bs' | 'pago_movil'
  >('efectivo_usd');

  const bgPrincipal = '#0f0a1c';
  const bgInput = '#090514';
  const bordeInactivo = '#251b45';
  const colorAlerta = '#ef4444'; // Rojo para indicar salida de dinero

  const handleConfirmar = () => {
    if (!descripcion.trim() || Number(monto) <= 0) return;

    let mUsd = 0;
    let mBs = 0;

    if (moneda === 'usd') {
      mUsd = Number(monto);
      mBs = mUsd * tasa;
    } else {
      mBs = Number(monto);
      mUsd = mBs / tasa;
    }

    onConfirm(descripcion, mUsd, mBs, metodo);
  };

  const sinDatos = !descripcion.trim() || Number(monto) <= 0;

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
          width: '400px',
          border: `1px solid ${colorAlerta}50`,
          boxShadow: `0 15px 50px ${colorAlerta}30`,
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
            borderBottom: `1px solid ${bordeInactivo}`,
            background: '#1c0a14',
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
              color: colorAlerta,
            }}
          >
            📉 Registrar Gasto / Salida
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

        <div style={{ padding: '20px' }}>
          {/* DESCRIPCIÓN */}
          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                fontSize: '11px',
                color: '#887bb0',
                display: 'block',
                marginBottom: '5px',
              }}
            >
              ¿En qué se gastó el dinero?
            </label>
            <input
              type="text"
              placeholder="Ej: Pago botellón de agua, hielo, vuelto..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              style={{
                width: '100%',
                background: bgInput,
                border: `1px solid ${bordeInactivo}`,
                color: '#fff',
                padding: '10px',
                borderRadius: '6px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* MONTO Y MONEDA */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 2 }}>
              <label
                style={{
                  fontSize: '11px',
                  color: '#887bb0',
                  display: 'block',
                  marginBottom: '5px',
                }}
              >
                Monto exacto
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                style={{
                  width: '100%',
                  background: bgInput,
                  border: `1px solid ${bordeInactivo}`,
                  color: colorAlerta,
                  fontWeight: 'bold',
                  padding: '10px',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: '11px',
                  color: '#887bb0',
                  display: 'block',
                  marginBottom: '5px',
                }}
              >
                Moneda
              </label>
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as any)}
                style={{
                  width: '100%',
                  background: bgInput,
                  border: `1px solid ${bordeInactivo}`,
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '6px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="usd">$ USD</option>
                <option value="bs">Bs</option>
              </select>
            </div>
          </div>

          {/* DE DÓNDE SALIÓ EL DINERO */}
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
                color: colorAlerta,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'block',
                marginBottom: '10px',
              }}
            >
              ¿De dónde se sacó la plata?
            </label>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {[
                { id: 'efectivo_usd', label: 'Caja - Efectivo $' },
                { id: 'efectivo_bs', label: 'Caja - Efectivo Bs 💵' },
                { id: 'pago_movil', label: 'Banco - Pago Móvil' },
              ].map((opcion) => (
                <div
                  key={opcion.id}
                  onClick={() => setMetodo(opcion.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: `1px solid ${
                      metodo === opcion.id ? colorAlerta : bordeInactivo
                    }`,
                    background: bgPrincipal,
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: `2px solid ${
                        metodo === opcion.id ? colorAlerta : '#555'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {metodo === opcion.id && (
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: colorAlerta,
                        }}
                      />
                    )}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                    {opcion.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: '15px 20px',
            borderTop: `1px solid ${bordeInactivo}`,
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'transparent',
              border: `1px solid ${bordeInactivo}`,
              color: '#fff',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={sinDatos}
            style={{
              flex: 1,
              background: sinDatos ? '#251b45' : colorAlerta,
              border: 'none',
              color: sinDatos ? '#887bb0' : '#fff',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: sinDatos ? 'not-allowed' : 'pointer',
            }}
          >
            Descontar de Caja
          </button>
        </div>
      </div>
    </div>
  );
}

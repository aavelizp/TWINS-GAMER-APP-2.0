import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function ModalCobro({ datos, onClose, onConfirm }: any) {
  const [metodoPago, setMetodoPago] = useState('efectivo_usd');
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState('');

  const [usdMixto, setUsdMixto] = useState('');
  const [bsMixto, setBsMixto] = useState('');
  const [tipoMixto, setTipoMixto] = useState('mixto_pago_movil');

  // --- NUEVO: ESTADOS PARA EL BANCO ---
  const [banco, setBanco] = useState('');
  const listaBancos = [
    'Banesco',
    'Mercantil',
    'Venezuela',
    'Provincial',
    'BNC',
    'Bancamiga',
    'Tesoro',
    'Otro',
  ];

  const mostrarSelector = !(datos?.clienteYaSolicitado || datos?.esInscripcion);

  useEffect(() => {
    if (datos && mostrarSelector) {
      cargarClientes();
    }
  }, [datos, mostrarSelector]);

  const cargarClientes = async () => {
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, alias')
      .order('nombre', { ascending: true });
    if (data) setClientes(data);
  };

  const handleConfirm = () => {
    const idAEnviar =
      datos.cliente_id_real || (clienteId ? Number(clienteId) : null);

    if (metodoPago === 'fiado' && !idAEnviar) {
      return alert(
        '⚠️ Debe vincular un cliente del Club Gamer para poder registrar un Fiado.'
      );
    }

    // --- NUEVA VALIDACIÓN: OBLIGATORIO ELEGIR BANCO ---
    const requiereBanco =
      metodoPago === 'pago_movil' ||
      (metodoPago === 'mixto' && tipoMixto === 'mixto_pago_movil');
    if (requiereBanco && !banco) {
      return alert(
        '⚠️ REQUERIDO: Selecciona el Banco del cual se emitió el pago.'
      );
    }

    let detalles: any = { banco: requiereBanco ? banco : null };

    if (metodoPago === 'mixto') {
      detalles.monto_usd = Number(usdMixto);
      detalles.monto_bs = Number(bsMixto);
      onConfirm(tipoMixto, detalles, idAEnviar);
      return;
    }

    onConfirm(metodoPago, detalles, idAEnviar);
  };

  if (!datos) return null;

  let textoBoton = 'Cobrar Sesión';
  if (datos.isVentaRapida) textoBoton = 'Cobrar Venta';
  if (datos.esInscripcion) textoBoton = 'Registrar Inscripción';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        style={{
          background: '#110b1f',
          padding: '30px',
          borderRadius: '16px',
          width: '360px',
          border: '1px solid #3c2a7a',
          color: '#fff',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        <h3
          style={{
            margin: '0 0 20px 0',
            color: '#d946ef',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '18px',
          }}
        >
          💳 Confirmar Cobro
        </h3>

        <div
          style={{
            background: '#090514',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
            marginBottom: '25px',
            border: '1px solid #251b45',
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
            Total a Pagar
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: '900',
              color: '#00e676',
              margin: '5px 0',
            }}
          >
            ${datos.usd}
          </div>
          <div style={{ fontSize: '13px', color: '#887bb0' }}>
            Bs {datos.bs}
          </div>
        </div>

        {mostrarSelector && (
          <div style={{ marginBottom: '20px', animation: 'fadeIn 0.3s' }}>
            <label
              style={{
                fontSize: '12px',
                color: '#00d2ff',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '8px',
                fontWeight: 'bold',
              }}
            >
              🏆 Vincular al Club Gamer
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(21,14,40,0.8)',
                border: '1px solid #3c2a7a',
                color: '#fff',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Consumidor Final (No fía ni suma puntos)</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.alias ? `${c.alias} (${c.nombre})` : c.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom:
              metodoPago === 'pago_movil' ||
              (metodoPago === 'mixto' && tipoMixto === 'mixto_pago_movil')
                ? '15px'
                : '25px',
          }}
        >
          {[
            { id: 'efectivo_usd', label: '💵 Efectivo ($)' },
            { id: 'pago_movil', label: '📱 Pago Móvil' },
            { id: 'efectivo_bs', label: '💵 Efectivo (Bs)' },
            { id: 'mixto', label: '🔀 Pago Mixto' },
            { id: 'fiado', label: '🤝 Fiado (Crédito)' },
          ].map((op) => (
            <label
              key={op.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'rgba(21,14,40,0.5)',
                border:
                  metodoPago === op.id
                    ? '1px solid #d946ef'
                    : '1px solid #251b45',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="radio"
                name="metodoPago"
                value={op.id}
                checked={metodoPago === op.id}
                onChange={(e) => setMetodoPago(e.target.value)}
                style={{ accentColor: '#d946ef', transform: 'scale(1.2)' }}
              />
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: metodoPago === op.id ? 'bold' : 'normal',
                  color: metodoPago === op.id ? '#fff' : '#a092c4',
                }}
              >
                {op.label}
              </span>
            </label>
          ))}
        </div>

        {/* --- NUEVO: DROPDOWN DE BANCOS --- */}
        {(metodoPago === 'pago_movil' ||
          (metodoPago === 'mixto' && tipoMixto === 'mixto_pago_movil')) && (
          <div style={{ marginBottom: '25px', animation: 'fadeIn 0.3s' }}>
            <select
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(21,14,40,0.8)',
                border: '1px solid #d946ef',
                color: '#fff',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Seleccione banco..</option>
              {listaBancos.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        )}

        {metodoPago === 'mixto' && (
          <div
            style={{
              background: 'rgba(21,14,40,0.8)',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px dashed #d946ef',
              animation: 'fadeIn 0.3s',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#887bb0',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  Monto en $
                </label>
                <input
                  type="number"
                  value={usdMixto}
                  onChange={(e) => setUsdMixto(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#090514',
                    border: '1px solid #3c2a7a',
                    color: '#fff',
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
                  Monto en Bs
                </label>
                <input
                  type="number"
                  value={bsMixto}
                  onChange={(e) => setBsMixto(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#090514',
                    border: '1px solid #3c2a7a',
                    color: '#fff',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <select
              value={tipoMixto}
              onChange={(e) => setTipoMixto(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#090514',
                border: '1px solid #3c2a7a',
                color: '#fff',
                borderRadius: '6px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="mixto_pago_movil">Mixto ($ + Pago Móvil)</option>
              <option value="mixto_efectivo_bs">Mixto ($ + Efectivo Bs)</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              background: 'transparent',
              border: '1px solid #3c2a7a',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '14px',
              background: 'linear-gradient(90deg, #d946ef, #9333ea)',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            {textoBoton}
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

import React, { useState } from 'react';

export default function ModalMover({
  consolaOrigen,
  consolas,
  onClose,
  onConfirm,
}: any) {
  const disponibles = consolas.filter((c: any) => c.estado === 'disponible');
  const [destinoId, setDestinoId] = useState(
    disponibles.length > 0 ? disponibles[0].id : ''
  );

  const handleConfirm = () => {
    if (!destinoId) return;
    const destino = consolas.find(
      (c: any) => c.id.toString() === destinoId.toString()
    );
    onConfirm(consolaOrigen, destino);
  };

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
        zIndex: 6000,
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        style={{
          background: '#0b0815',
          padding: '30px',
          borderRadius: '20px',
          width: '350px',
          border: '1px solid #00d2ff',
          boxShadow: '0 25px 50px rgba(0, 210, 255, 0.2)',
        }}
      >
        <h3
          style={{
            margin: '0 0 20px 0',
            color: '#00d2ff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '18px',
          }}
        >
          ⇄ Mover Jugador
        </h3>

        <div
          style={{
            background: 'rgba(21, 14, 40, 0.5)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px dashed #3c2a7a',
            marginBottom: '20px',
          }}
        >
          <div
            style={{ fontSize: '11px', color: '#887bb0', marginBottom: '5px' }}
          >
            Desde:
          </div>
          <strong style={{ color: '#fff' }}>
            {consolaOrigen.nombre} ({consolaOrigen.tipo})
          </strong>
          <div style={{ fontSize: '12px', color: '#00e676', marginTop: '5px' }}>
            {consolaOrigen.cliente_nombre || 'Cliente sin registrar'}
          </div>
        </div>

        {disponibles.length === 0 ? (
          <div
            style={{
              color: '#ef4444',
              textAlign: 'center',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            No hay consolas disponibles para mover.
          </div>
        ) : (
          <div style={{ marginBottom: '25px' }}>
            <label
              style={{
                fontSize: '11px',
                color: '#887bb0',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Mover Hacia:
            </label>
            <select
              value={destinoId}
              onChange={(e) => setDestinoId(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(21, 14, 40, 0.8)',
                border: '1px solid #251b45',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {disponibles.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.tipo}) - ${c.precio_por_hora}/h
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
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
            onClick={handleConfirm}
            disabled={disponibles.length === 0}
            style={{
              flex: 1,
              background: disponibles.length === 0 ? '#333' : '#00d2ff',
              border: 'none',
              color: '#000',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: '900',
              cursor: disponibles.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              textTransform: 'uppercase',
            }}
          >
            Confirmar Mover
          </button>
        </div>
      </div>
    </div>
  );
}

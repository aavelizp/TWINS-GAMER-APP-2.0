import { useState } from 'react';

interface ModalPrepagoProps {
  consola: any;
  onClose: () => void;
  onConfirmarTiempo: (minutos: number | null) => void;
}

export default function ModalPrepago({
  consola,
  onClose,
  onConfirmarTiempo,
}: ModalPrepagoProps) {
  const [horasSelec, setHorasSelec] = useState<number>(1);

  if (!consola) return null;

  const precioHora = consola.precio_por_hora || 3;

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
        zIndex: 1000,
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        style={{
          background: '#0d091a',
          border: '1px solid #32255c',
          borderRadius: '16px',
          width: '420px',
          padding: '25px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
          color: '#fff',
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
          <h2 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>
            Prepago - {consola.nombre}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#887bb0',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ✖
          </button>
        </div>

        {/* Cuadrícula Directa de Horas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          {[1, 2, 3, 4].map((h) => (
            <button
              key={h}
              onClick={() => setHorasSelec(h)}
              style={{
                background: horasSelec === h ? '#a126ff' : '#181136',
                border:
                  horasSelec === h ? '1px solid #00f2fe' : '1px solid #32255c',
                color: '#fff',
                padding: '12px 0',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {h}h - ${(h * precioHora).toFixed(2)}
            </button>
          ))}
        </div>

        {/* Input Personalizado */}
        <div
          style={{
            marginBottom: '25px',
            background: '#120d2b',
            padding: '15px',
            borderRadius: '10px',
            border: '1px solid #1f173d',
          }}
        >
          <label
            style={{
              fontSize: '11px',
              color: '#a126ff',
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            PERSONALIZADO (HORAS)
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={horasSelec}
            onChange={(e) => setHorasSelec(Number(e.target.value))}
            style={{
              width: '100%',
              background: '#090617',
              border: '1px solid #32255c',
              color: '#00f2fe',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              boxSizing: 'border-box',
              outline: 'none',
              textAlign: 'center',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              color: '#665399',
              marginTop: '8px',
              display: 'block',
              textAlign: 'center',
            }}
          >
            Ej: 1.5 es una hora y media
          </span>
        </div>

        {/* Botón de Confirmación */}
        <button
          onClick={() => onConfirmarTiempo(Math.round(horasSelec * 60))}
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #ff007f, #a126ff)',
            border: 'none',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(255, 0, 127, 0.4)',
          }}
        >
          Continuar al Pago (${(horasSelec * precioHora).toFixed(2)})
        </button>
      </div>
    </div>
  );
}

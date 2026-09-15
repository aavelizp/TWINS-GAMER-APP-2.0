import { useState, useEffect, useRef } from 'react';

interface ConsolaProps {
  consola: {
    id: number;
    nombre: string;
    tipo: string;
    estado: string;
    tiempo_inicio: string | null;
    minutos_solicitados: number | null;
    precio_por_hora: number;
    prepago: boolean;
    cliente_nombre?: string | null;
    deuda_acumulada?: number;
    tiempo_pausa?: string | null; // Nuevo campo para la pausa
  };
  tasaBs: number;
  rol: string;
  esSugerida?: boolean;
  onActualizarEstado: (
    id: number,
    nuevoEstado: string,
    minutos?: number | null,
    prepago?: boolean,
    clienteNombre?: string | null
  ) => Promise<boolean>;
  onAbrirPrepago: (consola: any, clienteNombre?: string) => void;
  onCobrar: (id: number, usd: string, bs: string) => void;
  onAnular: (id: number) => void;
  onMover: (consola: any) => void;
  onPausar: (consola: any) => void; // Nueva función
}

export default function TarjetaConsola({
  consola,
  tasaBs,
  rol,
  esSugerida,
  onActualizarEstado,
  onAbrirPrepago,
  onCobrar,
  onAnular,
  onMover,
  onPausar,
}: ConsolaProps) {
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);

  // Estados y Referencia para la Alarma
  const [alarmaSilenciada, setAlarmaSilenciada] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cargar el tono de alarma en memoria
    const audio = new Audio(
      'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
    );
    audio.loop = true; // Sonará hasta que la silencies
    audioRef.current = audio;

    return () => {
      // Limpiar memoria si se destruye el componente
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Reloj principal (Ahora entiende el concepto de Pausa)
  useEffect(() => {
    let intervalo: any = null;
    if (
      (consola.estado === 'ocupado' || consola.estado === 'pausado') &&
      consola.tiempo_inicio
    ) {
      intervalo = setInterval(() => {
        const inicio = new Date(consola.tiempo_inicio!).getTime();
        // Magia: Si está pausado, usamos el tiempo de pausa como "ahora" para congelar el reloj
        const ahora =
          consola.estado === 'pausado' && consola.tiempo_pausa
            ? new Date(consola.tiempo_pausa).getTime()
            : new Date().getTime();

        const diffSegundos = Math.floor((ahora - inicio) / 1000);
        setSegundosTranscurridos(diffSegundos > 0 ? diffSegundos : 0);
      }, 1000);
    } else {
      setSegundosTranscurridos(0);
      setAlarmaSilenciada(false); // Resetear silenciador
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    return () => clearInterval(intervalo);
  }, [consola.estado, consola.tiempo_inicio, consola.tiempo_pausa]);

  const formatearTiempo = (totalSegundos: number) => {
    const h = Math.floor(totalSegundos / 3600);
    const m = Math.floor((totalSegundos % 3600) / 60);
    const s = totalSegundos % 60;
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const esTiempoFijo = Boolean(
    consola.minutos_solicitados && consola.minutos_solicitados > 0
  );
  const segundosBase = (consola.minutos_solicitados || 0) * 60;

  const segundosRestantes = segundosBase - segundosTranscurridos;
  const tiempoExpirado = esTiempoFijo && segundosRestantes <= 0;
  const segundosExtra = tiempoExpirado ? Math.abs(segundosRestantes) : 0;
  const minutosExtra = Math.ceil(segundosExtra / 60);

  // DISPARADOR MAESTRO DE LA ALARMA
  useEffect(() => {
    if (consola.estado === 'ocupado' && tiempoExpirado && !alarmaSilenciada) {
      if (audioRef.current) {
        audioRef.current.play().catch((e) => {
          console.log('Audio en espera de interacción', e);
        });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [tiempoExpirado, alarmaSilenciada, consola.estado]);

  const silenciarAlarma = () => {
    setAlarmaSilenciada(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  let deudaUSD = 0;
  if (consola.prepago) {
    deudaUSD = (minutosExtra / 60) * consola.precio_por_hora;
  } else {
    if (esTiempoFijo) {
      const costoBase =
        ((consola.minutos_solicitados || 0) / 60) * consola.precio_por_hora;
      const costoExtra = (minutosExtra / 60) * consola.precio_por_hora;
      deudaUSD = costoBase + costoExtra;
    } else {
      const minutosUsados = Math.ceil(segundosTranscurridos / 60);
      deudaUSD = (minutosUsados / 60) * consola.precio_por_hora;
    }
  }

  const deudaAnterior = Number(consola.deuda_acumulada || 0);
  const totalUSD = deudaUSD + deudaAnterior;

  const totalUSDStr = totalUSD.toFixed(2);
  const totalBSStr = (totalUSD * tasaBs).toFixed(2);

  // Agrupamos ocupado y pausado para que la tarjeta se mantenga encendida visualmente
  const estaOcupada =
    consola.estado === 'ocupado' || consola.estado === 'pausado';
  const estaPausada = consola.estado === 'pausado';
  const esPS5 = consola.tipo === 'PS5';

  const colorBorde = esPS5 ? '#ffb703' : '#7928ca';
  const colorFondoTarjeta = '#150e28';
  const colorBotonSecundario = '#251b45';

  return (
    <div
      style={{
        background: colorFondoTarjeta,
        borderRadius: '16px',
        padding: '20px',
        border: `2px solid ${
          estaOcupada && tiempoExpirado ? '#ff0055' : colorBorde
        }`,
        boxShadow: estaOcupada
          ? `0 0 15px ${tiempoExpirado ? '#ff005540' : colorBorde + '40'}`
          : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
      }}
    >
      {/* HEADER TARJETA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', color: colorBorde }}>
            {esPS5 ? '✨' : '🎮'}
          </span>
          <div>
            <h3
              style={{
                margin: 0,
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold',
              }}
            >
              {consola.nombre}
            </h3>
            <span style={{ color: '#887bb0', fontSize: '12px' }}>
              ${consola.precio_por_hora.toFixed(2)}/h
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '5px',
          }}
        >
          <span
            style={{
              background: !estaOcupada
                ? '#00e676'
                : estaPausada
                ? '#f59e0b'
                : tiempoExpirado
                ? '#ff0055'
                : '#7928ca',
              color: '#fff',
              fontWeight: 'bold',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '10px',
              textTransform: 'uppercase',
            }}
          >
            {!estaOcupada
              ? 'LIBRE'
              : estaPausada
              ? 'PAUSADO'
              : tiempoExpirado
              ? 'TIEMPO EXTRA'
              : 'OCUPADO'}
          </span>
          {!estaOcupada && esSugerida && (
            <span
              style={{
                fontSize: '10px',
                background: '#ffb703',
                color: '#000',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: 'bold',
              }}
            >
              ⭐ Sugerida
            </span>
          )}
        </div>
      </div>

      {/* CLIENTE INFO */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: estaOcupada && consola.cliente_nombre ? '#00e676' : '#887bb0',
          fontSize: '13px',
          borderBottom: '1px solid #251b45',
          paddingBottom: '10px',
          fontWeight: consola.cliente_nombre ? 'bold' : 'normal',
        }}
      >
        👤{' '}
        {estaOcupada
          ? consola.cliente_nombre || 'Cliente sin registrar'
          : 'Disponible'}
      </div>

      {/* PANTALLA DE TIEMPO */}
      <div
        style={{
          background: '#0b0815',
          borderRadius: '12px',
          padding: '15px',
          textAlign: 'center',
          minHeight: '90px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {!estaOcupada ? (
          <span style={{ color: '#55497a', fontSize: '14px' }}>Sin sesión</span>
        ) : (
          <div>
            <span
              style={{
                color: estaPausada ? '#f59e0b' : '#887bb0',
                fontSize: '11px',
                display: 'block',
                marginBottom: '2px',
                fontWeight: estaPausada ? 'bold' : 'normal',
              }}
            >
              {estaPausada
                ? 'Reloj Detenido'
                : esTiempoFijo
                ? tiempoExpirado
                  ? 'Tiempo Extra'
                  : 'Restante'
                : 'Tiempo Libre'}
            </span>
            <div
              className="timer-font"
              style={{
                fontSize: '38px',
                color: estaPausada ? '#f59e0b' : '#fff',
              }}
            >
              {esTiempoFijo
                ? tiempoExpirado
                  ? `+${formatearTiempo(segundosExtra)}`
                  : formatearTiempo(segundosRestantes)
                : formatearTiempo(segundosTranscurridos)}
            </div>

            {deudaAnterior > 0 && (
              <div
                style={{
                  color: '#f59e0b',
                  fontSize: '10px',
                  marginTop: '2px',
                  fontWeight: 'bold',
                }}
              >
                Deuda Anterior: ${deudaAnterior.toFixed(2)}
              </div>
            )}

            <div
              style={{
                marginTop: '2px',
                color: '#ff007f',
                fontWeight: 'bold',
                fontSize: '13px',
              }}
            >
              ${totalUSDStr}{' '}
              <span style={{ color: '#665399' }}>- Bs {totalBSStr}</span>
            </div>
          </div>
        )}
      </div>

      {/* BOTONERA */}
      {!estaOcupada ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: '6px',
            }}
          >
            <button
              onClick={() =>
                onActualizarEstado(consola.id, 'ocupado', null, false)
              }
              style={{
                background: colorBotonSecundario,
                border: 'none',
                color: '#fff',
                padding: '10px 0',
                borderRadius: '8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Libre
            </button>
            <button
              onClick={() =>
                onActualizarEstado(consola.id, 'ocupado', 60, false)
              }
              style={{
                background: '#7928ca',
                border: 'none',
                color: '#fff',
                padding: '10px 0',
                borderRadius: '8px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              1 hora
            </button>
            <button
              onClick={() =>
                onActualizarEstado(consola.id, 'ocupado', 120, false)
              }
              style={{
                background: '#7928ca',
                border: 'none',
                color: '#fff',
                padding: '10px 0',
                borderRadius: '8px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              2 horas
            </button>
            <button
              onClick={() => onAbrirPrepago(consola)}
              style={{
                background: colorBotonSecundario,
                border: 'none',
                color: '#887bb0',
                padding: '10px 0',
                borderRadius: '8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Otra...
            </button>
          </div>
          <button
            onClick={() => onAbrirPrepago(consola)}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #ff007f, #a126ff)',
              border: 'none',
              color: '#fff',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            🔗 Prepago
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tiempoExpirado && !alarmaSilenciada && (
            <button
              onClick={silenciarAlarma}
              style={{
                width: '100%',
                background: '#ff0055',
                border: 'none',
                color: '#fff',
                padding: '10px',
                borderRadius: '8px',
                fontWeight: '900',
                fontSize: '12px',
                cursor: 'pointer',
                marginBottom: '4px',
                animation: 'pulse 1s infinite',
              }}
            >
              🔕 SILENCIAR ALARMA
            </button>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
            }}
          >
            <button
              onClick={() =>
                onActualizarEstado(
                  consola.id,
                  'ocupado',
                  (consola.minutos_solicitados || 0) + 60,
                  consola.prepago,
                  consola.cliente_nombre
                )
              }
              style={{
                background: colorBotonSecundario,
                border: 'none',
                color: '#fff',
                padding: '8px 0',
                borderRadius: '8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              +1 hora
            </button>
            <button
              onClick={() =>
                onActualizarEstado(
                  consola.id,
                  'ocupado',
                  (consola.minutos_solicitados || 0) + 120,
                  consola.prepago,
                  consola.cliente_nombre
                )
              }
              style={{
                background: colorBotonSecundario,
                border: 'none',
                color: '#fff',
                padding: '8px 0',
                borderRadius: '8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              +2 horas
            </button>
            <button
              style={{
                background: colorBotonSecundario,
                border: 'none',
                color: '#887bb0',
                padding: '8px 0',
                borderRadius: '8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              +Otra...
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
            }}
          >
            <button
              style={{
                background: '#0b0815',
                border: '1px solid #251b45',
                color: '#887bb0',
                padding: '8px 0',
                borderRadius: '8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              🍿 Snack
            </button>
            <button
              style={{
                background: '#0b0815',
                border: '1px solid #251b45',
                color: '#887bb0',
                padding: '8px 0',
                borderRadius: '8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              🎮 Ctrl +$1
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
            }}
          >
            <button
              onClick={() => onMover(consola)}
              style={{
                background: '#0b0815',
                border: '1px solid #251b45',
                color: '#887bb0',
                padding: '8px 0',
                borderRadius: '8px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <span>⇄</span> Mover
            </button>

            {/* BOTÓN PAUSAR / REANUDAR */}
            <button
              onClick={() => onPausar(consola)}
              style={{
                background: estaPausada ? 'rgba(0, 230, 118, 0.1)' : '#0b0815',
                border: estaPausada ? '1px solid #00e676' : '1px solid #251b45',
                color: estaPausada ? '#00e676' : '#887bb0',
                padding: '8px 0',
                borderRadius: '8px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              {estaPausada ? (
                <>
                  <span>▶</span> Reanudar
                </>
              ) : (
                <>
                  <span>⏸</span> Pausar
                </>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
            <button
              onClick={() => onCobrar(consola.id, totalUSDStr, totalBSStr)}
              style={{
                flex: 1,
                background: 'linear-gradient(90deg, #9b51e0, #7928ca)',
                border: 'none',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {totalUSD === 0 ? '🔗 LIBERAR' : `🔗 Cobrar $${totalUSDStr}`}
            </button>
            {rol === 'admin' && (
              <button
                onClick={() => onAnular(consola.id)}
                style={{
                  background: '#ff005520',
                  border: '1px solid #ff0055',
                  color: '#ff0055',
                  padding: '0 15px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
                title="Anular Sesión (Sin Cobrar)"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      )}

      {/* ESTILOS COMBINADOS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap');
        .timer-font {
          font-family: 'Montserrat', 'Arial Black', sans-serif;
          font-weight: 900;
          letter-spacing: 2px;
          text-shadow: 0px 4px 15px rgba(255,255,255,0.2);
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 85, 0.7); }
          50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(255, 0, 85, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 85, 0); }
        }
      `}</style>
    </div>
  );
}

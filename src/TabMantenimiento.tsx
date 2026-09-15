import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface TabMantenimientoProps {
  consolas: any[];
  onRecargar: () => void;
}

export default function TabMantenimiento({
  consolas,
  onRecargar,
}: TabMantenimientoProps) {
  const [registros, setRegistros] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Formulario
  const [consolaSeleccionada, setConsolaSeleccionada] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    cargarRegistros();
  }, []);

  const cargarRegistros = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('mantenimiento')
      .select('*')
      .order('creado_en', { ascending: false });
    if (data) setRegistros(data);
    setCargando(false);
  };

  const guardarMantenimiento = async () => {
    if (!consolaSeleccionada || !descripcion.trim()) {
      return alert('Selecciona una consola y escribe el trabajo realizado.');
    }

    const consola = consolas.find(
      (c) => c.id.toString() === consolaSeleccionada
    );
    if (!consola) return;

    const horasAcumuladas = consola.horas_uso_acumuladas || 0;

    // 1. Guardar en el historial
    const { error } = await supabase.from('mantenimiento').insert({
      consola_id: consola.id,
      consola_nombre: consola.nombre,
      descripcion: descripcion,
      horas_en_momento: horasAcumuladas,
    });

    if (error) return alert('Error: ' + error.message);

    // 2. Resetear el cronómetro de suciedad de la consola a 0
    await supabase
      .from('consolas')
      .update({ horas_uso_acumuladas: 0 })
      .eq('id', consola.id);

    setConsolaSeleccionada('');
    setDescripcion('');
    cargarRegistros();
    onRecargar(); // Refresca las consolas en el Dashboard para ver el 0h
  };

  const eliminarRegistro = async (id: number) => {
    if (!window.confirm('¿Eliminar este registro del historial?')) return;
    await supabase.from('mantenimiento').delete().eq('id', id);
    cargarRegistros();
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
          gap: '40px',
          marginBottom: '30px',
          flexWrap: 'wrap',
        }}
      >
        {/* LADO IZQUIERDO: FORMULARIO */}
        <div style={{ flex: 1, minWidth: '350px' }}>
          <h3
            style={{
              color: '#d946ef',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '5px',
            }}
          >
            🔧 Registrar Mantenimiento
          </h3>
          <p
            style={{ color: '#887bb0', fontSize: '11px', marginBottom: '20px' }}
          >
            Registrar un mantenimiento dejará en 0 el contador de suciedad de la
            consola seleccionada.
          </p>

          <div
            style={{
              background: 'rgba(21, 14, 40, 0.4)',
              borderRadius: '16px',
              border: '1px solid rgba(217, 70, 239, 0.3)',
              padding: '20px',
            }}
          >
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  fontSize: '11px',
                  color: '#a092c4',
                  display: 'block',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Consola Atendida
              </label>
              <select
                value={consolaSeleccionada}
                onChange={(e) => setConsolaSeleccionada(e.target.value)}
                style={{
                  width: '100%',
                  background: '#090514',
                  border: '1px solid #3c2a7a',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '8px',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                }}
              >
                <option value="">Seleccione una consola...</option>
                {consolas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} (Suciedad Acumulada:{' '}
                    {Math.floor(c.horas_uso_acumuladas || 0)}h)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label
                style={{
                  fontSize: '11px',
                  color: '#a092c4',
                  display: 'block',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Descripción del Servicio
              </label>
              <input
                type="text"
                placeholder="Ej: Cambio de pasta térmica, limpieza general..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                style={{
                  width: '100%',
                  background: '#090514',
                  border: '1px solid #3c2a7a',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={guardarMantenimiento}
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #d946ef, #9333ea)',
                border: 'none',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: !consolaSeleccionada || !descripcion ? 0.5 : 1,
              }}
              disabled={!consolaSeleccionada || !descripcion}
            >
              Guardar y Resetear Cronómetro
            </button>
          </div>
        </div>

        {/* LADO DERECHO: NIVELES DE SUCIEDAD */}
        <div style={{ flex: 1, minWidth: '350px' }}>
          <h3
            style={{ color: '#d946ef', fontSize: '16px', marginBottom: '20px' }}
          >
            Niveles de Suciedad (Uso desde el último mtto)
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}
          >
            {consolas.map((c) => (
              <div
                key={c.id}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <span
                  style={{
                    color: '#a092c4',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginBottom: '2px',
                  }}
                >
                  {c.nombre}
                </span>
                <span
                  style={{ color: '#fff', fontSize: '28px', fontWeight: '900' }}
                >
                  {Math.floor(c.horas_uso_acumuladas || 0)}h
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HISTORIAL DE SERVICIOS */}
      <div
        style={{
          background: 'rgba(21, 14, 40, 0.4)',
          borderRadius: '16px',
          border: '1px solid #251b45',
          overflow: 'hidden',
        }}
      >
        <h3
          style={{
            padding: '20px',
            margin: 0,
            color: '#fff',
            fontSize: '16px',
            borderBottom: '1px solid #251b45',
          }}
        >
          Historial de Servicios
        </h3>

        <div
          style={{
            display: 'flex',
            padding: '15px 20px',
            background: 'transparent',
            borderBottom: '1px solid #251b45',
            fontSize: '10px',
            color: '#a092c4',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          <div style={{ flex: 1 }}>Fecha</div>
          <div style={{ flex: 1 }}>Consola</div>
          <div style={{ flex: 2 }}>Trabajo Realizado</div>
          <div style={{ flex: 1 }}>Horas en el momento</div>
          <div style={{ width: '60px', textAlign: 'right' }}>Acción</div>
        </div>

        {cargando ? (
          <div
            style={{ textAlign: 'center', color: '#887bb0', padding: '40px' }}
          >
            Cargando registros...
          </div>
        ) : registros.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#55497a',
              padding: '40px',
              fontSize: '13px',
            }}
          >
            No hay registros de mantenimiento guardados.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {registros.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px 20px',
                  borderBottom: '1px solid rgba(37, 27, 69, 0.3)',
                }}
              >
                <div style={{ flex: 1, color: '#a092c4', fontSize: '12px' }}>
                  {new Date(r.creado_en).toLocaleDateString('es-VE')}
                </div>
                <div
                  style={{
                    flex: 1,
                    color: '#00d2ff',
                    fontWeight: 'bold',
                    fontSize: '13px',
                  }}
                >
                  {r.consola_nombre}
                </div>
                <div style={{ flex: 2, color: '#fff', fontSize: '13px' }}>
                  {r.descripcion}
                </div>
                <div
                  style={{
                    flex: 1,
                    color: '#d946ef',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  {Math.floor(r.horas_en_momento)}h
                </div>
                <div style={{ width: '60px', textAlign: 'right' }}>
                  <button
                    onClick={() => eliminarRegistro(r.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '14px',
                      opacity: 0.7,
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function ModalAsignarCliente({ onClose, onConfirm }: any) {
  const [modo, setModo] = useState<'existente' | 'nuevo'>('existente');
  const [clientesDb, setClientesDb] = useState<any[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoAlias, setNuevoAlias] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState('');

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });
    if (data) setClientesDb(data);
  };

  const procesar = async () => {
    if (modo === 'existente') {
      if (!clienteSeleccionadoId) {
        onConfirm(null, 'Consumidor Final'); // Invitado anónimo
        return;
      }
      const c = clientesDb.find(
        (x) => x.id.toString() === clienteSeleccionadoId
      );
      onConfirm(c.id, c.alias ? `${c.alias} (${c.nombre})` : c.nombre);
    } else {
      if (!nuevoNombre.trim()) return alert('El nombre es obligatorio.');
      const { data: newClient, error } = await supabase
        .from('clientes')
        .insert({
          nombre: nuevoNombre,
          alias: nuevoAlias,
          telefono: nuevoTelefono,
          horas_jugadas: 0,
          deuda_usd: 0,
        })
        .select()
        .single();
      if (error) return alert('Error al registrar: ' + error.message);
      onConfirm(
        newClient.id,
        newClient.alias
          ? `${newClient.alias} (${newClient.nombre})`
          : newClient.nombre
      );
    }
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
          width: '400px',
          border: '1px solid #00d2ff',
          boxShadow: '0 25px 50px rgba(0, 210, 255, 0.2)',
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
          <h3
            style={{
              margin: 0,
              color: '#00d2ff',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            👤 ¿Quién va a jugar?
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#887bb0',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setModo('existente')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              background: modo === 'existente' ? '#1a365d' : 'transparent',
              color: modo === 'existente' ? '#00d2ff' : '#887bb0',
            }}
          >
            Cliente Registrado
          </button>
          <button
            onClick={() => setModo('nuevo')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              background: modo === 'nuevo' ? '#1a365d' : 'transparent',
              color: modo === 'nuevo' ? '#00d2ff' : '#887bb0',
            }}
          >
            Nuevo Cliente
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {modo === 'existente' ? (
            <div>
              <label
                style={{
                  fontSize: '11px',
                  color: '#887bb0',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Buscar en Club Gamer
              </label>
              <select
                value={clienteSeleccionadoId}
                onChange={(e) => setClienteSeleccionadoId(e.target.value)}
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
                <option value="">Consumidor Final (Invitado)</option>
                {clientesDb.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.alias ? `${c.alias} (${c.nombre})` : c.nombre}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
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
                  placeholder="Ej: Adrian Veliz"
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
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                }}
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
                    Alias (GamerTag)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Adry"
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
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="Opcional"
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
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
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
              onClick={procesar}
              style={{
                flex: 1,
                background: '#00d2ff',
                border: 'none',
                color: '#000',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '900',
                cursor: 'pointer',
                fontSize: '12px',
                textTransform: 'uppercase',
              }}
            >
              Continuar ▷
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

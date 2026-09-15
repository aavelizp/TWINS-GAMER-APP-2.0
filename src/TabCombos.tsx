import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function TabCombos() {
  const [combos, setCombos] = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]); // Conexión a la BD real
  const [cargando, setCargando] = useState(true);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [horas, setHoras] = useState('');

  const [productosIncluidos, setProductosIncluidos] = useState<
    { nombre: string; cantidad: number }[]
  >([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState('1');

  useEffect(() => {
    cargarCombos();
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    const { data } = await supabase
      .from('inventario')
      .select('*')
      .order('nombre');
    if (data) setInventario(data);
  };

  const cargarCombos = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('combos')
      .select('*')
      .order('precio_usd', { ascending: false });
    if (data) setCombos(data);
    setCargando(false);
  };

  const agregarProductoAlCombo = () => {
    if (!productoSeleccionado) return;
    const cantidad = Number(cantidadProducto);
    if (cantidad <= 0) return;

    const existe = productosIncluidos.find(
      (p) => p.nombre === productoSeleccionado
    );
    if (existe) {
      setProductosIncluidos(
        productosIncluidos.map((p) =>
          p.nombre === productoSeleccionado
            ? { ...p, cantidad: p.cantidad + cantidad }
            : p
        )
      );
    } else {
      setProductosIncluidos([
        ...productosIncluidos,
        { nombre: productoSeleccionado, cantidad },
      ]);
    }
    setProductoSeleccionado('');
    setCantidadProducto('1');
  };

  const quitarProductoDelCombo = (nombreProducto: string) => {
    setProductosIncluidos(
      productosIncluidos.filter((p) => p.nombre !== nombreProducto)
    );
  };

  const guardarCombo = async () => {
    if (!nombre.trim() || Number(precio) <= 0)
      return alert('El nombre y el precio son obligatorios.');

    const { error } = await supabase.from('combos').insert({
      nombre,
      precio_usd: Number(precio),
      horas_incluidas: Number(horas) || 0,
      productos: productosIncluidos,
    });

    if (error) return alert('Error al guardar combo: ' + error.message);

    setNombre('');
    setPrecio('');
    setHoras('');
    setProductosIncluidos([]);
    cargarCombos();
  };

  const eliminarCombo = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este combo?')) return;
    await supabase.from('combos').delete().eq('id', id);
    cargarCombos();
  };

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          background: 'rgba(21, 14, 40, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(161, 38, 255, 0.2)',
          padding: '25px',
          marginBottom: '30px',
        }}
      >
        <h3
          style={{ color: '#ff2a85', margin: '0 0 20px 0', fontSize: '18px' }}
        >
          Crear Nuevo Combo
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                color: '#887bb0',
                fontSize: '12px',
                marginBottom: '8px',
              }}
            >
              Nombre del Combo
            </label>
            <input
              type="text"
              placeholder="Ej: Promo Nocturna"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(9, 5, 20, 0.5)',
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
                display: 'block',
                color: '#887bb0',
                fontSize: '12px',
                marginBottom: '8px',
              }}
            >
              Precio Total ($)
            </label>
            <input
              type="number"
              placeholder="5.00"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(9, 5, 20, 0.5)',
                border: '1px solid #251b45',
                color: '#00d2ff',
                fontWeight: 'bold',
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
                display: 'block',
                color: '#887bb0',
                fontSize: '12px',
                marginBottom: '8px',
              }}
            >
              Horas de Juego Incluidas
            </label>
            <input
              type="number"
              placeholder="2"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(9, 5, 20, 0.5)',
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

        <div
          style={{
            borderTop: '1px solid #251b45',
            paddingTop: '20px',
            marginBottom: '20px',
          }}
        >
          <label
            style={{
              display: 'block',
              color: '#887bb0',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px',
            }}
          >
            Productos Incluidos en el Combo
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(9, 5, 20, 0.5)',
                border: '1px solid #251b45',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Seleccione producto del inventario...</option>
              {/* AQUÍ SE CONECTA A LA BASE DE DATOS */}
              {inventario.map((p) => (
                <option key={p.id} value={p.nombre}>
                  {p.nombre} (Stock: {p.stock})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={cantidadProducto}
              onChange={(e) => setCantidadProducto(e.target.value)}
              style={{
                width: '60px',
                background: 'rgba(9, 5, 20, 0.5)',
                border: '1px solid #251b45',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                outline: 'none',
                textAlign: 'center',
              }}
            />
            <button
              onClick={agregarProductoAlCombo}
              style={{
                background: '#1c1335',
                border: '1px solid #3c2a7a',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              Añadir al Combo
            </button>
          </div>

          {productosIncluidos.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginTop: '15px',
              }}
            >
              {productosIncluidos.map((p) => (
                <div
                  key={p.nombre}
                  style={{
                    background: 'rgba(255, 42, 133, 0.1)',
                    border: '1px solid rgba(255, 42, 133, 0.3)',
                    color: '#ff2a85',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {p.cantidad}x {p.nombre}
                  <button
                    onClick={() => quitarProductoDelCombo(p.nombre)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ff2a85',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 'bold',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={guardarCombo}
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #9b51e0, #ff2a85)',
            border: 'none',
            color: '#fff',
            padding: '14px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>💾</span> Guardar Combo Definitivo
        </button>
      </div>

      <div
        style={{
          background: 'rgba(21, 14, 40, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(60, 42, 122, 0.5)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            padding: '15px 20px',
            background: 'rgba(13, 9, 26, 0.8)',
            borderBottom: '1px solid #251b45',
            fontSize: '11px',
            color: '#887bb0',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          <div style={{ flex: 1.5 }}>Combo</div>
          <div style={{ flex: 1 }}>Precio</div>
          <div style={{ flex: 2 }}>Incluye</div>
          <div style={{ width: '80px', textAlign: 'center' }}>Acciones</div>
        </div>

        {cargando ? (
          <div
            style={{ padding: '30px', textAlign: 'center', color: '#887bb0' }}
          >
            Cargando combos...
          </div>
        ) : combos.length === 0 ? (
          <div
            style={{ padding: '30px', textAlign: 'center', color: '#887bb0' }}
          >
            No hay combos creados aún.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {combos.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px 20px',
                  borderBottom: '1px solid rgba(37, 27, 69, 0.3)',
                }}
              >
                <div
                  style={{ flex: 1.5, color: '#ff2a85', fontWeight: 'bold' }}
                >
                  {c.nombre}
                </div>
                <div
                  style={{
                    flex: 1,
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '16px',
                  }}
                >
                  ${Number(c.precio_usd).toFixed(2)}
                </div>
                <div
                  style={{
                    flex: 2,
                    color: '#a092c4',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {Number(c.horas_incluidas) > 0 && (
                    <div>🎮 {c.horas_incluidas} Horas de Juego</div>
                  )}
                  {c.productos &&
                    c.productos.map((p: any, i: number) => (
                      <div key={i}>
                        📦 {p.cantidad}x {p.nombre}
                      </div>
                    ))}
                </div>
                <div style={{ width: '80px', textAlign: 'center' }}>
                  <button
                    onClick={() => eliminarCombo(c.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '16px',
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

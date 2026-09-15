import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function TabInventario() {
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'lista' | 'nuevo'>('lista');
  const [busqueda, setBusqueda] = useState('');

  // Formulario
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Snacks');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('inventario')
      .select('*')
      .order('nombre', { ascending: true });
    if (data) setProductos(data);
    setCargando(false);
  };

  const guardarProducto = async () => {
    if (!nombre.trim() || Number(precio) <= 0)
      return alert('Nombre y precio son obligatorios.');

    const { error } = await supabase.from('inventario').insert({
      nombre,
      categoria,
      precio_usd: Number(precio),
      stock: Number(stock) || 0,
    });

    if (error) return alert('Error al guardar: ' + error.message);

    setNombre('');
    setPrecio('');
    setStock('');
    setCategoria('Snacks');
    setVista('lista');
    cargarInventario();
  };

  const actualizarStockRapido = async (
    id: number,
    stockActual: number,
    cantidad: number
  ) => {
    const nuevoStock = stockActual + cantidad;
    if (nuevoStock < 0) return;

    setProductos(
      productos.map((p) => (p.id === id ? { ...p, stock: nuevoStock } : p))
    );
    await supabase
      .from('inventario')
      .update({ stock: nuevoStock })
      .eq('id', id);
  };

  const eliminarProducto = async (id: number) => {
    if (
      !window.confirm(
        '¿Seguro que deseas eliminar este producto del inventario?'
      )
    )
      return;
    await supabase.from('inventario').delete().eq('id', id);
    cargarInventario();
  };

  const getIconoCategoria = (cat: string) => {
    if (cat === 'Bebidas') return '🥤';
    if (cat === 'Comida Rápida') return '🍔';
    if (cat === 'Dulces') return '🍫';
    if (cat === 'Accesorios') return '🎮';
    if (cat === 'Otros') return '📦';
    return '🍟';
  };

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      {vista === 'lista' && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '24px',
                  color: '#00e676',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textShadow: '0 0 10px rgba(0, 230, 118, 0.5)',
                }}
              >
                📦 Inventario Maestro
              </h2>
              <p
                style={{
                  margin: '5px 0 0 0',
                  color: '#887bb0',
                  fontSize: '13px',
                }}
              >
                Control de stock y precios de Venta Rápida.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ position: 'relative', width: '250px' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: 0.5,
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(20, 15, 40, 0.6)',
                    border: '1px solid #3c2a7a',
                    color: '#fff',
                    padding: '10px 10px 10px 35px',
                    borderRadius: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                onClick={() => setVista('nuevo')}
                style={{
                  background: 'linear-gradient(90deg, #00e676, #00d2ff)',
                  border: 'none',
                  color: '#000',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)',
                }}
              >
                + Nuevo Producto
              </button>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(21, 14, 40, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(0, 230, 118, 0.2)',
              padding: '25px',
            }}
          >
            <div
              style={{
                display: 'flex',
                padding: '10px 20px',
                background: 'rgba(13, 9, 26, 0.8)',
                borderBottom: '1px solid rgba(0, 230, 118, 0.2)',
                fontSize: '11px',
                color: '#887bb0',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderRadius: '8px 8px 0 0',
              }}
            >
              <div style={{ flex: 2 }}>Producto</div>
              <div style={{ flex: 1.5 }}>Categoría</div>
              <div style={{ flex: 1 }}>Precio ($)</div>
              <div style={{ flex: 1.5, textAlign: 'center' }}>
                Control de Stock
              </div>
              <div style={{ width: '40px', textAlign: 'right' }}></div>
            </div>

            {cargando ? (
              <div
                style={{
                  textAlign: 'center',
                  color: '#887bb0',
                  padding: '40px',
                }}
              >
                Cargando inventario...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {productosFiltrados.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '15px 20px',
                      borderBottom: '1px solid rgba(37, 27, 69, 0.3)',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255,255,255,0.02)')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <div
                      style={{
                        flex: 2,
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>
                        {getIconoCategoria(p.categoria)}
                      </span>{' '}
                      {p.nombre}
                    </div>
                    <div
                      style={{ flex: 1.5, color: '#a092c4', fontSize: '12px' }}
                    >
                      <span
                        style={{
                          background: 'rgba(37, 27, 69, 0.5)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          border: '1px solid #3c2a7a',
                        }}
                      >
                        {p.categoria}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        color: '#00e676',
                        fontWeight: '900',
                        fontSize: '16px',
                      }}
                    >
                      ${Number(p.precio_usd).toFixed(2)}
                    </div>
                    <div
                      style={{
                        flex: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                      }}
                    >
                      <button
                        onClick={() => actualizarStockRapido(p.id, p.stock, -1)}
                        style={{
                          background: '#251b45',
                          border: 'none',
                          color: '#fff',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        -
                      </button>
                      <span
                        style={{
                          width: '30px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          color: p.stock <= 5 ? '#ef4444' : '#fff',
                        }}
                      >
                        {p.stock}
                      </span>
                      <button
                        onClick={() => actualizarStockRapido(p.id, p.stock, 1)}
                        style={{
                          background: '#3c2a7a',
                          border: 'none',
                          color: '#fff',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ width: '40px', textAlign: 'right' }}>
                      <button
                        onClick={() => eliminarProducto(p.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '14px',
                          opacity: 0.7,
                        }}
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                {productosFiltrados.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#887bb0',
                      padding: '40px',
                    }}
                  >
                    No se encontraron productos.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {vista === 'nuevo' && (
        <div
          style={{
            maxWidth: '450px',
            margin: '40px auto',
            background: 'rgba(21, 14, 40, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(0, 230, 118, 0.3)',
            padding: '40px 30px',
            boxShadow: '0 0 30px rgba(0, 230, 118, 0.15)',
          }}
        >
          <h3
            style={{
              color: '#fff',
              textAlign: 'center',
              margin: '0 0 25px 0',
              fontSize: '20px',
            }}
          >
            📦 Agregar Producto
          </h3>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#887bb0',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Nombre del Producto *
              </label>
              <input
                type="text"
                placeholder="Ej: Control PS4 Original"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(9, 5, 20, 0.5)',
                  border: '1px solid rgba(0, 230, 118, 0.3)',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    color: '#887bb0',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(9, 5, 20, 0.5)',
                    border: '1px solid #3c2a7a',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: '12px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Snacks">🍟 Snacks</option>
                  <option value="Bebidas">🥤 Bebidas</option>
                  <option value="Comida Rápida">🍔 Comida</option>
                  <option value="Dulces">🍫 Dulces</option>
                  <option value="Accesorios">
                    🎮 Accesorios / Electrónica
                  </option>
                  <option value="Otros">📦 Otros</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    color: '#887bb0',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Stock Inicial
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(9, 5, 20, 0.5)',
                    border: '1px solid #3c2a7a',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: '12px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#887bb0',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Precio de Venta (USD) *
              </label>
              <input
                type="number"
                placeholder="Ej: 1.50"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(9, 5, 20, 0.5)',
                  border: '1px solid rgba(0, 230, 118, 0.3)',
                  color: '#00e676',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  padding: '14px',
                  borderRadius: '12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button
                onClick={() => setVista('lista')}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid #3c2a7a',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarProducto}
                style={{
                  flex: 1,
                  background: 'linear-gradient(90deg, #00e676, #00a86b)',
                  border: 'none',
                  color: '#000',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)',
                }}
              >
                Guardar Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

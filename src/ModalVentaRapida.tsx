import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function ModalVentaRapida({ tasa, onClose, onConfirm }: any) {
  const [productos, setProductos] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    const { data } = await supabase
      .from('inventario')
      .select('*')
      .gt('stock', 0)
      .order('nombre');
    if (data) setProductos(data);
  };

  const agregarAlCarrito = (prod: any) => {
    const item = carrito.find((i) => i.id === prod.id);
    if (item) {
      if (item.cantidad >= prod.stock)
        return alert(`Solo quedan ${prod.stock} disponibles de ${prod.nombre}`);
      setCarrito(
        carrito.map((i) =>
          i.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      );
    } else {
      setCarrito([...carrito, { ...prod, cantidad: 1 }]);
    }
  };

  const quitarDelCarrito = (id: number) => {
    const item = carrito.find((i) => i.id === id);
    if (item.cantidad > 1) {
      setCarrito(
        carrito.map((i) =>
          i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i
        )
      );
    } else {
      setCarrito(carrito.filter((i) => i.id !== id));
    }
  };

  const getIconoCategoria = (cat: string) => {
    if (cat === 'Bebidas') return '🥤';
    if (cat === 'Comida Rápida') return '🍔';
    if (cat === 'Dulces') return '🍫';
    if (cat === 'Accesorios') return '🎮';
    if (cat === 'Otros') return '📦';
    return '🍟';
  };

  const totalUSD = carrito.reduce(
    (acc, item) => acc + item.precio_usd * item.cantidad,
    0
  );
  const totalBS = totalUSD * tasa;

  const handleConfirmar = () => {
    if (carrito.length === 0)
      return alert('El carrito está vacío. Agrega productos para cobrar.');
    // Pasamos el carrito al Dashboard para que abra el Modal Principal de Cobro
    onConfirm(carrito, totalUSD, totalBS);
  };

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

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
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'rgba(20, 15, 40, 0.95)',
          border: '1px solid #00e676',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '900px',
          height: '80vh',
          display: 'flex',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0,230,118,0.2)',
        }}
      >
        {/* ZONA IZQUIERDA: CATÁLOGO */}
        <div
          style={{
            flex: 2,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #251b45',
          }}
        >
          <h2
            style={{
              margin: '0 0 15px 0',
              color: '#00e676',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            🛒 Venta Rápida (Snacks & Extras)
          </h2>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              background: '#090514',
              border: '1px solid #251b45',
              color: '#fff',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              outline: 'none',
            }}
          />

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '15px',
              paddingRight: '10px',
            }}
          >
            {productosFiltrados.map((p) => (
              <div
                key={p.id}
                onClick={() => agregarAlCarrito(p)}
                style={{
                  background: '#150e28',
                  border: '1px solid #3c2a7a',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.1s, background 0.2s',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = '#1c1335')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = '#150e28')
                }
                onMouseDown={(e) =>
                  (e.currentTarget.style.transform = 'scale(0.95)')
                }
                onMouseUp={(e) =>
                  (e.currentTarget.style.transform = 'scale(1)')
                }
              >
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                  {getIconoCategoria(p.categoria)}
                </div>
                <div
                  style={{
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                    lineHeight: '1.2',
                  }}
                >
                  {p.nombre}
                </div>
                <div
                  style={{
                    color: '#00e676',
                    fontSize: '15px',
                    fontWeight: '900',
                  }}
                >
                  ${Number(p.precio_usd).toFixed(2)}
                </div>
                <div
                  style={{
                    color: '#887bb0',
                    fontSize: '10px',
                    marginTop: '5px',
                  }}
                >
                  Stock: {p.stock}
                </div>
              </div>
            ))}
            {productosFiltrados.length === 0 && (
              <div
                style={{
                  color: '#887bb0',
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  marginTop: '20px',
                }}
              >
                No hay productos en inventario.
              </div>
            )}
          </div>
        </div>

        {/* ZONA DERECHA: CARRITO */}
        <div
          style={{
            flex: 1,
            background: '#090514',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3
            style={{
              margin: '0 0 15px 0',
              color: '#fff',
              borderBottom: '1px solid #251b45',
              paddingBottom: '10px',
            }}
          >
            Tu Orden
          </h3>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {carrito.length === 0 ? (
              <div
                style={{
                  color: '#55497a',
                  textAlign: 'center',
                  marginTop: '50px',
                  fontSize: '14px',
                }}
              >
                Selecciona productos de la izquierda.
              </div>
            ) : (
              carrito.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#150e28',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #251b45',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {item.nombre}
                    </div>
                    <div style={{ color: '#00e676', fontSize: '12px' }}>
                      ${Number(item.precio_usd).toFixed(2)}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <button
                      onClick={() => quitarDelCarrito(item.id)}
                      style={{
                        background: '#251b45',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        width: '20px',
                        textAlign: 'center',
                      }}
                    >
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => agregarAlCarrito(item)}
                      style={{
                        background: '#3c2a7a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              borderTop: '1px solid #251b45',
              paddingTop: '15px',
              marginTop: '15px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '5px',
              }}
            >
              <span style={{ color: '#887bb0' }}>Total USD:</span>
              <strong style={{ color: '#00e676', fontSize: '20px' }}>
                ${totalUSD.toFixed(2)}
              </strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '15px',
              }}
            >
              <span style={{ color: '#887bb0' }}>Total Bs:</span>
              <strong style={{ color: '#fff', fontSize: '16px' }}>
                Bs {totalBS.toFixed(2)}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                style={{
                  flex: 2,
                  background: 'linear-gradient(90deg, #00e676, #00a86b)',
                  border: 'none',
                  color: '#000',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Proceder al Pago
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

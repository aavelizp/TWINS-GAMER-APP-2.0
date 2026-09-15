import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export default function ModalCierreCaja({ datos, onClose, onConfirm }: any) {
  const reciboRef = useRef<HTMLDivElement>(null);

  if (!datos) return null;

  const descargarImagen = async () => {
    if (!reciboRef.current) return;
    try {
      // Configuramos html2canvas para que capture la altura real y total del elemento
      const canvas = await html2canvas(reciboRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY, // Esto ayuda a evitar recortes en la parte superior
        windowWidth: reciboRef.current.scrollWidth,
        windowHeight: reciboRef.current.scrollHeight,
      });
      const dataUrl = canvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.download = `Cierre_Caja_${datos.fecha.replace(/\//g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error: any) {
      alert('⚠️ Error al generar la imagen. Detalle: ' + error.message);
    }
  };

  const descargarExcel = () => {
    try {
      const resumen = [
        { Concepto: 'Fecha de Cierre', Valor: datos.fecha },
        { Concepto: 'Hora de Cierre', Valor: datos.hora },
        { Concepto: 'Ventas Consolas (USD)', Valor: datos.ventasConsolasUSD },
        {
          Concepto: 'Ventas Snacks y Extras (USD)',
          Valor: datos.ventasSnacksUSD,
        },
        { Concepto: 'Dinero Fiado Hoy (USD)', Valor: datos.fiadoHoyUSD },
        { Concepto: 'Gastos Operativos (USD)', Valor: datos.gastosTotalesUSD },
        { Concepto: 'VENTAS NETAS TOTALES (USD)', Valor: datos.ventasNetasUSD },
        { Concepto: '---', Valor: '---' },
        {
          Concepto: 'Efectivo Esperado Gaveta ($)',
          Valor: datos.ingresoEfectivoUSD,
        },
        {
          Concepto: 'Efectivo Esperado Gaveta (Bs)',
          Valor: datos.ingresoEfectivoBs,
        },
        {
          Concepto: 'Pago Móvil / Banco Esperado (Bs)',
          Valor: datos.ingresoPagoMovil,
        },
      ];

      const ventas = (datos.ventasDetalle || []).map((v: any) => ({
        Hora: v.creado_en
          ? new Date(v.creado_en).toLocaleTimeString('es-VE')
          : 'N/A',
        Tipo: v.consola_id
          ? 'Consola'
          : v.descripcion
          ? 'Inscripción/Otros'
          : 'Snack',
        Detalle: v.consolas?.nombre || v.descripcion || 'Venta Rápida',
        Metodo_Pago: v.metodo_pago
          ? v.metodo_pago.replace('_', ' ').toUpperCase() +
            (v.banco ? ` (${v.banco})` : '')
          : 'N/A',
        Monto_USD: v.monto_usd || 0,
        Monto_Bs: v.monto_bs || 0,
      }));

      const gastos = (datos.gastosDetalle || []).map((g: any) => ({
        Hora: g.creado_en
          ? new Date(g.creado_en).toLocaleTimeString('es-VE')
          : 'N/A',
        Categoria: g.categoria || 'General',
        Descripcion: g.descripcion || 'N/A',
        Metodo_Pago: g.metodo_pago
          ? g.metodo_pago.replace('_', ' ').toUpperCase()
          : 'N/A',
        Monto_USD: g.monto_usd || 0,
        Monto_Bs: g.monto_bs || 0,
      }));

      const inventarioExcel = (datos.inventarioDetalle || []).map((i: any) => ({
        Producto: i.nombre || 'N/A',
        Categoria: i.categoria || 'N/A',
        Precio_USD: i.precio_usd || 0,
        Stock_Actual: i.stock || 0,
      }));

      const fiadosExcel = (datos.fiadosDetalle || []).map((f: any) => ({
        Cliente: f.nombre || 'N/A',
        Alias: f.alias || 'N/A',
        Deuda_Pendiente_USD: f.deuda_usd || 0,
      }));

      const libro = XLSX.utils.book_new();
      const hojaResumen = XLSX.utils.json_to_sheet(resumen);
      const hojaVentas = XLSX.utils.json_to_sheet(ventas);
      const hojaGastos = XLSX.utils.json_to_sheet(gastos);
      const hojaInventario = XLSX.utils.json_to_sheet(inventarioExcel);
      const hojaFiados = XLSX.utils.json_to_sheet(fiadosExcel);

      hojaVentas['!cols'] = [
        { wch: 12 },
        { wch: 15 },
        { wch: 30 },
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
      ];
      hojaInventario['!cols'] = [
        { wch: 30 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
      ];
      hojaFiados['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }];

      XLSX.utils.book_append_sheet(libro, hojaResumen, 'Resumen Z');
      XLSX.utils.book_append_sheet(libro, hojaVentas, 'Ventas Detalladas');
      XLSX.utils.book_append_sheet(libro, hojaGastos, 'Gastos del Día');
      XLSX.utils.book_append_sheet(libro, hojaInventario, 'Stock Inventario');
      XLSX.utils.book_append_sheet(libro, hojaFiados, 'Deudas Fiados');

      XLSX.writeFile(libro, `Cierre_Z_${datos.fecha.replace(/\//g, '-')}.xlsx`);
    } catch (error: any) {
      alert(
        '⚠️ Error al generar el Excel. Intenta abrir la App en una pestaña nueva. Detalle: ' +
          error.message
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
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '420px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#1f2937',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Caja exterior: Esta hace el scroll para no deformar la ventana */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* Caja interior: Esta tiene el contenido real 100% estirado, aquí apuntamos la cámara */}
          <div
            ref={reciboRef}
            style={{ padding: '30px', background: '#ffffff' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2
                style={{
                  margin: '0 0 5px 0',
                  fontSize: '22px',
                  fontWeight: '900',
                  letterSpacing: '1px',
                  color: '#111827',
                }}
              >
                CIERRE DE CAJA
              </h2>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                Fecha Contable: {datos.fecha} <br />
                (Emitido: {datos.hora}) - Tasa: Bs {datos.tasa}/$
              </div>
              <hr
                style={{
                  border: 'none',
                  borderTop: '1px dashed #d1d5db',
                  margin: '15px 0 0 0',
                }}
              />
            </div>

            <div
              style={{
                background: '#eff6ff',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '15px',
                border: '1px solid #bfdbfe',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: '#6b7280',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  marginBottom: '5px',
                }}
              >
                TOTAL FACTURADO HOY
              </div>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  color: '#2563eb',
                  lineHeight: '1',
                }}
              >
                ${datos.ventasBrutasUSD}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#16a34a',
                  fontWeight: 'bold',
                  marginTop: '5px',
                }}
              >
                Bs {(Number(datos.ventasBrutasUSD) * datos.tasa).toFixed(2)}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '25px',
              }}
            >
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginBottom: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  🎮 Horas de Juego
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#111827',
                  }}
                >
                  ${datos.ventasConsolasUSD}
                </div>
              </div>
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginBottom: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  🍿 Snacks/Otros
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#111827',
                  }}
                >
                  ${datos.ventasSnacksUSD}
                </div>
              </div>
            </div>

            <h3
              style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#374151',
                margin: '0 0 10px 0',
                textAlign: 'center',
                letterSpacing: '1px',
              }}
            >
              ARQUEO POR MÉTODO DE PAGO
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    color: '#15803d',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  💵 Efectivo ($)
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#16a34a',
                  }}
                >
                  ${datos.ingresoEfectivoUSD}
                </div>
              </div>

              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    color: '#1d4ed8',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  📱 Pago Móvil (Bs)
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#2563eb',
                  }}
                >
                  Bs {datos.ingresoPagoMovil}
                </div>
              </div>

              <div
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    color: '#c2410c',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  💵 Efectivo (Bs)
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#ea580c',
                  }}
                >
                  Bs {datos.ingresoEfectivoBs}
                </div>
              </div>

              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    color: '#b45309',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  🤝 Fiado Hoy
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#d97706',
                  }}
                >
                  ${datos.fiadoHoyUSD}
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: '#15803d',
                  fontWeight: 'bold',
                  marginBottom: '4px',
                }}
              >
                🔄 Recuperado (Deudas Pagadas)
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#16a34a',
                }}
              >
                ${datos.recuperadoUSD}
              </div>
            </div>

            <hr
              style={{
                border: 'none',
                borderTop: '1px dashed #d1d5db',
                margin: '20px 0',
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  color: '#ef4444',
                  fontWeight: 'bold',
                }}
              >
                📉 Gastos Operativos
              </span>
              <span
                style={{
                  fontSize: '16px',
                  color: '#ef4444',
                  fontWeight: 'bold',
                }}
              >
                - ${datos.gastosTotalesUSD}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#111827',
                padding: '15px',
                borderRadius: '8px',
                color: '#fff',
                marginTop: '15px',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                }}
              >
                VENTAS NETAS
              </span>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: '900',
                  color: '#00e676',
                }}
              >
                ${datos.ventasNetasUSD}
              </span>
            </div>
          </div>
        </div>

        {/* Footer fijo con botones */}
        <div
          style={{
            padding: '20px 30px',
            background: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <button
            onClick={descargarImagen}
            style={{
              width: '100%',
              padding: '12px',
              background: '#2563eb',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '10px',
              transition: 'background 0.2s',
            }}
          >
            📸 Descargar Imagen del Cierre
          </button>

          <button
            onClick={descargarExcel}
            style={{
              width: '100%',
              padding: '12px',
              background: '#107c41',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '10px',
              transition: 'background 0.2s',
            }}
          >
            📄 Descargar Reporte Excel Completo
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: 'transparent',
                border: '1px solid #d1d5db',
                color: '#4b5563',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Cerrar Visor
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '12px',
                background: '#4f46e5',
                border: 'none',
                color: '#fff',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Confirmar Cierre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

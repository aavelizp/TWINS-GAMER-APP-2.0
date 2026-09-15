import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'react-qr-code';

interface ModalReciboProps {
  datos: any;
  onClose: () => void;
}

export default function ModalRecibo({ datos, onClose }: ModalReciboProps) {
  const reciboRef = useRef<HTMLDivElement>(null);
  const [mostrarWa, setMostrarWa] = useState(false);
  const [numeroWa, setNumeroWa] = useState('');

  if (!datos) return null;

  const descargarPNG = async () => {
    if (!reciboRef.current) return;
    try {
      const canvas = await html2canvas(reciboRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Recibo_TwinsGamer_${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error('Error al generar PNG', error);
    }
  };

  const formatearMetodo = (metodo: string) => {
    if (metodo === 'efectivo_usd') return 'Efectivo ($)';
    if (metodo === 'pago_movil') return 'Pago M\u00F3vil (Bs)';
    if (metodo === 'efectivo_bs') return 'Efectivo (Bs)';
    if (metodo === 'mixto') return 'Pago Mixto';
    return metodo;
  };

  const confirmarEnvioWhatsApp = async () => {
    if (!numeroWa || numeroWa.trim() === '') return;

    let numLimpio = numeroWa.replace(/\D/g, '');
    if (numLimpio.startsWith('0')) {
      numLimpio = '58' + numLimpio.substring(1);
    } else if (!numLimpio.startsWith('58') && numLimpio.length === 10) {
      numLimpio = '58' + numLimpio;
    }

    const cliente = datos.clienteNombre || 'Consumidor Final';

    // CÓDIGOS UNIVERSALES PUROS (A prueba de cualquier error de codificación)
    const eControl = '\uD83C\uDFAE';
    const eRecibo = '\uD83E\uDDFE';
    const eCal = '\uD83D\uDDD3\uFE0F';
    const eUser = '\uD83D\uDC64';
    const eJoy = '\uD83D\uDD79\uFE0F';
    const eCam = '\uD83D\uDCF8';
    const punto = '\u2022';
    const adm = '\u00A1';
    const iAcento = '\u00ED';

    const mensajeTexto =
      `${eControl} *TWINS GAMER* ${eControl}\n` +
      `ZONA GAMER ${punto} GUACARA\n\n` +
      `${eRecibo} *RECIBO DE PAGO*\n` +
      `${eCal} ` +
      datos.fecha +
      `\n` +
      `${eUser} Cliente: ` +
      cliente +
      `\n\n` +
      `--------------------------------\n` +
      `${adm}Gracias por jugar con nosotros! ${eJoy}\n\n` +
      `${eCam} *S${iAcento}guenos en Instagram:*\n` +
      `https://www.instagram.com/twinszonagamer?igsi=MWd2cnU5eW4yYnh4Zw==`;

    if (reciboRef.current) {
      try {
        const canvas = await html2canvas(reciboRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
        });

        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const item = new ClipboardItem({ 'image/png': blob });
              await navigator.clipboard.write([item]);
              alert(
                "✅ IMAGEN COPIADA CON ÉXITO\n\nEl recibo está en tu portapapeles.\nAl abrir WhatsApp, haz clic derecho y selecciona 'Pegar' (o Ctrl+V) para enviar la foto junto al mensaje."
              );
            } catch (err) {
              console.warn(
                'Aviso: El navegador bloqueó copiar al portapapeles automático.',
                err
              );
            }
          }

          const urlWa =
            'https://wa.me/' +
            numLimpio +
            '?text=' +
            encodeURIComponent(mensajeTexto);
          const enlaceMagico = document.createElement('a');
          enlaceMagico.href = urlWa;
          enlaceMagico.target = '_blank';
          enlaceMagico.rel = 'noopener noreferrer';
          document.body.appendChild(enlaceMagico);
          enlaceMagico.click();
          document.body.removeChild(enlaceMagico);
        }, 'image/png');
      } catch (error) {
        console.error('Error capturando recibo', error);
      }
    }

    setMostrarWa(false);
    setNumeroWa('');
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
        zIndex: 4000,
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        style={{
          width: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
        }}
      >
        {/* TICKET BLANCO */}
        <div
          ref={reciboRef}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '30px',
            color: '#111',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1
              style={{
                margin: '0 0 5px 0',
                fontSize: '26px',
                color: '#a126ff',
                fontWeight: '900',
                letterSpacing: '1px',
              }}
            >
              TWINS GAMER
            </h1>
            <span
              style={{
                fontSize: '11px',
                color: '#666',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              ZONA GAMER • GUACARA
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#999',
                display: 'block',
                marginTop: '5px',
              }}
            >
              {datos.fecha}
            </span>
          </div>

          <hr style={{ borderTop: '1px dashed #ccc', margin: '0 0 15px 0' }} />

          <div style={{ marginBottom: '15px' }}>
            <span
              style={{
                fontSize: '10px',
                color: '#666',
                fontWeight: 'bold',
                display: 'block',
                textTransform: 'uppercase',
              }}
            >
              CLIENTE
            </span>
            <div
              style={{ fontSize: '15px', fontWeight: 'bold', color: '#111' }}
            >
              {datos.clienteNombre || 'Consumidor Final'}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '15px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '10px',
                  color: '#666',
                  fontWeight: 'bold',
                  display: 'block',
                  textTransform: 'uppercase',
                }}
              >
                DETALLE
              </span>
              <div style={{ fontSize: '14px', color: '#333' }}>
                {datos.consolaNombre || 'Venta Rápida'}{' '}
                {datos.esPrepago
                  ? `(${datos.minutosPrepago} min)`
                  : !datos.consolaNombre
                  ? ''
                  : '(Libre)'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '10px',
                  color: 'transparent',
                  display: 'block',
                }}
              >
                -
              </span>
              <div
                style={{ fontSize: '15px', fontWeight: 'bold', color: '#111' }}
              >
                ${datos.usd}
              </div>
            </div>
          </div>

          <hr style={{ borderTop: '1px dashed #ccc', margin: '0 0 15px 0' }} />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <div
              style={{ fontSize: '20px', fontWeight: '900', color: '#a126ff' }}
            >
              TOTAL
            </div>
            <div
              style={{ fontSize: '20px', fontWeight: '900', color: '#a126ff' }}
            >
              ${datos.usd}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#666',
              marginBottom: '5px',
            }}
          >
            <span>Equivalente</span>
            <span>Bs {datos.bs}</span>
          </div>
          <div
            style={{ fontSize: '10px', color: '#999', marginBottom: '15px' }}
          >
            Tasa del día: Bs {datos.tasa}/$
          </div>

          <hr style={{ borderTop: '1px dashed #ccc', margin: '0 0 15px 0' }} />

          <div style={{ marginBottom: '20px' }}>
            <span
              style={{
                fontSize: '10px',
                color: '#666',
                fontWeight: 'bold',
                display: 'block',
                textTransform: 'uppercase',
              }}
            >
              MÉTODO DE PAGO
            </span>
            <div style={{ fontSize: '14px', color: '#333' }}>
              {formatearMetodo(datos.metodoPago)}
            </div>
          </div>

          {/* FOOTER & CÓDIGO QR */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <span
              style={{
                fontWeight: 'bold',
                color: '#a126ff',
                fontSize: '14px',
                display: 'block',
                marginBottom: '15px',
              }}
            >
              ¡Gracias por jugar con nosotros! 🎮
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '15px',
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  background: '#fff',
                  padding: '5px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                }}
              >
                <QRCode
                  value="https://www.instagram.com/twinszonagamer?igsi=MWd2cnU5eW4yYnh4Zw=="
                  size={64}
                  level="M"
                />
              </div>
              <div style={{ textAlign: 'left' }}>
                <span
                  style={{ fontSize: '11px', color: '#666', display: 'block' }}
                >
                  Síguenos en
                </span>
                <strong
                  style={{
                    fontSize: '14px',
                    color: '#a126ff',
                    display: 'block',
                    margin: '2px 0',
                  }}
                >
                  @twinszonagamer
                </strong>
                <span
                  style={{ fontSize: '10px', color: '#999', display: 'block' }}
                >
                  Escanea para seguirnos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLES DINÁMICOS DE ACCIÓN */}
        {mostrarWa ? (
          <div
            style={{
              background: '#1c1335',
              border: '1px solid #3c2a7a',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '18px' }}>🇻🇪</span>
            <input
              type="number"
              placeholder="0414..."
              value={numeroWa}
              onChange={(e) => setNumeroWa(e.target.value)}
              style={{
                flex: 1,
                background: '#090514',
                border: '1px solid #251b45',
                color: '#fff',
                padding: '10px',
                borderRadius: '6px',
                outline: 'none',
              }}
              autoFocus
            />
            <button
              onClick={confirmarEnvioWhatsApp}
              style={{
                background: '#00e676',
                border: 'none',
                color: '#000',
                padding: '10px 15px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Enviar
            </button>
            <button
              onClick={() => setMostrarWa(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontWeight: 'bold',
                cursor: 'pointer',
                padding: '10px',
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={descargarPNG}
              style={{
                flex: 1,
                background: '#1c1335',
                border: '1px solid #3c2a7a',
                color: '#fff',
                padding: '12px',
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
              🖼️ PNG
            </button>
            <button
              style={{
                flex: 1,
                background: '#1c1335',
                border: '1px solid #3c2a7a',
                color: '#fff',
                padding: '12px',
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
              📄 PDF
            </button>
            <button
              onClick={() => setMostrarWa(true)}
              style={{
                flex: 2,
                background: '#00e676',
                border: 'none',
                color: '#000',
                padding: '12px',
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
              💬 WhatsApp
            </button>
          </div>
        )}

        {/* BOTÓN CERRAR */}
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#887bb0',
            padding: '10px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

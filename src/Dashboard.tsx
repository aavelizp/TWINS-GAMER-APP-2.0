import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import TarjetaConsola from './TarjetaConsola';
import ModalCobro from './ModalCobro';
import ModalPrepago from './ModalPrepago';
import ModalRecibo from './ModalRecibo';
import ModalCierreCaja from './ModalCierreCaja';
import ModalCobroMultiple from './ModalCobroMultiple';
import ModalVentaRapida from './ModalVentaRapida';
import ModalGastos from './ModalGastos';
import ModalAsignarCliente from './ModalAsignarCliente'; 
import ModalMover from './ModalMover'; 
import TabClientes from './TabClientes';
import TabClubGamer from './TabClubGamer';
import TabCombos from './TabCombos';
import TabTorneos from './TabTorneos';
import TabGastos from './TabGastos';
import TabInventario from './TabInventario';
import TabMantenimiento from './TabMantenimiento';
import TabVentasHoy from './TabVentasHoy';

interface DashboardProps { session: any; onLogout: () => void; }

export default function Dashboard({ session, onLogout }: DashboardProps) {
  const [rol, setRol] = useState<string>('cajero');
  const [tasa, setTasa] = useState<number>(0);
  const [consolas, setConsolas] = useState<any[]>([]);
  const [cajaHoy, setCajaHoy] = useState({ usd: '0.00', bs: '0.00' });
  const [cargando, setCargando] = useState<boolean>(true);
  
  const [pestañaActiva, setPestañaActiva] = useState<string>('consolas');

  const [datosCobro, setDatosCobro] = useState<any>(null);
  const [consolaPrepago, setConsolaPrepago] = useState<any>(null);
  const [datosRecibo, setDatosRecibo] = useState<any>(null);
  const [datosCierre, setDatosCierre] = useState<any>(null);
  const [mostrarCobroMultiple, setMostrarCobroMultiple] = useState(false);
  
  const [mostrarVentaRapida, setMostrarVentaRapida] = useState(false);
  const [mostrarGastos, setMostrarGastos] = useState(false); 

  const [intercepcionCliente, setIntercepcionCliente] = useState<any>(null);
  const [consolaAMover, setConsolaAMover] = useState<any>(null); 

  const [listaEspera, setListaEspera] = useState<{id: number, nombre: string, pref: string}[]>([]);
  const [nombreEspera, setNombreEspera] = useState('');
  const [prefEspera, setPrefEspera] = useState('Cualquiera');
  const [errorEspera, setErrorEspera] = useState(false);
  const [clienteAsignando, setClienteAsignando] = useState<any>(null);

  useEffect(() => { 
    obtenerDatosIniciales(); 

    const canalSuscripcion = supabase.channel('sincronizacion-global')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const tabla = payload.table;
        if (tabla === 'consolas') cargarConsolas();
        if (['ventas', 'gastos', 'pagos_deudas'].includes(tabla)) calcularCajaHoy();
        if (tabla === 'configuracion') obtenerDatosIniciales();
      })
      .subscribe();

    return () => { supabase.removeChannel(canalSuscripcion); };
  }, []);

  const obtenerDatosIniciales = async () => {
    try {
      const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', session.user.id).single();
      if (perfil) setRol(perfil.rol);
      const { data: config } = await supabase.from('configuracion').select('tasa_cambio').eq('id', 1).single();
      if (config) setTasa(config.tasa_cambio);
      await cargarConsolas();
      await calcularCajaHoy();
    } catch (error) { console.error(error); } finally { setCargando(false); }
  };

  const cargarConsolas = async () => {
    const { data } = await supabase.from('consolas').select('*').order('id', { ascending: true });
    if (data) setConsolas(data);
  };

  const obtenerInicioJornada = () => {
    const ahora = new Date();
    const inicio = new Date(ahora);
    if (ahora.getHours() < 6) inicio.setDate(inicio.getDate() - 1);
    inicio.setHours(6, 0, 0, 0); 
    return inicio.toISOString();
  };

  const calcularCajaHoy = async () => {
    const inicioJornada = obtenerInicioJornada();
    const { data: ventas } = await supabase.from('ventas').select('monto_usd, monto_bs, metodo_pago').gte('creado_en', inicioJornada);
    const { data: gastos } = await supabase.from('gastos').select('monto_usd, monto_bs').gte('creado_en', inicioJornada);
    const { data: pagos } = await supabase.from('pagos_deudas').select('monto_usd, monto_bs').gte('creado_en', inicioJornada);
    
    let vUsd = 0, vBs = 0, gUsd = 0, gBs = 0, pUsd = 0, pBs = 0;
    
    if (ventas) ventas.forEach(v => { 
      if(v.metodo_pago !== 'fiado') { vUsd += Number(v.monto_usd); vBs += Number(v.monto_bs); } 
    });
    if (gastos) gastos.forEach(g => { gUsd += Number(g.monto_usd); gBs += Number(g.monto_bs); });
    if (pagos) pagos.forEach(p => { pUsd += Number(p.monto_usd); pBs += Number(p.monto_bs); });
    
    setCajaHoy({ usd: (vUsd + pUsd - gUsd).toFixed(2), bs: (vBs + pBs - gBs).toFixed(2) });
  };

  const cambiarTasa = async () => {
    if (rol !== 'admin') return alert("Solo administradores pueden cambiar la tasa.");
    const nuevaTasa = prompt("Ingrese nueva tasa (Bs/$):", tasa.toString());
    if (!nuevaTasa || isNaN(Number(nuevaTasa))) return;
    await supabase.from('configuracion').update({ tasa_cambio: Number(nuevaTasa) }).eq('id', 1);
  };

  const obtenerConsolaSugerida = (pref: string) => {
    let disponibles = consolas.filter(c => c.estado === 'disponible');
    if (disponibles.length === 0) return null;
    disponibles.sort((a, b) => {
      if (!a.ultimo_fin_sesion) return -1;
      if (!b.ultimo_fin_sesion) return 1;
      return new Date(a.ultimo_fin_sesion).getTime() - new Date(b.ultimo_fin_sesion).getTime();
    });
    if (pref === 'PS4') return disponibles.find(c => c.tipo === 'PS4') || null;
    else if (pref === 'PS5') return disponibles.find(c => c.tipo === 'PS5') || null;
    else return disponibles.find(c => c.tipo === 'PS4') || disponibles[0];
  };

  const manejarEstadoConsola = async (id: number, nuevoEstado: string, minutos?: number | null, prepago: boolean = false, clienteNombre?: string | null): Promise<boolean> => {
    if (nuevoEstado === 'ocupado') {
       setIntercepcionCliente({ accion: 'inicio_normal', idConsola: id, minutos, prepago, clienteNombre });
       return false;
    }
    return await manejarEstadoConsolaSimple(id, nuevoEstado, minutos, prepago, clienteNombre);
  };

  const manejarEstadoConsolaSimple = async (id: number, nuevoEstado: string, minutos?: number | null, prepago: boolean = false, clienteNombre?: string | null, clienteId?: number | null): Promise<boolean> => {
    const actualizacion: any = {
      estado: nuevoEstado,
      tiempo_inicio: nuevoEstado === 'ocupado' ? new Date().toISOString() : null,
      minutos_solicitados: minutos || null,
      prepago: nuevoEstado === 'ocupado' ? prepago : false,
      cliente_nombre: nuevoEstado === 'ocupado' ? (clienteNombre || null) : null,
      cliente_id: nuevoEstado === 'ocupado' ? (clienteId || null) : null,
      deuda_acumulada: 0,
      tiempo_pausa: null 
    };
    if (nuevoEstado === 'disponible') actualizacion.ultimo_fin_sesion = new Date().toISOString();
    
    const { error } = await supabase.from('consolas').update(actualizacion).eq('id', id);
    if (error) {
      alert("Error de BD: " + error.message);
      return false;
    }
    return true;
  };

  const manejarPausaConsola = async (consola: any) => {
    if (consola.estado === 'ocupado') {
      const { error } = await supabase.from('consolas').update({
        estado: 'pausado', tiempo_pausa: new Date().toISOString()
      }).eq('id', consola.id);
      if (error) alert("Error al pausar: " + error.message);
    } else if (consola.estado === 'pausado' && consola.tiempo_pausa) {
      const ahoraMs = new Date().getTime();
      const pausaMs = new Date(consola.tiempo_pausa).getTime();
      const tiempoPausadoMs = ahoraMs - pausaMs;
      const nuevoInicioMs = new Date(consola.tiempo_inicio).getTime() + tiempoPausadoMs;

      const { error } = await supabase.from('consolas').update({
        estado: 'ocupado', tiempo_inicio: new Date(nuevoInicioMs).toISOString(), tiempo_pausa: null
      }).eq('id', consola.id);
      if (error) alert("Error al reanudar: " + error.message);
    }
  };

  const ejecutarMoverConsola = async (origen: any, destino: any) => {
    if (!origen.tiempo_inicio) return;

    const ahoraMs = (origen.estado === 'pausado' && origen.tiempo_pausa) 
        ? new Date(origen.tiempo_pausa).getTime() 
        : new Date().getTime();
        
    const inicioMs = new Date(origen.tiempo_inicio).getTime();
    const elapsedSecs = Math.floor((ahoraMs - inicioMs) / 1000);

    let nuevoTiempoInicio = null;
    let nuevosMinutos = null;
    let nuevaDeudaAcumulada = Number(origen.deuda_acumulada || 0);

    if (origen.minutos_solicitados && origen.minutos_solicitados > 0) {
      const totalSecs = origen.minutos_solicitados * 60;
      const restanteSecs = totalSecs - elapsedSecs;
      if (restanteSecs <= 0) {
         alert("El tiempo ya se agotó, no se puede mover.");
         setConsolaAMover(null); return;
      }
      nuevoTiempoInicio = new Date().toISOString();
      nuevosMinutos = restanteSecs / 60; 
    } else {
      const mins = Math.floor(elapsedSecs / 60);
      const deudaGenerada = Math.ceil((mins / 60) * origen.precio_por_hora * 100) / 100;
      
      nuevaDeudaAcumulada += deudaGenerada; 
      nuevoTiempoInicio = new Date().toISOString(); 
    }

    await supabase.from('consolas').update({
      estado: 'ocupado', tiempo_inicio: nuevoTiempoInicio, minutos_solicitados: nuevosMinutos,
      prepago: origen.prepago, cliente_nombre: origen.cliente_nombre, cliente_id: origen.cliente_id,
      deuda_acumulada: nuevaDeudaAcumulada, tiempo_pausa: null
    }).eq('id', destino.id);

    await supabase.from('consolas').update({
      estado: 'disponible', tiempo_inicio: null, minutos_solicitados: null, 
      prepago: false, cliente_nombre: null, cliente_id: null,
      deuda_acumulada: 0, tiempo_pausa: null, ultimo_fin_sesion: new Date().toISOString()
    }).eq('id', origen.id);

    setConsolaAMover(null);
    cargarConsolas();
  };

  const abrirPrepago = (consola: any) => {
    setIntercepcionCliente({ accion: 'prepago', consola });
  };

  const confirmarTiempoPrepago = (minutos: number | null) => {
    const consola = consolaPrepago;
    setConsolaPrepago(null);
    let usd = minutos && minutos > 0 ? ((minutos / 60) * consola.precio_por_hora).toFixed(2) : (1 * consola.precio_por_hora).toFixed(2);
    setDatosCobro({ 
      consola, usd, bs: (Number(usd) * tasa).toFixed(2), tasaBs: tasa, esPrepago: true, minutosPrepago: minutos, 
      clienteNombre: consola.cliente_nombre_temporal, cliente_id_real: consola.cliente_id_temporal, clienteYaSolicitado: true 
    });
  };

  const abrirModalCobroNormal = (idConsola: number, usdTotal: string, bsTotal: string) => {
    const consola = consolas.find(c => c.id === idConsola);
    if (Number(usdTotal) <= 0) { manejarEstadoConsolaSimple(idConsola, 'disponible'); return; }
    
    setDatosCobro({ 
      consola, usd: usdTotal, bs: bsTotal, tasaBs: tasa, esPrepago: false, 
      clienteNombre: consola?.cliente_nombre, cliente_id_real: consola?.cliente_id, clienteYaSolicitado: true 
    });
  };

  const prepararCobroVentaRapida = (carrito: any[], totalUSD: number, totalBS: number) => {
    setMostrarVentaRapida(false); 
    setDatosCobro({ isVentaRapida: true, carrito: carrito, usd: totalUSD.toFixed(2), bs: totalBS.toFixed(2), tasaBs: tasa, clienteYaSolicitado: false });
  };

  const ejecutarCobroFinal = async (metodoPago: string, detallesPago?: any, clienteIdForzado?: number) => {
    if (!datosCobro) return;
    let montoUSDGuardar = Number(datosCobro.usd), montoBSGuardar = Number(datosCobro.bs);
    if (metodoPago.startsWith('mixto') && detallesPago) { montoUSDGuardar = detallesPago.monto_usd; montoBSGuardar = detallesPago.monto_bs; }

    const idClienteFinal = datosCobro.cliente_id_real || clienteIdForzado || null;
    const bancoSeleccionado = detallesPago?.banco || null;

    if (datosCobro.isVentaRapida) {
      const { error } = await supabase.from('ventas').insert({ consola_id: null, monto_usd: montoUSDGuardar, monto_bs: montoBSGuardar, tasa_cambio: tasa, metodo_pago: metodoPago, cajero_id: session.user.id, cliente_id: idClienteFinal, banco: bancoSeleccionado });
      if (error) return alert("Error al registrar venta de snacks.");
      if (datosCobro.carrito && datosCobro.carrito.length > 0) {
        for (const item of datosCobro.carrito) { await supabase.from('inventario').update({ stock: item.stock - item.cantidad }).eq('id', item.id); }
      }
      if (idClienteFinal && metodoPago === 'fiado') {
        const { data: clienteActual } = await supabase.from('clientes').select('deuda_usd').eq('id', idClienteFinal).single();
        if (clienteActual) await supabase.from('clientes').update({ deuda_usd: Number(clienteActual.deuda_usd || 0) + montoUSDGuardar }).eq('id', idClienteFinal);
      }
      setDatosCobro(null); setDatosRecibo({ ...datosCobro, metodoPago, fecha: new Date().toLocaleString('es-VE') }); 
      return;
    }

    const { error } = await supabase.from('ventas').insert({ consola_id: datosCobro.consola.id, monto_usd: montoUSDGuardar, monto_bs: montoBSGuardar, tasa_cambio: tasa, metodo_pago: metodoPago, cajero_id: session.user.id, cliente_id: idClienteFinal, banco: bancoSeleccionado });
    if (error) return alert("Error al registrar venta.");

    const horasJugadas = montoUSDGuardar / datosCobro.consola.precio_por_hora;
    await supabase.from('consolas').update({ horas_uso_acumuladas: Number(datosCobro.consola.horas_uso_acumuladas || 0) + horasJugadas }).eq('id', datosCobro.consola.id);

    if (idClienteFinal) {
      const { data: clienteActual } = await supabase.from('clientes').select('deuda_usd, horas_jugadas').eq('id', idClienteFinal).single();
      if (clienteActual) {
        let actualizacionCliente: any = { horas_jugadas: Number(clienteActual.horas_jugadas || 0) + horasJugadas };
        if (metodoPago === 'fiado') actualizacionCliente.deuda_usd = Number(clienteActual.deuda_usd || 0) + montoUSDGuardar;
        await supabase.from('clientes').update(actualizacionCliente).eq('id', idClienteFinal);
      }
    }

    const nombreClienteFinal = datosCobro.clienteNombre || clienteAsignando?.nombre || null;
    
    if (datosCobro.esPrepago) {
      await manejarEstadoConsolaSimple(datosCobro.consola.id, 'ocupado', datosCobro.minutosPrepago, true, nombreClienteFinal, idClienteFinal);
    } else {
      await manejarEstadoConsolaSimple(datosCobro.consola.id, 'disponible');
    }

    if (clienteAsignando) { removerDeListaEspera(clienteAsignando.id); setClienteAsignando(null); }
    
    setDatosCobro(null); setDatosRecibo({ ...datosCobro, metodoPago, fecha: new Date().toLocaleString('es-VE') });
  };

  const asignarClienteListaEspera = (cliente: {id: number, nombre: string, pref: string}) => {
    const consolaSugerida = obtenerConsolaSugerida(cliente.pref);
    if (!consolaSugerida) return alert(`⚠️ No hay consolas [${cliente.pref}] disponibles.`);
    setClienteAsignando(cliente); 
    setIntercepcionCliente({ accion: 'prepago', consola: consolaSugerida });
  };

  const ejecutarGastoFinal = async (descripcion: string, montoUSD: number, montoBS: number, metodo: string) => {
    const { error } = await supabase.from('gastos').insert({ descripcion, monto_usd: montoUSD, monto_bs: montoBS, metodo_pago: metodo, cajero_id: session.user.id });
    if (error) return alert("Error al registrar gasto: " + error.message);
    setMostrarGastos(false); 
  };

  const anularSesionError = async (idConsola: number) => {
    if (rol !== 'admin') return alert("Acceso denegado.");
    if (window.confirm("⚠️ ¿ANULAR sesión sin cobrar?")) await manejarEstadoConsolaSimple(idConsola, 'disponible');
  };

  const generarCierreCaja = async () => {
    if (rol !== 'admin') return alert("Solo administrador.");
    const inicioJornada = obtenerInicioJornada();
    const { data: ventas, error: errVentas } = await supabase.from('ventas').select('*, consolas(nombre)').gte('creado_en', inicioJornada).order('creado_en', { ascending: true });
    const { data: gastos, error: errGastos } = await supabase.from('gastos').select('*').gte('creado_en', inicioJornada).order('creado_en', { ascending: true });
    const { data: pagos } = await supabase.from('pagos_deudas').select('*').gte('creado_en', inicioJornada);
    const { data: inventarioActual } = await supabase.from('inventario').select('*').order('nombre');
    const { data: clientesFiados } = await supabase.from('clientes').select('*').gt('deuda_usd', 0).order('nombre');

    if (errVentas || errGastos) return alert("Error extrayendo datos.");

    let v_usdTotal = 0, v_efectivoUsd = 0, v_efectivoBs = 0, v_pagoMovil = 0, v_consolas = 0, v_snacks = 0, v_fiado = 0;
    ventas.forEach(v => {
      const usd = Number(v.monto_usd); const bs = Number(v.monto_bs);
      v_usdTotal += usd;
      if (v.consola_id) v_consolas += usd; else v_snacks += usd;
      if (v.metodo_pago === 'efectivo_usd') v_efectivoUsd += usd;
      else if (v.metodo_pago === 'pago_movil') v_pagoMovil += bs;
      else if (v.metodo_pago === 'efectivo_bs') v_efectivoBs += bs;
      else if (v.metodo_pago === 'mixto_pago_movil' || v.metodo_pago === 'mixto') { v_efectivoUsd += usd; v_pagoMovil += bs; }
      else if (v.metodo_pago === 'mixto_efectivo_bs') { v_efectivoUsd += usd; v_efectivoBs += bs; }
      else if (v.metodo_pago === 'fiado') v_fiado += usd;
    });

    let p_recuperado = 0;
    if (pagos) pagos.forEach(p => {
      const usd = Number(p.monto_usd); const bs = Number(p.monto_bs);
      p_recuperado += usd;
      if (p.metodo_pago === 'efectivo_usd') v_efectivoUsd += usd;
      else if (p.metodo_pago === 'pago_movil') v_pagoMovil += bs;
      else if (p.metodo_pago === 'efectivo_bs') v_efectivoBs += bs;
    });

    let g_usdTotal = 0;
    gastos.forEach(g => { g_usdTotal += Number(g.monto_usd); });
    const ventasNetasUSD = ((v_usdTotal - v_fiado) + p_recuperado) - g_usdTotal;

    setDatosCierre({ 
      fecha: new Date(inicioJornada).toLocaleDateString('es-VE'), hora: new Date().toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit', hour12: true }), tasa, 
      ventasBrutasUSD: v_usdTotal.toFixed(2), ventasConsolasUSD: v_consolas.toFixed(2), ventasSnacksUSD: v_snacks.toFixed(2),
      ingresoEfectivoUSD: v_efectivoUsd.toFixed(2), ingresoPagoMovil: v_pagoMovil.toFixed(2), ingresoEfectivoBs: v_efectivoBs.toFixed(2),
      fiadoHoyUSD: v_fiado.toFixed(2), recuperadoUSD: p_recuperado.toFixed(2), gastosTotalesUSD: g_usdTotal.toFixed(2), ventasNetasUSD: ventasNetasUSD.toFixed(2),
      ventasDetalle: ventas, gastosDetalle: gastos, inventarioDetalle: inventarioActual || [], fiadosDetalle: clientesFiados || []
    });
  };

  const calcularDeudaConsola = (consola: any) => {
    if (!consola || (consola.estado !== 'ocupado' && consola.estado !== 'pausado') || !consola.tiempo_inicio) return 0;
    
    const ahoraMs = (consola.estado === 'pausado' && consola.tiempo_pausa) 
        ? new Date(consola.tiempo_pausa).getTime() 
        : new Date().getTime();

    const diff = Math.floor((ahoraMs - new Date(consola.tiempo_inicio).getTime()) / 1000);
    const secs = diff > 0 ? diff : 0;
    const esFijo = Boolean(consola.minutos_solicitados && consola.minutos_solicitados > 0);
    const restantes = (consola.minutos_solicitados || 0) * 60 - secs;
    const extra = Math.ceil((esFijo && restantes <= 0 ? Math.abs(restantes) : 0) / 60);

    let deudaBase = 0;
    if (consola.prepago) deudaBase = (extra / 60) * consola.precio_por_hora;
    else if (esFijo) deudaBase = (((consola.minutos_solicitados || 0) / 60) * consola.precio_por_hora) + ((extra / 60) * consola.precio_por_hora);
    else deudaBase = (Math.ceil(secs / 60) / 60) * consola.precio_por_hora;

    return deudaBase + (Number(consola.deuda_acumulada) || 0);
  };

  const ejecutarCobroMultipleFinal = async (metodoPago: string, detallesPago: any, consolasIds: number[]) => {
    let sumaDeudasGlobal = 0;
    const matrizDeudas = consolasIds.map(id => { const deuda = calcularDeudaConsola(consolas.find(c => c.id === id)); sumaDeudasGlobal += deuda; return { id, deuda }; });
    for (const item of matrizDeudas) {
      let mUsd = 0, mBs = 0;
      const peso = sumaDeudasGlobal > 0 ? (item.deuda / sumaDeudasGlobal) : (1 / consolasIds.length);
      if (metodoPago.startsWith('mixto')) { mUsd = detallesPago.monto_usd * peso; mBs = detallesPago.monto_bs * peso; } 
      else if (metodoPago === 'efectivo_bs' || metodoPago === 'pago_movil') mBs = item.deuda * tasa; else mUsd = item.deuda;
      
      await supabase.from('ventas').insert({ consola_id: item.id, monto_usd: mUsd, monto_bs: mBs, tasa_cambio: tasa, metodo_pago: metodoPago, cajero_id: session.user.id });
      
      const consolaCompleta = consolas.find(c => c.id === item.id);
      if (consolaCompleta) {
        const horasJugadas = mUsd / consolaCompleta.precio_por_hora;
        await supabase.from('consolas').update({ horas_uso_acumuladas: Number(consolaCompleta.horas_uso_acumuladas || 0) + horasJugadas }).eq('id', item.id);
      }
      await manejarEstadoConsolaSimple(item.id, 'disponible');
    }
    setMostrarCobroMultiple(false); 
  };

  const agregarAListaEspera = () => { if (!nombreEspera.trim()) { setErrorEspera(true); return; } setListaEspera([...listaEspera, { id: Date.now(), nombre: nombreEspera, pref: prefEspera }]); setNombreEspera(''); setErrorEspera(false); };
  const removerDeListaEspera = (id: number) => setListaEspera(listaEspera.filter(c => c.id !== id));

  if (cargando) return <div style={{ background: '#0a0a0a', color: '#a126ff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando Estaciones...</div>;

  const tabs = [
    { id: 'consolas', icon: '🎮', label: 'Consolas' },
    { id: 'club_gamer', icon: '🏆', label: 'Club Gamer' },
    { id: 'combos', icon: '🍔', label: 'Combos' },
    { id: 'torneos', icon: '🏆', label: 'Torneos' },
    { id: 'clientes', icon: '👥', label: 'Clientes' },
    { id: 'fiados', icon: '📝', label: 'Fiados' },
    { id: 'gastos', icon: '💸', label: 'Gastos' },
    { id: 'inventario', icon: '📦', label: 'Inventario' },
    { id: 'mantenimiento', icon: '🔧', label: 'Mantenimiento' },
    { id: 'ventas_hoy', icon: '📊', label: 'Ventas Hoy' }
  ];

  return (
    <div style={{ color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', backgroundImage: 'url("/logo-twins.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 5, 20, 0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        
        <header style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: 'rgba(13, 9, 26, 0.6)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src="/logo-twins.jpg" alt="Twins Gamer" style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }} />
            <div><h1 style={{ margin: 0, fontSize: '16px', color: '#fff', letterSpacing: '1px' }}>TWINS GAMER</h1><span style={{ fontSize: '9px', color: '#a126ff', letterSpacing: '1px', textTransform: 'uppercase' }}>POS - VENEZUELA</span></div>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div onClick={cambiarTasa} style={{ background: 'rgba(21, 14, 40, 0.8)', padding: '6px 12px', borderRadius: '20px', border: '1px solid #3c2a7a', cursor: rol === 'admin' ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#887bb0' }}>TASA BS/$</span><strong style={{ color: '#fff', fontSize: '13px' }}>{tasa} ✏️</strong>
            </div>
            {(rol === 'admin' || rol === 'cajero') && (
              <div style={{ textAlign: 'center', marginRight: '10px' }}>
                <span style={{ fontSize: '10px', color: '#00e676', display: 'block', fontWeight: 'bold' }}>Caja Neta Hoy</span>
                <strong style={{ color: '#fff', fontSize: '14px' }}>${cajaHoy.usd} <span style={{ color: '#ff007f' }}>- Bs {cajaHoy.bs}</span></strong>
              </div>
            )}
            <button onClick={() => setMostrarGastos(true)} style={{ background: 'rgba(11, 8, 21, 0.7)', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>📉 Gastos</button>
            <button onClick={() => setMostrarVentaRapida(true)} style={{ background: 'rgba(11, 8, 21, 0.7)', border: '1px solid #00e676', color: '#00e676', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>🛒 Venta Rápida</button>
            <button onClick={generarCierreCaja} style={{ background: 'linear-gradient(90deg, rgba(155,81,224,0.9), rgba(161,38,255,0.9))', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>💰 Cierre Z</button>
            <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid #ff0055', color: '#ff0055', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>🚪</button>
          </div>
        </header>

        <nav style={{ display: 'flex', gap: '8px', padding: '12px 20px', background: 'rgba(28, 18, 54, 0.4)', backdropFilter: 'blur(5px)', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {tabs.map((tab) => {
            const isActive = pestañaActiva === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setPestañaActiva(tab.id)} 
                style={{ 
                  background: isActive ? 'rgba(20, 12, 38, 0.9)' : 'transparent', 
                  border: isActive ? '1px solid #3c2a7a' : '1px solid transparent',
                  color: isActive ? '#fff' : '#a092c4', 
                  padding: '8px 16px', 
                  borderRadius: '20px', 
                  fontSize: '14px', 
                  fontWeight: isActive ? 'bold' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}>
                <span style={{ fontSize: '16px' }}>{tab.icon}</span> {tab.label}
              </button>
            );
          })}
        </nav>

        {pestañaActiva === 'consolas' && (
          <main style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: '3 1 300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', color: '#a126ff', letterSpacing: '2px', textTransform: 'uppercase' }}>Estado en vivo</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '15px' }}>
                {consolas.map((c) => {
                  const sugeridaParaTipo = obtenerConsolaSugerida(c.tipo);
                  return <TarjetaConsola key={c.id} consola={c} tasaBs={tasa} rol={rol} esSugerida={sugeridaParaTipo?.id === c.id} onActualizarEstado={manejarEstadoConsola} onAbrirPrepago={abrirPrepago} onCobrar={abrirModalCobroNormal} onAnular={anularSesionError} onMover={(consola: any) => setConsolaAMover(consola)} onPausar={manejarPausaConsola} />;
                })}
              </div>
            </div>

            <div style={{ flex: '1 1 280px' }}>
               <button onClick={() => setMostrarCobroMultiple(true)} style={{ width: '100%', background: 'rgba(121, 40, 202, 0.9)', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', backdropFilter: 'blur(5px)' }}>🔗 Cobro Múltiple</button>
               <div style={{ background: 'rgba(21, 14, 40, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(60,42,122,0.5)' }}>
                 <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{color: '#ff007f'}}>👥</span> Lista de Espera</h3>
                 <input type="text" placeholder="Nombre" value={nombreEspera} onChange={(e) => { setNombreEspera(e.target.value); setErrorEspera(false); }} style={{ width: '100%', background: 'rgba(11, 8, 21, 0.8)', border: `1px solid ${errorEspera ? '#ef4444' : '#251b45'}`, color: '#fff', padding: '10px', borderRadius: '8px', marginBottom: errorEspera ? '5px' : '15px', boxSizing: 'border-box', outline: 'none' }} />
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', marginBottom: '15px' }}>
                   {['PS4', 'PS5', 'Cualquiera'].map(pref => ( <button key={pref} onClick={() => setPrefEspera(pref)} style={{ background: prefEspera === pref ? '#9b51e0' : 'rgba(11, 8, 21, 0.8)', border: prefEspera === pref ? 'none' : '1px solid #3c2a7a', color: prefEspera === pref ? '#fff' : '#887bb0', padding: '8px 0', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>{pref}</button> ))}
                 </div>
                 <button onClick={agregarAListaEspera} style={{ width: '100%', background: 'linear-gradient(90deg, #9b51e0, #a126ff)', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>Añadir</button>
                 {listaEspera.length === 0 ? ( <span style={{ fontSize: '12px', color: '#55497a' }}>Sin clientes en espera.</span> ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {listaEspera.map((c, i) => (
                        <div key={c.id} style={{ background: 'rgba(28, 19, 53, 0.8)', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#ff007f', fontWeight: 'bold', fontSize: '16px' }}>{i + 1}</span><div><div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{c.nombre}</div><div style={{ color: '#887bb0', fontSize: '11px' }}>{c.pref}</div></div></div>
                          <div style={{ display: 'flex', gap: '5px' }}><button onClick={() => asignarClienteListaEspera(c)} style={{ background: '#a126ff', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Asignar</button><button onClick={() => removerDeListaEspera(c.id)} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '6px', fontSize: '16px', cursor: 'pointer' }}>✕</button></div>
                        </div>
                      ))}
                    </div>
                 )}
               </div>
            </div>
          </main>
        )}

        {pestañaActiva === 'club_gamer' && <TabClubGamer />}
        {pestañaActiva === 'combos' && <TabCombos />}
        {pestañaActiva === 'torneos' && <TabTorneos tasa={tasa} cajeroId={session.user.id} onPagoRealizado={() => {}} />}
        {pestañaActiva === 'clientes' && <TabClientes tasa={tasa} cajeroId={session.user.id} modo="clientes" onPagoRealizado={() => {}} />}
        {pestañaActiva === 'fiados' && <TabClientes tasa={tasa} cajeroId={session.user.id} modo="fiados" onPagoRealizado={() => {}} />}
        {pestañaActiva === 'gastos' && <TabGastos tasa={tasa} cajeroId={session.user.id} onGastoRealizado={() => {}} />}
        {pestañaActiva === 'inventario' && <TabInventario />}
        {pestañaActiva === 'mantenimiento' && <TabMantenimiento consolas={consolas} onRecargar={() => {}} />}
        {pestañaActiva === 'ventas_hoy' && <TabVentasHoy tasa={tasa} rol={rol} />}
        
      </div>

      {intercepcionCliente && (
        <ModalAsignarCliente 
          onClose={() => setIntercepcionCliente(null)} 
          onConfirm={(clienteId: number | null, nombre: string) => {
             const { accion, idConsola, consola, minutos, prepago } = intercepcionCliente;
             setIntercepcionCliente(null);
             if (accion === 'inicio_normal') manejarEstadoConsolaSimple(idConsola, 'ocupado', minutos, prepago, nombre, clienteId);
             else if (accion === 'prepago') setConsolaPrepago({ ...consola, cliente_nombre_temporal: nombre, cliente_id_temporal: clienteId });
          }} 
        />
      )}

      {consolaAMover && (
        <ModalMover 
          consolaOrigen={consolaAMover} 
          consolas={consolas} 
          onClose={() => setConsolaAMover(null)} 
          onConfirm={ejecutarMoverConsola} 
        />
      )}

      <ModalPrepago consola={consolaPrepago} onClose={() => { setConsolaPrepago(null); setClienteAsignando(null); }} onConfirmarTiempo={confirmarTiempoPrepago} />
      <ModalCobro datos={datosCobro} onClose={() => { setDatosCobro(null); setClienteAsignando(null); }} onConfirm={ejecutarCobroFinal} />
      <ModalRecibo datos={datosRecibo} onClose={() => setDatosRecibo(null)} />
      {datosCierre && <ModalCierreCaja datos={datosCierre} onClose={() => setDatosCierre(null)} onConfirm={() => { alert("✅ CAJA CERRADA EXITOSAMENTE"); setDatosCierre(null); }} />}
      {mostrarCobroMultiple && <ModalCobroMultiple consolas={consolas} tasa={tasa} calcularDeuda={calcularDeudaConsola} onClose={() => setMostrarCobroMultiple(false)} onConfirm={ejecutarCobroMultipleFinal} />}
      {mostrarVentaRapida && <ModalVentaRapida tasa={tasa} onClose={() => setMostrarVentaRapida(false)} onConfirm={prepararCobroVentaRapida} />}
      {mostrarGastos && <ModalGastos tasa={tasa} onClose={() => setMostrarGastos(false)} onConfirm={ejecutarGastoFinal} />}
      
      <style>{`
        :root, body, html {
          margin: 0 !important;
          padding: 0 !important;
          max-width: 100% !important;
          width: 100% !important;
          overflow-x: hidden;
        }
        #root {
          margin: 0 !important;
          padding: 0 !important;
          max-width: 100% !important;
          width: 100% !important;
        }

        @media (max-width: 768px) {
          header {
            flex-direction: column !important;
            padding: 15px 10px !important;
            gap: 15px !important;
          }
          header > div {
            justify-content: center !important;
            width: 100%;
          }

          div[style*="width: 420px"], 
          div[style*="width: 500px"], 
          div[style*="width: 600px"],
          div[style*="width: 700px"],
          div[style*="width: 800px"] {
            width: 95vw !important;
            min-width: 0 !important;
          }

          div[style*="border-radius: 16px"] {
            overflow-x: auto !important;
          }
          
          div[style*="border-radius: 16px"] > div[style*="display: flex"] {
            min-width: 700px !important; 
          }
          
          div[style*="padding: 20px"] {
            padding: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
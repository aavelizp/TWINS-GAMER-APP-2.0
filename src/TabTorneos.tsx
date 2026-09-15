import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import ModalCobro from './ModalCobro';

interface TabTorneosProps {
  tasa: number;
  cajeroId: string;
  onPagoRealizado: () => void;
}

export default function TabTorneos({
  tasa,
  cajeroId,
  onPagoRealizado,
}: TabTorneosProps) {
  const [torneos, setTorneos] = useState<any[]>([]);
  const [clientesDb, setClientesDb] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const [vista, setVista] = useState<'lista' | 'detalle'>('lista');
  const [torneoActivo, setTorneoActivo] = useState<any>(null);

  // --- Modal Crear/Editar Torneo ---
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoModal, setModoModal] = useState<'crear' | 'editar'>('crear');
  const [nombre, setNombre] = useState('');
  const [juego, setJuego] = useState('');
  const [formato, setFormato] = useState('Liga (Todos vs Todos)');
  const [maxJugadores, setMaxJugadores] = useState('Sin Límite');
  const [inscripcion, setInscripcion] = useState('');
  const [porcentaje, setPorcentaje] = useState(50);
  const [premioEstimado, setPremioEstimado] = useState('');

  // --- Modal de Inscripción ---
  const [mostrarModalInscripcion, setMostrarModalInscripcion] = useState(false);
  const [modoInscripcion, setModoInscripcion] = useState<'existente' | 'nuevo'>(
    'existente'
  );
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoAlias, setNuevoAlias] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState('');

  // --- Modal de Cobro ---
  const [datosCobroInscripcion, setDatosCobroInscripcion] = useState<any>(null);

  useEffect(() => {
    cargarTorneos();
    cargarClientes();
  }, []);

  const cargarTorneos = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('torneos')
      .select('*')
      .order('creado_en', { ascending: false });
    if (data) setTorneos(data);
    setCargando(false);
  };

  const cargarClientes = async () => {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });
    if (data) setClientesDb(data);
  };

  useEffect(() => {
    const maxJ =
      maxJugadores === 'Sin Límite' ? 0 : Number(maxJugadores.split(' ')[0]);
    const insc = Number(inscripcion) || 0;
    const totalPosible = maxJ * insc;
    if (totalPosible > 0)
      setPremioEstimado((totalPosible * (porcentaje / 100)).toFixed(2));
  }, [maxJugadores, inscripcion, porcentaje]);

  const handlePorcentajeChange = (val: number) => {
    setPorcentaje(val);
    const maxJ =
      maxJugadores === 'Sin Límite' ? 0 : Number(maxJugadores.split(' ')[0]);
    const insc = Number(inscripcion) || 0;
    const totalPosible = maxJ * insc;
    if (totalPosible > 0)
      setPremioEstimado((totalPosible * (val / 100)).toFixed(2));
  };

  const handlePremioChange = (val: string) => {
    setPremioEstimado(val);
    const numVal = Number(val) || 0;
    const maxJ =
      maxJugadores === 'Sin Límite' ? 0 : Number(maxJugadores.split(' ')[0]);
    const insc = Number(inscripcion) || 0;
    const totalPosible = maxJ * insc;
    if (totalPosible > 0)
      setPorcentaje(Math.min(100, Math.round((numVal / totalPosible) * 100)));
  };

  const limpiarFormularioTorneo = () => {
    setNombre('');
    setJuego('');
    setInscripcion('');
    setPremioEstimado('');
    setPorcentaje(50);
    setMaxJugadores('Sin Límite');
    setFormato('Liga (Todos vs Todos)');
  };

  const abrirCrearTorneo = () => {
    setModoModal('crear');
    limpiarFormularioTorneo();
    setMostrarModal(true);
  };

  const abrirEditarTorneo = () => {
    setModoModal('editar');
    setNombre(torneoActivo.nombre);
    setJuego(torneoActivo.juego);
    setFormato(torneoActivo.formato);
    setMaxJugadores(
      torneoActivo.participantes_max === 999
        ? 'Sin Límite'
        : `${torneoActivo.participantes_max} Jugadores`
    );
    setInscripcion(
      torneoActivo.inscripcion_usd > 0
        ? torneoActivo.inscripcion_usd.toString()
        : ''
    );
    setPorcentaje(torneoActivo.porcentaje_pozo);
    setPremioEstimado(
      torneoActivo.premio.includes('$')
        ? torneoActivo.premio.replace('$', '')
        : ''
    );
    setMostrarModal(true);
  };

  const guardarTorneo = async () => {
    if (!nombre.trim() || !juego.trim())
      return alert('Nombre y Videojuego son obligatorios.');

    const maxJ =
      maxJugadores === 'Sin Límite' ? 999 : Number(maxJugadores.split(' ')[0]);
    const insc = Number(inscripcion) || 0;
    const premioFinal = premioEstimado
      ? `$${premioEstimado}`
      : 'Porcentaje del Pozo';

    if (modoModal === 'editar') {
      const { error } = await supabase
        .from('torneos')
        .update({
          nombre,
          juego,
          formato,
          participantes_max: maxJ,
          inscripcion_usd: insc,
          porcentaje_pozo: porcentaje,
          premio: premioFinal,
        })
        .eq('id', torneoActivo.id);

      if (error) return alert('Error al editar: ' + error.message);
      setTorneoActivo({
        ...torneoActivo,
        nombre,
        juego,
        formato,
        participantes_max: maxJ,
        inscripcion_usd: insc,
        porcentaje_pozo: porcentaje,
        premio: premioFinal,
      });
    } else {
      const { error } = await supabase.from('torneos').insert({
        nombre,
        juego,
        fecha: new Date().toLocaleDateString('es-VE'),
        premio: premioFinal,
        formato,
        participantes_max: maxJ,
        inscripcion_usd: insc,
        porcentaje_pozo: porcentaje,
        estado: 'Inscripcion',
        participantes: [],
        partidos: [],
      });
      if (error) return alert('Error al crear: ' + error.message);
    }

    setMostrarModal(false);
    limpiarFormularioTorneo();
    cargarTorneos();
  };

  const eliminarTorneo = async (id: number) => {
    if (
      !window.confirm('¿Seguro que deseas eliminar este torneo por completo?')
    )
      return;
    await supabase.from('torneos').delete().eq('id', id);
    if (torneoActivo?.id === id) setVista('lista');
    cargarTorneos();
  };

  const abrirDetalle = (torneo: any) => {
    setTorneoActivo(torneo);
    setVista('detalle');
  };

  const volverALista = () => {
    setVista('lista');
    cargarTorneos();
  };

  const procesarInscripcion = async () => {
    let listaActual = torneoActivo.participantes || [];
    if (listaActual.length >= torneoActivo.participantes_max)
      return alert('El torneo ya está lleno.');

    let clienteDbId = null;
    let nombreAMostrar = '';

    if (modoInscripcion === 'existente') {
      if (!clienteSeleccionadoId)
        return alert('Debes seleccionar un jugador de la lista.');
      const clienteEncontrado = clientesDb.find(
        (c) => c.id.toString() === clienteSeleccionadoId
      );
      if (!clienteEncontrado) return;
      if (listaActual.some((j: any) => j.cliente_id === clienteEncontrado.id))
        return alert('¡Este jugador ya está inscrito!');

      clienteDbId = clienteEncontrado.id;
      nombreAMostrar = clienteEncontrado.alias
        ? `${clienteEncontrado.alias} (${clienteEncontrado.nombre})`
        : clienteEncontrado.nombre;
    } else {
      if (!nuevoNombre.trim())
        return alert('El nombre del jugador es obligatorio.');
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
      if (error)
        return alert('Error al registrar el cliente: ' + error.message);
      clienteDbId = newClient.id;
      nombreAMostrar = newClient.alias
        ? `${newClient.alias} (${newClient.nombre})`
        : newClient.nombre;
    }

    const usd = Number(torneoActivo.inscripcion_usd);
    const estadoInicial = usd <= 0 ? 'Pagado' : 'Pendiente';

    const nuevoJugador = {
      id: Date.now(),
      cliente_id: clienteDbId,
      nombre: nombreAMostrar,
      estado_pago: estadoInicial,
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      gf: 0,
      gc: 0,
      pts: 0,
    };
    const nuevaLista = [...listaActual, nuevoJugador];

    await supabase
      .from('torneos')
      .update({ participantes: nuevaLista })
      .eq('id', torneoActivo.id);
    setTorneoActivo({ ...torneoActivo, participantes: nuevaLista });

    setMostrarModalInscripcion(false);
    setNuevoNombre('');
    setNuevoAlias('');
    setNuevoTelefono('');
    setClienteSeleccionadoId('');
    cargarTorneos();
    cargarClientes();

    if (usd > 0) {
      setDatosCobroInscripcion({
        jugadorId: nuevoJugador.id,
        cliente_id_real: clienteDbId,
        usd: usd.toFixed(2),
        bs: (usd * tasa).toFixed(2),
        tasaBs: tasa,
        esInscripcion: true,
      });
    }
  };

  const abrirCobroInscripcion = (
    jugadorId: number,
    clienteDbId: number | null
  ) => {
    const usd = Number(torneoActivo.inscripcion_usd);
    if (usd <= 0) {
      marcarComoPagado(jugadorId);
      return;
    }
    setDatosCobroInscripcion({
      jugadorId,
      cliente_id_real: clienteDbId,
      usd: usd.toFixed(2),
      bs: (usd * tasa).toFixed(2),
      tasaBs: tasa,
      esInscripcion: true,
    });
  };

  // --- ACTUALIZADO PARA RECIBIR EL BANCO ---
  const ejecutarCobroInscripcion = async (
    metodoPago: string,
    detallesPago?: any,
    clienteIdForzado?: number | null
  ) => {
    let montoUSDGuardar = Number(datosCobroInscripcion.usd);
    let montoBSGuardar = Number(datosCobroInscripcion.bs);
    const bancoSeleccionado = detallesPago?.banco || null; // Capturamos el banco

    if (metodoPago.startsWith('mixto') && detallesPago) {
      montoUSDGuardar = detallesPago.monto_usd;
      montoBSGuardar = detallesPago.monto_bs;
    }

    const idClienteFinal =
      clienteIdForzado || datosCobroInscripcion.cliente_id_real || null;

    const { error } = await supabase
      .from('ventas')
      .insert({
        consola_id: null,
        monto_usd: montoUSDGuardar,
        monto_bs: montoBSGuardar,
        tasa_cambio: tasa,
        metodo_pago: metodoPago,
        cajero_id: cajeroId,
        cliente_id: idClienteFinal,
        descripcion: `Inscripción Torneo: ${torneoActivo.nombre}`,
        banco: bancoSeleccionado,
      });

    if (error) return alert('Error al registrar el cobro: ' + error.message);

    if (idClienteFinal && metodoPago === 'fiado') {
      const { data: clienteActual } = await supabase
        .from('clientes')
        .select('deuda_usd')
        .eq('id', idClienteFinal)
        .single();
      if (clienteActual)
        await supabase
          .from('clientes')
          .update({
            deuda_usd: Number(clienteActual.deuda_usd || 0) + montoUSDGuardar,
          })
          .eq('id', idClienteFinal);
    }

    await marcarComoPagado(datosCobroInscripcion.jugadorId, idClienteFinal);
    setDatosCobroInscripcion(null);
    onPagoRealizado();
  };

  const marcarComoPagado = async (
    jugadorId: number,
    clienteIdActualizado?: number | null
  ) => {
    const { data: torneoFresco } = await supabase
      .from('torneos')
      .select('participantes')
      .eq('id', torneoActivo.id)
      .single();
    if (torneoFresco) {
      const nuevaLista = torneoFresco.participantes.map((j: any) => {
        if (j.id === jugadorId) {
          return {
            ...j,
            estado_pago: 'Pagado',
            cliente_id: clienteIdActualizado || j.cliente_id,
          };
        }
        return j;
      });
      await supabase
        .from('torneos')
        .update({ participantes: nuevaLista })
        .eq('id', torneoActivo.id);
      setTorneoActivo({ ...torneoActivo, participantes: nuevaLista });
      cargarTorneos();
    }
  };

  const eliminarJugador = async (jugadorId: number) => {
    if (!window.confirm('¿Sacar a este jugador del torneo?')) return;
    const nuevaLista = torneoActivo.participantes.filter(
      (j: any) => j.id !== jugadorId
    );
    await supabase
      .from('torneos')
      .update({ participantes: nuevaLista })
      .eq('id', torneoActivo.id);
    setTorneoActivo({ ...torneoActivo, participantes: nuevaLista });
    cargarTorneos();
  };

  const generarFixtureYComenzar = async () => {
    if (torneoActivo.participantes?.length < 2)
      return alert('Necesitas al menos 2 jugadores.');
    if (
      !window.confirm(
        '⚠️ ¿Cerrar inscripciones y generar el calendario? Ya no podrás agregar jugadores.'
      )
    )
      return;

    let participantes = [...torneoActivo.participantes];
    let nuevosPartidos: any[] = [];

    if (torneoActivo.formato === 'Liga (Todos vs Todos)') {
      if (participantes.length % 2 !== 0)
        participantes.push({ id: 'bye', nombre: 'Libre (Descansa)' });
      const n = participantes.length;
      let ids = participantes.map((p) => p.id);

      for (let ronda = 0; ronda < n - 1; ronda++) {
        for (let i = 0; i < n / 2; i++) {
          const localId = ids[i];
          const visitanteId = ids[n - 1 - i];
          if (localId !== 'bye' && visitanteId !== 'bye') {
            nuevosPartidos.push({
              id: `match_${ronda}_${i}_${Date.now()}`,
              jornada: ronda + 1,
              local_id: localId,
              visitante_id: visitanteId,
              goles_local: null,
              goles_visitante: null,
              estado: 'Pendiente',
            });
          }
        }
        ids.splice(1, 0, ids.pop() as any);
      }
    } else {
      const mezclados = participantes.sort(() => Math.random() - 0.5);
      let nombreFaseInicial: string | number = 'Ronda 1';
      const jugCount = mezclados.length;
      if (jugCount <= 2) nombreFaseInicial = 'Gran Final';
      else if (jugCount <= 4) nombreFaseInicial = 'Semifinal';
      else if (jugCount <= 8) nombreFaseInicial = 'Cuartos de Final';

      for (let i = 0; i < mezclados.length; i += 2) {
        if (mezclados[i + 1]) {
          nuevosPartidos.push({
            id: `match_elim_${i}_${Date.now()}`,
            jornada: nombreFaseInicial,
            local_id: mezclados[i].id,
            visitante_id: mezclados[i + 1].id,
            goles_local: null,
            goles_visitante: null,
            estado: 'Pendiente',
          });
        }
      }
    }

    const { error } = await supabase
      .from('torneos')
      .update({ estado: 'En Curso', partidos: nuevosPartidos })
      .eq('id', torneoActivo.id);
    if (error) return alert('Error al iniciar: ' + error.message);
    setTorneoActivo({
      ...torneoActivo,
      estado: 'En Curso',
      partidos: nuevosPartidos,
    });
    cargarTorneos();
  };

  const generarSiguienteFase = async () => {
    if (!window.confirm('¿Generar los emparejamientos de la siguiente fase?'))
      return;

    const partidos = torneoActivo.partidos;
    const fases = [...new Set(partidos.map((p: any) => p.jornada))];
    const ultimaFase = fases[fases.length - 1];
    let avanzan = [];

    if (
      torneoActivo.formato === 'Liga (Todos vs Todos)' &&
      typeof ultimaFase === 'number'
    ) {
      const tablaOrdenada = [...torneoActivo.participantes].sort(
        (a: any, b: any) => {
          if (b.pts !== a.pts) return b.pts - a.pts;
          const difA = a.gf - a.gc;
          const difB = b.gf - b.gc;
          if (difB !== difA) return difB - difA;
          return b.gf - a.gf;
        }
      );
      if (tablaOrdenada.length >= 4) {
        avanzan = [
          tablaOrdenada[0].id,
          tablaOrdenada[3].id,
          tablaOrdenada[1].id,
          tablaOrdenada[2].id,
        ];
      } else {
        avanzan = [tablaOrdenada[0].id, tablaOrdenada[1].id];
      }
    } else {
      const partidosUltimaFase = partidos.filter(
        (p: any) => p.jornada === ultimaFase
      );
      avanzan = partidosUltimaFase.map((p: any) =>
        p.goles_local > p.goles_visitante ? p.local_id : p.visitante_id
      );
    }

    let nuevaFaseNombre: string | number = `Ronda de ${avanzan.length}`;
    if (avanzan.length === 8) nuevaFaseNombre = 'Cuartos de Final';
    if (avanzan.length === 4) nuevaFaseNombre = 'Semifinal';
    if (avanzan.length === 2) nuevaFaseNombre = 'Gran Final';

    let nuevosPartidos = [];
    for (let i = 0; i < avanzan.length; i += 2) {
      if (avanzan[i] && avanzan[i + 1]) {
        nuevosPartidos.push({
          id: `match_${nuevaFaseNombre}_${i}_${Date.now()}`,
          jornada: nuevaFaseNombre,
          local_id: avanzan[i],
          visitante_id: avanzan[i + 1],
          goles_local: null,
          goles_visitante: null,
          estado: 'Pendiente',
        });
      }
    }

    const partidosActualizados = [...partidos, ...nuevosPartidos];
    await supabase
      .from('torneos')
      .update({ partidos: partidosActualizados })
      .eq('id', torneoActivo.id);
    setTorneoActivo({ ...torneoActivo, partidos: partidosActualizados });
    cargarTorneos();
  };

  const registrarResultado = async (partidoId: string) => {
    const partido = torneoActivo.partidos.find((p: any) => p.id === partidoId);
    const local = torneoActivo.participantes.find(
      (j: any) => j.id === partido.local_id
    );
    const visitante = torneoActivo.participantes.find(
      (j: any) => j.id === partido.visitante_id
    );

    const esLiga = torneoActivo.formato === 'Liga (Todos vs Todos)';
    const terminoScore = esLiga
      ? '⚽ Goles marcados por'
      : '🥊 Sets/Peleas ganadas por';

    const resLocal = window.prompt(
      `${terminoScore} ${local?.nombre || 'Local'}:`,
      partido.goles_local ?? ''
    );
    if (resLocal === null || resLocal.trim() === '') return;
    const resVisit = window.prompt(
      `${terminoScore} ${visitante?.nombre || 'Visitante'}:`,
      partido.goles_visitante ?? ''
    );
    if (resVisit === null || resVisit.trim() === '') return;

    const gl = parseInt(resLocal);
    const gv = parseInt(resVisit);
    if (isNaN(gl) || isNaN(gv))
      return alert('Los resultados deben ser números.');

    if (gl === gv && !esLiga) {
      return alert(
        '¡En combates de Eliminatoria Directa no puede haber empates! Registra el resultado del ganador definitivo.'
      );
    }

    const nuevosPartidos = torneoActivo.partidos.map((p: any) => {
      if (p.id === partidoId)
        return {
          ...p,
          goles_local: gl,
          goles_visitante: gv,
          estado: 'Completado',
        };
      return p;
    });

    let nuevaTabla = torneoActivo.participantes.map((p: any) => ({
      ...p,
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      gf: 0,
      gc: 0,
      pts: 0,
    }));

    if (esLiga) {
      nuevosPartidos
        .filter(
          (p: any) => p.estado === 'Completado' && typeof p.jornada === 'number'
        )
        .forEach((pt: any) => {
          const l = nuevaTabla.find((j: any) => j.id === pt.local_id);
          const v = nuevaTabla.find((j: any) => j.id === pt.visitante_id);
          if (!l || !v) return;

          l.pj += 1;
          v.pj += 1;
          l.gf += pt.goles_local;
          l.gc += pt.goles_visitante;
          v.gf += pt.goles_visitante;
          v.gc += pt.goles_local;

          if (pt.goles_local > pt.goles_visitante) {
            l.g += 1;
            l.pts += 3;
            v.p += 1;
          } else if (pt.goles_local < pt.goles_visitante) {
            v.g += 1;
            v.pts += 3;
            l.p += 1;
          } else {
            l.e += 1;
            v.e += 1;
            l.pts += 1;
            v.pts += 1;
          }
        });

      nuevaTabla.sort((a: any, b: any) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        const difA = a.gf - a.gc;
        const difB = b.gf - b.gc;
        if (difB !== difA) return difB - difA;
        return b.gf - a.gf;
      });
    }

    let estadoTorneo = torneoActivo.estado;
    if (partido.jornada === 'Gran Final') estadoTorneo = 'Finalizado';

    await supabase
      .from('torneos')
      .update({
        partidos: nuevosPartidos,
        participantes: nuevaTabla,
        estado: estadoTorneo,
      })
      .eq('id', torneoActivo.id);
    setTorneoActivo({
      ...torneoActivo,
      partidos: nuevosPartidos,
      participantes: nuevaTabla,
      estado: estadoTorneo,
    });

    cargarTorneos();
  };

  const getNombreJugador = (id: string) => {
    if (id === 'bye') return 'Libre (Descansa)';
    return (
      torneoActivo.participantes.find((j: any) => j.id === id)?.nombre ||
      'Jugador Eliminado'
    );
  };

  const totalRecaudado =
    (torneoActivo?.participantes?.length || 0) *
    (torneoActivo?.inscripcion_usd || 0);
  const pozoGanador =
    totalRecaudado * ((torneoActivo?.porcentaje_pozo || 0) / 100);
  const todosPartidosCompletados =
    torneoActivo?.partidos?.length > 0 &&
    torneoActivo.partidos.every((p: any) => p.estado === 'Completado');
  const ultimaFase =
    torneoActivo?.partidos?.[torneoActivo.partidos.length - 1]?.jornada;
  const mostrarBotonSiguienteFase =
    todosPartidosCompletados &&
    ultimaFase !== 'Gran Final' &&
    torneoActivo.estado === 'En Curso';

  const esLigaActiva = torneoActivo?.formato === 'Liga (Todos vs Todos)';

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '1100px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {vista === 'lista' && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '24px',
                  color: '#d946ef',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                🏆 Gestión de Torneos
              </h2>
              <p
                style={{
                  margin: '5px 0 0 0',
                  color: '#887bb0',
                  fontSize: '13px',
                }}
              >
                Organiza Ligas o Eliminatorias, cobra inscripciones y registra
                resultados exactos.
              </p>
            </div>
            <button
              onClick={abrirCrearTorneo}
              style={{
                background: 'linear-gradient(90deg, #d946ef, #9333ea)',
                border: 'none',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              + Crear Torneo
            </button>
          </div>

          {cargando ? (
            <div
              style={{ textAlign: 'center', color: '#887bb0', padding: '40px' }}
            >
              Cargando torneos...
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {torneos.map((t) => {
                const isFinalizado = t.estado === 'Finalizado';
                const isEnCurso = t.estado === 'En Curso';
                const gradienteBorde = isFinalizado
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : isEnCurso
                  ? 'linear-gradient(90deg, #00d2ff, #00e676)'
                  : 'linear-gradient(90deg, #00d2ff, #d946ef)';
                const colorTextoEstado = isFinalizado
                  ? '#f59e0b'
                  : isEnCurso
                  ? '#00d2ff'
                  : '#d946ef';

                return (
                  <div
                    key={t.id}
                    style={{
                      background: 'rgba(21, 14, 40, 0.6)',
                      border: `1px solid ${
                        isEnCurso
                          ? '#00d2ff'
                          : isFinalizado
                          ? '#f59e0b'
                          : '#3c2a7a'
                      }`,
                      borderRadius: '16px',
                      padding: '20px',
                      position: 'relative',
                      overflow: 'hidden',
                      backdropFilter: 'blur(10px)',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: gradienteBorde,
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <h3
                        style={{
                          margin: '0 0 5px 0',
                          color: '#fff',
                          fontSize: '18px',
                        }}
                      >
                        {t.nombre}
                      </h3>
                      <span
                        style={{
                          fontSize: '9px',
                          background: `rgba(0,0,0,0.5)`,
                          border: `1px solid ${colorTextoEstado}`,
                          color: colorTextoEstado,
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                        }}
                      >
                        {t.estado}
                      </span>
                    </div>
                    <div
                      style={{
                        color: '#00d2ff',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        marginBottom: '15px',
                      }}
                    >
                      🎮 {t.juego}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#887bb0',
                        marginBottom: '20px',
                      }}
                    >
                      <div>
                        📅 <strong>Fecha:</strong> {t.fecha}
                      </div>
                      <div>
                        💰 <strong>Inscripción:</strong> $
                        {Number(t.inscripcion_usd).toFixed(2)}
                      </div>
                      <div>
                        🎁 <strong>Premio Meta:</strong> {t.premio} (
                        {t.porcentaje_pozo}%)
                      </div>
                      <div>
                        👥 <strong>Cupos:</strong>{' '}
                        {t.participantes?.length || 0} /{' '}
                        {t.participantes_max === 999
                          ? '∞'
                          : t.participantes_max}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => abrirDetalle(t)}
                        style={{
                          flex: 1,
                          background: 'rgba(217, 70, 239, 0.1)',
                          border: '1px solid #d946ef',
                          color: '#d946ef',
                          padding: '10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {isFinalizado ? 'Ver Resultados' : 'Gestionar Torneo'}
                      </button>
                      <button
                        onClick={() => eliminarTorneo(t.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #ef4444',
                          color: '#ef4444',
                          padding: '10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {vista === 'detalle' && torneoActivo && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '25px',
            }}
          >
            <button
              onClick={volverALista}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ←
            </button>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                {torneoActivo.nombre}{' '}
                <span
                  style={{
                    background:
                      torneoActivo.estado === 'En Curso'
                        ? '#004d40'
                        : torneoActivo.estado === 'Finalizado'
                        ? '#78350f'
                        : '#3c2a7a',
                    color:
                      torneoActivo.estado === 'En Curso'
                        ? '#00e676'
                        : torneoActivo.estado === 'Finalizado'
                        ? '#f59e0b'
                        : '#d946ef',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    border: '1px solid',
                  }}
                >
                  {torneoActivo.estado}
                </span>
              </h2>
              <span style={{ color: '#887bb0', fontSize: '12px' }}>
                {torneoActivo.juego} • {torneoActivo.formato}
              </span>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <button
                onClick={abrirEditarTorneo}
                style={{
                  background: 'transparent',
                  border: '1px solid #3c2a7a',
                  color: '#00d2ff',
                  padding: '8px 15px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                ⚙️ Ajustes
              </button>
            </div>
          </div>

          {torneoActivo.estado === 'Finalizado' && (
            <div
              style={{
                background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '25px',
                boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)',
                border: '2px solid #fff',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏆</div>
              <h2
                style={{
                  margin: 0,
                  color: '#000',
                  fontSize: '24px',
                  textTransform: 'uppercase',
                  fontWeight: '900',
                }}
              >
                ¡Campeón del Torneo!
              </h2>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#fff',
                  marginTop: '10px',
                  textShadow: '0 2px 5px rgba(0,0,0,0.5)',
                }}
              >
                {(() => {
                  const finalMatch = torneoActivo.partidos.find(
                    (p: any) => p.jornada === 'Gran Final'
                  );
                  if (finalMatch) {
                    const winnerId =
                      finalMatch.goles_local > finalMatch.goles_visitante
                        ? finalMatch.local_id
                        : finalMatch.visitante_id;
                    return getNombreJugador(winnerId);
                  }
                  return 'Desconocido';
                })()}
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '25px',
            }}
          >
            <div
              style={{
                background: 'rgba(21, 14, 40, 0.6)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                padding: '20px',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: '#887bb0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Inscripción
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  color: '#00e676',
                  marginTop: '5px',
                }}
              >
                ${Number(torneoActivo.inscripcion_usd).toFixed(2)}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(21, 14, 40, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '20px',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: '#887bb0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Total Recaudado Bruto
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  color: '#fff',
                  marginTop: '5px',
                }}
              >
                ${totalRecaudado.toFixed(2)}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(21, 14, 40, 0.6)',
                border: '1px solid rgba(217, 70, 239, 0.3)',
                padding: '20px',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: '#d946ef',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                🎁 Pozo Ganador ({torneoActivo.porcentaje_pozo}%)
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  color: '#d946ef',
                  marginTop: '5px',
                }}
              >
                ${pozoGanador.toFixed(2)}
              </div>
              <div
                style={{ fontSize: '11px', color: '#887bb0', marginTop: '5px' }}
              >
                Meta Original: {torneoActivo.premio}
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(21, 14, 40, 0.7)',
              borderRadius: '16px',
              border: '1px solid #3c2a7a',
              overflow: 'hidden',
              marginBottom: '25px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 20px',
                borderBottom: '1px solid #251b45',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: '#fff',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: '#d946ef' }}>👥</span> Participantes (
                {torneoActivo.participantes?.length || 0})
              </h3>
              {torneoActivo.estado === 'Inscripcion' && (
                <button
                  onClick={() => setMostrarModalInscripcion(true)}
                  style={{
                    background: 'linear-gradient(90deg, #d946ef, #9333ea)',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 15px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  + Inscribir
                </button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                padding: '10px 20px',
                background: 'rgba(13, 9, 26, 0.8)',
                fontSize: '10px',
                color: '#887bb0',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              <div style={{ flex: 2 }}>Jugador</div>
              <div style={{ flex: 1, textAlign: 'center' }}>Estado de Pago</div>
              {torneoActivo.estado === 'Inscripcion' && (
                <div style={{ flex: 1, textAlign: 'right' }}>Acciones</div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {!torneoActivo.participantes ||
              torneoActivo.participantes.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#55497a',
                    padding: '30px',
                    fontSize: '13px',
                  }}
                >
                  Nadie inscrito todavía.
                </div>
              ) : (
                torneoActivo.participantes.map((j: any) => (
                  <div
                    key={j.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '15px 20px',
                      borderBottom: '1px solid rgba(37, 27, 69, 0.3)',
                    }}
                  >
                    <div
                      style={{
                        flex: 2,
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '13px',
                      }}
                    >
                      {j.nombre}
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      {j.estado_pago === 'Pendiente' ? (
                        <span
                          style={{
                            color: '#f59e0b',
                            border: '1px solid #f59e0b',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                          }}
                        >
                          Pendiente
                        </span>
                      ) : (
                        <span
                          style={{
                            color: '#00e676',
                            border: '1px solid #00e676',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                          }}
                        >
                          Pagado
                        </span>
                      )}
                    </div>
                    {torneoActivo.estado === 'Inscripcion' && (
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '10px',
                        }}
                      >
                        {j.estado_pago === 'Pendiente' && (
                          <button
                            onClick={() =>
                              abrirCobroInscripcion(j.id, j.cliente_id)
                            }
                            style={{
                              background: 'rgba(0, 230, 118, 0.1)',
                              border: '1px solid #00e676',
                              color: '#00e676',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                            }}
                          >
                            Cobrar
                          </button>
                        )}
                        <button
                          onClick={() => eliminarJugador(j.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {torneoActivo.estado === 'Inscripcion' &&
              torneoActivo.participantes?.length > 1 && (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    borderTop: '1px solid #251b45',
                  }}
                >
                  <button
                    onClick={generarFixtureYComenzar}
                    style={{
                      background: 'linear-gradient(90deg, #d946ef, #9333ea)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 30px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(217, 70, 239, 0.3)',
                    }}
                  >
                    ▷ COMENZAR TORNEO
                  </button>
                </div>
              )}
          </div>

          {/* TABLA DE POSICIONES INTELIGENTE */}
          {torneoActivo.participantes?.length > 0 && esLigaActiva && (
            <div
              style={{
                background: 'rgba(21, 14, 40, 0.7)',
                borderRadius: '16px',
                border: '1px solid #3c2a7a',
                overflow: 'hidden',
                marginBottom: '25px',
              }}
            >
              <h3
                style={{
                  padding: '15px 20px',
                  margin: 0,
                  color: '#fff',
                  fontSize: '14px',
                  borderBottom: '1px solid #251b45',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: '#00d2ff' }}>📊</span> Tabla de Posiciones
              </h3>
              <div
                style={{
                  display: 'flex',
                  padding: '10px 20px',
                  background: 'rgba(13, 9, 26, 0.8)',
                  fontSize: '9px',
                  color: '#887bb0',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}
              >
                <div style={{ width: '20px' }}>#</div>
                <div style={{ flex: 2 }}>Jugador</div>
                <div style={{ width: '30px', textAlign: 'center' }}>PJ</div>
                <div style={{ width: '30px', textAlign: 'center' }}>G</div>
                <div style={{ width: '30px', textAlign: 'center' }}>E</div>
                <div style={{ width: '30px', textAlign: 'center' }}>P</div>
                <div
                  style={{
                    width: '30px',
                    textAlign: 'center',
                    color: '#00e676',
                  }}
                >
                  GF
                </div>
                <div
                  style={{
                    width: '30px',
                    textAlign: 'center',
                    color: '#ef4444',
                  }}
                >
                  GC
                </div>
                <div style={{ width: '30px', textAlign: 'center' }}>DG</div>
                <div
                  style={{
                    width: '40px',
                    textAlign: 'center',
                    color: '#d946ef',
                  }}
                >
                  PTS
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {torneoActivo.participantes.map((j: any, i: number) => (
                  <div
                    key={j.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 20px',
                      borderBottom: '1px solid rgba(37, 27, 69, 0.3)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ width: '20px', color: '#887bb0' }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 2, color: '#fff', fontWeight: 'bold' }}>
                      {i === 0 && j.pj > 0 && '🏆 '} {j.nombre}
                    </div>
                    <div
                      style={{
                        width: '30px',
                        textAlign: 'center',
                        color: '#a092c4',
                      }}
                    >
                      {j.pj}
                    </div>
                    <div
                      style={{
                        width: '30px',
                        textAlign: 'center',
                        color: '#00d2ff',
                      }}
                    >
                      {j.g}
                    </div>
                    <div
                      style={{
                        width: '30px',
                        textAlign: 'center',
                        color: '#887bb0',
                      }}
                    >
                      {j.e}
                    </div>
                    <div
                      style={{
                        width: '30px',
                        textAlign: 'center',
                        color: '#ef4444',
                      }}
                    >
                      {j.p}
                    </div>
                    <div
                      style={{
                        width: '30px',
                        textAlign: 'center',
                        color: '#00e676',
                      }}
                    >
                      {j.gf}
                    </div>
                    <div
                      style={{
                        width: '30px',
                        textAlign: 'center',
                        color: '#ef4444',
                      }}
                    >
                      {j.gc}
                    </div>
                    <div
                      style={{
                        width: '30px',
                        textAlign: 'center',
                        color: '#fff',
                      }}
                    >
                      {j.gf - j.gc}
                    </div>
                    <div
                      style={{
                        width: '40px',
                        textAlign: 'center',
                        color: '#d946ef',
                        fontWeight: '900',
                      }}
                    >
                      {j.pts}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FIXTURE Y LLAVES */}
          {(torneoActivo.estado === 'En Curso' ||
            torneoActivo.estado === 'Finalizado') &&
            torneoActivo.partidos?.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3
                  style={{
                    color: '#00d2ff',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '20px',
                  }}
                >
                  ⚔️{' '}
                  {esLigaActiva
                    ? 'Calendario de Partidos'
                    : 'Llaves (Brackets)'}
                </h3>

                {Object.entries(
                  torneoActivo.partidos.reduce(
                    (acc: any, p: any) => ({
                      ...acc,
                      [p.jornada]: [...(acc[p.jornada] || []), p],
                    }),
                    {}
                  )
                ).map(([jornada, partidosFase]: any) => (
                  <div
                    key={jornada}
                    style={{
                      marginBottom: '20px',
                      background: 'rgba(21, 14, 40, 0.4)',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #3c2a7a',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 15px 0',
                        color: '#d946ef',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      {esLigaActiva && !isNaN(Number(jornada))
                        ? `JORNADA ${jornada}`
                        : jornada}
                    </h4>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '15px',
                      }}
                    >
                      {partidosFase.map((p: any) => {
                        const esGanadorLocal =
                          p.estado === 'Completado' &&
                          p.goles_local > p.goles_visitante;
                        const esGanadorVisitante =
                          p.estado === 'Completado' &&
                          p.goles_visitante > p.goles_local;

                        return (
                          <div
                            key={p.id}
                            style={{
                              background: '#090514',
                              padding: '15px',
                              borderRadius: '8px',
                              border:
                                p.estado === 'Completado'
                                  ? '1px solid #00e676'
                                  : '1px dashed #3c2a7a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span
                              style={{
                                color: esGanadorLocal
                                  ? '#00e676'
                                  : p.estado === 'Completado'
                                  ? '#55497a'
                                  : '#fff',
                                fontWeight: esGanadorLocal ? '900' : 'bold',
                                width: '35%',
                                textAlign: 'right',
                                fontSize: '12px',
                                transition: 'all 0.3s',
                              }}
                            >
                              {esGanadorLocal && '🏆 '}{' '}
                              {getNombreJugador(p.local_id)}
                            </span>

                            <div
                              style={{
                                display: 'flex',
                                gap: '5px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30%',
                              }}
                            >
                              {p.estado === 'Completado' ? (
                                <button
                                  style={{
                                    background: '#3c2a7a',
                                    color: '#fff',
                                    padding: '5px 15px',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    fontSize: '14px',
                                  }}
                                >
                                  {p.goles_local} - {p.goles_visitante}
                                </button>
                              ) : (
                                <button
                                  onClick={() => registrarResultado(p.id)}
                                  style={{
                                    background: 'rgba(217, 70, 239, 0.2)',
                                    border: '1px solid #d946ef',
                                    color: '#d946ef',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  Registrar
                                </button>
                              )}
                            </div>

                            <span
                              style={{
                                color: esGanadorVisitante
                                  ? '#00e676'
                                  : p.estado === 'Completado'
                                  ? '#55497a'
                                  : '#fff',
                                fontWeight: esGanadorVisitante ? '900' : 'bold',
                                width: '35%',
                                textAlign: 'left',
                                fontSize: '12px',
                                transition: 'all 0.3s',
                              }}
                            >
                              {getNombreJugador(p.visitante_id)}{' '}
                              {esGanadorVisitante && ' 🏆'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {mostrarBotonSiguienteFase && (
                  <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <button
                      onClick={generarSiguienteFase}
                      style={{
                        background: 'linear-gradient(90deg, #00e676, #00b0ff)',
                        border: 'none',
                        color: '#000',
                        padding: '15px 40px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        boxShadow: '0 10px 30px rgba(0, 230, 118, 0.3)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {ultimaFase === 'Semifinal'
                        ? '⚔️ Generar Gran Final'
                        : '🏆 Generar Siguiente Ronda'}
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {/* --- MODAL CREAR/EDITAR TORNEO --- */}
      {mostrarModal && (
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
          }}
        >
          <div
            style={{
              background: '#0b0815',
              padding: '30px',
              borderRadius: '20px',
              width: '400px',
              border: '1px solid #3c2a7a',
              boxShadow: '0 25px 50px rgba(217, 70, 239, 0.2)',
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
                  color: '#d946ef',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {modoModal === 'crear' ? '🏆 Nuevo Torneo' : '⚙️ Editar Torneo'}
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
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

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
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
                  Nombre del Torneo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Liga de FIFA o Torneo MK"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
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
                  Videojuego
                </label>
                <input
                  type="text"
                  placeholder="Ej: Mortal Kombat 1"
                  value={juego}
                  onChange={(e) => setJuego(e.target.value)}
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
                    Formato
                  </label>
                  <select
                    value={formato}
                    onChange={(e) => setFormato(e.target.value)}
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
                    <option value="Liga (Todos vs Todos)">
                      Liga (Puntos / Fútbol)
                    </option>
                    <option value="Eliminatoria Directa">
                      Eliminatoria Directa (Llaves / Pelea)
                    </option>
                  </select>
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
                    Máx. Jugadores
                  </label>
                  <select
                    value={maxJugadores}
                    onChange={(e) => setMaxJugadores(e.target.value)}
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
                    <option>Sin Límite</option>
                    <option>4 Jugadores</option>
                    <option>8 Jugadores</option>
                    <option>16 Jugadores</option>
                    <option>32 Jugadores</option>
                  </select>
                </div>
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
                    Precio Inscripción ($)
                  </label>
                  <input
                    type="number"
                    placeholder="5.00"
                    value={inscripcion}
                    onChange={(e) => setInscripcion(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(21, 14, 40, 0.8)',
                      border: '1px solid #251b45',
                      color: '#00e676',
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
                      fontSize: '11px',
                      color: '#887bb0',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Premio al Ganador ($)
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 20"
                    value={premioEstimado}
                    onChange={(e) => handlePremioChange(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(21, 14, 40, 0.8)',
                      border: '1px solid #251b45',
                      color: '#d946ef',
                      fontWeight: 'bold',
                      padding: '12px',
                      borderRadius: '8px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <label
                    style={{
                      fontSize: '11px',
                      color: '#887bb0',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Porcentaje para el Pozo
                  </label>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#d946ef',
                      fontWeight: 'bold',
                    }}
                  >
                    {porcentaje}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={porcentaje}
                  onChange={(e) =>
                    handlePorcentajeChange(Number(e.target.value))
                  }
                  style={{
                    width: '100%',
                    accentColor: '#d946ef',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => setMostrarModal(false)}
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
                  onClick={guardarTorneo}
                  style={{
                    flex: 1,
                    background: '#d946ef',
                    border: 'none',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  {modoModal === 'crear' ? 'Crear Torneo' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL INSCRIPCIÓN VINCULADO AL CRM --- */}
      {mostrarModalInscripcion && (
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
          }}
        >
          <div
            style={{
              background: '#0b0815',
              padding: '30px',
              borderRadius: '20px',
              width: '400px',
              border: '1px solid #3c2a7a',
              boxShadow: '0 25px 50px rgba(217, 70, 239, 0.2)',
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
                  color: '#d946ef',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ✍️ Inscribir Jugador
              </h3>
              <button
                onClick={() => setMostrarModalInscripcion(false)}
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
                onClick={() => setModoInscripcion('existente')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background:
                    modoInscripcion === 'existente' ? '#3c2a7a' : 'transparent',
                  color: modoInscripcion === 'existente' ? '#fff' : '#887bb0',
                }}
              >
                Cliente Registrado
              </button>
              <button
                onClick={() => setModoInscripcion('nuevo')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background:
                    modoInscripcion === 'nuevo' ? '#3c2a7a' : 'transparent',
                  color: modoInscripcion === 'nuevo' ? '#fff' : '#887bb0',
                }}
              >
                Nuevo Cliente
              </button>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              {modoInscripcion === 'existente' ? (
                <div>
                  <label
                    style={{
                      fontSize: '11px',
                      color: '#887bb0',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Buscar Cliente en Club Gamer
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
                    <option value="">-- Selecciona un jugador --</option>
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
                  onClick={() => setMostrarModalInscripcion(false)}
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
                  onClick={procesarInscripcion}
                  style={{
                    flex: 1,
                    background: '#d946ef',
                    border: 'none',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Guardar Inscripción
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {datosCobroInscripcion && (
        <ModalCobro
          datos={datosCobroInscripcion}
          onClose={() => setDatosCobroInscripcion(null)}
          onConfirm={ejecutarCobroInscripcion}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

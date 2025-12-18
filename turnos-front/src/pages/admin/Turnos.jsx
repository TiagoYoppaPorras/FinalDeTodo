import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import DataTable from "../../components/common/DataTable";
import { CalendarDays, PlusCircle, Edit, Trash2, CheckCircle, XCircle, FileText, AlertCircle } from "lucide-react";
import EditModal from "../../components/common/EditModal";
import { useNavigate } from "react-router-dom";
import { alertaExito, alertaError, confirmarAccion } from "../../utils/alerts";

// 🔴 CORRECCIÓN: Definidos FUERA del componente principal
const InputConError = ({ type = "text", value, onChange, error, min, max, placeholder, className }) => (
    <div className="w-full">
        <div className="relative">
            <input 
                type={type} 
                className={`${className} transition-colors outline-none w-full
                    ${error ? "border-red-500 bg-red-50 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                value={value} 
                onChange={onChange}
                min={min}
                max={max}
                placeholder={placeholder}
            />
            {error && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
            )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
);

const SelectConError = ({ value, onChange, error, options, defaultText, className }) => (
    <div className="w-full">
        <div className="relative">
            <select 
                className={`${className} transition-colors outline-none w-full appearance-none
                    ${error ? "border-red-500 bg-red-50 focus:border-red-500 text-red-900" : "border-gray-300 focus:border-blue-500"}`}
                value={value} 
                onChange={onChange}
            >
                <option value="">{defaultText}</option>
                {options.map((op) => (
                    <option key={op.id} value={op.id}>
                        {op.nombre || op.user?.nombre || `Item #${op.id}`} 
                        {op.ubicacion ? ` (${op.ubicacion})` : ""}
                    </option>
                ))}
            </select>
            {error && (
                <div className="absolute inset-y-0 right-6 pr-2 flex items-center pointer-events-none">
                     <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
            )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
);

export default function Turnos() {
  const [turnos, setTurnos] = useState([]);
  
  // Estado para manejar los errores de validación
  const [errores, setErrores] = useState({});

  const [nuevoTurno, setNuevoTurno] = useState({
    paciente_id: "", kinesiologo_id: "", servicio_id: "", sala_id: "", fecha: "", hora: "", motivo: "",
  });

  const [pacientes, setPacientes] = useState([]);
  const [kines, setKines] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Estados para edición
  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // Obtener fecha de hoy formato YYYY-MM-DD
  const hoyString = new Date().toLocaleDateString('en-CA'); 

  // Lógica para detectar qué campo falló desde el backend
  const procesarErrorBackend = (err) => {
    const mensaje = err.response?.data?.detail || "Error desconocido";
    const nuevosErrores = {};
    const txt = typeof mensaje === 'string' ? mensaje.toLowerCase() : "";

    if (txt.includes("kinesiólogo") || txt.includes("kinesiologo")) {
        nuevosErrores.kinesiologo_id = mensaje;
    } else if (txt.includes("sala")) {
        nuevosErrores.sala_id = mensaje;
    } else if (txt.includes("paciente")) {
        nuevosErrores.paciente_id = mensaje;
    } else if (txt.includes("pasado") || txt.includes("fin de semana") || txt.includes("horario")) {
        nuevosErrores.fecha = mensaje;
        nuevosErrores.hora = "Verificar horario";
    } else {
        alertaError(mensaje); // Si no es un error de campo, mostrar alerta general
        return;
    }
    setErrores(nuevosErrores);
  };

  const calcularMinimoHora = (fechaSeleccionada) => {
    const HORA_APERTURA = "08:00";
    if (!fechaSeleccionada) return HORA_APERTURA;
    if (fechaSeleccionada === hoyString) {
        const ahora = new Date();
        const horas = String(ahora.getHours()).padStart(2, '0');
        const minutos = String(ahora.getMinutes()).padStart(2, '0');
        const horaActual = `${horas}:${minutos}`;
        return horaActual > HORA_APERTURA ? horaActual : HORA_APERTURA;
    }
    return HORA_APERTURA;
  };

  const fetchData = async () => {
    try {
      const [resTurnos, resPac, resKine, resServ, resSalas] = await Promise.all([
        api.get("/turnos/"),
        api.get("/pacientes/"),
        api.get("/kinesiologos/"),
        api.get("/servicios/"),
        api.get("/salas/"),
      ]);

      const turnosOrdenados = resTurnos.data.sort((a, b) => b.id - a.id);
      
      setTurnos(turnosOrdenados);
      setPacientes(resPac.data);
      setKines(resKine.data);
      setServicios(resServ.data);
      setSalas(resSalas.data);
    } catch (err) {
      console.error("❌ Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Unificamos la lógica de cambio de inputs para limpiar errores automáticamente
  const handleChange = (campo, valor, esEdicion = false) => {
    // 1. Actualizar el estado correspondiente
    if (esEdicion) {
        setDatosEdicion(prev => ({ ...prev, [campo]: valor }));
    } else {
        setNuevoTurno(prev => ({ ...prev, [campo]: valor }));
    }

    // 2. Limpiar el error visual de ese campo si existe
    if (errores[campo]) {
        setErrores(prev => ({ ...prev, [campo]: null }));
    } else if (campo === 'hora' && errores.fecha) {
        // A veces corregir la hora arregla el error de fecha/hora conjunto
        setErrores(prev => ({ ...prev, fecha: null, hora: null }));
    }

    // 3. Validaciones Frontend Inmediatas (Fines de semana)
    if (campo === 'fecha' && valor) {
        const dateObj = new Date(valor + "T00:00:00");
        const diaSemana = dateObj.getDay(); // 0=Domingo, 6=Sábado
        
        if (diaSemana === 0 || diaSemana === 6) {
             setErrores(prev => ({ ...prev, fecha: "No se pueden asignar turnos los Sábados ni Domingos." }));
             // Limpiamos la fecha en el estado para forzar corrección
             if(esEdicion) setDatosEdicion(prev => ({ ...prev, fecha: "" }));
             else setNuevoTurno(prev => ({ ...prev, fecha: "" }));
        } else {
            // Lógica de hora mínima si cambia la fecha
            const nuevaHoraMinima = calcularMinimoHora(valor);
            const stateActual = esEdicion ? datosEdicion : nuevoTurno;
            const horaKey = esEdicion ? 'hora_inicio' : 'hora';
            const horaActual = stateActual[horaKey];

            if (horaActual && horaActual < nuevaHoraMinima) {
                 // Resetear hora si quedó inválida
                 if(esEdicion) setDatosEdicion(prev => ({ ...prev, hora_inicio: "" }));
                 else setNuevoTurno(prev => ({ ...prev, hora: "" }));
            }
        }
    }
  };

  const handleCrearTurno = async (e) => {
    e.preventDefault();
    setErrores({}); // Limpiar errores previos
    
    // Validación básica de campos obligatorios
    if (!nuevoTurno.paciente_id || !nuevoTurno.kinesiologo_id || !nuevoTurno.servicio_id) {
      alertaError("Complete los campos obligatorios");
      return;
    }

    try {
      const payload = {
        fecha: nuevoTurno.fecha,
        hora_inicio: nuevoTurno.hora,
        estado: "pendiente",
        motivo: nuevoTurno.motivo,
        observaciones: "",
        paciente_id: parseInt(nuevoTurno.paciente_id),
        kinesiologo_id: parseInt(nuevoTurno.kinesiologo_id),
        servicio_id: parseInt(nuevoTurno.servicio_id),
        sala_id: nuevoTurno.sala_id ? parseInt(nuevoTurno.sala_id) : null,
      };

      await api.post("/turnos/", payload);
      alertaExito("Turno agendado exitosamente");
      setNuevoTurno({ paciente_id: "", kinesiologo_id: "", servicio_id: "", sala_id: "", fecha: "", hora: "", motivo: "" });
      fetchData();
    } catch (err) {
      procesarErrorBackend(err); // 👈 Capturamos y mostramos el error visualmente
    }
  };

  const handleEdit = (turno) => {
    setEditando(turno.id);
    setErrores({}); // Limpiar errores al abrir
    setDatosEdicion({
      paciente_id: turno.paciente_id,
      kinesiologo_id: turno.kinesiologo_id,
      servicio_id: turno.servicio_id || "",
      sala_id: turno.sala_id || "",
      fecha: turno.fecha,
      hora_inicio: turno.hora_inicio?.slice(0, 5) || "",
      hora_fin: turno.hora_fin?.slice(0, 5) || "",
      estado: turno.estado,
      motivo: turno.motivo || "",
      observaciones: turno.observaciones || "",
    });
  };

  const handleUpdate = async () => {
    setIsLoadingSave(true);
    setErrores({}); // Limpiar errores previos

    try {
      const payload = {
        paciente_id: parseInt(datosEdicion.paciente_id),
        kinesiologo_id: parseInt(datosEdicion.kinesiologo_id),
        servicio_id: datosEdicion.servicio_id ? parseInt(datosEdicion.servicio_id) : null,
        sala_id: datosEdicion.sala_id ? parseInt(datosEdicion.sala_id) : null,
        fecha: datosEdicion.fecha,
        hora_inicio: datosEdicion.hora_inicio,
        hora_fin: datosEdicion.hora_fin,
        estado: datosEdicion.estado,
        motivo: datosEdicion.motivo,
        observaciones: datosEdicion.observaciones,
      };
      await api.put(`/turnos/${editando}`, payload);
      alertaExito("Turno actualizado correctamente");
      setEditando(null);
      setDatosEdicion({});
      fetchData();
    } catch (err) {
      procesarErrorBackend(err); // 👈 Capturamos error en edición también
    } finally {
      setIsLoadingSave(false);
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.patch(`/turnos/${id}/estado?estado=${nuevoEstado}`);
      fetchData();
    } catch (err) {
      console.error("Error cambiando estado:", err);
      alertaError("No se pudo cambiar el estado");
    }
  };

  const eliminarTurno = async (item) => {
    const confirmado = await confirmarAccion("¿Eliminar turno?", "Esta acción no se puede deshacer.");
    if (!confirmado) return;

    try {
      await api.delete(`/turnos/${item.id}`);
      alertaExito("Turno eliminado");
      fetchData();
    } catch (err) {
      console.error("Error al eliminar turno:", err);
      alertaError("Error al eliminar turno");
    }
  };

  const columns = [
    { key: "id", label: "ID", render: (t) => <span className="text-gray-500">#{t.id}</span> },
    { key: "paciente", label: "Paciente", render: (t) => t.paciente?.user?.nombre || "—" },
    { key: "kinesiologo", label: "Kinesiólogo", render: (t) => t.kinesiologo?.user?.nombre || "—" },
    { key: "servicio", label: "Servicio", render: (t) => t.servicio?.nombre || "—" },
    { key: "sala", label: "Sala", render: (t) => t.sala?.nombre || "—" },
    { key: "fecha", label: "Fecha" },
    { key: "hora", label: "Hora", render: (t) => t.hora_inicio?.slice(0, 5) || "—" },
    { 
      key: "estado", 
      label: "Estado", 
      render: (t) => (
        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
          ${t.estado === 'confirmado' ? 'bg-green-100 text-green-700' : 
            t.estado === 'cancelado' ? 'bg-red-100 text-red-700' : 
            'bg-yellow-100 text-yellow-700'}`}>
          {t.estado}
        </span>
      )
    },
    { 
      key: "acciones", 
      label: "Acciones", 
      render: (t) => (
        <div className="flex gap-2 justify-end md:justify-start">
            <button onClick={() => handleEdit(t)} className="bg-yellow-100 text-yellow-700 p-1.5 rounded hover:bg-yellow-200" title="Editar">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => cambiarEstado(t.id, "confirmado")} className="bg-green-100 text-green-700 p-1.5 rounded hover:bg-green-200" title="Confirmar">
              <CheckCircle className="w-4 h-4" />
            </button>
            <button onClick={() => cambiarEstado(t.id, "cancelado")} className="bg-red-100 text-red-700 p-1.5 rounded hover:bg-red-200" title="Cancelar">
              <XCircle className="w-4 h-4" />
            </button>
            <button onClick={() => eliminarTurno(t)} className="bg-gray-100 text-gray-700 p-1.5 rounded hover:bg-gray-200" title="Eliminar">
              <Trash2 className="w-4 h-4" />
            </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-600">Cargando turnos...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-600" />
          Gestión de Turnos
        </h1>

        {/* 🔴 Formulario Nuevo Turno Actualizado */}
        <form onSubmit={handleCrearTurno} className="bg-white border rounded-lg shadow-sm p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <SelectConError 
                className="border p-2 rounded w-full"
                value={nuevoTurno.paciente_id} 
                onChange={(e) => handleChange("paciente_id", e.target.value)}
                options={pacientes}
                defaultText="Seleccione Paciente"
                error={errores.paciente_id}
            />

            <SelectConError 
                className="border p-2 rounded w-full"
                value={nuevoTurno.kinesiologo_id} 
                onChange={(e) => handleChange("kinesiologo_id", e.target.value)}
                options={kines}
                defaultText="Seleccione Kinesiólogo"
                error={errores.kinesiologo_id}
            />

            <SelectConError 
                className="border p-2 rounded w-full"
                value={nuevoTurno.servicio_id} 
                onChange={(e) => handleChange("servicio_id", e.target.value)}
                options={servicios}
                defaultText="Seleccione Servicio"
                error={errores.servicio_id}
            />

            <SelectConError 
                className="border p-2 rounded w-full"
                value={nuevoTurno.sala_id} 
                onChange={(e) => handleChange("sala_id", e.target.value)}
                options={salas}
                defaultText="Seleccione Sala (Opcional)"
                error={errores.sala_id}
            />

            <InputConError 
                type="date"
                className="border p-2 rounded w-full"
                value={nuevoTurno.fecha} 
                min={hoyString}
                onChange={(e) => handleChange("fecha", e.target.value)} 
                error={errores.fecha}
            />

            <InputConError 
                type="time" 
                className="border p-2 rounded w-full"
                value={nuevoTurno.hora} 
                min={calcularMinimoHora(nuevoTurno.fecha)}
                max="22:00"
                onChange={(e) => handleChange("hora", e.target.value)} 
                error={errores.hora}
            />

            <input type="text" placeholder="Motivo del turno" className="border p-2 rounded md:col-span-3 w-full" value={nuevoTurno.motivo} onChange={(e) => handleChange("motivo", e.target.value)} />
          </div>
          <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full md:w-auto justify-center">
            <PlusCircle className="w-5 h-5" /> Crear Turno
          </button>
        </form>

        <DataTable 
          data={turnos} 
          columns={columns} 
          emptyMessage="No hay turnos registrados." 
        />

        {/* 🔴 Modal de edición Actualizado */}
        <EditModal
          isOpen={editando !== null}
          onClose={() => { setEditando(null); setDatosEdicion({}); setErrores({}); }}
          title="Editar Turno"
          onSave={handleUpdate}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                <SelectConError 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={datosEdicion.paciente_id || ""} 
                    onChange={(e) => handleChange("paciente_id", e.target.value, true)}
                    options={pacientes}
                    defaultText="Seleccione"
                    error={errores.paciente_id}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kinesiólogo</label>
                <SelectConError 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={datosEdicion.kinesiologo_id || ""} 
                    onChange={(e) => handleChange("kinesiologo_id", e.target.value, true)}
                    options={kines}
                    defaultText="Seleccione"
                    error={errores.kinesiologo_id}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
                <SelectConError 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={datosEdicion.sala_id || ""} 
                    onChange={(e) => handleChange("sala_id", e.target.value, true)}
                    options={salas}
                    defaultText="Sin Sala"
                    error={errores.sala_id}
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2" value={datosEdicion.estado || ""} onChange={(e) => handleChange("estado", e.target.value, true)}>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="completado">Completado</option>
                  </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <InputConError 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={datosEdicion.fecha || ""} 
                    min={hoyString}
                    onChange={(e) => handleChange("fecha", e.target.value, true)}
                    error={errores.fecha}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <InputConError 
                    type="time" 
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={datosEdicion.hora_inicio || ""} 
                    min={calcularMinimoHora(datosEdicion.fecha)}
                    max="22:00"
                    onChange={(e) => handleChange("hora_inicio", e.target.value, true)}
                    error={errores.hora}
                />
              </div>
            </div>
            
            {turnos.find(t => t.id === editando) && (
                <button
                onClick={() => {
                    const t = turnos.find(item => item.id === editando);
                    navigate(`/historias-clinicas?paciente_id=${t?.paciente_id}&kinesiologo_id=${t?.kinesiologo_id}`);
                }}
                className="mt-4 w-full bg-green-500 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2 hover:bg-green-600"
                >
                <FileText className="w-4 h-4" /> Ir a Historia Clínica
                </button>
            )}
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}
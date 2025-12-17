import { useState, useEffect } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import {
  Calendar as CalendarIcon,
  Filter,
  User,
  Clock,
  X,
  Edit2,
  MapPin,
  FileText,
} from "lucide-react";
import "./CalendarioTurnos.css"; 
import { useNavigate } from "react-router-dom";

// Configurar moment en español
moment.locale("es");
const localizer = momentLocalizer(moment);

const messages = {
  allDay: "Todo el día",
  previous: "Anterior",
  next: "Siguiente",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Turno",
  noEventsInRange: "No hay turnos en este rango",
  showMore: (total) => `+ Ver más (${total})`,
};

export default function CalendarioTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [kinesiologos, setKinesiologos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filtros
  const [filtroKinesiologo, setFiltroKinesiologo] = useState("");
  const [filtroSala, setFiltroSala] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Modal de detalle
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Vista del calendario
  const [vista, setVista] = useState("month");

  // ==========================================
  // FETCH DATOS
  // ==========================================
  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const inicio = moment().subtract(1, "month").format("YYYY-MM-DD");
      const fin = moment().add(2, "months").format("YYYY-MM-DD");

      const [resTurnos, resKines, resSalas] = await Promise.all([
        api.get("/turnos/calendario/", {
          params: { fecha_inicio: inicio, fecha_fin: fin },
        }),
        api.get("/kinesiologos/"),
        api.get("/salas/"),
      ]);

      setTurnos(resTurnos.data);
      setKinesiologos(resKines.data);
      setSalas(resSalas.data);
    } catch (err) {
      console.error("❌ Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // TRANSFORMAR TURNOS
  // ==========================================
  const eventos = turnos
    .filter((turno) => {
      if (filtroKinesiologo && turno.kinesiologo_id !== parseInt(filtroKinesiologo)) return false;
      if (filtroSala && turno.sala_id !== parseInt(filtroSala)) return false;
      if (filtroEstado && turno.estado !== filtroEstado) return false;
      return true;
    })
    .map((turno) => {
      const fechaInicio = moment(`${turno.fecha} ${turno.hora_inicio}`, "YYYY-MM-DD HH:mm").toDate();
      const fechaFin = moment(`${turno.fecha} ${turno.hora_fin}`, "YYYY-MM-DD HH:mm").toDate();

      return {
        id: turno.id,
        title: `${turno.paciente?.user?.nombre || "Paciente"}`, // Titulo más corto para móvil
        start: fechaInicio,
        end: fechaFin,
        resource: turno,
      };
    });

  const eventStyleGetter = (event) => {
    const turno = event.resource;
    let backgroundColor = "#3b82f6";

    switch (turno.estado) {
      case "pendiente": backgroundColor = "#eab308"; break;
      case "confirmado": backgroundColor = "#22c55e"; break;
      case "cancelado": backgroundColor = "#ef4444"; break;
      case "completado": backgroundColor = "#3b82f6"; break;
      default: backgroundColor = "#6b7280";
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "0.85em",
      },
    };
  };

  const handleSelectEvent = (event) => {
    setTurnoSeleccionado(event.resource);
    setModalAbierto(true);
  };

  const handleEventDrop = async ({ event, start, end }) => {
    if (!confirm("¿Mover este turno a la nueva fecha/hora?")) return;
    try {
      const nuevaFecha = moment(start).format("YYYY-MM-DD");
      const nuevaHoraInicio = moment(start).format("HH:mm");
      const nuevaHoraFin = moment(end).format("HH:mm");

      await api.put(`/turnos/${event.id}/mover`, {
        nueva_fecha: nuevaFecha,
        nueva_hora_inicio: nuevaHoraInicio,
        nueva_hora_fin: nuevaHoraFin,
      });
      alert("✅ Turno movido correctamente");
      fetchDatos();
    } catch (err) {
      console.error("❌ Error moviendo turno:", err);
      alert("Error al mover turno");
    }
  };

  const handleEventResize = async ({ event, start, end }) => {
    if (!confirm("¿Cambiar la duración de este turno?")) return;
    try {
      const nuevaHoraInicio = moment(start).format("HH:mm");
      const nuevaHoraFin = moment(end).format("HH:mm");
      await api.put(`/turnos/${event.id}`, {
        hora_inicio: nuevaHoraInicio,
        hora_fin: nuevaHoraFin,
      });
      alert("✅ Duración actualizada");
      fetchDatos();
    } catch (err) {
      console.error("❌ Error:", err);
      alert("Error al cambiar duración");
    }
  };

  const handleSelectSlot = (slotInfo) => {
    console.log("Slot seleccionado:", slotInfo);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-600">Cargando calendario...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6 h-full flex flex-col">
        {/* Header Responsive */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-blue-600 w-8 h-8" />
            <h1 className="text-2xl font-semibold text-gray-800">
              Calendario
            </h1>
          </div>

          {/* Leyenda de colores Responsive (flex-wrap) */}
          <div className="flex flex-wrap gap-3 text-sm w-full md:w-auto">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Cancelado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Completado</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-800 text-sm">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              value={filtroKinesiologo}
              onChange={(e) => setFiltroKinesiologo(e.target.value)}
            >
              <option value="">-- Kinesiólogo --</option>
              {kinesiologos.map((k) => (
                <option key={k.id} value={k.id}>{k.user?.nombre}</option>
              ))}
            </select>

            <select
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              value={filtroSala}
              onChange={(e) => setFiltroSala(e.target.value)}
            >
              <option value="">-- Sala --</option>
              {salas.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>

            <select
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">-- Estado --</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
              <option value="completado">Completado</option>
            </select>
          </div>
          
          {(filtroKinesiologo || filtroSala || filtroEstado) && (
            <button
              onClick={() => {
                setFiltroKinesiologo("");
                setFiltroSala("");
                setFiltroEstado("");
              }}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Limpiar filtros
            </button>
          )}
        </div>

        {/* Calendario con Scroll Horizontal */}
        <div className="bg-white border rounded-lg p-2 md:p-4 shadow-sm calendario-container flex-1 overflow-hidden flex flex-col">
           {/* Contenedor con scroll para evitar que se rompa en movil */}
           <div className="overflow-x-auto flex-1">
              <div className="min-w-[700px] h-full">
                <BigCalendar
                    localizer={localizer}
                    events={eventos}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%", minHeight: "600px" }}
                    messages={messages}
                    views={["month", "week", "day", "agenda"]}
                    view={vista}
                    onView={setVista}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable
                    draggableAccessor={() => true}
                    resizable
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    min={moment("08:00", "HH:mm").toDate()}
                    max={moment("20:00", "HH:mm").toDate()}
                    step={30}
                    timeslots={2}
                    popup
                />
              </div>
           </div>
        </div>

        {/* Modal Detalle Turno */}
        {modalAbierto && turnoSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">Detalle del Turno</h3>
                <button onClick={() => setModalAbierto(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Estado</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                        ${turnoSeleccionado.estado === 'confirmado' ? 'bg-green-100 text-green-700' : 
                        turnoSeleccionado.estado === 'cancelado' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'}`}>
                        {turnoSeleccionado.estado}
                    </span>
                </div>

                <div className="space-y-2">
                    <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">{turnoSeleccionado.paciente?.user?.nombre}</p>
                            <p className="text-xs text-gray-500">Paciente</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">{turnoSeleccionado.kinesiologo?.user?.nombre}</p>
                            <p className="text-xs text-gray-500">Kinesiólogo</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {moment(turnoSeleccionado.fecha).format("DD/MM/YYYY")}
                            </p>
                            <p className="text-xs text-gray-500">
                                {turnoSeleccionado.hora_inicio} - {turnoSeleccionado.hora_fin}
                            </p>
                        </div>
                    </div>
                    {turnoSeleccionado.sala && (
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">{turnoSeleccionado.sala.nombre}</p>
                                <p className="text-xs text-gray-500">Sala</p>
                            </div>
                        </div>
                    )}
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                <button onClick={() => setModalAbierto(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded">Cerrar</button>
                <button 
                    onClick={() => navigate("/turnos")} 
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                >
                    <Edit2 className="w-3 h-3" /> Editar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
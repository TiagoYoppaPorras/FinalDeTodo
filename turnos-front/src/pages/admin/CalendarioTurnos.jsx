import { useState, useEffect, useCallback } from "react";
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
import "./CalendarioTurnos.css"; // Estilos personalizados

// Configurar moment en español
moment.locale("es");
const localizer = momentLocalizer(moment);

// Mensajes en español para el calendario
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

  // Filtros
  const [filtroKinesiologo, setFiltroKinesiologo] = useState("");
  const [filtroSala, setFiltroSala] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Modal de detalle
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Vista del calendario
  const [vista, setVista] = useState("month"); // 'month', 'week', 'day', 'agenda'

  // ==========================================
  // FETCH DATOS
  // ==========================================
  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      // Calcular rango de fechas (mes actual +/- 1 mes)
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
  // TRANSFORMAR TURNOS PARA CALENDARIO
  // ==========================================
  const eventos = turnos
    .filter((turno) => {
      // Aplicar filtros
      if (filtroKinesiologo && turno.kinesiologo_id !== parseInt(filtroKinesiologo))
        return false;
      if (filtroSala && turno.sala_id !== parseInt(filtroSala)) return false;
      if (filtroEstado && turno.estado !== filtroEstado) return false;
      return true;
    })
    .map((turno) => {
      // Combinar fecha + hora
      const fechaInicio = moment(
        `${turno.fecha} ${turno.hora_inicio}`,
        "YYYY-MM-DD HH:mm"
      ).toDate();
      const fechaFin = moment(
        `${turno.fecha} ${turno.hora_fin}`,
        "YYYY-MM-DD HH:mm"
      ).toDate();

      return {
        id: turno.id,
        title: `${turno.paciente?.user?.nombre || "Paciente"} - ${
          turno.kinesiologo?.user?.nombre || "Kinesiólogo"
        }`,
        start: fechaInicio,
        end: fechaFin,
        resource: turno, // Guardar turno completo
      };
    });

  // ==========================================
  // FUNCIÓN PARA COLORES SEGÚN ESTADO
  // ==========================================
  const eventStyleGetter = (event) => {
    const turno = event.resource;
    let backgroundColor = "#3b82f6"; // Azul por defecto

    switch (turno.estado) {
      case "pendiente":
        backgroundColor = "#eab308"; // Amarillo
        break;
      case "confirmado":
        backgroundColor = "#22c55e"; // Verde
        break;
      case "cancelado":
        backgroundColor = "#ef4444"; // Rojo
        break;
      case "completado":
        backgroundColor = "#3b82f6"; // Azul
        break;
      default:
        backgroundColor = "#6b7280"; // Gris
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  // ==========================================
  // CLICK EN EVENTO (VER DETALLE)
  // ==========================================
  const handleSelectEvent = (event) => {
    setTurnoSeleccionado(event.resource);
    setModalAbierto(true);
  };

  // ==========================================
  // DRAG & DROP - MOVER TURNO
  // ==========================================
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
      fetchDatos(); // Recargar
    } catch (err) {
      console.error("❌ Error moviendo turno:", err);
      alert(err.response?.data?.detail || "Error al mover turno");
    }
  };

  // ==========================================
  // RESIZE - CAMBIAR DURACIÓN
  // ==========================================
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

  // ==========================================
  // CLICK EN SLOT VACÍO (CREAR TURNO - FUTURO)
  // ==========================================
  const handleSelectSlot = (slotInfo) => {
    // Aquí podrías abrir un modal para crear turno en esa fecha/hora
    console.log("Slot seleccionado:", slotInfo);
    // alert(`Crear turno para ${moment(slotInfo.start).format("DD/MM/YYYY HH:mm")}`);
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-blue-600 w-8 h-8" />
            <h1 className="text-2xl font-semibold text-gray-800">
              Calendario de Turnos
            </h1>
          </div>

          {/* Leyenda de colores */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Cancelado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Completado</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro Kinesiólogo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kinesiólogo
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filtroKinesiologo}
                onChange={(e) => setFiltroKinesiologo(e.target.value)}
              >
                <option value="">-- Todos --</option>
                {kinesiologos.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.user?.nombre || "Sin nombre"}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Sala */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sala
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filtroSala}
                onChange={(e) => setFiltroSala(e.target.value)}
              >
                <option value="">-- Todas --</option>
                {salas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">-- Todos --</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="cancelado">Cancelado</option>
                <option value="completado">Completado</option>
              </select>
            </div>
          </div>

          {/* Botón limpiar filtros */}
          {(filtroKinesiologo || filtroSala || filtroEstado) && (
            <button
              onClick={() => {
                setFiltroKinesiologo("");
                setFiltroSala("");
                setFiltroEstado("");
              }}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Limpiar filtros
            </button>
          )}
        </div>

        {/* Calendario */}
        <div className="bg-white border rounded-lg p-4 shadow-sm calendario-container">
          <BigCalendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            messages={messages}
            views={["month", "week", "day", "agenda"]}
            view={vista}
            onView={setVista}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            // Drag & Drop
            draggableAccessor={() => true}
            resizable
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            // Configuración de horarios
            min={moment("08:00", "HH:mm").toDate()}
            max={moment("20:00", "HH:mm").toDate()}
            step={30}
            timeslots={2}
            // Tooltip personalizado
            popup
          />
        </div>

        {/* Modal de Detalle del Turno */}
        {modalAbierto && turnoSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Detalle del Turno
                </h3>
                <button
                  onClick={() => setModalAbierto(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-4 space-y-3">
                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Estado:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      turnoSeleccionado.estado === "pendiente"
                        ? "bg-yellow-100 text-yellow-800"
                        : turnoSeleccionado.estado === "confirmado"
                        ? "bg-green-100 text-green-800"
                        : turnoSeleccionado.estado === "cancelado"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {turnoSeleccionado.estado.toUpperCase()}
                  </span>
                </div>

                {/* Paciente */}
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <User className="w-4 h-4" /> Paciente:
                  </p>
                  <p className="text-gray-800">
                    {turnoSeleccionado.paciente?.user?.nombre || "N/A"}
                  </p>
                </div>

                {/* Kinesiólogo */}
                <div>
                  <p className="text-sm font-medium text-gray-600">Kinesiólogo:</p>
                  <p className="text-gray-800">
                    {turnoSeleccionado.kinesiologo?.user?.nombre || "N/A"}
                  </p>
                </div>

                {/* Fecha y Hora */}
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Fecha y Hora:
                  </p>
                  <p className="text-gray-800">
                    {moment(turnoSeleccionado.fecha).format("DD/MM/YYYY")}
                    <span className="mx-2">•</span>
                    {turnoSeleccionado.hora_inicio} - {turnoSeleccionado.hora_fin}
                  </p>
                </div>

                {/* Servicio */}
                {turnoSeleccionado.servicio && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Servicio:</p>
                    <p className="text-gray-800">{turnoSeleccionado.servicio.nombre}</p>
                  </div>
                )}

                {/* Sala */}
                {turnoSeleccionado.sala && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> Sala:
                    </p>
                    <p className="text-gray-800">{turnoSeleccionado.sala.nombre}</p>
                  </div>
                )}

                {/* Motivo */}
                {turnoSeleccionado.motivo && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Motivo:
                    </p>
                    <p className="text-gray-800">{turnoSeleccionado.motivo}</p>
                  </div>
                )}

                {/* Observaciones */}
                {turnoSeleccionado.observaciones && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Observaciones:</p>
                    <p className="text-gray-600 text-sm italic">
                      {turnoSeleccionado.observaciones}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    // Redirigir a edición (implementar según tu flujo)
                    window.location.href = `/turnos?edit=${turnoSeleccionado.id}`;
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" /> Editar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

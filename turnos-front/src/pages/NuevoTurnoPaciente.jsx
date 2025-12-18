import { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import api from "../api/Client";
import { PlusCircle, User, MapPin } from "lucide-react"; 
import { useAuth } from "../context/AuthContext";
// 👇 Importamos las alertas
import { alertaExito, alertaError } from "../utils/alerts";

export default function NuevoTurnoPaciente() {
  const { user } = useAuth();

  // Estados para las listas de opciones
  const [servicios, setServicios] = useState([]);
  const [kinesiologos, setKinesiologos] = useState([]);
  const [salas, setSalas] = useState([]);

  const [pacienteId, setPacienteId] = useState(null);

  // Estado del formulario
  const [nuevoTurno, setNuevoTurno] = useState({
    servicio_id: "",
    kinesiologo_id: "", 
    sala_id: "", 
    fecha: "",
    hora: "",
    motivo: "",
  });

  // 🔹 Helpers para Fecha y Hora actual (Local)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`; // Formato YYYY-MM-DD

  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTimeStr = `${currentHours}:${currentMinutes}`; // Formato HH:MM

  // 🔹 Cargar Servicios, Kinesiólogos, Salas y Perfil del Paciente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resServicios, resKines, resSalas, resPacientes] =
          await Promise.all([
            api.get("/servicios/"),
            api.get("/kinesiologos/"),
            api.get("/salas/"),
            api.get("/pacientes/"),
          ]);

        setServicios(resServicios.data);
        setKinesiologos(resKines.data);
        setSalas(resSalas.data);

        // Buscar el ID de paciente asociado al usuario logueado
        const paciente = resPacientes.data.find((p) => p.user_id === user.id);
        if (paciente) {
          setPacienteId(paciente.id);
        } else {
          console.warn("⚠️ No se encontró paciente asociado al usuario");
        }
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
      }
    };

    if (user) fetchData();
  }, [user]);

  // Función auxiliar para sumar minutos a una hora HH:MM
  const calcularHoraFin = (horaInicio, duracionMinutos) => {
    if (!horaInicio) return "";
    const [h, m] = horaInicio.split(":").map(Number);
    const date = new Date();
    date.setHours(h);
    date.setMinutes(m + duracionMinutos);
    // Formato HH:MM
    const hh = date.getHours().toString().padStart(2, "0");
    const mm = date.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
  };

  // 🔹 Enviar turno nuevo
  const handleSolicitarTurno = async (e) => {
    e.preventDefault();

    if (!pacienteId) {
      alertaError("No se encontró el perfil del paciente asociado a este usuario.");
      return;
    }

    // Validación de hora pasada (por si el navegador no soporta min en time o se fuerza el input)
    if (nuevoTurno.fecha === todayStr && nuevoTurno.hora < currentTimeStr) {
      alertaError("No puedes seleccionar un horario que ya ha pasado.");
      return;
    }

    // Buscar el servicio seleccionado para saber su duración
    const servicioSeleccionado = servicios.find(
      (s) => s.id === parseInt(nuevoTurno.servicio_id)
    );
    const duracion = servicioSeleccionado
      ? servicioSeleccionado.duracion_minutos
      : 30;

    // Calcular hora fin
    const horaFinCalculada = calcularHoraFin(nuevoTurno.hora, duracion);

    try {
      const payload = {
        fecha: nuevoTurno.fecha,
        hora_inicio: nuevoTurno.hora + ":00",
        hora_fin: horaFinCalculada + ":00",
        motivo: nuevoTurno.motivo,
        paciente_id: pacienteId,
        servicio_id: parseInt(nuevoTurno.servicio_id),

        // Enviamos el ID si existe, o null si está vacío
        kinesiologo_id: nuevoTurno.kinesiologo_id
          ? parseInt(nuevoTurno.kinesiologo_id)
          : null,
        sala_id: nuevoTurno.sala_id ? parseInt(nuevoTurno.sala_id) : null,

        estado: "pendiente",
      };

      console.log("Enviando payload:", payload);

      await api.post("/turnos/", payload);
      alertaExito("Turno solicitado correctamente");

      // Resetear formulario
      setNuevoTurno({
        servicio_id: "",
        kinesiologo_id: "",
        sala_id: "",
        fecha: "",
        hora: "",
        motivo: "",
      });
    } catch (err) {
      console.error("❌ Error solicitando turno:", err);
      if (err.response && err.response.data) {
        alertaError(`Error: ${JSON.stringify(err.response.data.detail)}`);
      } else {
        alertaError("Error al solicitar turno");
      }
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-blue-600" />
          Solicitar Turno
        </h1>

        <form
          onSubmit={handleSolicitarTurno}
          className="bg-white border rounded-lg shadow-sm p-6 space-y-4"
        >
          {/* GRUPO 1: Selección de Servicio y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servicio *
              </label>
              <select
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                value={nuevoTurno.servicio_id}
                onChange={(e) =>
                  setNuevoTurno({ ...nuevoTurno, servicio_id: e.target.value })
                }
                required
              >
                <option value="">-- Seleccionar servicio --</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.duracion_minutos} min)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                min={todayStr} // 👈 Restringe días anteriores a hoy
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                value={nuevoTurno.fecha}
                onChange={(e) =>
                  setNuevoTurno({ ...nuevoTurno, fecha: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* GRUPO 2: Kinesiólogo y Hora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <User size={16} /> Kinesiólogo (Opcional)
            </label>
            <select
              required
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              value={nuevoTurno.kinesiologo_id}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, kinesiologo_id: e.target.value })
              }
            >
              <option value="">-- Cualquiera disponible --</option>
              {kinesiologos.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.user ? k.user.nombre : "Kinesiólogo #" + k.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora Inicio *
            </label>
            <input
              type="time"
              // 👈 Si la fecha elegida es hoy, el mínimo es la hora actual; si no, es libre
              min={nuevoTurno.fecha === todayStr ? currentTimeStr : undefined}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              value={nuevoTurno.hora}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, hora: e.target.value })
              }
              required
            />
          </div>

          {/* GRUPO 3: Sala (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <MapPin size={16} /> Sala (Opcional)
            </label>
            <select
              required
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              value={nuevoTurno.sala_id}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, sala_id: e.target.value })
              }
            >
              <option value="">-- Asignación automática --</option>
              {salas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} (Capacidad: {s.capacidad})
                </option>
              ))}
            </select>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo / Observaciones
            </label>
            <textarea
              placeholder="Detalle brevemente el motivo de la consulta..."
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={nuevoTurno.motivo}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, motivo: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition-colors font-medium"
          >
            <PlusCircle className="w-5 h-5" /> Confirmar Solicitud
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
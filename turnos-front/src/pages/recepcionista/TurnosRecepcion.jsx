import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Search
} from "lucide-react";
// 👇 Importamos las alertas
import { alertaExito, alertaError } from "../../utils/alerts";

export default function TurnosRecepcion() {
  const [turnos, setTurnos] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  // Obtener turnos del día
  const fetchTurnos = async () => {
    try {
      const res = await api.get("/recepcion/turnos-hoy");
      setTurnos(res.data);
    } catch (err) {
      console.error("Error cargando turnos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnos();
  }, []);

  // Confirmar asistencia
  const confirmarAsistencia = async (turnoId, llegoTarde = false) => {
    try {
      await api.patch(`/recepcion/${turnoId}/confirmar-asistencia?llego_tarde=${llegoTarde}`);
      alertaExito(llegoTarde ? "Asistencia confirmada (Llegó tarde)" : "Asistencia confirmada"); // ✨
      fetchTurnos();
    } catch (err) {
      console.error("Error confirmando asistencia:", err);
      alertaError("Error al confirmar asistencia"); // ✨
    }
  };

  // Marcar como ausente
  const marcarAusente = async (turnoId) => {
    const motivo = prompt("Motivo de la ausencia (opcional):");
    try {
      const params = motivo ? `?motivo=${encodeURIComponent(motivo)}` : "";
      await api.patch(`/recepcion/${turnoId}/marcar-ausente${params}`);
      alertaExito("Turno marcado como ausente"); // ✨
      fetchTurnos();
    } catch (err) {
      console.error("Error marcando ausencia:", err);
      alertaError("Error al marcar ausencia"); // ✨
    }
  };

  // Filtrar turnos
  const turnosFiltrados = turnos.filter((turno) => {
    if (filtro !== "todos" && turno.estado !== filtro) {
      return false;
    }
    if (busqueda) {
      const nombrePaciente = turno.paciente?.user?.nombre?.toLowerCase() || "";
      const nombreKine = turno.kinesiologo?.user?.nombre?.toLowerCase() || "";
      const query = busqueda.toLowerCase();
      return nombrePaciente.includes(query) || nombreKine.includes(query);
    }
    return true;
  });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente": return "bg-yellow-100 text-yellow-800";
      case "confirmado": return "bg-green-100 text-green-800";
      case "cancelado": return "bg-red-100 text-red-800";
      case "completado": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">Cargando turnos...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Turnos del Día
          </h1>
          <p className="text-gray-600 capitalize">
            {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por paciente o kinesiólogo..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <select
              className="border rounded-lg px-4 py-2 w-full"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmado">Confirmados</option>
              <option value="cancelado">Ausentes</option>
              <option value="completado">Completados</option>
            </select>
          </div>
        </div>

        {/* Lista de Turnos */}
        <div className="space-y-4">
          {turnosFiltrados.length === 0 ? (
            <div className="bg-white p-8 text-center text-gray-500 rounded-lg border shadow-sm">
              No hay turnos que coincidan con los filtros
            </div>
          ) : (
            turnosFiltrados.map((turno) => (
              <div key={turno.id} className="bg-white rounded-lg shadow-sm border p-4 transition hover:shadow-md">
                {/* Contenedor flexible: Columna en móvil, Fila en escritorio */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Info Izquierda */}
                  <div className="flex items-start gap-4">
                    {/* Hora Box */}
                    <div className="text-center min-w-[70px] bg-blue-50 rounded-lg p-2 border border-blue-100">
                      <p className="text-xl font-bold text-blue-700">
                        {turno.hora_inicio?.slice(0, 5)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {turno.hora_fin?.slice(0, 5)}
                      </p>
                    </div>

                    {/* Detalles */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-800 text-lg">
                          {turno.paciente?.user?.nombre || "Sin nombre"}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getEstadoColor(turno.estado)}`}>
                          {turno.estado}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-0.5">
                        <p><span className="font-medium">Kinesiólogo:</span> {turno.kinesiologo?.user?.nombre}</p>
                        <p><span className="font-medium">Servicio:</span> {turno.servicio?.nombre}</p>
                        {turno.sala && <p><span className="font-medium">Sala:</span> {turno.sala.nombre}</p>}
                        {turno.motivo && <p className="italic text-gray-500">"{turno.motivo}"</p>}
                      </div>
                    </div>
                  </div>

                  {/* Acciones (Botones) */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
                    {turno.estado === "pendiente" && (
                      <>
                        <button
                          onClick={() => confirmarAsistencia(turno.id, false)}
                          className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium w-full"
                        >
                          <CheckCircle className="w-4 h-4" /> Confirmar
                        </button>
                        <button
                          onClick={() => confirmarAsistencia(turno.id, true)}
                          className="flex items-center justify-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition text-sm font-medium w-full"
                        >
                          <Clock className="w-4 h-4" /> Llegó Tarde
                        </button>
                        <button
                          onClick={() => marcarAusente(turno.id)}
                          className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium w-full"
                        >
                          <XCircle className="w-4 h-4" /> Ausente
                        </button>
                      </>
                    )}

                    {turno.estado === "confirmado" && (
                      <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 px-3 py-2 rounded-lg justify-center md:justify-end">
                        <CheckCircle className="w-5 h-5" /> Confirmado
                      </div>
                    )}

                    {turno.estado === "cancelado" && (
                      <div className="flex items-center gap-2 text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg justify-center md:justify-end">
                        <XCircle className="w-5 h-5" /> Ausente
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumen Footer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Guía Rápida:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Use <strong>Confirmar</strong> cuando el paciente llegue a tiempo.</li>
                <li>Use <strong>Llegó Tarde</strong> si el paciente llega con retraso (quedará registrado).</li>
                <li>Use <strong>Ausente</strong> si el paciente no se presenta al turno.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
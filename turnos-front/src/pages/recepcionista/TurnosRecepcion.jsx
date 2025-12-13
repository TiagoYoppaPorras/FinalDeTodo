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
      alert(llegoTarde ? "✅ Asistencia confirmada (Llegó tarde)" : "✅ Asistencia confirmada");
      fetchTurnos();
    } catch (err) {
      console.error("Error confirmando asistencia:", err);
      alert("Error al confirmar asistencia");
    }
  };

  // Marcar como ausente
  const marcarAusente = async (turnoId) => {
    const motivo = prompt("Motivo de la ausencia (opcional):");
    try {
      const params = motivo ? `?motivo=${encodeURIComponent(motivo)}` : "";
      await api.patch(`/recepcion/${turnoId}/marcar-ausente${params}`);
      alert("❌ Turno marcado como ausente");
      fetchTurnos();
    } catch (err) {
      console.error("Error marcando ausencia:", err);
      alert("Error al marcar ausencia");
    }
  };

  // Filtrar turnos
  const turnosFiltrados = turnos.filter((turno) => {
    // Filtro por estado
    if (filtro !== "todos" && turno.estado !== filtro) {
      return false;
    }

    // Búsqueda por nombre
    if (busqueda) {
      const nombrePaciente = turno.paciente?.user?.nombre?.toLowerCase() || "";
      const nombreKine = turno.kinesiologo?.user?.nombre?.toLowerCase() || "";
      const query = busqueda.toLowerCase();
      return nombrePaciente.includes(query) || nombreKine.includes(query);
    }

    return true;
  });

  // Obtener color según estado
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Turnos del Día
          </h1>
          <p className="text-gray-600">
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
            {/* Búsqueda */}
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

            {/* Filtro por estado */}
            <select
              className="border rounded-lg px-4 py-2"
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
        <div className="bg-white rounded-lg shadow-sm border">
          {turnosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay turnos que coincidan con los filtros
            </div>
          ) : (
            <div className="divide-y">
              {turnosFiltrados.map((turno) => (
                <div key={turno.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    {/* Info del turno */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4">
                        {/* Hora */}
                        <div className="text-center min-w-[80px]">
                          <p className="text-2xl font-bold text-blue-600">
                            {turno.hora_inicio?.slice(0, 5)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {turno.hora_fin?.slice(0, 5)}
                          </p>
                        </div>

                        {/* Detalles */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-800 text-lg">
                              {turno.paciente?.user?.nombre || "Sin nombre"}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(turno.estado)}`}>
                              {turno.estado}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <span className="font-medium">Kinesiólogo:</span>{" "}
                              {turno.kinesiologo?.user?.nombre || "Sin asignar"}
                            </p>
                            <p>
                              <span className="font-medium">Servicio:</span>{" "}
                              {turno.servicio?.nombre || "Sin servicio"}
                            </p>
                            {turno.sala && (
                              <p>
                                <span className="font-medium">Sala:</span> {turno.sala.nombre}
                              </p>
                            )}
                            {turno.motivo && (
                              <p>
                                <span className="font-medium">Motivo:</span> {turno.motivo}
                              </p>
                            )}
                            {turno.observaciones && (
                              <p className="text-xs text-gray-500 italic">
                                {turno.observaciones}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    {turno.estado === "pendiente" && (
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => confirmarAsistencia(turno.id, false)}
                          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar
                        </button>
                        <button
                          onClick={() => confirmarAsistencia(turno.id, true)}
                          className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm"
                        >
                          <Clock className="w-4 h-4" />
                          Llegó Tarde
                        </button>
                        <button
                          onClick={() => marcarAusente(turno.id)}
                          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Ausente
                        </button>
                      </div>
                    )}

                    {turno.estado === "confirmado" && (
                      <div className="ml-4">
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                          <CheckCircle className="w-5 h-5" />
                          Confirmado
                        </div>
                      </div>
                    )}

                    {turno.estado === "cancelado" && (
                      <div className="ml-4">
                        <div className="flex items-center gap-2 text-red-600 font-medium">
                          <XCircle className="w-5 h-5" />
                          Ausente
                        </div>
                      </div>
                    )}

                    {turno.estado === "completado" && (
                      <div className="ml-4">
                        <div className="flex items-center gap-2 text-purple-600 font-medium">
                          <CheckCircle className="w-5 h-5" />
                          Completado
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Instrucciones:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Confirmar:</strong> Cuando el paciente llega a tiempo</li>
                <li><strong>Llegó Tarde:</strong> Cuando el paciente llega después de la hora</li>
                <li><strong>Ausente:</strong> Cuando el paciente no se presenta</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

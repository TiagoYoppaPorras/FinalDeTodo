import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { 
  CalendarDays, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  TrendingUp 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardRecepcionista() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [turnosProximos, setTurnosProximos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Obtener estadísticas del día
  const fetchEstadisticas = async () => {
    try {
      const res = await api.get("/recepcion/estadisticas-hoy");
      setEstadisticas(res.data);
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
    }
  };

  // Obtener próximos turnos (próximas 2 horas)
  const fetchTurnosProximos = async () => {
    try {
      const res = await api.get("/recepcion/turnos-hoy");
      const ahora = new Date();
      const dosBoras = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);
      
      const proximos = res.data.filter((turno) => {
        const horaTurno = new Date(`${turno.fecha}T${turno.hora_inicio}`);
        return horaTurno >= ahora && horaTurno <= dosBoras && turno.estado === "pendiente";
      });
      
      setTurnosProximos(proximos);
    } catch (err) {
      console.error("Error cargando turnos próximos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadisticas();
    fetchTurnosProximos();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      fetchEstadisticas();
      fetchTurnosProximos();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">Cargando...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Dashboard de Recepción
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
          <button
            onClick={() => navigate("/recepcion/turnos")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <CalendarDays className="w-5 h-5" />
            Ver Todos los Turnos
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total del Día</p>
                <p className="text-3xl font-bold text-gray-800">
                  {estadisticas?.total_turnos || 0}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          {/* Pendientes */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {estadisticas?.pendientes || 0}
                </p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          {/* Confirmados */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmados</p>
                <p className="text-3xl font-bold text-green-600">
                  {estadisticas?.confirmados || 0}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          {/* Cancelados */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ausentes</p>
                <p className="text-3xl font-bold text-red-600">
                  {estadisticas?.cancelados || 0}
                </p>
              </div>
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          {/* Completados */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completados</p>
                <p className="text-3xl font-bold text-purple-600">
                  {estadisticas?.completados || 0}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Próximos Turnos */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Próximos Turnos (2 horas)
          </h2>
          
          {turnosProximos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay turnos pendientes en las próximas 2 horas
            </p>
          ) : (
            <div className="space-y-3">
              {turnosProximos.map((turno) => (
                <div
                  key={turno.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => navigate("/recepcion/turnos")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-blue-600">
                          {turno.hora_inicio?.slice(0, 5)}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {turno.paciente?.user?.nombre || "Sin nombre"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Kinesiólogo:{" "}
                            {turno.kinesiologo?.user?.nombre || "Sin asignar"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {turno.servicio?.nombre || "Sin servicio"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Sala: {turno.sala?.nombre || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/recepcion/turnos")}
            className="bg-white border rounded-lg p-6 hover:bg-blue-50 hover:border-blue-300 transition text-left"
          >
            <CalendarDays className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-800 mb-1">
              Gestionar Turnos
            </h3>
            <p className="text-sm text-gray-600">
              Ver y confirmar turnos del día
            </p>
          </button>

          <button
            onClick={() => navigate("/turnos")}
            className="bg-white border rounded-lg p-6 hover:bg-green-50 hover:border-green-300 transition text-left"
          >
            <Users className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-800 mb-1">Crear Turno</h3>
            <p className="text-sm text-gray-600">
              Agendar nuevo turno para paciente
            </p>
          </button>

          <button
            onClick={() => navigate("/pacientes")}
            className="bg-white border rounded-lg p-6 hover:bg-purple-50 hover:border-purple-300 transition text-left"
          >
            <Users className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-800 mb-1">
              Ver Pacientes
            </h3>
            <p className="text-sm text-gray-600">
              Consultar información de pacientes
            </p>
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

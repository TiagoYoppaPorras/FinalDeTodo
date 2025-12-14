import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Activity,
  Heart,
  Weight,
  Ruler,
  Thermometer,
  FileText,
  User,
} from "lucide-react";

export default function TimelinePaciente() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();

  const [historias, setHistorias] = useState([]);
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vistaGrafico, setVistaGrafico] = useState(false);

  useEffect(() => {
    fetchDatos();
  }, [pacienteId]);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const [resHistorias, resPaciente] = await Promise.all([
        api.get(`/historias-clinicas/paciente/${pacienteId}`),
        api.get(`/pacientes/${pacienteId}`),
      ]);

      setHistorias(resHistorias.data);
      setPaciente(resPaciente.data);
    } catch (err) {
      console.error("❌ Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-600">Cargando timeline...</div>
      </MainLayout>
    );
  }

  if (!paciente) {
    return (
      <MainLayout>
        <div className="p-6 text-red-600">Paciente no encontrado</div>
      </MainLayout>
    );
  }

  // Ordenar historias por fecha (más reciente primero)
  const historiasOrdenadas = [...historias].sort(
    (a, b) => new Date(b.fecha_consulta) - new Date(a.fecha_consulta)
  );

  // Preparar datos para gráfico de peso
  const datosPeso = historias
    .filter((h) => h.peso)
    .sort((a, b) => new Date(a.fecha_consulta) - new Date(b.fecha_consulta))
    .map((h) => ({
      fecha: new Date(h.fecha_consulta).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
      }),
      peso: h.peso,
    }));

  // Calcular estadísticas
  const pesoActual = historias.find((h) => h.peso)?.peso || null;
  const pesoInicial = historias
    .filter((h) => h.peso)
    .sort((a, b) => new Date(a.fecha_consulta) - new Date(b.fecha_consulta))[0]?.peso || null;
  const variacionPeso = pesoActual && pesoInicial ? (pesoActual - pesoInicial).toFixed(1) : null;

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/historias-clinicas")}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                Timeline de Evolución
              </h1>
              <p className="text-sm text-gray-500">
                <User className="w-4 h-4 inline mr-1" />
                {paciente.user?.nombre || "Paciente"} 
                {paciente.dni && ` - DNI: ${paciente.dni}`}
              </p>
            </div>
          </div>

          {/* Toggle vista */}
          <div className="flex gap-2">
            <button
              onClick={() => setVistaGrafico(false)}
              className={`px-4 py-2 rounded ${
                !vistaGrafico
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" /> Timeline
            </button>
            <button
              onClick={() => setVistaGrafico(true)}
              className={`px-4 py-2 rounded ${
                vistaGrafico
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" /> Gráficos
            </button>
          </div>
        </div>

        {historias.length === 0 && (
          <div className="bg-white border rounded-lg p-8 text-center">
            <p className="text-gray-500">
              No hay historias clínicas registradas para este paciente.
            </p>
          </div>
        )}

        {/* VISTA TIMELINE */}
        {!vistaGrafico && historias.length > 0 && (
          <div className="bg-white border rounded-lg p-6">
            <div className="relative">
              {/* Línea vertical del timeline */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200"></div>

              {/* Entradas del timeline */}
              <div className="space-y-6">
                {historiasOrdenadas.map((historia, index) => (
                  <div key={historia.id} className="relative flex gap-4">
                    {/* Punto en la línea */}
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">
                        <Calendar className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow-sm">
                      {/* Fecha */}
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-gray-800">
                          {new Date(historia.fecha_consulta).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        {index === 0 && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Más reciente
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mb-3">
                        Atendido por: {historia.kinesiologo?.user?.nombre || "N/A"}
                      </p>

                      {/* Datos Vitales */}
                      {(historia.peso || historia.presion_arterial || historia.temperatura) && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 bg-white p-2 rounded">
                          {historia.peso && (
                            <div className="flex items-center gap-1 text-sm">
                              <Weight className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">{historia.peso} kg</span>
                            </div>
                          )}
                          {historia.altura && (
                            <div className="flex items-center gap-1 text-sm">
                              <Ruler className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">{historia.altura} cm</span>
                            </div>
                          )}
                          {historia.presion_arterial && (
                            <div className="flex items-center gap-1 text-sm">
                              <Heart className="w-4 h-4 text-red-600" />
                              <span className="font-medium">{historia.presion_arterial}</span>
                            </div>
                          )}
                          {historia.temperatura && (
                            <div className="flex items-center gap-1 text-sm">
                              <Thermometer className="w-4 h-4 text-orange-600" />
                              <span className="font-medium">{historia.temperatura}°C</span>
                            </div>
                          )}
                          {historia.frecuencia_cardiaca && (
                            <div className="flex items-center gap-1 text-sm">
                              <Activity className="w-4 h-4 text-green-600" />
                              <span className="font-medium">{historia.frecuencia_cardiaca} lpm</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Contenido Clínico */}
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="font-semibold text-gray-700">Motivo:</p>
                          <p className="text-gray-600">{historia.motivo_consulta}</p>
                        </div>

                        {historia.diagnostico && (
                          <div>
                            <p className="font-semibold text-gray-700">Diagnóstico:</p>
                            <p className="text-gray-600">{historia.diagnostico}</p>
                          </div>
                        )}

                        {historia.tratamiento && (
                          <div>
                            <p className="font-semibold text-gray-700">Tratamiento:</p>
                            <p className="text-gray-600">{historia.tratamiento}</p>
                          </div>
                        )}

                        {historia.evolucion && (
                          <div>
                            <p className="font-semibold text-gray-700">Evolución:</p>
                            <p className="text-gray-600">{historia.evolucion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VISTA GRÁFICOS */}
        {vistaGrafico && historias.length > 0 && (
          <div className="space-y-6">
            {/* Estadísticas Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Consultas</p>
                <p className="text-3xl font-bold text-blue-600">{historias.length}</p>
              </div>

              {pesoActual && (
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Peso Actual</p>
                  <p className="text-3xl font-bold text-purple-600">{pesoActual} kg</p>
                  {variacionPeso && (
                    <p className={`text-sm ${parseFloat(variacionPeso) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {parseFloat(variacionPeso) >= 0 ? "+" : ""}{variacionPeso} kg desde inicio
                    </p>
                  )}
                </div>
              )}

              {historias[0]?.presion_arterial && (
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Presión Actual</p>
                  <p className="text-3xl font-bold text-red-600">
                    {historias[0].presion_arterial}
                  </p>
                </div>
              )}
            </div>

            {/* Gráfico de Peso (simplificado) */}
            {datosPeso.length > 0 && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Weight className="w-5 h-5 text-purple-600" />
                  Evolución del Peso
                </h3>

                <div className="relative h-64">
                  {/* Gráfico de barras simple */}
                  <div className="flex items-end justify-around h-full pb-8">
                    {datosPeso.map((dato, index) => {
                      const maxPeso = Math.max(...datosPeso.map((d) => d.peso));
                      const altura = (dato.peso / maxPeso) * 100;
                      
                      return (
                        <div key={index} className="flex flex-col items-center gap-2">
                          <div className="relative group">
                            <div
                              className="w-16 bg-purple-600 rounded-t hover:bg-purple-700 transition-colors cursor-pointer"
                              style={{ height: `${altura * 2}px` }}
                            />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {dato.peso} kg
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 text-center">{dato.fecha}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de datos vitales completa */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Historial de Datos Vitales
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-2 border">Fecha</th>
                      <th className="p-2 border">Peso</th>
                      <th className="p-2 border">Altura</th>
                      <th className="p-2 border">Presión</th>
                      <th className="p-2 border">FC</th>
                      <th className="p-2 border">Temp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historiasOrdenadas.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="p-2 border">
                          {new Date(h.fecha_consulta).toLocaleDateString("es-AR")}
                        </td>
                        <td className="p-2 border text-center">
                          {h.peso ? `${h.peso} kg` : "-"}
                        </td>
                        <td className="p-2 border text-center">
                          {h.altura ? `${h.altura} cm` : "-"}
                        </td>
                        <td className="p-2 border text-center">
                          {h.presion_arterial || "-"}
                        </td>
                        <td className="p-2 border text-center">
                          {h.frecuencia_cardiaca ? `${h.frecuencia_cardiaca} lpm` : "-"}
                        </td>
                        <td className="p-2 border text-center">
                          {h.temperatura ? `${h.temperatura}°C` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

import { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import api from "../api/Client";
import { CalendarDays, Users, Activity, Layers } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, roles } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [kines, setKines] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = roles.includes("admin");
  const isKine = roles.includes("kinesiologo");
  const isPaciente = roles.includes("paciente");

  useEffect(() => {
    const fetchData = async () => {
      try {
        let promises = [];

        // --- Admin puede pedir todo ---
        if (isAdmin) {
          promises = [
            api.get("/usuarios/"),
            api.get("/pacientes/"),
            api.get("/kinesiologos/"),
            api.get("/turnos/"),
            api.get("/servicios/"),
            api.get("/salas/"),
          ];

          const [
            resUsuarios,
            resPac,
            resKine,
            resTurnos,
            resServ,
            resSalas,
          ] = await Promise.all(promises);

          setUsuarios(resUsuarios.data);
          setPacientes(resPac.data);
          setKines(resKine.data);
          setTurnos(resTurnos.data);
          setServicios(resServ.data);
          setSalas(resSalas.data);
        }

        // --- Kinesiologo: solo sus turnos y datos informativos ---
        else if (isKine) {
          const [resTurnos, resServ, resSalas] = await Promise.all([
            api.get("/turnos/"),
            api.get("/servicios/"),
            api.get("/salas/"),
          ]);

          // Filtramos solo los turnos asignados al kinesiólogo logueado
          const propios = resTurnos.data.filter(
            (t) => t.kinesiologo?.user_id === user.id
          );

          setTurnos(propios);
          setServicios(resServ.data);
          setSalas(resSalas.data);
        }

        // --- Paciente: solo sus turnos y servicios disponibles ---
        else if (isPaciente) {
          const [resTurnos, resServ] = await Promise.all([
            api.get("/turnos/"),
            api.get("/servicios/"),
          ]);

          const propios = resTurnos.data.filter(
            (t) => t.paciente?.user_id === user.id
          );

          setTurnos(propios);
          setServicios(resServ.data);
        }
      } catch (err) {
        console.error("❌ Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roles]);

  if (loading)
    return (
      <MainLayout>
        <div className="p-6 text-gray-600">Cargando dashboard...</div>
      </MainLayout>
    );

  // 📊 Calcular métricas solo si es admin
  const pendientes = turnos.filter((t) => t.estado === "pendiente").length;
  const confirmados = turnos.filter((t) => t.estado === "confirmado").length;
  const cancelados = turnos.filter((t) => t.estado === "cancelado").length;

  // 📅 Próximos turnos
  const proximos = [...turnos]
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Activity className="text-blue-600 w-6 h-6" />
          Panel de Control
        </h1>

        {/* === ADMIN CARDS === */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <DashboardCard
              icon={<Users className="text-blue-600 w-6 h-6" />}
              title="Usuarios"
              value={usuarios.length}
            />
            <DashboardCard
              icon={<Users className="text-green-600 w-6 h-6" />}
              title="Pacientes"
              value={pacientes.length}
            />
            <DashboardCard
              icon={<Users className="text-purple-600 w-6 h-6" />}
              title="Kinesiólogos"
              value={kines.length}
            />
            <DashboardCard
              icon={<CalendarDays className="text-orange-600 w-6 h-6" />}
              title="Turnos Totales"
              value={turnos.length}
            />
          </div>
        )}

        {/* === ESTADO DE TURNOS (visible para todos) === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardCard title="Pendientes" value={pendientes} color="text-yellow-600" />
          <DashboardCard title="Confirmados" value={confirmados} color="text-green-600" />
          <DashboardCard title="Cancelados" value={cancelados} color="text-red-600" />
        </div>

        {/* === TABLA DE PRÓXIMOS TURNOS === */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" /> Próximos Turnos
          </h2>

          {proximos.length === 0 ? (
            <p className="text-gray-500">No hay turnos próximos.</p>
          ) : (
            <table className="w-full text-sm border">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 border">Fecha</th>
                  <th className="p-2 border">Hora</th>
                  <th className="p-2 border">Paciente</th>
                  <th className="p-2 border">Kinesiólogo</th>
                  <th className="p-2 border">Servicio</th>
                  <th className="p-2 border">Estado</th>
                </tr>
              </thead>
              <tbody>
                {proximos.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 border">{t.fecha}</td>
                    <td className="p-2 border">{t.hora_inicio?.slice(0, 5) || "—"}</td>
                    <td className="p-2 border">{t.paciente?.user?.nombre || "—"}</td>
                    <td className="p-2 border">{t.kinesiologo?.user?.nombre || "—"}</td>
                    <td className="p-2 border">{t.servicio?.nombre || "—"}</td>
                    <td className="p-2 border capitalize">{t.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* === SERVICIOS Y SALAS === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Layers className="text-blue-600 w-5 h-5" /> Servicios
            </h2>
            {servicios.length === 0 ? (
              <p className="text-gray-500">No hay servicios registrados.</p>
            ) : (
              <ul className="text-gray-700 list-disc pl-5">
                {servicios.map((s) => (
                  <li key={s.id}>
                    {s.nombre} —{" "}
                    <span className="text-gray-500 text-sm">{s.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Salas solo para admin y kine */}
          {(isAdmin || isKine) && (
            <div className="bg-white border rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Layers className="text-green-600 w-5 h-5" /> Salas
              </h2>
              {salas.length === 0 ? (
                <p className="text-gray-500">No hay salas registradas.</p>
              ) : (
                <ul className="text-gray-700 list-disc pl-5">
                  {salas.map((s) => (
                    <li key={s.id}>
                      {s.nombre} —{" "}
                      <span className="text-gray-500 text-sm">
                        {s.ubicacion || "Sin ubicación"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

// --- CARD COMPONENT ---
function DashboardCard({ icon, title, value, color = "text-gray-800" }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-3">
      {icon}
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`text-xl font-semibold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

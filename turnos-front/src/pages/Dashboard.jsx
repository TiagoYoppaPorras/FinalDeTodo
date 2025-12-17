import { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import api from "../api/Client";
import DataTable from "../components/common/DataTable"; // 👈 Importamos el componente mágico
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

        if (isAdmin) {
          promises = [
            api.get("/usuarios/"),
            api.get("/pacientes/"),
            api.get("/kinesiologos/"),
            api.get("/turnos/"),
            api.get("/servicios/"),
            api.get("/salas/"),
          ];

          const [resUsuarios, resPac, resKine, resTurnos, resServ, resSalas] = await Promise.all(promises);

          setUsuarios(resUsuarios.data);
          setPacientes(resPac.data);
          setKines(resKine.data);
          setTurnos(resTurnos.data);
          setServicios(resServ.data);
          setSalas(resSalas.data);
        } else if (isKine) {
          const [resTurnos, resServ, resSalas] = await Promise.all([
            api.get("/turnos/"),
            api.get("/servicios/"),
            api.get("/salas/"),
          ]);
          const propios = resTurnos.data.filter((t) => t.kinesiologo?.user_id === user.id);
          setTurnos(propios);
          setServicios(resServ.data);
          setSalas(resSalas.data);
        } else if (isPaciente) {
          const [resTurnos, resServ] = await Promise.all([
            api.get("/turnos/"),
            api.get("/servicios/"),
          ]);
          const propios = resTurnos.data.filter((t) => t.paciente?.user_id === user.id);
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

  const pendientes = turnos.filter((t) => t.estado === "pendiente").length;
  const confirmados = turnos.filter((t) => t.estado === "confirmado").length;
  const cancelados = turnos.filter((t) => t.estado === "cancelado").length;

  const proximos = [...turnos]
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 5);

  // 🔹 DEFINICIÓN DE COLUMNAS PARA DATATABLE (Dashboard)
  const columns = [
    { key: "fecha", label: "Fecha" },
    { 
      key: "hora", 
      label: "Hora", 
      render: (t) => t.hora_inicio?.slice(0, 5) || "—" 
    },
    { 
      key: "paciente", 
      label: "Paciente", 
      render: (t) => <span className="font-medium">{t.paciente?.user?.nombre || "—"}</span> 
    },
    { 
      key: "kinesiologo", 
      label: "Kinesiólogo", 
      render: (t) => t.kinesiologo?.user?.nombre || "—" 
    },
    { 
      key: "servicio", 
      label: "Servicio", 
      render: (t) => t.servicio?.nombre || "—" 
    },
    { 
      key: "estado", 
      label: "Estado", 
      render: (t) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold
          ${t.estado === 'confirmado' ? 'bg-green-100 text-green-700' : 
            t.estado === 'cancelado' ? 'bg-red-100 text-red-700' : 
            'bg-yellow-100 text-yellow-700'}`}>
          {t.estado}
        </span>
      )
    },
  ];

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-8">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Activity className="text-blue-600 w-6 h-6" />
          Panel de Control
        </h1>

        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <DashboardCard icon={<Users className="text-blue-600 w-6 h-6" />} title="Usuarios" value={usuarios.length} />
            <DashboardCard icon={<Users className="text-green-600 w-6 h-6" />} title="Pacientes" value={pacientes.length} />
            <DashboardCard icon={<Users className="text-purple-600 w-6 h-6" />} title="Kinesiólogos" value={kines.length} />
            <DashboardCard icon={<CalendarDays className="text-orange-600 w-6 h-6" />} title="Turnos Totales" value={turnos.length} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardCard title="Pendientes" value={pendientes} color="text-yellow-600" />
          <DashboardCard title="Confirmados" value={confirmados} color="text-green-600" />
          <DashboardCard title="Cancelados" value={cancelados} color="text-red-600" />
        </div>

        {/* === TABLA RESPONSIVE === */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" /> Próximos Turnos
          </h2>
          <DataTable 
            data={proximos} 
            columns={columns} 
            emptyMessage="No hay turnos próximos." 
          />
        </div>

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
                    {s.nombre} — <span className="text-gray-500 text-sm">{s.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
                      {s.nombre} — <span className="text-gray-500 text-sm">{s.ubicacion || "Sin ubicación"}</span>
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
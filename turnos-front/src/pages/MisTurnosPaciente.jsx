import { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import api from "../api/Client";
import { CalendarDays, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/common/DataTable";
// 👇 Importamos las alertas
import { alertaExito, alertaError, confirmarAccion } from "../utils/alerts";

export default function MisTurnosPaciente() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTurnos = async () => {
    try {
      const res = await api.get("/turnos/");
      // Ordenamos por ID descendente para ver el último creado arriba
      const misTurnos = res.data
        .filter((t) => t.paciente?.user_id === user.id)
        .sort((a, b) => b.id - a.id);
        
      setTurnos(misTurnos);
    } catch (err) {
      console.error("❌ Error cargando turnos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnos();
  }, []);

  const handleCancelarTurno = async (item) => {
    const confirmado = await confirmarAccion("¿Cancelar turno?", "No podrás recuperar este turno."); // ✨
    if (!confirmado) return;

    try {
      await api.patch(`/turnos/${item.id}/estado?estado=cancelado`);
      alertaExito("Turno cancelado correctamente"); // ✨
      fetchTurnos();
    } catch (err) {
      console.error("Error cancelando turno:", err);
      alertaError("No se pudo cancelar el turno"); // ✨
    }
  };

  // 🔹 Columnas para DataTable
  const columns = [
    { key: "fecha", label: "Fecha" },
    { 
      key: "hora", 
      label: "Hora", 
      render: (t) => t.hora_inicio?.slice(0, 5) 
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
        t.estado !== "cancelado" && t.estado !== "completado" ? (
          <button
            onClick={() => handleCancelarTurno(t)}
            className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition"
          >
            <XCircle className="w-4 h-4" /> Cancelar
          </button>
        ) : null
      )
    }
  ];

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-600" />
          Mis Turnos
        </h1>

        <DataTable 
          data={turnos} 
          columns={columns} 
          loading={loading}
          emptyMessage="No tiene turnos registrados." 
        />
      </div>
    </MainLayout>
  );
}
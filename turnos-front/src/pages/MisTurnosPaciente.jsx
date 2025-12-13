import { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import api from "../api/Client";
import { CalendarDays } from "lucide-react";
import { useAuth } from "../context/AuthContext";


export default function MisTurnosPaciente() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTurnos = async () => {
    try {
      const res = await api.get("/turnos/");
      const misTurnos = res.data.filter(
        (t) => t.paciente?.user_id === user.id
      );
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

  const handleCancelarTurno = async (id) => {
    if (!confirm("¿Desea cancelar este turno?")) return;
    try {
      await api.patch(`/turnos/${id}/estado?estado=cancelado`);
      fetchTurnos();
    } catch (err) {
      console.error("Error cancelando turno:", err);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-600" />
          Mis Turnos
        </h1>

        <div className="bg-white border rounded-lg shadow-sm p-6">
          {loading ? (
            <p className="text-gray-500">Cargando turnos...</p>
          ) : turnos.length === 0 ? (
            <p className="text-gray-500">No tiene turnos registrados.</p>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 border">Fecha</th>
                  <th className="p-2 border">Hora</th>
                  <th className="p-2 border">Servicio</th>
                  <th className="p-2 border">Estado</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 border">{t.fecha}</td>
                    <td className="p-2 border">
                      {t.hora_inicio?.slice(0, 5)}
                    </td>
                    <td className="p-2 border">
                      {t.servicio?.nombre || "—"}
                    </td>
                    <td className="p-2 border capitalize">{t.estado}</td>
                    <td className="p-2 border text-center">
                      {t.estado !== "cancelado" && (
                        <button
                          onClick={() => handleCancelarTurno(t.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

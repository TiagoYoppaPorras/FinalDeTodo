import { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import api from "../api/Client";
import { PlusCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function NuevoTurnoPaciente() {
  const { user } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [pacienteId, setPacienteId] = useState(null);
  const [nuevoTurno, setNuevoTurno] = useState({
    servicio_id: "",
    fecha: "",
    hora: "",
    motivo: "",
  });

  // 🔹 Cargar servicios y obtener ID del paciente logueado
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resServicios, resPacientes] = await Promise.all([
          api.get("/servicios/"),
          api.get("/pacientes/"),
        ]);

        setServicios(resServicios.data);

        const paciente = resPacientes.data.find(
          (p) => p.user_id === user.id
        );
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

  // 🔹 Enviar turno nuevo
  const handleSolicitarTurno = async (e) => {
    e.preventDefault();

    if (!pacienteId) {
      alert("No se encontró el perfil del paciente asociado a este usuario.");
      return;
    }

    try {
      const payload = {
        fecha: nuevoTurno.fecha,
        hora_inicio: nuevoTurno.hora,
        hora_fin: nuevoTurno.hora,
        motivo: nuevoTurno.motivo,
        paciente_id: pacienteId, // ✅ ahora apunta al id correcto
        servicio_id: nuevoTurno.servicio_id,
        estado: "pendiente",
      };

      await api.post("/turnos/", payload);
      alert("✅ Turno solicitado correctamente");
      setNuevoTurno({ servicio_id: "", fecha: "", hora: "", motivo: "" });
    } catch (err) {
      console.error("❌ Error solicitando turno:", err);
      alert("Error al solicitar turno");
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="border p-2 rounded"
              value={nuevoTurno.servicio_id}
              onChange={(e) =>
                setNuevoTurno({
                  ...nuevoTurno,
                  servicio_id: e.target.value,
                })
              }
              required
            >
              <option value="">Seleccionar servicio</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="border p-2 rounded"
              value={nuevoTurno.fecha}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, fecha: e.target.value })
              }
              required
            />

            <input
              type="time"
              className="border p-2 rounded"
              value={nuevoTurno.hora}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, hora: e.target.value })
              }
              required
            />
          </div>

          <input
            type="text"
            placeholder="Motivo del turno (opcional)"
            className="border p-2 rounded w-full"
            value={nuevoTurno.motivo}
            onChange={(e) =>
              setNuevoTurno({ ...nuevoTurno, motivo: e.target.value })
            }
          />

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <PlusCircle className="w-5 h-5" /> Solicitar Turno
          </button>
        </form>
      </div>
    </MainLayout>
  );
}

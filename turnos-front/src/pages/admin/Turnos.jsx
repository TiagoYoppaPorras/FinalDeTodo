import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import { CalendarDays, PlusCircle } from "lucide-react";

export default function Turnos() {
  const [turnos, setTurnos] = useState([]);
  const [nuevoTurno, setNuevoTurno] = useState({
    paciente_id: "",
    kinesiologo_id: "",
    servicio_id: "",
    sala_id: "",
    fecha: "",
    hora: "",
    motivo: "",
  });

  const [pacientes, setPacientes] = useState([]);
  const [kines, setKines] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar todos los datos necesarios
  const fetchData = async () => {
    try {
      const [resTurnos, resPac, resKine, resServ, resSalas] = await Promise.all([
        api.get("/turnos/"),
        api.get("/pacientes/"),
        api.get("/kinesiologos/"),
        api.get("/servicios/"),
        api.get("/salas/"),
      ]);
      setTurnos(resTurnos.data);
      setPacientes(resPac.data);
      setKines(resKine.data);
      setServicios(resServ.data);
      setSalas(resSalas.data);
    } catch (err) {
      console.error("❌ Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Crear turno
  const handleCrearTurno = async (e) => {
    e.preventDefault();

    // Validaciones mínimas
    if (!nuevoTurno.paciente_id || !nuevoTurno.kinesiologo_id) {
      alert("Debe seleccionar un paciente y un kinesiólogo");
      return;
    }

    try {
      const payload = {
        fecha: nuevoTurno.fecha,
        hora_inicio: nuevoTurno.hora,
        hora_fin: nuevoTurno.hora, // 🔹 simplificado, podrías ajustarlo luego
        estado: "pendiente",
        motivo: nuevoTurno.motivo,
        observaciones: "",
        paciente_id: parseInt(nuevoTurno.paciente_id),
        kinesiologo_id: parseInt(nuevoTurno.kinesiologo_id),
        servicio_id: parseInt(nuevoTurno.servicio_id || 0),
        sala_id: parseInt(nuevoTurno.sala_id || 0),
      };

      await api.post("/turnos/", payload);
      alert("✅ Turno creado correctamente");
      setNuevoTurno({
        paciente_id: "",
        kinesiologo_id: "",
        servicio_id: "",
        sala_id: "",
        fecha: "",
        hora: "",
        motivo: "",
      });
      fetchData();
    } catch (err) {
      console.error("❌ Error al crear turno:", err);
      alert("Error al crear turno");
    }
  };

  // 🔹 Cambiar estado del turno
  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.patch(`/turnos/${id}/estado?estado=${nuevoEstado}`);
      fetchData();
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  };

  // 🔹 Eliminar turno
  const eliminarTurno = async (id) => {
    if (!confirm("¿Eliminar turno?")) return;
    try {
      await api.delete(`/turnos/${id}`);
      fetchData();
    } catch (err) {
      console.error("Error al eliminar turno:", err);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            Gestión de Turnos
          </h1>
        </div>

        {/* 🔹 Formulario nuevo turno */}
        <form
          onSubmit={handleCrearTurno}
          className="bg-white border rounded-lg shadow-sm p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Paciente */}
            <select
              className="border p-2 rounded"
              value={nuevoTurno.paciente_id}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, paciente_id: e.target.value })
              }
              required
            >
              <option value="">Seleccione Paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user?.nombre || `Paciente #${p.id}`}
                </option>
              ))}
            </select>

            {/* Kinesiólogo */}
            <select
              className="border p-2 rounded"
              value={nuevoTurno.kinesiologo_id}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, kinesiologo_id: e.target.value })
              }
              required
            >
              <option value="">Seleccione Kinesiólogo</option>
              {kines.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.user?.nombre || `Kinesiólogo #${k.id}`}
                </option>
              ))}
            </select>

            {/* Servicio */}
            <select
              className="border p-2 rounded"
              value={nuevoTurno.servicio_id}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, servicio_id: e.target.value })
              }
            >
              <option value="">Seleccione Servicio</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>

            {/* Sala */}
            <select
              className="border p-2 rounded"
              value={nuevoTurno.sala_id}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, sala_id: e.target.value })
              }
            >
              <option value="">Seleccione Sala</option>
              {salas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.ubicacion})
                </option>
              ))}
            </select>

            {/* Fecha y hora */}
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

            {/* Motivo */}
            <input
              type="text"
              placeholder="Motivo del turno"
              className="border p-2 rounded md:col-span-3"
              value={nuevoTurno.motivo}
              onChange={(e) =>
                setNuevoTurno({ ...nuevoTurno, motivo: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-5 h-5" /> Crear Turno
          </button>
        </form>

        {/* 🔹 Tabla de turnos */}
        <div className="bg-white border rounded-lg shadow-sm p-6">
          {loading ? (
            <p className="text-gray-500">Cargando turnos...</p>
          ) : turnos.length === 0 ? (
            <p className="text-gray-500">No hay turnos registrados.</p>
          ) : (
            <table className="w-full text-sm border">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Paciente</th>
                  <th className="p-2 border">Kinesiólogo</th>
                  <th className="p-2 border">Servicio</th>
                  <th className="p-2 border">Sala</th>
                  <th className="p-2 border">Fecha</th>
                  <th className="p-2 border">Hora</th>
                  <th className="p-2 border">Estado</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
  {turnos.map((t) => (
    <tr key={t.id} className="border-t hover:bg-gray-50">
      <td className="p-2 border text-center">{t.id}</td>
      <td className="p-2 border">{t.paciente?.user?.nombre || "—"}</td>
      <td className="p-2 border">{t.kinesiologo?.user?.nombre || "—"}</td>
      <td className="p-2 border">{t.servicio?.nombre || "—"}</td>
      <td className="p-2 border">{t.sala?.nombre || "—"}</td>
      <td className="p-2 border">{t.fecha}</td>
      <td className="p-2 border">{t.hora_inicio?.slice(0, 5) || "—"}</td>
      <td className="p-2 border capitalize">{t.estado}</td>
      <td className="p-2 border flex gap-2 justify-center">
        <button
          onClick={() => cambiarEstado(t.id, "confirmado")}
          className="px-2 py-1 bg-green-500 text-white rounded text-xs"
        >
          Confirmar
        </button>
        <button
          onClick={() => cambiarEstado(t.id, "cancelado")}
          className="px-2 py-1 bg-red-500 text-white rounded text-xs"
        >
          Cancelar
        </button>
        <button
          onClick={() => eliminarTurno(t.id)}
          className="px-2 py-1 bg-gray-400 text-white rounded text-xs"
        >
          Eliminar
        </button>
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

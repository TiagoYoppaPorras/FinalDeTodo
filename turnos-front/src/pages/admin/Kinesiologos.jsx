import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import api from "../../api/Client";
import {
  Stethoscope,
  PlusCircle,
  Trash2,
  Edit,
  UserPlus,
  UserCheck,
} from "lucide-react";
import EditModal from "../../components/common/EditModal";
import DataTable from "../../components/common/DataTable";
import { alertaExito, alertaError, confirmarAccion } from "../../utils/alerts";

// 1. Nuevos imports y eliminación de componente local
import InputConError from "../../components/common/InputConError";
import {
  validarEmail,
  validarPassword,
  validarNombre,
  validarMatricula,
} from "../../utils/validaciones";
import { procesarErrorBackend } from "../../utils/errorHandler";

export default function Kinesiologos() {
  const [kinesiologos, setKinesiologos] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [errores, setErrores] = useState({});

  // Estados para creación
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modoCreacion, setModoCreacion] = useState("nuevo");
  const [formNuevo, setFormNuevo] = useState({
    nombre: "",
    email: "",
    password: "",
    matricula_profesional: "",
    especialidad: "",
  });
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [formExistente, setFormExistente] = useState({
    matricula_profesional: "",
    especialidad: "",
  });

  // Estados para edición
  const [editando, setEditando] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // --- Fetch kinesiólogos ---
  const fetchKinesiologos = async () => {
    try {
      const res = await api.get("/kinesiologos/");
      setKinesiologos(res.data);
    } catch (err) {
      console.error("❌ Error cargando kinesiólogos:", err);
    }
  };

  // --- Fetch usuarios disponibles ---
  const fetchUsuariosDisponibles = async () => {
    try {
      const res = await api.get("/kinesiologos/usuarios-disponibles");
      setUsuariosDisponibles(res.data);
    } catch (err) {
      console.error("❌ Error cargando usuarios disponibles:", err);
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      await Promise.all([fetchKinesiologos(), fetchUsuariosDisponibles()]);
      setLoading(false);
    };
    cargarDatos();
  }, []);

  // --- Abrir modal de creación ---
  const abrirModalCrear = () => {
    setModalCrearAbierto(true);
    setModoCreacion("nuevo");
    setErrores({});
    setFormNuevo({
      nombre: "",
      email: "",
      password: "",
      matricula_profesional: "",
      especialidad: "",
    });
    setUsuarioSeleccionado("");
    setFormExistente({ matricula_profesional: "", especialidad: "" });
  };

  // 2. Helpers de cambio y validación real-time (Nuevo usuario)
  const handleChangeNuevo = (campo, valor) => {
    setFormNuevo((prev) => ({ ...prev, [campo]: valor }));

    // Validar en tiempo real
    let error = null;
    switch (campo) {
      case "email":
        error = validarEmail(valor);
        break;
      case "password":
        error = validarPassword(valor);
        break;
      case "nombre":
        error = validarNombre(valor);
        break;
      case "matricula_profesional":
        error = validarMatricula(valor);
        break;
      default:
        break;
    }

    if (error) {
      setErrores((prev) => ({ ...prev, [campo]: error }));
    } else {
      setErrores((prev) => ({ ...prev, [campo]: null }));
    }
  };

  // 3. Helpers de cambio y validación real-time (Usuario existente)
  const handleChangeExistente = (campo, valor) => {
    setFormExistente((prev) => ({ ...prev, [campo]: valor }));

    // Validar en tiempo real
    if (campo === "matricula_profesional") {
      const error = validarMatricula(valor);
      if (error) {
        setErrores((prev) => ({ ...prev, [campo]: error }));
      } else {
        setErrores((prev) => ({ ...prev, [campo]: null }));
      }
    }
  };

  // --- Crear kinesiólogo ---
  const handleCrear = async (e) => {
    e.preventDefault();
    setIsLoadingSave(true);
    setErrores({});

    try {
      if (modoCreacion === "nuevo") {
        // Mantenemos esta validación rápida de campo obligatorio antes de enviar
        if (!formNuevo.matricula_profesional) {
          setErrores({ matricula_profesional: "Obligatoria" });
          setIsLoadingSave(false);
          return;
        }
        await api.post("/kinesiologos/con-usuario", formNuevo);
        alertaExito("Kinesiólogo creado correctamente");
      } else {
        if (!usuarioSeleccionado) {
          alertaError("Debes seleccionar un usuario");
          setIsLoadingSave(false);
          return;
        }
        if (!formExistente.matricula_profesional) {
          setErrores({ matricula_profesional: "Obligatoria" });
          setIsLoadingSave(false);
          return;
        }
        await api.post("/kinesiologos/", {
          user_id: parseInt(usuarioSeleccionado),
          ...formExistente,
        });
        alertaExito("Kinesiólogo asociado correctamente");
      }

      setModalCrearAbierto(false);
      await Promise.all([fetchKinesiologos(), fetchUsuariosDisponibles()]);
    } catch (err) {
      console.error("❌ Error creando kinesiólogo:", err);

      // 4. Manejo de errores actualizado con procesarErrorBackend
      const { erroresCampos, mensajeGeneral } = procesarErrorBackend(err);

      if (Object.keys(erroresCampos).length > 0) {
        setErrores(erroresCampos);
      }

      if (mensajeGeneral) {
        alertaError(mensajeGeneral);
      }
    } finally {
      setIsLoadingSave(false);
    }
  };

  // --- Abrir modal de edición ---
  const handleEdit = (kinesiologo) => {
    setEditando(kinesiologo.id);
    setErrores({});
    setDatosEdicion({
      matricula_profesional: kinesiologo.matricula_profesional || "",
      especialidad: kinesiologo.especialidad || "",
    });
  };

  // --- Actualizar kinesiólogo ---
  const handleUpdate = async () => {
    setIsLoadingSave(true);
    setErrores({});
    try {
      if (!datosEdicion.matricula_profesional) {
        setErrores({ matricula_profesional: "Obligatoria" });
        setIsLoadingSave(false);
        return;
      }
      await api.put(`/kinesiologos/${editando}`, datosEdicion);
      alertaExito("Kinesiólogo actualizado correctamente");
      setEditando(null);
      setDatosEdicion({});
      fetchKinesiologos();
    } catch (err) {
      console.error("❌ Error actualizando kinesiólogo:", err);
      // Usamos también el procesador de errores aquí por consistencia
      const { erroresCampos, mensajeGeneral } = procesarErrorBackend(err);
      if (Object.keys(erroresCampos).length > 0) setErrores(erroresCampos);
      if (mensajeGeneral) alertaError(mensajeGeneral);
    } finally {
      setIsLoadingSave(false);
    }
  };

  // --- Eliminar kinesiólogo ---
  const handleDelete = async (id) => {
    const confirmado = await confirmarAccion(
      "¿Eliminar kinesiólogo?",
      "Esta acción no se puede deshacer."
    );
    if (!confirmado) return;

    try {
      await api.delete(`/kinesiologos/${id}`);
      fetchKinesiologos();
      fetchUsuariosDisponibles();
      alertaExito("Kinesiólogo eliminado");
    } catch (err) {
      console.error("❌ Error eliminando kinesiólogo:", err);
      alertaError(err.response?.data?.detail || "Error al eliminar");
    }
  };

  const columns = [
    {
      key: "nombre",
      label: "Nombre",
      render: (k) => k.user?.nombre || "N/A",
    },
    {
      key: "email",
      label: "Email",
      render: (k) => k.user?.email || "N/A",
    },
    {
      key: "matricula",
      label: "Matrícula",
      render: (k) => (
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
          {k.matricula_profesional}
        </span>
      ),
    },
    {
      key: "especialidad",
      label: "Especialidad",
      render: (k) => k.especialidad || "-",
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (k) => (
        <div className="flex gap-2 justify-end md:justify-start">
          <button
            onClick={() => handleEdit(k)}
            className="bg-yellow-500 text-white p-1.5 rounded hover:bg-yellow-600"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(k.id)}
            className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-600">Cargando kinesiólogos...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Stethoscope className="text-green-600 w-6 h-6" /> Gestión de
            Kinesiólogos
          </h1>
          <button
            onClick={abrirModalCrear}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            <PlusCircle className="w-5 h-5" /> Crear Kinesiólogo
          </button>
        </div>

        <DataTable
          data={kinesiologos}
          columns={columns}
          emptyMessage="No hay kinesiólogos registrados."
        />

        {/* Modal de creación */}
        <EditModal
          isOpen={modalCrearAbierto}
          onClose={() => setModalCrearAbierto(false)}
          title="Crear Kinesiólogo"
          onSave={handleCrear}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3">
                Modo de Creación
              </h4>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modo"
                    value="nuevo"
                    checked={modoCreacion === "nuevo"}
                    onChange={(e) => setModoCreacion(e.target.value)}
                    className="w-4 h-4"
                  />
                  <UserPlus className="w-5 h-5 text-green-600" />{" "}
                  <span className="text-sm font-medium">Usuario Nuevo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modo"
                    value="existente"
                    checked={modoCreacion === "existente"}
                    onChange={(e) => setModoCreacion(e.target.value)}
                    className="w-4 h-4"
                  />
                  <UserCheck className="w-5 h-5 text-blue-600" />{" "}
                  <span className="text-sm font-medium">Usuario Existente</span>
                </label>
              </div>
            </div>
            {modoCreacion === "nuevo" && (
              <>
                <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                  <h5 className="font-medium text-gray-700">Datos Usuario</h5>
                  <InputConError
                    placeholder="Nombre completo *"
                    value={formNuevo.nombre}
                    onChange={(e) =>
                      handleChangeNuevo("nombre", e.target.value)
                    }
                    error={errores.nombre}
                  />
                  <InputConError
                    type="email"
                    placeholder="Email *"
                    value={formNuevo.email}
                    onChange={(e) => handleChangeNuevo("email", e.target.value)}
                    error={errores.email}
                  />
                  <InputConError
                    type="password"
                    placeholder="Contraseña *"
                    value={formNuevo.password}
                    onChange={(e) =>
                      handleChangeNuevo("password", e.target.value)
                    }
                    error={errores.password}
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                  <h5 className="font-medium text-gray-700">
                    Datos Profesional
                  </h5>
                  <InputConError
                    placeholder="Matrícula *"
                    value={formNuevo.matricula_profesional}
                    onChange={(e) =>
                      handleChangeNuevo("matricula_profesional", e.target.value)
                    }
                    error={errores.matricula_profesional}
                  />
                  <InputConError
                    placeholder="Especialidad"
                    value={formNuevo.especialidad}
                    onChange={(e) =>
                      handleChangeNuevo("especialidad", e.target.value)
                    }
                    error={errores.especialidad}
                  />
                </div>
              </>
            )}
            {modoCreacion === "existente" && (
              <>
                <select
                  className="w-full border rounded p-2"
                  value={usuarioSeleccionado}
                  onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                >
                  <option value="">-- Seleccionar Usuario --</option>
                  {usuariosDisponibles.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.email})
                    </option>
                  ))}
                </select>
                {usuariosDisponibles.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-3 mt-2">
                    <InputConError
                      placeholder="Matrícula *"
                      value={formExistente.matricula_profesional}
                      onChange={(e) =>
                        handleChangeExistente(
                          "matricula_profesional",
                          e.target.value
                        )
                      }
                      error={errores.matricula_profesional}
                    />
                    <InputConError
                      placeholder="Especialidad"
                      value={formExistente.especialidad}
                      onChange={(e) =>
                        handleChangeExistente("especialidad", e.target.value)
                      }
                      error={errores.especialidad}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </EditModal>

        <EditModal
          isOpen={editando !== null}
          onClose={() => {
            setEditando(null);
            setDatosEdicion({});
          }}
          title="Editar Kinesiólogo"
          onSave={handleUpdate}
          isLoading={isLoadingSave}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Matrícula *</label>
              <InputConError
                value={datosEdicion.matricula_profesional || ""}
                onChange={(e) =>
                  setDatosEdicion({
                    ...datosEdicion,
                    matricula_profesional: e.target.value,
                  })
                }
                error={errores.matricula_profesional}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Especialidad</label>
              <InputConError
                value={datosEdicion.especialidad || ""}
                onChange={(e) =>
                  setDatosEdicion({
                    ...datosEdicion,
                    especialidad: e.target.value,
                  })
                }
                error={errores.especialidad}
              />
            </div>
          </div>
        </EditModal>
      </div>
    </MainLayout>
  );
}
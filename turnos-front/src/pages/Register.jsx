import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, User, Lock, Mail } from "lucide-react";
import { registerUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";
// 👇 Importamos alerta
import { alertaExito } from "../utils/alerts";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
  });

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiamos el error cuando el usuario empieza a escribir de nuevo
    if (error) setError("");
  };

  // 🔹 Validación simple en el frontend
  const validarFormulario = () => {
    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }
    // Puedes agregar más validaciones aquí (mayúsculas, números, etc.)
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validamos antes de enviar para evitar llamadas innecesarias
    if (!validarFormulario()) return;

    setIsLoading(true);
    setError("");

    try {
      console.log("📦 Enviando registro:", formData);
      const data = await registerUser(
        formData.nombre,
        formData.email,
        formData.password
      );

      // Si el backend devuelve un token (como el login), logueamos directo
      if (data.access_token) {
        await login(data.access_token);
        alertaExito("¡Registro exitoso! Bienvenido.");
        navigate("/dashboard");
      } else {
        // Si solo crea el usuario sin token, redirigimos al login
        alertaExito("Cuenta creada. Por favor inicia sesión.");
        navigate("/login");
      }
    } catch (err) {
      console.error("❌ Error en registro:", err);
      
      // 🔹 AQUÍ ESTABA EL ERROR DEL PANTALLAZO BLANCO
      // FastAPI devuelve 422 como un array de objetos. React crashea si intentas renderizar objetos.
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        
        if (Array.isArray(detail)) {
            // Si es un array (errores de validación de pydantic), unimos los mensajes
            const mensajes = detail.map(d => d.msg).join(". ");
            setError(mensajes);
        } else {
            // Si es un string simple
            setError(detail);
        }
      } else {
        setError("No se pudo registrar el usuario. Intente nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sistema de Gestión Kinesiológica
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nombre */}
          <div className="relative">
            <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nombre completo"
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contraseña */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type={isVisible ? "text" : "password"}
              placeholder="Contraseña"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={toggleVisibility}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          {/* Texto de ayuda para la contraseña */}
          <p className="text-xs text-gray-500 px-1">
            Mínimo 8 caracteres.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        <div className="text-center text-sm mt-6">
          <span className="text-gray-600">¿Ya tienes cuenta? </span>
          <Link
            to="/login"
            className="text-blue-600 font-medium hover:underline"
          >
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
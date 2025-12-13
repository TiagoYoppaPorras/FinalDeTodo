import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// 🔹 Interceptor para agregar token automáticamente en query (?token=...)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // No agregamos token en rutas públicas
  const isAuthRoute =
    config.url?.includes("/auth/login") || config.url?.includes("/auth/register");

  if (token && !isAuthRoute) {
    if (!config.params) config.params = {};
    config.params.token = token; // 👈 añade el token como query param
  }

  return config;
});

// 🔹 Interceptor de respuesta para manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token inválido o expirado. Cerrando sesión...");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// 🔹 Interceptor para inyectar el Token en los HEADERS
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // No agregamos token en rutas públicas
  const isAuthRoute =
    config.url?.includes("/auth/login") || config.url?.includes("/auth/register");

  if (token && !isAuthRoute) {
    // 🔴 CORRECCIÓN: Usar Header Authorization Bearer estándar
    config.headers.Authorization = `Bearer ${token}`;
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
      // Opcional: Redirigir solo si no estamos ya en login
      if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
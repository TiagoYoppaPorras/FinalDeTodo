import API from "./Client";

// 🔐 Login
export const loginUser = async (email, password) => {
  const response = await API.post("/auth/login", {
    email,
    password,
  });
  return response.data; // devolvemos los datos del backend
};

// 🧾 Registro
export const registerUser = async (nombre, email, password) => {
  const payload = {
    nombre,
    email,
    password,
    activo: true, // 👈 por defecto lo marcamos como activo
  };

  const res = await API.post("/auth/register", payload);
  return res.data;
};
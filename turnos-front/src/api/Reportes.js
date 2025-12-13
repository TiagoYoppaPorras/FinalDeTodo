import axios from "axios";

// 📊 Obtener datos del reporte de turnos
export const getReporteTurnos = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("/api/reportes/turnos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error al obtener reporte de turnos:", error);
    throw error;
  }
};



const API_BASE_URL = "http://localhost:8000"; // 👈 tu backend real

export const descargarReportePDF = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios({
      url: `${API_BASE_URL}/reportes/turnos/pdf`, // 👈 sin /api
      method: "GET",
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
    });

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "reporte_turnos.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("❌ Error al descargar PDF:", error);
    alert("No se pudo generar el PDF del reporte");
  }
};

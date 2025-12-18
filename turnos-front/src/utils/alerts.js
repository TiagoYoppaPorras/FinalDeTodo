import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const alertaExito = (mensaje) => {
  return MySwal.fire({
    title: '¡Excelente!',
    text: mensaje,
    icon: 'success',
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'Aceptar',
    timer: 3000,
    timerProgressBar: true
  });
};

export const alertaError = (mensaje) => {
  return MySwal.fire({
    title: 'Error',
    text: mensaje,
    icon: 'error',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Cerrar'
  });
};

export const confirmarAccion = async (titulo, texto) => {
  const result = await MySwal.fire({
    title: titulo,
    text: texto,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, confirmar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });
  return result.isConfirmed;
};
/**
 * Funciones de validación centralizadas para el frontend
 * Estas validaciones deben coincidir con las del backend
 */

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validarEmail = (email) => {
  if (!email || email.trim() === '') {
    return 'El email es obligatorio';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'El formato del email no es válido (debe contener @ y dominio)';
  }
  
  return null;
};

/**
 * Valida contraseña fuerte
 * Debe coincidir con validación del backend en user_schema.py
 * @param {string} password - Contraseña a validar
 * @returns {string|null} - Mensaje de error o null si es válida
 */
export const validarPassword = (password) => {
  if (!password || password.trim() === '') {
    return 'La contraseña es obligatoria';
  }
  
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  
  if (!/\d/.test(password)) {
    return 'La contraseña debe contener al menos un número';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra mayúscula';
  }
  
  return null;
};

/**
 * Valida DNI argentino
 * Debe coincidir con validación del backend en paciente_schema.py
 * @param {string} dni - DNI a validar
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validarDNI = (dni) => {
  if (!dni || dni.trim() === '') {
    return null; // DNI es opcional en muchos casos
  }
  
  // Limpiar puntos y espacios
  const dniLimpio = dni.replace(/[.\s]/g, '');
  
  // Validar que solo contenga números
  if (!/^\d+$/.test(dniLimpio)) {
    return 'El DNI debe contener solo números';
  }
  
  // Validar longitud (6-10 dígitos)
  if (dniLimpio.length < 6 || dniLimpio.length > 10) {
    return 'El DNI debe tener entre 6 y 10 dígitos';
  }
  
  return null;
};

/**
 * Valida número de teléfono
 * Debe coincidir con validación del backend en paciente_schema.py
 * @param {string} telefono - Teléfono a validar
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validarTelefono = (telefono) => {
  if (!telefono || telefono.trim() === '') {
    return null; // Teléfono es opcional
  }
  
  // Permitir números, +, -, espacios y paréntesis
  const telefonoRegex = /^[\d\+\-\s()]+$/;
  if (!telefonoRegex.test(telefono)) {
    return 'El teléfono contiene caracteres inválidos (solo se permiten números, +, -, (), espacios)';
  }
  
  // Verificar que tenga al menos 6 dígitos
  const soloDigitos = telefono.replace(/\D/g, '');
  if (soloDigitos.length < 6) {
    return 'El teléfono debe tener al menos 6 dígitos';
  }
  
  return null;
};

/**
 * Valida nombre (no vacío y longitud razonable)
 * @param {string} nombre - Nombre a validar
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validarNombre = (nombre) => {
  if (!nombre || nombre.trim() === '') {
    return 'El nombre es obligatorio';
  }
  
  if (nombre.trim().length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (nombre.trim().length > 100) {
    return 'El nombre no puede exceder 100 caracteres';
  }
  
  return null;
};

/**
 * Valida matrícula profesional (no vacía)
 * @param {string} matricula - Matrícula a validar
 * @returns {string|null} - Mensaje de error o null si es válida
 */
export const validarMatricula = (matricula) => {
  if (!matricula || matricula.trim() === '') {
    return 'La matrícula profesional es obligatoria';
  }
  
  if (matricula.trim().length < 3) {
    return 'La matrícula debe tener al menos 3 caracteres';
  }
  
  return null;
};

/**
 * Limpia DNI removiendo puntos y espacios
 * @param {string} dni - DNI a limpiar
 * @returns {string} - DNI limpio
 */
export const limpiarDNI = (dni) => {
  if (!dni) return '';
  return dni.replace(/[.\s]/g, '');
};

/**
 * Formatea DNI agregando puntos (ej: 12345678 -> 12.345.678)
 * @param {string} dni - DNI a formatear
 * @returns {string} - DNI formateado
 */
export const formatearDNI = (dni) => {
  if (!dni) return '';
  const dniLimpio = limpiarDNI(dni);
  
  // No formatear si tiene menos de 6 dígitos
  if (dniLimpio.length < 6) return dniLimpio;
  
  // Formatear con puntos
  return dniLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Valida todos los campos de un formulario
 * @param {Object} campos - Objeto con los campos a validar
 * @param {Object} validadores - Objeto con las funciones validadoras para cada campo
 * @returns {Object} - Objeto con los errores encontrados
 */
export const validarFormulario = (campos, validadores) => {
  const errores = {};
  
  Object.keys(validadores).forEach(campo => {
    const validador = validadores[campo];
    const valor = campos[campo];
    const error = validador(valor);
    
    if (error) {
      errores[campo] = error;
    }
  });
  
  return errores;
};

/**
 * Verifica si un objeto de errores tiene algún error
 * @param {Object} errores - Objeto con errores
 * @returns {boolean} - true si hay al menos un error
 */
export const tieneErrores = (errores) => {
  return Object.keys(errores).some(key => errores[key] !== null && errores[key] !== '');
};

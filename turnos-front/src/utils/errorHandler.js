/**
 * Manejador centralizado de errores del backend
 * Mapea errores de la API a campos específicos del formulario
 */

/**
 * Procesa errores de validación de Pydantic (status 422)
 * @param {Object} errorResponse - Respuesta de error del backend
 * @returns {Object} - Objeto con errores mapeados por campo
 */
const procesarErroresPydantic = (errorResponse) => {
  const errores = {};
  
  // Los errores de Pydantic vienen en formato: { detail: [{loc: [...], msg: "...", type: "..."}] }
  if (errorResponse.detail && Array.isArray(errorResponse.detail)) {
    errorResponse.detail.forEach(error => {
      // loc contiene la ruta del campo, ej: ["body", "password"]
      if (error.loc && error.loc.length > 0) {
        // El último elemento de loc es el nombre del campo
        const campo = error.loc[error.loc.length - 1];
        errores[campo] = error.msg;
      }
    });
  }
  
  return errores;
};

/**
 * Procesa errores de lógica de negocio (status 400, 404, etc.)
 * Intenta identificar a qué campo pertenece el error basándose en palabras clave
 * @param {string} mensaje - Mensaje de error del backend
 * @returns {Object} - Objeto con errores mapeados por campo
 */
const procesarErrorNegocio = (mensaje) => {
  const errores = {};
  
  if (typeof mensaje !== 'string') {
    return errores;
  }
  
  const mensajeLower = mensaje.toLowerCase();
  
  // Mapeo de palabras clave a campos
  const mapeos = [
    { keywords: ['dni'], campo: 'dni' },
    { keywords: ['email', 'correo'], campo: 'email' },
    { keywords: ['contraseña', 'password'], campo: 'password' },
    { keywords: ['teléfono', 'telefono', 'celular'], campo: 'telefono' },
    { keywords: ['nombre'], campo: 'nombre' },
    { keywords: ['matrícula', 'matricula'], campo: 'matricula_profesional' },
    { keywords: ['especialidad'], campo: 'especialidad' },
    { keywords: ['obra social', 'cobertura'], campo: 'obra_social' },
    { keywords: ['dirección', 'direccion', 'domicilio'], campo: 'direccion' }
  ];
  
  // Buscar qué campo corresponde al error
  for (const mapeo of mapeos) {
    if (mapeo.keywords.some(keyword => mensajeLower.includes(keyword))) {
      errores[mapeo.campo] = mensaje;
      return errores; // Retornar al primer match
    }
  }
  
  // Si no se pudo mapear, retornar objeto vacío
  // El componente padre mostrará el error con alertaError()
  return errores;
};

/**
 * Procesa errores del backend y los convierte en formato útil para el frontend
 * @param {Object} error - Error de axios
 * @returns {Object} - { erroresCampos: {...}, mensajeGeneral: "..." }
 */
export const procesarErrorBackend = (error) => {
  const resultado = {
    erroresCampos: {},
    mensajeGeneral: null
  };
  
  // Si no hay respuesta del servidor
  if (!error.response) {
    resultado.mensajeGeneral = 'Error de conexión con el servidor. Verifica tu conexión a internet.';
    return resultado;
  }
  
  const status = error.response.status;
  const data = error.response.data;
  
  // Errores de validación de Pydantic (422)
  if (status === 422) {
    resultado.erroresCampos = procesarErroresPydantic(data);
    
    // Si no se pudo extraer ningún campo específico, usar mensaje general
    if (Object.keys(resultado.erroresCampos).length === 0) {
      resultado.mensajeGeneral = 'Error de validación en el formulario. Por favor revisa los datos ingresados.';
    }
    return resultado;
  }
  
  // Errores de lógica de negocio (400, 404, etc.)
  const mensaje = data?.detail || data?.message || 'Error desconocido';
  
  // Intentar mapear el error a un campo específico
  resultado.erroresCampos = procesarErrorNegocio(mensaje);
  
  // Si no se pudo mapear a ningún campo, usar como mensaje general
  if (Object.keys(resultado.erroresCampos).length === 0) {
    resultado.mensajeGeneral = mensaje;
  }
  
  return resultado;
};

/**
 * Genera mensajes de error amigables basados en el código de estado HTTP
 * @param {number} status - Código de estado HTTP
 * @returns {string} - Mensaje de error amigable
 */
export const obtenerMensajePorStatus = (status) => {
  const mensajes = {
    400: 'Los datos enviados no son válidos. Por favor revisa el formulario.',
    401: 'No estás autenticado. Por favor inicia sesión nuevamente.',
    403: 'No tienes permisos para realizar esta acción.',
    404: 'El recurso solicitado no fue encontrado.',
    409: 'Ya existe un registro con estos datos.',
    422: 'Error de validación en los datos enviados.',
    500: 'Error interno del servidor. Por favor contacta al administrador.',
    503: 'El servicio no está disponible temporalmente. Intenta más tarde.'
  };
  
  return mensajes[status] || `Error ${status}: Ocurrió un problema inesperado.`;
};

/**
 * Extrae el mensaje de error más relevante de la respuesta del backend
 * @param {Object} error - Error de axios
 * @returns {string} - Mensaje de error
 */
export const extraerMensajeError = (error) => {
  if (!error.response) {
    return 'Error de conexión con el servidor';
  }
  
  const data = error.response.data;
  
  // Intentar obtener el mensaje de diferentes ubicaciones
  return data?.detail || 
         data?.message || 
         data?.error || 
         obtenerMensajePorStatus(error.response.status);
};

/**
 * Verifica si un error es de tipo "recurso duplicado"
 * @param {Object} error - Error de axios
 * @returns {boolean} - true si el error es por duplicado
 */
export const esDuplicado = (error) => {
  if (!error.response) return false;
  
  const mensaje = extraerMensajeError(error).toLowerCase();
  const palabrasClave = ['duplicado', 'ya existe', 'ya está', 'already exists', 'duplicate'];
  
  return palabrasClave.some(palabra => mensaje.includes(palabra));
};

/**
 * Verifica si un error es de autenticación
 * @param {Object} error - Error de axios
 * @returns {boolean} - true si el error es de autenticación
 */
export const esErrorAutenticacion = (error) => {
  if (!error.response) return false;
  return error.response.status === 401;
};

/**
 * Verifica si un error es de permisos
 * @param {Object} error - Error de axios
 * @returns {boolean} - true si el error es de permisos
 */
export const esErrorPermisos = (error) => {
  if (!error.response) return false;
  return error.response.status === 403;
};

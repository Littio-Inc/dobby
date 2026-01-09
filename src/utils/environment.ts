/**
 * Detecta el ambiente actual basándose en el hostname/URL
 * @returns 'staging' | 'production' | 'development'
 */
export const getEnvironment = (): 'staging' | 'production' | 'development' => {
  // En el cliente (browser)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const origin = window.location.origin;

    // Development: localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || origin.includes('localhost:4321')) {
      return 'development';
    }

    // Staging: dobby-dev.littio-api.co
    if (
      hostname === 'dobby-dev.littio-api.co' ||
      hostname.includes('dobby-dev') ||
      origin.includes('dobby-dev.littio-api.co')
    ) {
      return 'staging';
    }

    // Production: hub.littio.co
    if (hostname === 'hub.littio.co' || hostname.includes('hub.littio.co') || origin.includes('hub.littio.co')) {
      return 'production';
    }

    // Fallback: si no coincide con ninguno, intentar detectar por patrones
    if (hostname.includes('staging') || hostname.includes('dev') || hostname.includes('test')) {
      return 'staging';
    }

    // Por defecto, asumir production
    return 'production';
  }

  // En el servidor (SSR) - usar NODE_ENV como fallback
  if (typeof process !== 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      return 'development';
    }
    return 'production';
  }

  // Fallback
  return 'production';
};

/**
 * Verifica si el ambiente actual es staging
 */
export const isStaging = (): boolean => {
  return getEnvironment() === 'staging';
};

/**
 * Verifica si el ambiente actual es production
 */
export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

/**
 * Verifica si el ambiente actual es development
 */
export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

/**
 * Obtiene el hostname actual
 */
export const getCurrentHostname = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return '';
};

/**
 * Obtiene el origin actual (protocolo + hostname + puerto)
 */
export const getCurrentOrigin = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

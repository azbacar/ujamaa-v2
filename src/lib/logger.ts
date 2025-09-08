// Production-ready logging utility
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[LOG] ${message}`, ...args);
    }
    // En production, les logs non-critiques sont silencieux
  },
  
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      // En production, stocker les erreurs critiques pour le monitoring
      try {
        const errorData = {
          message,
          error: error?.message || error,
          timestamp: new Date().toISOString(),
          url: window.location.href
        };
        
        // Store in localStorage for debugging (optional)
        const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
        existingErrors.push(errorData);
        
        // Keep only last 50 errors
        if (existingErrors.length > 50) {
          existingErrors.splice(0, existingErrors.length - 50);
        }
        
        localStorage.setItem('app_errors', JSON.stringify(existingErrors));
      } catch (e) {
        // Fallback if localStorage fails
      }
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
};

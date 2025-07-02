
// Secure storage utilities with enhanced cookie security
export const secureStorage = {
  // Use localStorage for UI preferences instead of cookies when possible
  setUIPreference: (key: string, value: string): void => {
    try {
      localStorage.setItem(`ui_${key}`, value);
    } catch (error) {
      console.warn('Failed to save UI preference:', error);
    }
  },

  getUIPreference: (key: string, defaultValue: string = ''): string => {
    try {
      return localStorage.getItem(`ui_${key}`) || defaultValue;
    } catch (error) {
      console.warn('Failed to read UI preference:', error);
      return defaultValue;
    }
  },

  removeUIPreference: (key: string): void => {
    try {
      localStorage.removeItem(`ui_${key}`);
    } catch (error) {
      console.warn('Failed to remove UI preference:', error);
    }
  },

  // Enhanced cookie handling with security flags (for when cookies are necessary)
  setSecureCookie: (name: string, value: string, days: number = 30): void => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    
    // Add security flags
    const securityFlags = [
      'SameSite=Strict',
      'Secure', // Will work when deployed over HTTPS
      'HttpOnly=false' // We need JS access for UI preferences
    ];
    
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; ${securityFlags.join('; ')}`;
  },

  getSecureCookie: (name: string): string | null => {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }
};

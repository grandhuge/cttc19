
// Input sanitization and validation utilities
export const sanitizeNumericInput = (value: string | number): number => {
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? 0 : Math.max(0, value);
  }
  
  // Remove all non-numeric characters except decimal point
  const cleaned = value.toString().replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) || !isFinite(num) ? 0 : Math.max(0, num);
};

export const validateMonetaryAmount = (amount: string | number): boolean => {
  const sanitized = sanitizeNumericInput(amount);
  return sanitized >= 0 && sanitized <= 999999999; // Max 999M for reasonable limits
};

export const sanitizeTextInput = (input: string, maxLength: number = 100): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, maxLength);
};

// Safe confirmation dialog replacement
export const showConfirmDialog = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  // For now, use the built-in confirm but this can be replaced with a custom modal
  if (confirm(message)) {
    onConfirm();
  } else if (onCancel) {
    onCancel();
  }
};

// Safe alert replacement
export const showAlert = (message: string): void => {
  // For now, use alert but this should be replaced with toast notifications
  alert(message);
};

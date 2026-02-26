export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateMatricNo = (matricNo) => {
  return matricNo && matricNo.trim().length >= 5 && matricNo.trim().length <= 20;
};

export const validateStaffId = (staffId) => {
  return staffId && staffId.trim().length >= 3 && staffId.trim().length <= 20;
};

export const getUserFriendlyError = (error) => {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment.';
  }
  if (message.includes('already registered')) {
    return 'Email already registered.';
  }
  if (message.includes('invalid login')) {
    return 'Invalid email or password.';
  }
  if (message.includes('duplicate key') || message.includes('23505')) {
    return 'This ID already exists.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Check your connection.';
  }
  if (message.includes('linked to another account')) {
    return 'This device is linked to another account.';
  }
  
  return error.message || 'An error occurred.';
};
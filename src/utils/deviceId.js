// utils/deviceId.js
export const generateDeviceId = () => {
  // Get browser info
  const userAgent = navigator.userAgent;
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  
  // Create a unique fingerprint
  const fingerprint = `${userAgent}|${screenRes}|${timezone}|${language}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

export const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
};
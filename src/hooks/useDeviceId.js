import { useState, useEffect } from 'react';

const generateDeviceId = () => {
  const userAgent = navigator.userAgent;
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const platform = navigator.platform;
  
  const fingerprint = `${userAgent}|${screenRes}|${timezone}|${language}|${platform}`;
  
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36) + Date.now().toString(36);
};

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    let id = localStorage.getItem('device_id');
    if (!id) {
      id = generateDeviceId();
      localStorage.setItem('device_id', id);
    }
    setDeviceId(id);
  }, []);

  return deviceId;
};
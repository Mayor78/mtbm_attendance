// components/PerformanceMonitor.jsx
import React, { useEffect, useState } from 'react';

 const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: null,
    lastUpdate: Date.now()
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const now = performance.now();
      const delta = now - lastTime;
      
      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta);
        setMetrics(prev => ({
          ...prev,
          fps,
          memory: performance.memory?.usedJSHeapSize 
            ? Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)) 
            : null,
          lastUpdate: now
        }));
        
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    const rafId = requestAnimationFrame(measureFPS);
    
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs px-3 py-2 rounded-lg font-mono z-50">
      <div>FPS: {metrics.fps}</div>
      {metrics.memory && <div>Memory: {metrics.memory} MB</div>}
      <div className="text-green-400">
        {metrics.fps > 50 ? '🟢 Smooth' : metrics.fps > 30 ? '🟡 OK' : '🔴 Lagging'}
      </div>
    </div>
  );
};

export default PerformanceMonitor
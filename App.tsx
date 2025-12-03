import React, { useState, useEffect, useRef, useCallback } from 'react';
import Scene from './components/ParticleSystem';
import { ParticleShape, ParticleState } from './types';
import { SHAPES, COLORS } from './constants';
import { GeminiLiveService } from './services/geminiLive';
import { Camera, Hand, Activity, Power, Palette, Layers, Info } from 'lucide-react';

const App: React.FC = () => {
  const [shape, setShape] = useState<ParticleShape>(ParticleShape.HEART);
  const [color, setColor] = useState<string>(COLORS[1]);
  const [particleState, setParticleState] = useState<ParticleState>({ expansion: 0, tension: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geminiRef = useRef<GeminiLiveService | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Gemini Service
  useEffect(() => {
    geminiRef.current = new GeminiLiveService();
    return () => {
      geminiRef.current?.disconnect();
    };
  }, []);

  const handleGeminiUpdate = useCallback((expansion: number, tension: number) => {
    setParticleState({ expansion, tension });
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: 15 },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Camera permission denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleConnection = async () => {
    if (isConnected) {
      geminiRef.current?.disconnect();
      stopCamera();
      setIsConnected(false);
    } else {
      await startCamera();
      // Wait a moment for video to start
      await new Promise(r => setTimeout(r, 1000));
      
      geminiRef.current?.connect({
        onConnect: () => setIsConnected(true),
        onDisconnect: () => {
            setIsConnected(false);
            stopCamera();
        },
        onUpdate: handleGeminiUpdate
      });
    }
  };

  // Video Frame Loop
  useEffect(() => {
    let intervalId: number;

    if (isConnected && isCameraActive) {
      intervalId = window.setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            // Draw video frame to canvas
            ctx.drawImage(videoRef.current, 0, 0, 320, 240);
            
            // Get base64
            const base64 = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
            
            // Send to Gemini
            geminiRef.current?.sendVideoFrame(base64);
          }
        }
      }, 200); // 5 FPS is sufficient for control and keeps quota manageable
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [isConnected, isCameraActive]);


  return (
    <div className="w-full h-full relative bg-gradient-to-br from-gray-900 to-black overflow-hidden font-sans">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0">
        <Scene shape={shape} color={color} particleState={particleState} />
      </div>

      {/* Hidden processing elements */}
      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} width="320" height="240" className="hidden" />

      {/* Header / Connection Status */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-3xl font-bold tracking-tighter text-white mb-2 drop-shadow-md">
            ZEN<span className="text-cyan-400">PARTICLES</span>
          </h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400 font-mono">
              {isConnected ? 'SYSTEM ONLINE // TRACKING' : 'OFFLINE'}
            </span>
          </div>
        </div>
        
        <div className="pointer-events-auto flex flex-col items-end space-y-4">
           {/* Camera/Connect Button */}
          <button
            onClick={toggleConnection}
            className={`
              flex items-center space-x-3 px-6 py-3 rounded-full backdrop-blur-md border transition-all duration-300
              ${isConnected 
                ? 'bg-red-500/20 border-red-500 text-red-100 hover:bg-red-500/40' 
                : 'bg-cyan-500/20 border-cyan-500 text-cyan-100 hover:bg-cyan-500/40'}
            `}
          >
            <Power size={20} />
            <span className="font-bold tracking-wider">{isConnected ? 'DISCONNECT' : 'INITIALIZE'}</span>
          </button>
          
          {isConnected && (
             <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/10 w-64 text-xs font-mono text-gray-300">
               <div className="flex justify-between mb-2">
                 <span>EXPANSION</span>
                 <span className="text-cyan-400">{(particleState.expansion * 100).toFixed(0)}%</span>
               </div>
               <div className="w-full bg-gray-800 h-1 rounded mb-4 overflow-hidden">
                 <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${particleState.expansion * 100}%`}} />
               </div>
               
               <div className="flex justify-between mb-2">
                 <span>TENSION</span>
                 <span className="text-pink-500">{(particleState.tension * 100).toFixed(0)}%</span>
               </div>
               <div className="w-full bg-gray-800 h-1 rounded overflow-hidden">
                 <div className="h-full bg-pink-500 transition-all duration-300" style={{ width: `${particleState.tension * 100}%`}} />
               </div>
             </div>
          )}
        </div>
      </div>

      {/* Control Panels */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col md:flex-row gap-6 pointer-events-auto w-full max-w-4xl px-4">
        
        {/* Shape Selector */}
        <div className="flex-1 bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-4 transition-all hover:bg-black/50 hover:border-white/20">
          <div className="flex items-center space-x-2 mb-3 text-gray-300 border-b border-white/5 pb-2">
             <Layers size={16} />
             <span className="text-xs font-bold tracking-widest uppercase">Formation</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {SHAPES.map((s) => (
              <button
                key={s}
                onClick={() => setShape(s)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${shape === s 
                    ? 'bg-white text-black shadow-lg shadow-white/10 scale-105' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}
                `}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selector */}
        <div className="flex-initial bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-4 transition-all hover:bg-black/50 hover:border-white/20">
          <div className="flex items-center space-x-2 mb-3 text-gray-300 border-b border-white/5 pb-2">
             <Palette size={16} />
             <span className="text-xs font-bold tracking-widest uppercase">Spectrum</span>
          </div>
          <div className="flex space-x-3 justify-center">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`
                  w-8 h-8 rounded-full border-2 transition-all duration-300
                  ${color === c ? 'border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-110'}
                `}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Info / Instructions */}
      {!isConnected && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-60">
            <Camera size={48} className="mx-auto mb-4 text-cyan-500 animate-bounce" />
            <p className="text-xl font-light tracking-wide">INITIALIZE SYSTEM TO BEGIN</p>
            <p className="text-sm mt-2 max-w-md mx-auto">
              Use your camera to control the particles. <br/>
              Open/Close hands to expand/contract. <br/>
              Clench fists to increase tension.
            </p>
         </div>
      )}
    </div>
  );
};

export default App;

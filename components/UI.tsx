import React from 'react';
import { ParticleMode } from '../types';

interface UIProps {
  currentMode: ParticleMode;
  onUpload: (file: File) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  gesture: string;
  isPinching: boolean;
  hasImage: boolean;
}

const UI: React.FC<UIProps> = ({ currentMode, onUpload, videoRef, gesture, isPinching, hasImage }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const getStatusText = () => {
    if (isPinching && hasImage) return "Mode: IMAGE REVEAL (Pinching)";
    if (gesture === "Closed_Fist") return "Mode: ASSEMBLE TREE (Fist)";
    if (gesture === "Open_Palm") return "Mode: EXPLODE (Open Hand)";
    return "Mode: IDLE (Waiting for gesture)";
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 text-[#D4AF37] font-sans">
      
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-widest font-['Cinzel'] text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF] to-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
            LUXE HOLIDAY
          </h1>
          <p className="text-emerald-400 text-sm tracking-widest mt-2 uppercase opacity-80">
            Interactive 3D Experience
          </p>
        </div>
        
        {/* Webcam Preview (Small & Styled) */}
        <div className="relative group pointer-events-auto">
          <video 
            ref={videoRef} 
            className="w-32 h-24 object-cover rounded-lg border-2 border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]" 
            autoPlay 
            muted 
            playsInline 
          />
          <div className="absolute top-0 left-0 w-full h-full bg-black/20 rounded-lg"></div>
          <div className="absolute bottom-1 right-2 text-[10px] text-white/70">LIVE INPUT</div>
        </div>
      </header>

      {/* Center Status */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
         <div className={`transition-all duration-500 ease-out transform ${gesture !== "None" ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <h2 className="text-2xl text-emerald-100 font-light tracking-[0.2em] uppercase blur-xs">
              {getStatusText()}
            </h2>
         </div>
      </div>

      {/* Footer / Controls */}
      <footer className="flex justify-between items-end pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-[#D4AF37]/20 max-w-sm">
          <h3 className="text-[#D4AF37] font-bold mb-2 tracking-wide border-b border-[#D4AF37]/20 pb-1">INSTRUCTIONS</h3>
          <ul className="space-y-2 text-sm text-emerald-50">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
              <span>✊ <b>Close Fist:</b> Assemble Tree</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
              <span>✋ <b>Open Hand:</b> Explode Stars</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
              <span>🤏 <b>Pinch:</b> Reveal Your Photo</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col items-end gap-3">
          <label className="cursor-pointer group">
             <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
             <div className="px-6 py-3 bg-gradient-to-r from-[#046307] to-[#0a4f0c] text-[#D4AF37] border border-[#D4AF37]/50 rounded-full font-bold tracking-wider shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all transform group-hover:-translate-y-1 flex items-center gap-2">
               <span>UPLOAD PHOTO</span>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
             </div>
          </label>
          {!hasImage && <p className="text-xs text-red-400 mr-2">Upload a photo to use Pinch mode</p>}
        </div>
      </footer>
    </div>
  );
};

export default UI;
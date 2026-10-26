import React from 'react';

export const LandscapeFallback: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion = false }) => {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-[#8ec4e8] via-[#d7e8c4] to-[#e8d9a8]" />
      <div
        className={`absolute -top-10 right-[12%] w-36 h-36 rounded-full bg-[#ffd27a] blur-[2px] ${
          reducedMotion ? '' : 'animate-sun-pulse'
        }`}
      />
      <div className="absolute inset-x-0 bottom-[38%] h-[32%]">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full">
          <path fill="#6f8f7c" d="M0,192L120,176C240,160,480,128,720,144C960,160,1200,224,1320,256L1440,288L1440,320L0,320Z" />
          <path fill="#3e5d48" opacity="0.9" d="M0,224L160,208C320,192,640,160,880,176C1120,192,1280,240,1360,256L1440,272L1440,320L0,320Z" />
        </svg>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[46%]">
        <svg viewBox="0 0 1440 280" preserveAspectRatio="none" className="w-full h-full">
          <path fill="#86a546" d="M0,80L180,96C360,112,720,144,1080,128C1260,120,1350,96,1440,88L1440,280L0,280Z" />
          <path fill="#6f8f32" d="M0,140L240,128C480,116,960,150,1200,150C1320,150,1380,140,1440,132L1440,280L0,280Z" />
        </svg>
      </div>
      <div className={`absolute left-[8%] bottom-[18%] w-24 opacity-80 ${reducedMotion ? '' : 'animate-leaf-sway'}`}>
        <svg viewBox="0 0 80 140" className="w-full h-auto fill-[#1f4a2d]">
          <ellipse cx="40" cy="48" rx="22" ry="40" />
          <rect x="37" y="80" width="6" height="50" rx="2" fill="#3a2a18" />
        </svg>
      </div>
      <div className={`absolute right-[10%] bottom-[16%] w-28 opacity-75 ${reducedMotion ? '' : 'animate-leaf-sway'}`}>
        <svg viewBox="0 0 90 150" className="w-full h-auto fill-[#245534]">
          <ellipse cx="45" cy="50" rx="26" ry="46" />
          <rect x="42" y="88" width="7" height="52" rx="2" fill="#3a2a18" />
        </svg>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#071D43]/55 via-[#071D43]/20 to-transparent" />
    </div>
  );
};

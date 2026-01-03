import React, { useState, useRef, useEffect } from 'react';
import { ALARM_SOUNDS } from '../constants';
import { Icon } from './Icon';

interface ConfigModalProps {
  isSoundOn: boolean;
  toggleSound: () => void;
  autoFullscreen: boolean;
  toggleAutoFullscreen: () => void;
  selectedSound: string;
  onSelectSound: (url: string) => void;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isSoundOn,
  toggleSound,
  autoFullscreen,
  toggleAutoFullscreen,
  selectedSound,
  onSelectSound,
  onClose
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePreview = (url: string) => {
    if (previewUrl === url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPreviewUrl(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.onended = () => setPreviewUrl(null);
      audio.onerror = (e) => {
        console.error("Audio playback error", e);
        setPreviewUrl(null);
      };
      
      setPreviewUrl(url);
      
      audio.play().catch(e => {
        console.error("Preview failed", e);
        setPreviewUrl(null);
      });
      
      audioRef.current = audio;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[40px] p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">SETTINGS</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-500 hover:text-zinc-300 active:scale-95 transition-transform"
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Sound Toggle Card */}
          <button 
            onClick={toggleSound}
            className={`
              aspect-square rounded-3xl flex flex-col items-center justify-center gap-3 p-4 transition-all duration-300 active:scale-95 border-2
              ${isSoundOn 
                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' 
                : 'bg-zinc-950 border-zinc-800 text-zinc-500'}
            `}
          >
            <div className={`p-4 rounded-full ${isSoundOn ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-600'}`}>
              <Icon name={isSoundOn ? 'volumeOn' : 'volumeOff'} size={24} />
            </div>
            <span className="font-bold text-xs tracking-widest uppercase">
              Sound {isSoundOn ? 'On' : 'Off'}
            </span>
          </button>

          {/* Auto Fullscreen Toggle Card */}
          <button 
            onClick={toggleAutoFullscreen}
            className={`
              aspect-square rounded-3xl flex flex-col items-center justify-center gap-3 p-4 transition-all duration-300 active:scale-95 border-2
              ${autoFullscreen 
                ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                : 'bg-zinc-950 border-zinc-800 text-zinc-500'}
            `}
          >
             <div className={`p-4 rounded-full ${autoFullscreen ? 'bg-purple-500 text-zinc-950' : 'bg-zinc-800 text-zinc-600'}`}>
              <Icon name="proportions" size={24} />
            </div>
            <span className="font-bold text-xs tracking-widest uppercase text-center leading-tight">
              Auto Fullscreen
            </span>
          </button>

          {/* Sound Selection Card (Full Width) */}
          <div className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-3xl p-4 space-y-4 mt-2">
            <div className="flex items-center gap-2 text-zinc-400 px-1">
              <Icon name="music" size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Alarm Tone</span>
            </div>
            
            <div className="space-y-1">
              {ALARM_SOUNDS.map((sound) => {
                const isSelected = selectedSound === sound.url;
                const isPlaying = previewUrl === sound.url;
                
                return (
                  <div
                    key={sound.id}
                    className={`
                      w-full flex items-center gap-3 p-2 pr-3 rounded-2xl transition-all
                      ${isSelected ? 'bg-zinc-800' : 'hover:bg-zinc-900'}
                    `}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePreview(sound.url);
                      }}
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0
                        ${isPlaying ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}
                      `}
                    >
                      <Icon name={isPlaying ? 'pause' : 'play'} size={16} />
                    </button>

                    <button
                      onClick={() => onSelectSound(sound.url)}
                      className="flex-1 text-left flex items-center justify-between group"
                    >
                      <span className={`font-semibold text-sm ${isSelected ? 'text-cyan-400' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                        {sound.name}
                      </span>
                      {isSelected && <Icon name="check" size={16} className="text-cyan-500" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GitHub Repository Card */}
          <a 
            href="https://github.com/Markkop/boomsync"
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 rounded-3xl flex items-center gap-3 p-4 transition-all duration-300 active:scale-95 border-2 bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:border-zinc-700 hover:text-zinc-300 mt-2"
          >
            <div className="p-3 rounded-full bg-zinc-800 text-zinc-500">
              <Icon name="github" size={20} />
            </div>
            <span className="font-bold text-xs tracking-widest uppercase">
              Github Repository
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};
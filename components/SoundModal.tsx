
import React, { useState, useRef, useEffect } from 'react';
import { ALARM_SOUNDS } from '../constants';
import { Icon } from './Icon';

interface SoundModalProps {
  selected: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export const SoundModal: React.FC<SoundModalProps> = ({ selected, onSelect, onClose }) => {
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
          alert("Could not play sound. The file might be unavailable.");
          setPreviewUrl(null);
      };
      
      setPreviewUrl(url); // Set state immediately to show loading/playing UI
      
      audio.play().catch(e => {
        console.error("Preview failed", e);
        setPreviewUrl(null); // Reset on play failure
      });
      
      audioRef.current = audio;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-zinc-300"
        >
          <Icon name="close" />
        </button>

        <h2 className="text-2xl font-black mb-6 text-zinc-100">ALARM SOUND</h2>

        <div className="space-y-2">
          {ALARM_SOUNDS.map((sound) => {
            const isSelected = selected === sound.url;
            const isPlaying = previewUrl === sound.url;
            
            return (
              <div
                key={sound.id}
                className={`
                  w-full flex items-center justify-between pl-6 pr-4 py-3 rounded-3xl transition-all
                  ${isSelected ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}
                `}
              >
                <button
                  onClick={() => onSelect(sound.url)}
                  className={`flex-1 text-left font-bold text-lg py-2 focus:outline-none ${isSelected ? 'text-zinc-950' : 'text-zinc-200'}`}
                >
                  {sound.name}
                </button>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePreview(sound.url);
                    }}
                    className={`
                      p-3 rounded-full transition-colors flex items-center justify-center
                      ${isSelected 
                        ? 'bg-zinc-950/10 hover:bg-zinc-950/20 text-zinc-950' 
                        : 'bg-zinc-900 hover:bg-zinc-950 text-cyan-400 border border-zinc-700'}
                    `}
                  >
                    <Icon name={isPlaying ? 'pause' : 'play'} size={18} />
                  </button>
                  
                  <div className={`w-6 flex justify-center ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                    {isSelected && <Icon name="music" size={20} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

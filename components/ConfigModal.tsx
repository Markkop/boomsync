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
  volume: number;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isSoundOn,
  toggleSound,
  autoFullscreen,
  toggleAutoFullscreen,
  selectedSound,
  onSelectSound,
  volume,
  onVolumeChange,
  onClose
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumePreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shortPreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (volumePreviewTimeoutRef.current) {
        clearTimeout(volumePreviewTimeoutRef.current);
      }
      if (shortPreviewTimeoutRef.current) {
        clearTimeout(shortPreviewTimeoutRef.current);
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
      audio.volume = volume;
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

  const playShortPreview = (url: string) => {
    // Stop any existing preview
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (shortPreviewTimeoutRef.current) {
      clearTimeout(shortPreviewTimeoutRef.current);
    }
    
    const audio = new Audio(url);
    audio.volume = volume;
    audio.onerror = (e) => {
      console.error("Audio playback error", e);
      if (shortPreviewTimeoutRef.current) {
        clearTimeout(shortPreviewTimeoutRef.current);
      }
    };
    
    audioRef.current = audio;
    
    audio.play().catch(e => {
      console.error("Preview failed", e);
      if (shortPreviewTimeoutRef.current) {
        clearTimeout(shortPreviewTimeoutRef.current);
      }
    });
    
    // Stop after 0.5 seconds for short preview
    shortPreviewTimeoutRef.current = setTimeout(() => {
      if (audioRef.current === audio) {
        audio.pause();
        audioRef.current = null;
      }
      if (shortPreviewTimeoutRef.current) {
        clearTimeout(shortPreviewTimeoutRef.current);
      }
    }, 500);
  };

  const handleSelectSound = (url: string) => {
    onSelectSound(url);
    // Auto-play short preview when selecting a different sound
    if (url !== selectedSound) {
      playShortPreview(url);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100; // Convert 0-100 to 0-1
    onVolumeChange(newVolume);
    
    // Clear any existing timeout
    if (volumePreviewTimeoutRef.current) {
      clearTimeout(volumePreviewTimeoutRef.current);
    }
    
    // Stop any existing preview immediately
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    // Debounce preview playback - only play short sound after user stops adjusting slider
    volumePreviewTimeoutRef.current = setTimeout(() => {
      // Play short preview of selected sound at new volume
      if (newVolume > 0 && selectedSound) {
        // Stop any existing preview
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }
        
        const previewAudio = new Audio(selectedSound);
        previewAudio.volume = newVolume;
        previewAudio.onerror = () => {
          if (audioRef.current === previewAudio) {
            audioRef.current = null;
          }
        };
        
        audioRef.current = previewAudio;
        previewAudio.play().catch(() => {
          // Ignore play errors
          if (audioRef.current === previewAudio) {
            audioRef.current = null;
          }
        });
        
        // Stop after 0.4 seconds for short preview (like checking selection)
        setTimeout(() => {
          if (audioRef.current === previewAudio) {
            previewAudio.pause();
            previewAudio.currentTime = 0;
            audioRef.current = null;
          }
        }, 400);
      }
    }, 300); // 300ms debounce delay
  };

  const getVolumeIcon = () => {
    if (volume === 0) return 'volumeOff';
    if (volume < 0.5) return 'volumeOn'; // You may need to add a volumeLow icon if available
    return 'volumeOn';
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

          {/* Volume Control Card (Full Width) */}
          <div className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-3xl p-4 space-y-3 mt-2">
            <div className="flex items-center gap-2 text-zinc-400 px-1">
              <Icon name={getVolumeIcon()} size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Volume</span>
            </div>
            
            <div className="flex items-center gap-3 px-1">
              <Icon name={getVolumeIcon()} size={20} className={`${volume === 0 ? 'text-zinc-500' : 'text-cyan-400'}`} />
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(volume * 100)}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                style={{
                  background: `linear-gradient(to right, rgb(6, 182, 212) 0%, rgb(6, 182, 212) ${volume * 100}%, rgb(39, 39, 42) ${volume * 100}%, rgb(39, 39, 42) 100%)`
                }}
              />
              <span className="text-sm font-semibold text-zinc-400 w-10 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

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
                      onClick={() => handleSelectSound(sound.url)}
                      className="flex-1 flex items-center gap-3 text-left group"
                    >
                      <Icon 
                        name={isSelected ? 'circleCheck' : 'circle'} 
                        size={20} 
                        className={`shrink-0 ${isSelected ? 'text-cyan-400' : 'text-zinc-500'}`}
                      />
                      <span className={`font-semibold text-sm ${isSelected ? 'text-cyan-400' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                        {sound.name}
                      </span>
                    </button>

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
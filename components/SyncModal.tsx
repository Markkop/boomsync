import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { peerService } from '../services/peerService';
import { Icon } from './Icon';

interface SyncModalProps {
  onClose: () => void;
  onToggle: () => void;
  initialCode?: string;
}

export const SyncModal: React.FC<SyncModalProps> = ({ onToggle, initialCode = '' }) => {
  const [roomCode, setRoomCode] = useState('');
  const [targetId, setTargetId] = useState(initialCode);
  const [status, setStatus] = useState<'idle' | 'hosting' | 'connecting' | 'connected'>('idle');
  const [connectionCount, setConnectionCount] = useState(0);
  const [isHost, setIsHost] = useState(true);
  const [copied, setCopied] = useState(false);

  // Check if already hosting or connected
  useEffect(() => {
    const existingRoomCode = peerService.getRoomCode();
    const existingId = peerService.getPeerId();
    const hostStatus = peerService.getIsHost();
    setIsHost(hostStatus);
    
    if (existingRoomCode) {
      setRoomCode(existingRoomCode);
      setConnectionCount(peerService.getConnectionCount());
      if (hostStatus) {
        setStatus('hosting');
      } else {
        setStatus('connected');
      }
    } else if (existingId) {
      // Fallback: if we have a peer ID but no room code, we're hosting
      setRoomCode(existingId);
      setConnectionCount(peerService.getConnectionCount());
      setStatus('hosting');
      setIsHost(true);
    }
  }, []);

  // Listen for connection count updates
  useEffect(() => {
    const checkConnectionCount = () => {
      const count = peerService.getConnectionCount();
      if (count > 0) {
        setConnectionCount(count);
      }
    };

    // Check periodically for connection count updates
    const interval = setInterval(checkConnectionCount, 500);
    
    // Also listen for messages that might update connection count
    peerService.onMessage(() => {
      checkConnectionCount();
    });

    return () => clearInterval(interval);
  }, []);

  const handleJoin = useCallback((idToJoin: string) => {
    if (!idToJoin) return;
    setStatus('connecting');
    // If we don't have an ID ourselves, init first (randomly), then connect
    // Note: PeerJS connect requires us to be initialized
    const initPromise = peerService.getPeerId() 
      ? Promise.resolve(peerService.getPeerId()!) 
      : peerService.init(); // Auto-gen ID for the joiner

    initPromise.then(() => {
      peerService.connect(idToJoin);
      setIsHost(false);
      peerService.onConnected(() => {
        setStatus('connected');
        setIsHost(false);
        // Update room code to the one we joined
        const joinedRoomCode = peerService.getRoomCode();
        if (joinedRoomCode) {
          setRoomCode(joinedRoomCode);
        }
        setConnectionCount(peerService.getConnectionCount());
      });
    }).catch(e => {
        alert("Connection failed: " + e);
        setStatus('idle');
    });
  }, []);

  // Auto-join if initialCode provided
  useEffect(() => {
    if (initialCode && status === 'idle' && !peerService.getPeerId()) {
      handleJoin(initialCode);
    }
  }, [initialCode, status, handleJoin]);

  const generateShortCode = () => {
    // Generate 6 character alpha-numeric code
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleHost = async () => {
    try {
      setStatus('connecting');
      const code = generateShortCode();
      const id = await peerService.init(code);
      setRoomCode(id);
      setConnectionCount(peerService.getConnectionCount());
      setStatus('hosting');
      setIsHost(true);
      peerService.onConnected(() => {
        setStatus('connected');
        setIsHost(true);
        setConnectionCount(peerService.getConnectionCount());
      });
    } catch (e) {
      alert("Failed to initialize sync: " + e);
      setStatus('idle');
    }
  };

  const getRoomLink = useMemo(() => {
    if (!roomCode) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomCode);
    return url.toString();
  }, [roomCode]);

  const copyLink = async () => {
    if (!getRoomLink) return;
    try {
      await navigator.clipboard.writeText(getRoomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleDisconnect = () => {
    peerService.disconnect();
    setStatus('idle');
    setRoomCode('');
    setConnectionCount(0);
    setTargetId('');
    setIsHost(true);
    // Clear URL parameter if present
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
        <button 
          onClick={onToggle}
          className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-zinc-300"
        >
          <Icon name="close" size={24} />
        </button>

        <h2 className="text-2xl font-black mb-6 text-zinc-100">SYNC SESSIONS</h2>

        <div className="space-y-8">
          {/* Host Section - only show when hosting or when idle (not when joined as non-host) */}
          {(isHost || status === 'idle') && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Host a Room</h3>
              {status === 'hosting' || (status === 'connected' && isHost) ? (
                <div className="space-y-2">
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center gap-4">
                    <code className="text-3xl font-mono font-bold text-cyan-400 tracking-wider">{roomCode}</code>
                    {connectionCount > 0 && (
                      <div className="text-xs text-zinc-500 font-semibold">
                        {connectionCount} {connectionCount === 1 ? 'person' : 'people'} connected
                      </div>
                    )}
                    {getRoomLink && (
                      <div className="bg-white p-3 rounded-xl">
                        <QRCodeSVG value={getRoomLink} size={160} />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={copyLink}
                    className="w-full py-3 bg-cyan-500/10 text-cyan-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-500/20 transition-all relative overflow-hidden"
                  >
                    {copied ? (
                      <span className="flex items-center gap-2 animate-in zoom-in duration-200">
                        <Icon name="check" size={18} />
                        <span>COPIED!</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Icon name="share" size={18} />
                        <span>COPY LINK</span>
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleHost}
                  disabled={status === 'connecting'}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-2xl transition-all"
                >
                  {status === 'connecting' ? 'Creating...' : 'CREATE ROOM'}
                </button>
              )}
            </div>
          )}

          {/* Only show join section when not connected */}
          {status !== 'hosting' && status !== 'connected' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-zinc-600 font-bold tracking-widest">OR</span></div>
              </div>

              {/* Join Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Join a Room</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="XXXXXX"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value.toUpperCase())}
                    className="flex-1 bg-zinc-950 border border-zinc-800 px-4 py-4 rounded-2xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 uppercase font-mono tracking-widest text-center font-bold"
                    maxLength={6}
                  />
                  <button 
                    onClick={() => handleJoin(targetId)}
                    disabled={status === 'connecting' || !targetId}
                    className="bg-cyan-500 p-4 rounded-2xl text-zinc-950 active:scale-90 transition-transform disabled:opacity-50 disabled:scale-100"
                  >
                    <Icon name="right" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Show room info for joiners when connected */}
          {status === 'connected' && roomCode && !isHost && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Joined Room</h3>
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center gap-4">
                <code className="text-3xl font-mono font-bold text-cyan-400 tracking-wider">{roomCode}</code>
                {connectionCount > 0 && (
                  <div className="text-xs text-zinc-500 font-semibold">
                    {connectionCount} {connectionCount === 1 ? 'person' : 'people'} connected
                  </div>
                )}
                {getRoomLink && (
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG value={getRoomLink} size={160} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {(status === 'connected' || status === 'hosting') && (
          <div className="mt-8">
            <button 
              onClick={handleDisconnect}
              className="w-full py-3 bg-red-500/10 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
            >
              <Icon name="logout" size={18} />
              <span>DISCONNECT</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
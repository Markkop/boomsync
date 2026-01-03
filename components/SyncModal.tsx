import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const [status, setStatus] = useState<'idle' | 'hosting' | 'connecting' | 'connected' | 'room_deleted'>('idle');
  const [connectionCount, setConnectionCount] = useState(0);
  const [isHost, setIsHost] = useState(true);
  const [copied, setCopied] = useState(false);

  // Track initial state to prevent auto-close when reopening modal
  const initialConnectionCountRef = useRef<number | null>(null);
  const initialStatusRef = useRef<string | null>(null);

  // Check if already hosting or connected
  useEffect(() => {
    const existingRoomCode = peerService.getRoomCode();
    const existingId = peerService.getPeerId();
    const hostStatus = peerService.getIsHost();
    setIsHost(hostStatus);
    
    // Capture initial state on mount
    const initialCount = peerService.getConnectionCount();
    initialConnectionCountRef.current = initialCount;
    
    if (existingRoomCode) {
      setRoomCode(existingRoomCode);
      setConnectionCount(initialCount);
      const initialStatus = hostStatus ? 'hosting' : 'connected';
      setStatus(initialStatus);
      initialStatusRef.current = initialStatus;
    } else if (existingId) {
      // Fallback: if we have a peer ID but no room code, we're hosting
      setRoomCode(existingId);
      setConnectionCount(initialCount);
      setStatus('hosting');
      setIsHost(true);
      initialStatusRef.current = 'hosting';
    } else {
      initialStatusRef.current = 'idle';
    }

    // Listen for room deletion
    peerService.onRoomDeleted(() => {
      setStatus('room_deleted');
      setRoomCode('');
      setConnectionCount(0);
      setIsHost(true);
    });
  }, []);

  // Listen for connection count updates
  useEffect(() => {
    const checkConnectionCount = () => {
      const count = peerService.getConnectionCount();
      if (count > 0) {
        setConnectionCount(count);
      }
    };

    // Use the callback for real-time updates
    peerService.onConnectionCountChange((count) => {
      setConnectionCount(count);
    });

    // Also check periodically as backup
    const interval = setInterval(checkConnectionCount, 500);

    return () => clearInterval(interval);
  }, []);

  // Auto-close modal when hosting and another user joins (connectionCount > 1)
  useEffect(() => {
    // Only auto-close if connectionCount increased AFTER modal opened
    if (isHost && connectionCount > 1 && 
        initialConnectionCountRef.current !== null && 
        connectionCount > initialConnectionCountRef.current) {
      onToggle();
    }
  }, [isHost, connectionCount, onToggle]);

  // Auto-close modal when joining and connection is established
  useEffect(() => {
    // Only auto-close if we transitioned to connected (wasn't connected on mount)
    if (status === 'connected' && !isHost && 
        initialStatusRef.current !== 'connected') {
      onToggle();
    }
  }, [status, isHost, onToggle]);

  const handleJoin = useCallback((idToJoin: string) => {
    if (!idToJoin) return;
    setStatus('connecting');
    // If we don't have an ID ourselves, init first (randomly), then connect
    const initPromise = peerService.getPeerId() 
      ? Promise.resolve(peerService.getPeerId()!) 
      : peerService.init();

    initPromise.then(() => {
      peerService.connect(idToJoin);
      setIsHost(false);
      peerService.onConnected(() => {
        setStatus('connected');
        setIsHost(false);
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
    // Joiner: just disconnect
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

  const handleDeleteRoom = () => {
    // Host: delete room and notify all joiners
    peerService.deleteRoom();
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

  const handleDismissRoomDeleted = () => {
    setStatus('idle');
    // Clear URL parameter if present
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  };

  // Room was deleted by host - show message
  if (status === 'room_deleted') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center">
              <Icon name="logout" size={32} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-black text-zinc-100">Room Closed</h2>
            <p className="text-zinc-400 text-sm">
              The host has closed this room. You have been disconnected.
            </p>
            <button 
              onClick={handleDismissRoomDeleted}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl transition-all"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isActiveSession = status === 'hosting' || status === 'connected';

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

        <div className="space-y-6">
          {/* Active Session Display - shown for both hosts and joiners when connected */}
          {isActiveSession && roomCode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                  {isHost ? 'Your Room' : 'Connected Room'}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs text-green-400 font-semibold">
                    {connectionCount} {connectionCount === 1 ? 'user' : 'users'}
                  </span>
                </div>
              </div>
              
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center gap-4">
                <code className="text-3xl font-mono font-bold text-cyan-400 tracking-wider">{roomCode}</code>
                {getRoomLink && (
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG value={getRoomLink} size={160} />
                  </div>
                )}
              </div>
              
              {/* Copy Link Button - available for both hosts and joiners */}
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
                    <span>SHARE LINK</span>
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Create Room Button - only when idle */}
          {status === 'idle' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Host a Room</h3>
              <button 
                onClick={handleHost}
                disabled={status === 'connecting'}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-2xl transition-all"
              >
                CREATE ROOM
              </button>
            </div>
          )}

          {/* Join Section - only when idle or connecting */}
          {(status === 'idle' || status === 'connecting') && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-zinc-600 font-bold tracking-widest">OR</span></div>
              </div>

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
                    {status === 'connecting' ? (
                      <div className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Icon name="right" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Disconnect/Delete Buttons */}
        {isActiveSession && (
          <div className="mt-6 space-y-2">
            {isHost ? (
              // Host: Delete Room button (disconnects all and destroys room)
              <button 
                onClick={handleDeleteRoom}
                className="w-full py-3 bg-red-500/20 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors border border-red-500/30"
              >
                <Icon name="logout" size={18} />
                <span>DISCONNECT & DELETE ROOM</span>
              </button>
            ) : (
              // Joiner: Simple disconnect button
              <button 
                onClick={handleDisconnect}
                className="w-full py-3 bg-zinc-800 text-zinc-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
              >
                <Icon name="logout" size={18} />
                <span>DISCONNECT</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

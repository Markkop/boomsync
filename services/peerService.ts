
import { Peer, DataConnection } from 'peerjs';
import { SyncMessage, GameState } from '../types';

const HEARTBEAT_INTERVAL = 5000; // Send heartbeat every 5 seconds
const CONNECTION_TIMEOUT = 15000; // Consider connection dead after 15 seconds

interface ConnectionInfo {
  connection: DataConnection;
  lastSeen: number;
  peerId: string;
}

class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, ConnectionInfo> = new Map();
  private onMessageCallbacks: ((msg: SyncMessage) => void)[] = [];
  private onConnectedCallback: (() => void) | null = null;
  private onDisconnectedCallback: (() => void) | null = null;
  private onRoomDeletedCallback: (() => void) | null = null;
  private onConnectionCountChangeCallback: ((count: number) => void) | null = null;
  private isHost: boolean = true;
  private roomCode: string | null = null;
  private connectionCount: number = 0;
  private maxConnectionCount: number = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private timeoutCheckInterval: ReturnType<typeof setInterval> | null = null;

  init(id?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // If id is provided, this peer is hosting
      this.isHost = id !== undefined;
      this.peer = new Peer(id);
      
      this.peer.on('open', (peerId) => {
        this.roomCode = peerId;
        this.connectionCount = 1; // Self counts as 1
        this.maxConnectionCount = 1;
        this.startHeartbeat();
        resolve(peerId);
      });
      
      this.peer.on('error', (err) => reject(err));
      
      this.peer.on('connection', (conn) => {
        this.handleIncomingConnection(conn);
      });
    });
  }

  connect(targetId: string) {
    if (!this.peer) return;
    this.isHost = false;
    this.roomCode = targetId;
    const conn = this.peer.connect(targetId);
    this.handleOutgoingConnection(conn);
  }

  private handleIncomingConnection(conn: DataConnection) {
    conn.on('open', () => {
      const connInfo: ConnectionInfo = {
        connection: conn,
        lastSeen: Date.now(),
        peerId: conn.peer
      };
      this.connections.set(conn.peer, connInfo);
      
      // Host: update connection counts
      if (this.isHost) {
        this.updateConnectionCount();
      }
      
      if (this.onConnectedCallback) this.onConnectedCallback();
    });
    
    this.setupConnection(conn);
    
    conn.on('close', () => {
      this.connections.delete(conn.peer);
      if (this.isHost) {
        this.updateConnectionCount();
      }
      if (this.onDisconnectedCallback) this.onDisconnectedCallback();
    });
    
    conn.on('error', () => {
      this.connections.delete(conn.peer);
      if (this.isHost) {
        this.updateConnectionCount();
      }
    });
  }

  private handleOutgoingConnection(conn: DataConnection) {
    conn.on('open', () => {
      const connInfo: ConnectionInfo = {
        connection: conn,
        lastSeen: Date.now(),
        peerId: conn.peer
      };
      this.connections.set(conn.peer, connInfo);
      
      // Request current state from host
      conn.send({ type: 'REQUEST_STATE' } as SyncMessage);
      
      if (this.onConnectedCallback) this.onConnectedCallback();
    });
    
    this.setupConnection(conn);
    
    conn.on('close', () => {
      this.connections.delete(conn.peer);
      // If joiner loses connection to host, trigger room deleted callback
      if (!this.isHost && this.onRoomDeletedCallback) {
        this.onRoomDeletedCallback();
      }
      if (this.onDisconnectedCallback) this.onDisconnectedCallback();
    });
    
    conn.on('error', () => {
      this.connections.delete(conn.peer);
    });
  }

  private setupConnection(conn: DataConnection) {
    conn.on('data', (data) => {
      const msg = data as SyncMessage;
      
      // Update last seen timestamp for heartbeats
      if (msg.type === 'HEARTBEAT') {
        const connInfo = this.connections.get(conn.peer);
        if (connInfo) {
          connInfo.lastSeen = Date.now();
        }
        return; // Don't propagate heartbeat to callbacks
      }
      
      // Handle connection count updates from host
      if (msg.type === 'CONNECTION_COUNT' && !this.isHost) {
        this.connectionCount = msg.count;
        this.maxConnectionCount = Math.max(this.maxConnectionCount, msg.count);
        if (this.onConnectionCountChangeCallback) {
          this.onConnectionCountChangeCallback(msg.count);
        }
      }
      
      // Handle room deleted notification
      if (msg.type === 'ROOM_DELETED' && !this.isHost) {
        if (this.onRoomDeletedCallback) {
          this.onRoomDeletedCallback();
        }
        this.disconnect();
        return;
      }
      
      // Host: relay SYNC_STATE messages to all other joiners
      if (msg.type === 'SYNC_STATE' && this.isHost) {
        this.relayMessage(msg, conn.peer);
      }
      
      // Handle REQUEST_STATE - host should respond with current state
      // This is handled by App.tsx via the message callback
      
      // Notify all registered message callbacks
      this.onMessageCallbacks.forEach(callback => callback(msg));
    });
  }

  private relayMessage(msg: SyncMessage, excludePeerId: string) {
    // Relay message to all connections except the sender
    this.connections.forEach((connInfo, peerId) => {
      if (peerId !== excludePeerId && connInfo.connection.open) {
        connInfo.connection.send(msg);
      }
    });
  }

  private updateConnectionCount() {
    // Count active connections + self
    this.connectionCount = this.connections.size + 1;
    this.maxConnectionCount = Math.max(this.maxConnectionCount, this.connectionCount);
    this.broadcastConnectionCount();
    if (this.onConnectionCountChangeCallback) {
      this.onConnectionCountChangeCallback(this.connectionCount);
    }
  }

  private broadcastConnectionCount() {
    const countMsg: SyncMessage = { type: 'CONNECTION_COUNT', count: this.connectionCount };
    this.connections.forEach((connInfo) => {
      if (connInfo.connection.open) {
        connInfo.connection.send(countMsg);
      }
    });
  }

  private startHeartbeat() {
    // Send heartbeat to all connections
    this.heartbeatInterval = setInterval(() => {
      const peerId = this.peer?.id;
      if (!peerId) return;
      
      const heartbeatMsg: SyncMessage = { type: 'HEARTBEAT', peerId };
      this.connections.forEach((connInfo) => {
        if (connInfo.connection.open) {
          connInfo.connection.send(heartbeatMsg);
        }
      });
    }, HEARTBEAT_INTERVAL);

    // Check for timed out connections (host only)
    if (this.isHost) {
      this.timeoutCheckInterval = setInterval(() => {
        const now = Date.now();
        let hasRemovals = false;
        
        this.connections.forEach((connInfo, peerId) => {
          if (now - connInfo.lastSeen > CONNECTION_TIMEOUT) {
            connInfo.connection.close();
            this.connections.delete(peerId);
            hasRemovals = true;
          }
        });
        
        if (hasRemovals) {
          this.updateConnectionCount();
        }
      }, HEARTBEAT_INTERVAL);
    }
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = null;
    }
  }

  send(msg: SyncMessage) {
    this.connections.forEach((connInfo) => {
      if (connInfo.connection.open) {
        connInfo.connection.send(msg);
      }
    });
  }

  onMessage(callback: (msg: SyncMessage) => void): () => void {
    this.onMessageCallbacks.push(callback);
    return () => {
      this.onMessageCallbacks = this.onMessageCallbacks.filter(cb => cb !== callback);
    };
  }

  onConnected(callback: () => void) {
    this.onConnectedCallback = callback;
  }

  onDisconnected(callback: () => void) {
    this.onDisconnectedCallback = callback;
  }

  onRoomDeleted(callback: () => void) {
    this.onRoomDeletedCallback = callback;
  }

  onConnectionCountChange(callback: (count: number) => void) {
    this.onConnectionCountChangeCallback = callback;
  }

  getPeerId() {
    return this.peer?.id;
  }

  getIsHost() {
    return this.isHost;
  }

  getRoomCode(): string | null {
    return this.roomCode;
  }

  getConnectionCount(): number {
    return this.connectionCount;
  }

  getMaxConnectionCount(): number {
    return this.maxConnectionCount;
  }

  isConnected(): boolean {
    return this.connections.size > 0 || (this.isHost && this.roomCode !== null);
  }

  // Host-only: Delete room and notify all joiners
  deleteRoom() {
    if (!this.isHost) {
      console.warn('Only host can delete room');
      return;
    }
    
    // Broadcast room deleted message to all joiners
    const deleteMsg: SyncMessage = { type: 'ROOM_DELETED' };
    this.connections.forEach((connInfo) => {
      if (connInfo.connection.open) {
        connInfo.connection.send(deleteMsg);
      }
    });
    
    // Give a small delay for messages to be sent, then disconnect
    setTimeout(() => {
      this.disconnect();
    }, 100);
  }

  disconnect() {
    this.stopHeartbeat();
    
    // Close all connections
    this.connections.forEach((connInfo) => {
      connInfo.connection.close();
    });
    this.connections.clear();
    
    this.peer?.destroy();
    this.peer = null;
    
    // Reset to standalone mode
    this.isHost = true;
    this.roomCode = null;
    this.connectionCount = 0;
    this.maxConnectionCount = 0;
  }
}

export const peerService = new PeerService();

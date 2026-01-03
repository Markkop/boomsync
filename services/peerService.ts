
import { Peer, DataConnection } from 'peerjs';
import { SyncMessage, GameState } from '../types';

class PeerService {
  private peer: Peer | null = null;
  private connections: DataConnection[] = [];
  private onMessageCallback: ((msg: SyncMessage) => void) | null = null;
  private onConnectedCallback: (() => void) | null = null;
  private isHost: boolean = true; // Default to true (standalone mode)
  private roomCode: string | null = null; // Host's ID (for joiners) or own ID (for hosts)
  private connectionCount: number = 0;

  init(id?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // If id is provided, this peer is hosting
      this.isHost = id !== undefined;
      this.peer = new Peer(id);
      this.peer.on('open', (peerId) => {
        this.roomCode = peerId; // Store room code (host's own ID)
        this.connectionCount = 1; // Host counts as 1
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
    // When connecting to another peer, this peer is joining (not hosting)
    this.isHost = false;
    this.roomCode = targetId; // Store the room code (host's ID) we're joining
    const conn = this.peer.connect(targetId);
    this.handleOutgoingConnection(conn);
  }

  private handleIncomingConnection(conn: DataConnection) {
    this.connections.push(conn);
    this.setupConnection(conn);
    
    conn.on('open', () => {
      // Host: recalculate connection count (all connections + host)
      if (this.isHost) {
        this.connectionCount = this.connections.length + 1;
        this.broadcastConnectionCount();
      }
      if (this.onConnectedCallback) this.onConnectedCallback();
    });
    
    conn.on('close', () => {
      // Remove connection from array
      this.connections = this.connections.filter(c => c !== conn);
      // Host: recalculate and broadcast count
      if (this.isHost) {
        this.connectionCount = this.connections.length + 1;
        this.broadcastConnectionCount();
      }
    });
  }

  private handleOutgoingConnection(conn: DataConnection) {
    this.connections.push(conn);
    this.setupConnection(conn);
    
    conn.on('open', () => {
      if (this.onConnectedCallback) this.onConnectedCallback();
    });
    
    conn.on('close', () => {
      // Remove connection from array
      this.connections = this.connections.filter(c => c !== conn);
    });
  }

  private setupConnection(conn: DataConnection) {
    conn.on('data', (data) => {
      const msg = data as SyncMessage;
      if (this.onMessageCallback) this.onMessageCallback(msg);
      
      // Handle connection count updates from host
      if (msg.type === 'CONNECTION_COUNT' && !this.isHost) {
        this.connectionCount = msg.count;
      }
    });
  }

  private broadcastConnectionCount() {
    // Host broadcasts connection count to all connected peers
    const countMsg: SyncMessage = { type: 'CONNECTION_COUNT', count: this.connectionCount };
    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send(countMsg);
      }
    });
  }

  send(msg: SyncMessage) {
    // Send to all connections
    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  onMessage(callback: (msg: SyncMessage) => void) {
    this.onMessageCallback = callback;
  }

  onConnected(callback: () => void) {
    this.onConnectedCallback = callback;
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

  disconnect() {
    // Close all connections
    this.connections.forEach(conn => conn.close());
    this.connections = [];
    this.peer?.destroy();
    // Reset to standalone mode after disconnect
    this.isHost = true;
    this.roomCode = null;
    this.connectionCount = 0;
  }
}

export const peerService = new PeerService();

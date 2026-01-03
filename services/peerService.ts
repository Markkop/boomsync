
import { Peer, DataConnection } from 'peerjs';
import { SyncMessage, GameState } from '../types';

class PeerService {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private onMessageCallback: ((msg: SyncMessage) => void) | null = null;
  private onConnectedCallback: (() => void) | null = null;

  init(id?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer(id);
      this.peer.on('open', (id) => resolve(id));
      this.peer.on('error', (err) => reject(err));
      
      this.peer.on('connection', (conn) => {
        this.handleConnection(conn);
      });
    });
  }

  connect(targetId: string) {
    if (!this.peer) return;
    const conn = this.peer.connect(targetId);
    this.handleConnection(conn);
  }

  private handleConnection(conn: DataConnection) {
    this.connection = conn;
    conn.on('open', () => {
      if (this.onConnectedCallback) this.onConnectedCallback();
    });
    conn.on('data', (data) => {
      if (this.onMessageCallback) this.onMessageCallback(data as SyncMessage);
    });
  }

  send(msg: SyncMessage) {
    if (this.connection && this.connection.open) {
      this.connection.send(msg);
    }
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

  disconnect() {
    this.connection?.close();
    this.peer?.destroy();
  }
}

export const peerService = new PeerService();

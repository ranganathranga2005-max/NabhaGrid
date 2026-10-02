export type WebSocketStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export type TelemetryMessageHandler = (data: any) => void;

export class TelemetryWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private status: WebSocketStatus = 'DISCONNECTED';
  private listeners: Set<TelemetryMessageHandler> = new Set();
  private statusListeners: Set<(status: WebSocketStatus) => void> = new Set();
  private reconnectTimer: number | null = null;
  private shouldReconnect: boolean = false;

  constructor(url: string = 'ws://localhost:8000/ws/telemetry') {
    this.url = url;
  }

  setUrl(url: string) {
    this.url = url;
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') {
      this.disconnect();
      this.connect();
    }
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.shouldReconnect = true;
    this.setStatus('CONNECTING');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(parsed));
        } catch {
          // Ignore unparseable frames
        }
      };

      this.ws.onerror = () => {
        this.setStatus('ERROR');
      };

      this.ws.onclose = () => {
        this.setStatus('DISCONNECTED');
        if (this.shouldReconnect) {
          this.reconnectTimer = window.setTimeout(() => this.connect(), 4000);
        }
      };
    } catch {
      this.setStatus('ERROR');
    }
  }

  sendCommand(action: string, payload: Record<string, any> = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ action, ...payload }));
      } catch (err) {
        console.warn('Failed to send websocket command:', err);
      }
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }

  onTelemetry(handler: TelemetryMessageHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  onStatusChange(handler: (status: WebSocketStatus) => void): () => void {
    this.statusListeners.add(handler);
    handler(this.status);
    return () => this.statusListeners.delete(handler);
  }

  private setStatus(s: WebSocketStatus) {
    this.status = s;
    this.statusListeners.forEach((h) => h(s));
  }
}

export const websocketClient = new TelemetryWebSocketClient();

interface WebSocketMessage {
  type: 'message' | 'typing' | 'file' | 'status' | 'connect' | 'disconnect';
  jobId?: string;
  userId: string;
  userRole: 'client' | 'landscaper';
  data: any;
  timestamp: number;
}

interface MessageHandler {
  (message: WebSocketMessage): void;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private isConnecting = false;
  private userId: string | null = null;
  private userRole: 'client' | 'landscaper' | null = null;

  connect(userId: string, userRole: 'client' | 'landscaper') {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.userId = userId;
    this.userRole = userRole;
    this.isConnecting = true;

    try {
      // Use Supabase realtime for WebSocket connection
      const wsUrl = `wss://mwvcbedvnimabfwubazz.supabase.co/realtime/v1/websocket?apikey=${import.meta.env.VITE_SUPABASE_ANON_KEY}&vsn=1.0.0`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.sendMessage({
          type: 'connect',
          userId,
          userRole,
          data: { status: 'online' },
          timestamp: Date.now()
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.userId && this.userRole) {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(this.userId, this.userRole);
      }
    }, delay);
  }

  sendMessage(message: Omit<WebSocketMessage, 'timestamp'>) {
    const serializedMessage = {
      ...message,
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(message.data)) // Ensure serializable
    };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(serializedMessage));
    } else {
      console.warn('WebSocket not connected, message queued');
      this.queueOfflineMessage(serializedMessage);
    }
  }

  private queueOfflineMessage(message: WebSocketMessage) {
    const offlineMessages = JSON.parse(localStorage.getItem('offline_messages') || '[]');
    offlineMessages.push(message);
    localStorage.setItem('offline_messages', JSON.stringify(offlineMessages));
  }

  private sendQueuedMessages() {
    const offlineMessages = JSON.parse(localStorage.getItem('offline_messages') || '[]');
    offlineMessages.forEach((message: WebSocketMessage) => {
      this.sendMessage(message);
    });
    localStorage.removeItem('offline_messages');
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.handlers.get(message.type) || [];
    handlers.forEach(handler => handler(message));
  }

  subscribe(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);

    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.sendMessage({
        type: 'disconnect',
        userId: this.userId!,
        userRole: this.userRole!,
        data: { status: 'offline' },
        timestamp: Date.now()
      });
      this.ws.close();
      this.ws = null;
    }
    this.userId = null;
    this.userRole = null;
    this.handlers.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const webSocketManager = new WebSocketManager();
export type { WebSocketMessage, MessageHandler };
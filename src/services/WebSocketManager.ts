// TODO: Re-enable WebSocket functionality after production deployment
// WebSocket code has been disabled to prevent errors with placeholder endpoints in Famous previews
// This is a STUB implementation that provides the same interface but does nothing

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'file' | 'status' | 'connect' | 'disconnect';
  jobId?: string;
  userId?: string;
  userRole?: 'client' | 'landscaper';
  data?: any;
  timestamp?: number;
}

export interface MessageHandler {
  (message: WebSocketMessage): void;
}

// Stub WebSocket manager - no actual connections made
class WebSocketManagerStub {
  private handlers: Map<string, MessageHandler[]> = new Map();

  connect(userId: string, userRole: 'client' | 'landscaper') {
    // TODO: Re-enable WebSocket connection after production deployment
    console.log('[WEBSOCKET STUB] connect() called but disabled', { userId, userRole });
  }

  sendMessage(message: Omit<WebSocketMessage, 'timestamp'>) {
    // TODO: Re-enable WebSocket messaging after production deployment
    console.log('[WEBSOCKET STUB] sendMessage() called but disabled:', message.type);
  }

  subscribe(type: string, handler: MessageHandler): () => void {
    // TODO: Re-enable WebSocket subscriptions after production deployment
    console.log('[WEBSOCKET STUB] subscribe() called but disabled:', type);
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
    return () => {
      const h = this.handlers.get(type) || [];
      const index = h.indexOf(handler);
      if (index > -1) h.splice(index, 1);
    };
  }

  disconnect() {
    // TODO: Re-enable WebSocket disconnect after production deployment
    console.log('[WEBSOCKET STUB] disconnect() called but disabled');
    this.handlers.clear();
  }

  isConnected(): boolean {
    // Always return false since WebSocket is disabled
    return false;
  }

  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    // Always return disconnected since WebSocket is disabled
    return 'disconnected';
  }
}

export const webSocketManager = new WebSocketManagerStub();
export default webSocketManager;

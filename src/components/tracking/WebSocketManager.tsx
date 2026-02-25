// TODO: Re-enable WebSocket functionality after production deployment
// WebSocket code has been disabled to prevent errors with placeholder endpoints in Famous previews
// This is a STUB implementation that provides the same interface but does nothing

import React, { createContext, useContext } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  subscribe: (type: string, callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Stub hook that returns safe defaults - no actual WebSocket connection
export const useWebSocket = (): WebSocketContextType => {
  // Return stub values - allows components to render without WebSocketProvider
  return {
    isConnected: false,
    connectionStatus: 'disconnected',
    lastMessage: null,
    sendMessage: () => {
      console.log('[WEBSOCKET STUB] sendMessage() called but disabled');
    },
    subscribe: () => {
      console.log('[WEBSOCKET STUB] subscribe() called but disabled');
      return () => {}; // Return no-op unsubscribe function
    }
  };
};

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
}

// Stub provider that just renders children without WebSocket connection
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  // TODO: Re-enable WebSocket connection after production deployment
  const stubValue: WebSocketContextType = {
    isConnected: false,
    connectionStatus: 'disconnected',
    lastMessage: null,
    sendMessage: () => {
      console.log('[WEBSOCKET STUB] sendMessage() called but disabled');
    },
    subscribe: () => () => {}
  };

  return (
    <WebSocketContext.Provider value={stubValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;

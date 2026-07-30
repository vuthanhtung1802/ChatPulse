import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  send: (event: string, data?: any) => void;
}

export function useWebSocket(token: string | null): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

  const connect = useCallback(() => {
    if (!token) return;

    const ws = new WebSocket(`${wsUrl}?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected', event.code);
      setIsConnected(false);
      if (socketRef.current === ws) {
        setSocket(null);
        socketRef.current = null;
      }
      if (event.code < 4000 && reconnectAttemptsRef.current < 10) {
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      console.error('WebSocket error');
    };

    socketRef.current = ws;
    setSocket(ws);
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(4000);
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [connect]);

  const send = useCallback((event: string, data?: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event, data }));
    }
  }, []);

  return { socket, isConnected, send };
}

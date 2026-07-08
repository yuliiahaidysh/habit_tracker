import { useEffect, useRef, useState, useCallback } from "react";
import { WEBSOCKET_CONFIG } from "../constants/config";

export interface MilestoneNotification {
  type: "milestone";
  habitId: string;
  habitName: string;
  milestone: number;
}

interface UseWebSocketOptions {
  onMilestoneReceived?: (notification: MilestoneNotification) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current) {
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.hostname}:${WEBSOCKET_CONFIG.PORT}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[ws] connected");
        setIsConnected(true);
        setError(null);

        // Send subscribe message to establish client→server communication (Task 5.9)
        ws.send(JSON.stringify({ type: "subscribe" }));
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "milestone") {
            console.log("[ws] received milestone", msg);
            options.onMilestoneReceived?.(msg as MilestoneNotification);
          } else if (msg.type === "subscribed") {
            console.log("[ws] subscription confirmed");
          }
        } catch (err) {
          console.error("[ws] message parse error", err);
        }
      };

      ws.onerror = (event: Event) => {
        console.error("[ws] connection error", event);
        setError("WebSocket connection error");
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("[ws] disconnected");
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection after 3 seconds
        setTimeout(() => {
          if (!wsRef.current) {
            connect();
          }
        }, 3000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("[ws] connection failed", err);
      setError("Failed to connect to WebSocket");
    }
  }, [options.onMilestoneReceived]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    disconnect,
  };
}

import { useEffect, useRef, useState } from "react";

import { API_URL } from "../api";

/* =========================================================
   USE WEBSOCKET
========================================================= */

function useWebSocket(currentUser, onUserStatus) {
  const [websocket, setWebsocket] = useState(null);

  const [websocketConnected, setWebsocketConnected] = useState(false);

  const [socketEvent, setSocketEvent] = useState(null);

  const websocketRef = useRef(null);

  /* =====================================================
     CONNECT WEBSOCKET
  ===================================================== */

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !currentUser?.id) {
      return;
    }

    /* ===================================================
       XÁC ĐỊNH WS / WSS
    =================================================== */

    const websocketProtocol = API_URL.startsWith("https://")
      ? "wss://"
      : "ws://";

    const websocketHost = API_URL.replace(/^https?:\/\//, "");

    const websocketUrl =
      websocketProtocol +
      websocketHost +
      `/ws/chat?access_token=${encodeURIComponent(token)}`;

    console.log("Connecting WebSocket:", websocketUrl);

    /* ===================================================
       CREATE SOCKET
    =================================================== */

    const socket = new WebSocket(websocketUrl);

    websocketRef.current = socket;

    /* ===================================================
       CONNECTED
    =================================================== */

    socket.onopen = () => {
      /*
       * Chỉ xử lý nếu đây vẫn là socket hiện tại.
       */
      if (websocketRef.current !== socket) {
        return;
      }

      console.log("WebSocket connected");

      setWebsocket(socket);
      setWebsocketConnected(true);

      setSocketEvent({
        type: "connection_status",
        isConnected: true,
        __receivedAt: Date.now(),
      });
    };

    /* ===================================================
       RECEIVE MESSAGE
    =================================================== */

    socket.onmessage = (event) => {
      /*
       * Bỏ qua message từ socket cũ.
       */
      if (websocketRef.current !== socket) {
        return;
      }

      try {
        const data = JSON.parse(event.data);

        console.log("WebSocket message:", data);

        /* =================================================
           USER ONLINE / OFFLINE
        ================================================= */

        if (data.type === "user_status") {
          onUserStatus?.({
            userId: Number(data.userId),
            isOnline: Boolean(data.isOnline),
            lastSeen: data.lastSeen ?? null,
          });
        }

        /* =================================================
           GLOBAL SOCKET EVENT
        ================================================= */

        setSocketEvent({
          ...data,
          __receivedAt: Date.now(),
        });
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
    };

    /* ===================================================
       ERROR
    =================================================== */

    socket.onerror = (error) => {
      /*
       * Socket cũ không được phép
       * làm thay đổi trạng thái socket mới.
       */
      if (websocketRef.current !== socket) {
        return;
      }

      console.error("WebSocket error:", error);

      setWebsocketConnected(false);
    };

    /* ===================================================
       CLOSED
    =================================================== */

    socket.onclose = () => {
      /*
       * Đây là phần QUAN TRỌNG NHẤT.
       *
       * Nếu socket này không còn là socket hiện tại
       * thì không được set trạng thái disconnected.
       */
      if (websocketRef.current !== socket) {
        return;
      }

      console.log("WebSocket disconnected");

      setWebsocket(null);
      setWebsocketConnected(false);

      setSocketEvent({
        type: "connection_status",
        isConnected: false,
        __receivedAt: Date.now(),
      });

      websocketRef.current = null;
    };

    /* ===================================================
       CLEANUP
    =================================================== */

    return () => {
      /*
       * Chỉ cleanup socket hiện tại.
       */
      if (websocketRef.current === socket) {
        websocketRef.current = null;
      }

      /*
       * Đóng socket.
       */
      socket.close();
    };
  }, [currentUser?.id, onUserStatus]);

  /* =====================================================
     CLOSE WEBSOCKET
  ===================================================== */

  function closeWebSocket() {
    if (websocketRef.current) {
      websocketRef.current.close();
    }
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return {
    websocket,
    websocketConnected,
    socketEvent,
    websocketRef,
    closeWebSocket,
  };
}

export default useWebSocket;
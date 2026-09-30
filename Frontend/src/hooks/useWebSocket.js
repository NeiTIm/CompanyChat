import {
  useEffect,
  useRef,
  useState,
} from "react";

import { API_URL } from "../api";

/* =========================================================
   USE WEBSOCKET
========================================================= */

function useWebSocket(currentUser) {
  const [websocket, setWebsocket] =
    useState(null);

  const [
    websocketConnected,
    setWebsocketConnected,
  ] = useState(false);

  const [socketEvent, setSocketEvent] =
    useState(null);

  const websocketRef =
    useRef(null);

  /* =====================================================
     CONNECT WEBSOCKET
  ===================================================== */

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    /* ===================================================
       XÁC ĐỊNH WS / WSS
    =================================================== */

    const websocketProtocol =
      API_URL.startsWith("https://")
        ? "wss://"
        : "ws://";

    const websocketHost =
      API_URL.replace(
        /^https?:\/\//,
        ""
      );

    const websocketUrl =
      websocketProtocol +
      websocketHost +
      `/ws/chat?access_token=${encodeURIComponent(
        token
      )}`;

    console.log(
      "Connecting WebSocket:",
      websocketUrl
    );

    /* ===================================================
       CREATE SOCKET
    =================================================== */

    const socket =
      new WebSocket(websocketUrl);

    websocketRef.current = socket;

    /* ===================================================
       CONNECTED
    =================================================== */

    socket.onopen = () => {
      console.log(
        "WebSocket connected"
      );

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
      try {
        const data =
          JSON.parse(event.data);

        console.log(
          "WebSocket message:",
          data
        );

        setSocketEvent({
          ...data,
          __receivedAt: Date.now(),
        });

      } catch (error) {
        console.error(
          "Invalid WebSocket message:",
          error
        );
      }
    };

    /* ===================================================
       ERROR
    =================================================== */

    socket.onerror = (error) => {
      console.error(
        "WebSocket error:",
        error
      );

      setWebsocketConnected(false);
    };

    /* ===================================================
       CLOSED
    =================================================== */

    socket.onclose = () => {
      console.log(
        "WebSocket disconnected"
      );

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
      socket.close();

      websocketRef.current = null;
    };
  }, [
    currentUser.id,
  ]);

  /* =====================================================
     CLOSE WEBSOCKET
  ===================================================== */

  function closeWebSocket() {
    if (
      websocketRef.current
    ) {
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
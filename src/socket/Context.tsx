import { observer } from "mobx-react-lite"
import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import SocketService, { SocketStatuses } from "./SocketService"

const WebSocketContext = createContext<SocketService | null>(null);

interface WebSocketProviderProps {
    children: React.ReactNode;
    url: string; // WebSocket URL
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = observer(({ children, url }) => {
    const [initialized, setInitialized] = useState(false);
    const webSocketServiceRef = useRef<SocketService | null>(null);

    useEffect(() => {
        // Инициализируем SocketService
        webSocketServiceRef.current = new SocketService(url);
        setInitialized(true)

        return () => {
            // Закрываем соединение при размонтировании
            // webSocketServiceRef.current?.close();
        };
    }, [url]);

    if (!initialized || webSocketServiceRef?.current?.socketStatus === SocketStatuses.CONNECTING) {
        return (
            <div>
                Подключение к серверу...
            </div>
        )
    }

    if (webSocketServiceRef?.current?.socketStatus === SocketStatuses.CLOSED) {
        return (
            <div>
                Связь с сервером потеряна
            </div>
        )
    }

    return (
        <WebSocketContext.Provider value={webSocketServiceRef.current}>
            {children}
        </WebSocketContext.Provider>
    );
});

export const useWebSocket = (): SocketService | null => {
    return useContext(WebSocketContext);
};

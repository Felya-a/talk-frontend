import { reaction } from "mobx"
import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import SocketService, { SocketStatuses } from "./SocketService"

const WebSocketContext = createContext<SocketService | null>(null)

interface WebSocketProviderProps {
	children: React.ReactNode
	url: string // WebSocket URL
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url }) => {
	const [socketStatus, setSocketStatus] = useState(SocketStatuses.CONNECTING)
	const webSocketServiceRef = useRef<SocketService | null>(null)

	useEffect(() => {
		// Инициализируем SocketService
		webSocketServiceRef.current = new SocketService(url)

		const disposer = reaction(
			() => webSocketServiceRef.current.socketStatus,
			async newStatus => {
				setSocketStatus(newStatus)

				// Попытка переподключения к серверу
				if (newStatus === SocketStatuses.CLOSED) {
					setTimeout(() => {
						webSocketServiceRef.current.connect(url)
					}, 3000)
				}
			}
		)

		return () => {
			disposer() // Очистка подписки
			webSocketServiceRef.current?.close() // Закрываем соединение
		}
	}, [])

	if (socketStatus === SocketStatuses.CONNECTING) {
		return <div>Подключение к серверу...</div>
	}

	if (socketStatus === SocketStatuses.CLOSED) {
		return <div>Связь с сервером потеряна</div>
	}

	if (socketStatus === SocketStatuses.OPEN) {
		return <WebSocketContext.Provider value={webSocketServiceRef.current}>{children}</WebSocketContext.Provider>
	}

	return <div>...</div>
}

export const useWebSocket = (): SocketService | null => {
	return useContext(WebSocketContext)
}

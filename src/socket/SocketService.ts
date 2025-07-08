import { makeAutoObservable } from "mobx"
import { sessionStore } from "../store"
import { PingHandler, ShareRoomsHandler, ClientInfoHandler } from "./handlers"
import { InputMessagesTypes, MessageHandler, OutputMessagesTypes, ReceiveMessage, TransmitData, TransmitMessage } from "./interface"
import { callManager } from "../components/Call/CallManager"

export enum SocketStatuses {
	CONNECTING = 0,
	OPEN = 1,
	CLOSING = 2,
	CLOSED = 3
}

class SocketService {
	public socketStatus: SocketStatuses = SocketStatuses.CONNECTING
	private socket: WebSocket
	private handlers: Partial<Record<InputMessagesTypes, MessageHandler>>
	private dynamicsHandlers: Partial<Record<InputMessagesTypes, (...args: any) => void>> = {}

	constructor(url: string) {
		makeAutoObservable(this)

		this.connect(url)

		const pingHandler = new PingHandler()
		const shareRoomsHandler = new ShareRoomsHandler()
		const clientInfoHandler = new ClientInfoHandler()

		this.handlers = {
			[InputMessagesTypes.PING]: pingHandler,
			[InputMessagesTypes.SHARE_ROOMS]: shareRoomsHandler,
			[InputMessagesTypes.CLIENT_INFO]: clientInfoHandler
		}
	}

	connect(url: string) {
		this.socketStatus = SocketStatuses.CONNECTING
		this.socket = new WebSocket(url)

		this.socket.onopen = this.onOpen.bind(this)
		this.socket.onclose = this.onClose.bind(this)
		this.socket.onmessage = this.onMessage.bind(this)
	}

	private async onOpen(event: Event): Promise<void> {
		console.log("onOpen", event)
		await new Promise(res => setTimeout(res, 500)) // DEBUG ONLY
		// TODO: Возможно будет лучше переделать на глобальный объект в window
		sessionStore.setSocket(this)
		callManager.setSocket(this)
		this.socketStatus = SocketStatuses.OPEN
	}

	private async onClose(closeEvent: CloseEvent): Promise<void> {
		console.log("onClose", closeEvent)
		this.socketStatus = SocketStatuses.CLOSED
	}

	private async onMessage(message: MessageEvent): Promise<void> {
		// console.log("Получено сообщение: ", JSON.parse(message.data)) // TODO: вернуть лог
		const parsedMessage = JSON.parse(message.data) as ReceiveMessage

		// Динамические обработчики (подключенные после инициализации SocketService)
		const dynamicHandler = this.dynamicsHandlers[parsedMessage.type]
		if (dynamicHandler) {
			// console.log("Найден динамический обработчик ", parsedMessage.type) // TODO: вернуть лог
			await dynamicHandler(parsedMessage.data)
			return
		}

		// Статические обработчики (подключенные в конструкторе)
		const handler = this.handlers[parsedMessage.type]
		if (handler) {
			await handler.handle(parsedMessage.data)
			return
		}

		console.warn(`Не найден обработчик для сообщения типа: ${parsedMessage.type}`)
	}

	public send<T extends OutputMessagesTypes>(type: T, data: TransmitData<T>): void {
		// console.log("Отправка сообщения ", type, data) // TODO: вернуть лог
		const message: TransmitMessage<T> = { type, data }
		this.socket.send(JSON.stringify(message))
	}

	public on<T extends InputMessagesTypes>(type: T, handler: (...args: any) => void) {
		if (this.dynamicsHandlers[type]) {
			console.warn(`Обработчик сообщения ${type} уже существует. Он будет перезаписан`)
		}

		this.dynamicsHandlers[type] = handler
	}

	public off<T extends InputMessagesTypes>(type: T) {
		console.log("Отписка от события ", type)
		this.dynamicsHandlers[type] = null
	}

	public close(): void {
		this.socket.close()
	}
}

export default SocketService

import { z } from "zod"

export enum DataChannelMessageType {
	Microphone = "microphone",
	Webcam = "webcam",
	ChatMessage = "chat_message"
}

const BaseSchema = z.object({
	type: z.nativeEnum(DataChannelMessageType),
	data: z.object({})
})

const MicrophoneSchema = BaseSchema.extend({
	type: z.literal(DataChannelMessageType.Microphone),
	data: z.object({
		enabled: z.boolean()
	})
})

const WebcamSchema = BaseSchema.extend({
	type: z.literal(DataChannelMessageType.Webcam),
	data: z.object({
		enabled: z.boolean()
	})
})

export enum ChatMessageType {
	Text = "text",
	Image = "image"
}
const ChatMessageSchema = BaseSchema.extend({
	type: z.literal(DataChannelMessageType.ChatMessage),
	data: z.object({
		image: z
			.instanceof(ArrayBuffer)
			.or(z.null()),
		text: z.string()
	})
})

const DataChannelMessagesSchemas = z.union([MicrophoneSchema, WebcamSchema, ChatMessageSchema])

export type DataChannelMessage = z.infer<typeof DataChannelMessagesSchemas>

interface Serializer<T> {
	encode(data: T): string
	decode(data: string): T
}

const jsonSerializer: Serializer<any> = {
	encode: data => {
		console.log("[jsonSerializer] encode")
		return JSON.stringify(data)
	},
	decode: data => {
		console.log("[jsonSerializer] decode")
		return JSON.parse(data)
	}
}

const chatMessageSerializer: Serializer<z.infer<typeof ChatMessageSchema>> = {
	encode: message => {
		message = structuredClone(message)
		console.log("[chatMessageSerializer] encode")
		if (message.data.image) {
			// Преобразование изображения в base64 для корректной сериализации всего сообщения в строку
			const base64Data = arrayBufferToBase64(message.data.image as ArrayBuffer)
			message.data.image = base64Data as any
		}

		return JSON.stringify(message)
	},

	decode: data => {
		console.log("[chatMessageSerializer] decode")
		const message = JSON.parse(data as string) as z.infer<typeof ChatMessageSchema>

		if (message.data.image) {
			// Преобразование изображения из base64 в ArrayBuffer для дальнейшего преобразования в изображение
			message.data.image = base64ToArrayBuffer(message.data.image as any as string)
		}
		return message
	}
}

const serializers: Record<DataChannelMessageType, Serializer<any>> = {
	[DataChannelMessageType.Microphone]: jsonSerializer,
	[DataChannelMessageType.Webcam]: jsonSerializer,
	[DataChannelMessageType.ChatMessage]: chatMessageSerializer
}

const CHUNK_SIZE = 16 * 1024; // 16 KB

export class DataChannelManager {
	private dataChannels: Record<string, RTCDataChannel> = {}
	private incomingChunkBuffer: Record<string, string[]> = {}

	constructor(private receiveMessage: (event: DataChannelMessage, peerID: string) => void) {}

	add(peerID: string, dataChannel: RTCDataChannel) {
		if (this.dataChannels[peerID]) return
		this.dataChannels[peerID] = dataChannel
		this.dataChannels[peerID].onmessage = event => this.onMessage(event, peerID)
	}

	create(peerConnection: RTCPeerConnection, peerID: string) {
		// Вызывает подключающийся пользователь
		// Создание канала передачи данных поверх уже открытого RTCPeerConnection
		const channel = peerConnection.createDataChannel("talk")
		channel.onopen = () => this.add(peerID, channel)
		channel.onerror = console.error
	}

	listenCreate(peerConnection: RTCPeerConnection, peerID: string, callback: () => void) {
		// Вызывает и пользователь находящийся в комнате и подключающийся пользователь
		peerConnection.ondatachannel = event => {
			this.add(peerID, event.channel)
			callback()
		}
	}

	close(peerID: string) {
		if (!this.dataChannels[peerID]) return
		this.dataChannels[peerID].close()
		delete this.dataChannels[peerID]
		delete this.incomingChunkBuffer[peerID]
	}

	clear() {
		Object.keys(this.dataChannels).forEach(id => this.close(id))
		this.dataChannels = {}
	}

	send(peerID: string, message: DataChannelMessage) {
		console.log("send", {peerID})
		if (this.dataChannels[peerID]?.readyState !== "open") {
			console.warn(`dataChannel с пользователем ${peerID} не открыт`, { readyState: this.dataChannels[peerID].readyState })
			return
		}

		const encodedMessage = serializers[message.type].encode(message)
		// console.log("encodedMessage", encodedMessage)
		console.log("encodedMessage.length", encodedMessage.length)

		let offset = 0
		if (encodedMessage.length <= CHUNK_SIZE) {
			// Если сообщение умещается о один чанк, то делить его не нужно
			this.dataChannels[peerID].send(encodedMessage)
			return
		}

		while (offset < encodedMessage.length) {
			const end = Math.min(offset + CHUNK_SIZE, encodedMessage.length)
			this.dataChannels[peerID].send(encodedMessage.slice(offset, end))
			console.log("отправлен кусок данных", {start: offset, end})
			offset = end
		}

		this.dataChannels[peerID].send("done")
	}

	sendEveryone(message: DataChannelMessage) {
		Object.keys(this.dataChannels).forEach(peerID => this.send(peerID, message))
	}

	private onMessage(event: MessageEvent, peerID: string) {
		try {
			let isClosingMessage, mergedChunks
			if (event.data === "done") {
				// не было предыдущих сообщений
				if (!this.incomingChunkBuffer[peerID]?.length) return

				isClosingMessage = true
				mergedChunks = this.incomingChunkBuffer[peerID].join("")
			}

			let raw: any
			const data = isClosingMessage ? mergedChunks : event.data
			try {
				raw = JSON.parse(data)
			} catch {
				if (isClosingMessage) throw new Error("Invalid JSON")

				if (!this.incomingChunkBuffer[peerID]) {
					this.incomingChunkBuffer[peerID] = []
				}
				this.incomingChunkBuffer[peerID].push(event.data)
				return
				// throw new Error("Invalid JSON")
			}

			const messageType = raw?.type as DataChannelMessageType
			if (!messageType) throw new Error("message type not defined")

			const decoded = serializers[messageType].decode(data)
			const parsedMessage = DataChannelMessagesSchemas.parse(decoded)
			this.receiveMessage(parsedMessage, peerID)

			if (isClosingMessage) {
				this.incomingChunkBuffer[peerID] = []
			}
		} catch (error) {
			console.error(error)
			this.incomingChunkBuffer[peerID] = []
		}
	}
}

// Преобразование ArrayBuffer в Base64 строку
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer)
	let binary = ""
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return btoa(binary)
}

// Преобразование Base64 строки обратно в Uint8Array
function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64)
	const len = binary.length
	const bytes = new Uint8Array(len)
	for (let i = 0; i < len; i++) {
		bytes[i] = binary.charCodeAt(i)
	}
	return bytes.buffer
}

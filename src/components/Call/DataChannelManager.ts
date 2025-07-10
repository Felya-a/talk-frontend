import { z } from "zod"

export enum DataChannelMessageType {
	Microphone = "microphone",
	Webcam = "webcam"
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
const DataChannelMessagesSchemas = z.union([MicrophoneSchema, WebcamSchema])

export type DataChannelMessage = z.infer<typeof DataChannelMessagesSchemas>

export class DataChannelManager {
	private dataChannels: Record<string, RTCDataChannel> = {}

	constructor(private receiveMessage: (event: DataChannelMessage, peerID: string) => void) {}

	add(peerID: string, dataChannel: RTCDataChannel) {
		if (this.dataChannels[peerID]) return
		this.dataChannels[peerID] = dataChannel
		this.dataChannels[peerID].onmessage = event => this.onMessage(event, peerID)
	}

	create(peerConnection: RTCPeerConnection, peerID: string) {
		// Создание канала передачи данных поверх уже открытого RTCPeerConnection
		const channel = peerConnection.createDataChannel("talk")
		channel.onopen = () => this.add(peerID, channel)
		channel.onerror = console.error
	}

	listenCreate(peerConnection: RTCPeerConnection, peerID: string) {
		peerConnection.ondatachannel = event => this.add(peerID, event.channel)
	}

	close(peerID: string) {
		if (!this.dataChannels[peerID]) return
		this.dataChannels[peerID].close()
		delete this.dataChannels[peerID]
	}

	clear() {
		Object.keys(this.dataChannels).forEach(id => this.close(id))
		this.dataChannels = {}
	}

	send(peerID: string, message: DataChannelMessage) {
		this.dataChannels[peerID]?.send(JSON.stringify(message))
	}

	sendEveryone(message: DataChannelMessage) {
		Object.keys(this.dataChannels).forEach(peerID => this.send(peerID, message))
	}

	private onMessage(event: MessageEvent, peerID: string) {
		try {
			const messageData = JSON.parse(event.data)
			const message = DataChannelMessagesSchemas.parse(messageData)
			this.receiveMessage(message, peerID)
		} catch (error) {
			console.error(error)
		}
	}
}

import freeice from "freeice"
import { action, computed, makeAutoObservable } from "mobx"
import { InputMessagesTypes, OutputMessagesTypes } from "../../socket/interface"
import SocketService from "../../socket/SocketService"
import { Room, sessionStore } from "../../store"
import { DataChannelManager, DataChannelMessage, DataChannelMessageType } from "./DataChannelManager"

type Client = {
	uuid: string
	statuses: {
		webcam: boolean
		microphone: boolean
		display: boolean
	}
}

export enum MediaType {
	WEBCAM = "webcam",
	DISPlAY = "display"
}

let SELF_CLIENT

class CallManager {
	private socketService: SocketService
	private dataChannelManager = new DataChannelManager(this.onDataChannelMessage.bind(this))

	private peerConnections: Record<string, RTCPeerConnection> = {}
	private streamsQueue: Record<string, MediaStream> = {}
	private displaySenders: Record<string, RTCRtpSender> = {}

	private localMedia: Record<MediaType, MediaStream> = {
		[MediaType.WEBCAM]: null,
		[MediaType.DISPlAY]: null
	}

	// react ref из тегов video
	private peerMediaElements: Record<string, { webcam: HTMLMediaElement; display: HTMLMediaElement | null }> = {}

	clients: Client[] = []

	constructor() {
		makeAutoObservable(this, {
			setMediaElement: action.bound,
			isOnWebcamAudio: computed,
			isOnWebcamVideo: computed,
			isCaptureDisplay: computed
		})
	}

	setSocket(socketService: SocketService) {
		this.socketService = socketService
	}

	async start(room: Room) {
		SELF_CLIENT = sessionStore.myUuid
		if (!SELF_CLIENT) throw new Error("not have self uuid")

		this.socketService.on(InputMessagesTypes.ADD_PEER, this.handleNewPeer.bind(this))
		this.socketService.on(InputMessagesTypes.SESSION_DESCRIPTION, this.setRemoteMedia.bind(this))
		this.socketService.on(InputMessagesTypes.ICE_CANDIDATE, this.handleIceCandidate.bind(this))
		this.socketService.on(InputMessagesTypes.REMOVE_PEER, this.handleRemovePeer.bind(this))
		await this.startCaptureUserMedia()
		sessionStore.join(room)
	}

	stop() {
		sessionStore.leave()
		SELF_CLIENT = null
		this.socketService.off(InputMessagesTypes.ADD_PEER)
		this.socketService.off(InputMessagesTypes.SESSION_DESCRIPTION)
		this.socketService.off(InputMessagesTypes.ICE_CANDIDATE)
		this.socketService.off(InputMessagesTypes.REMOVE_PEER)

		if (this.localMedia) {
			Object.entries(this.localMedia).forEach(([key, media]) => {
				media?.getTracks().forEach(track => {
					track.stop()
				})
			})
		}

		this.clients = []
		this.localMedia = {
			[MediaType.WEBCAM]: null,
			[MediaType.DISPlAY]: null
		}
		this.peerMediaElements = {}
		this.dataChannelManager.clear()
		Object.values(this.peerConnections).forEach(peerConnection => peerConnection.close())
		this.peerConnections = {}
		this.displaySenders = {}
	}

	get isOnWebcamAudio(): boolean {
		return this.findSelfClient()?.statuses.microphone
	}

	get isOnWebcamVideo() {
		return this.findSelfClient()?.statuses.webcam
	}

	get isCaptureDisplay() {
		return this.findSelfClient()?.statuses.display
	}

	switchWebcamAudioMode() {
		const audioTrack = this.localMedia[MediaType.WEBCAM]?.getAudioTracks()[0]
		if (audioTrack) {
			audioTrack.enabled = !audioTrack.enabled
			this.findSelfClient().statuses.microphone = audioTrack.enabled
			this.dataChannelManager.sendEveryone({ type: DataChannelMessageType.Microphone, data: { enabled: audioTrack.enabled } })
		}
	}

	switchWebcamVideoMode() {
		const videoTrack = this.localMedia[MediaType.WEBCAM]?.getVideoTracks()[0]
		if (videoTrack) {
			videoTrack.enabled = !videoTrack.enabled
			this.findSelfClient().statuses.webcam = videoTrack.enabled
			this.dataChannelManager.sendEveryone({ type: DataChannelMessageType.Webcam, data: { enabled: videoTrack.enabled } })
		}
	}

	async switchCaptureDisplayMode() {
		let selfClient = this.findSelfClient()

		if (!selfClient.statuses.display) {
			await this.startCaptureDisplay() // Устанавливает поток данных в this.localMedia[MediaType.DISPlAY]

			selfClient.statuses.display = true // Вызовет отрисовку второго тега video для пользователя

			// Рассылка нового media всем пользователям комнаты
			this.forEachPeerLocalTrack(MediaType.DISPlAY, async (peerID: string, peerConnection: RTCPeerConnection, track: MediaStreamTrack) => {
				console.log("[switchCaptureDisplayMode] Рассылка нового media всем пользователям комнаты")
				const sender = peerConnection.addTrack(track, this.localMedia[MediaType.DISPlAY])
				this.displaySenders[peerID] = sender
				const offer = await peerConnection.createOffer()
				await peerConnection.setLocalDescription(offer)
				this.socketService.send(OutputMessagesTypes.RELAY_SDP, {
					peer_id: peerID,
					session_description: offer
				})
			})
		} else {
			this.localMedia[MediaType.DISPlAY].getTracks().forEach(track => track.stop())

			// Удаление трека
			this.forEachPeerLocalTrack(MediaType.DISPlAY, async (peerID: string, peerConnection: RTCPeerConnection, track: MediaStreamTrack) => {
				console.log("[switchCaptureDisplayMode] Удаление трека")
				peerConnection.removeTrack(this.displaySenders[peerID])
				delete this.displaySenders[peerID]
				const offer = await peerConnection.createOffer()
				await peerConnection.setLocalDescription(offer)
				this.socketService.send(OutputMessagesTypes.RELAY_SDP, {
					peer_id: peerID,
					session_description: offer
				})
			})

			this.localMedia[MediaType.DISPlAY] = null
			this.peerMediaElements[SELF_CLIENT][MediaType.DISPlAY] = null

			selfClient.statuses.display = false // Убирает тег video демонстрации
		}
	}

	private async forEachPeerLocalTrack(
		mediaType: MediaType,
		callback: (peerID: string, peerConnection: RTCPeerConnection, track: MediaStreamTrack) => void
	) {
		Object.entries(this.peerConnections).forEach(([peerID, peerConnection]) => {
			this.localMedia[mediaType]?.getTracks().forEach(async track => {
				await callback(peerID, peerConnection, track)
			})
		})
	}

	private addClient(clientName: string, remoteStream?: MediaStream) {
		console.log("addClient", clientName)
		if (!this.findClientByUUID(clientName)) {
			this.clients.push({ uuid: clientName, statuses: { microphone: false, webcam: false, display: false } })
		} else {
			console.log("addClient пользователь уже добавлен")
		}

		// Видеопоток от удалённого пользователя
		if (remoteStream) {
			// Тут нужно устанавливать srcObject в объект который установит компонент
			if (this.peerMediaElements[clientName]) {
				console.log("[addClient] установлен remoteStream в peerMediaElement")
				this.peerMediaElements[clientName] = { srcObject: remoteStream } as any
			} else {
				// В этот момент для клиента еще не создан html тег video и некуда присваивать поток данных
				// Он будет присвоен в методе setMediaElement вызываемом компонентом
				console.log("[addClient] remoteStream помещен в streamsQueue")
				this.streamsQueue[clientName] = remoteStream
			}
		}
	}

	private onDataChannelMessage(message: DataChannelMessage, peerID: string) {
		console.log("onDataChannelMessage", message, peerID)
		switch (message.type) {
			case DataChannelMessageType.Webcam:
				this.clients.find(client => client.uuid === peerID).statuses.webcam = message.data.enabled
				break
			case DataChannelMessageType.Microphone:
				this.clients.find(client => client.uuid === peerID).statuses.microphone = message.data.enabled
				break
			default:
				console.log("[onDataChannelMessage] Неизвестный тип сообщения")
				break
		}
	}

	private removeClient(clientName: string) {
		this.clients = this.clients.filter(client => client.uuid !== clientName)

		this.dataChannelManager.close(clientName)
		if (this.peerConnections[clientName]) {
			this.peerConnections[clientName].close()
		}

		delete this.peerConnections[clientName]
		delete this.peerMediaElements[clientName]
		delete this.displaySenders[clientName]
		delete this.streamsQueue[clientName]
	}

	private async handleNewPeer({ peer_id: peerID, create_offer: createOffer }) {
		console.log("handleNewPeer", peerID, createOffer)
		if (peerID in this.peerConnections) {
			return console.warn(`Already connected to peer ${peerID}`)
		}

		this.peerConnections[peerID] = new RTCPeerConnection({
			iceServers: freeice()
		})

		this.peerConnections[peerID].onicecandidate = event => {
			if (event.candidate) {
				// console.log("ICE CANDIDATE", event.candidate)
				this.socketService.send(OutputMessagesTypes.RELAY_ICE, {
					peer_id: peerID,
					ice_candidate: event.candidate
				})
			}
		}

		this.peerConnections[peerID].ontrack = event => {
			// Вызывается при поступлении медиа данных от удалённого peer
			const {
				streams: [remoteStream]
			} = event

			console.log("ontrack", {
				label: event.track.label,
				remoteStreamId: remoteStream.id,
				kind: event.track.kind
			})

			// Учитываем только video
			if (event.track.kind !== "video") return

			if (!this.peerMediaElements[peerID]?.webcam) {
				console.log("is webcam")
				// получены потоки вебки и звука при подключении пользователя
				// определяется, что это именно они так как еще ничего нет в this.peerMediaElements[peerID].webcam
				this.addClient(peerID, remoteStream)
			} else {
				console.log("is display")
				// Получен поток демонстрации
				this.streamsQueue[peerID] = remoteStream
				this.findClientByUUID(peerID).statuses.display = true // Вызывает отрисовку дополнительного тега video для демонстрации
			}

			remoteStream.addEventListener("removetrack", () => {
				// Тут может быть только демонстрация (потому что сейчас только её треки удаляются)
				console.log("on removetrack")
				this.findClientByUUID(peerID).statuses.display = false // Убирает отрисовку дополнительного тега video
				this.peerMediaElements[peerID][MediaType.DISPlAY] = null
			})
		}

		this.dataChannelManager.listenCreate(this.peerConnections[peerID], peerID)

		// Отправка подключающемуся пользователю своего видео-потока
		this.localMedia[MediaType.WEBCAM].getTracks().forEach(track => {
			console.log("[WEBCAM] send local tracks to remote client", {trackId: track.id, kind: track.kind, label: track.label})
			this.peerConnections[peerID].addTrack(track, this.localMedia[MediaType.WEBCAM])
		})

		// Этот блок кода нужен затем, что не удавалось единоразово отправить треки this.localMedia[MediaType.WEBCAM] и this.localMedia[MediaType.DISPLAY]
		// Приходится сначала отправлять треки this.localMedia[MediaType.WEBCAM], затем дожидаться когда с подключающимся установится соединение
		// затем отправлять ему треки this.localMedia[MediaType.DISPLAY]
		let isAlreadySendDisplayTracks = false
		this.peerConnections[peerID].onconnectionstatechange = (event: any) => {
			if (
				!isAlreadySendDisplayTracks &&
				event?.target?.connectionState === "connected" &&
				this.localMedia[MediaType.DISPlAY]
			) {
				this.localMedia[MediaType.DISPlAY].getTracks().forEach(async track => {
					console.log("[DISPLAY] send local tracks to remote client", {trackId: track.id, kind: track.kind, label: track.label})
					const sender = this.peerConnections[peerID].addTrack(track, this.localMedia[MediaType.DISPlAY])
					this.displaySenders[peerID] = sender
					const offer = await this.peerConnections[peerID].createOffer()
					await this.peerConnections[peerID].setLocalDescription(offer)
					this.socketService.send(OutputMessagesTypes.RELAY_SDP, {
						peer_id: peerID,
						session_description: offer
					})
				})
				isAlreadySendDisplayTracks = true
			}
		}

		// Это делает подключающийся пользователь
		if (createOffer) {
			this.dataChannelManager.create(this.peerConnections[peerID], peerID)

			const offer = await this.peerConnections[peerID].createOffer()

			await this.peerConnections[peerID].setLocalDescription(offer)

			this.socketService.send(OutputMessagesTypes.RELAY_SDP, {
				peer_id: peerID,
				session_description: offer
			})
		}
	}

	private async setRemoteMedia({ peer_id: peerID, session_description: remoteDescription }) {
		await this.peerConnections[peerID]?.setRemoteDescription(new RTCSessionDescription(remoteDescription))

		if (remoteDescription.type === "offer") {
			const answer = await this.peerConnections[peerID].createAnswer()

			await this.peerConnections[peerID].setLocalDescription(answer)

			this.socketService.send(OutputMessagesTypes.RELAY_SDP, {
				peer_id: peerID,
				session_description: answer
			})
		}
	}

	private async handleIceCandidate({ peer_id: peerID, ice_candidate: iceCandidate }) {
		this.peerConnections[peerID]?.addIceCandidate(new RTCIceCandidate(iceCandidate))
	}

	private handleRemovePeer({ peer_id: peerID }) {
		this.removeClient(peerID)
	}

	private async startCaptureUserMedia() {
		try {
			this.localMedia[MediaType.WEBCAM] = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: {
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					frameRate: { ideal: 30, max: 60 }
				}
			})

			// По умолчанию выключаем вебку и микрофон
			this.localMedia[MediaType.WEBCAM].getTracks()?.forEach(track => (track.enabled = false))

			// Для добавления самого себя в список пользователей
			this.addClient(SELF_CLIENT)
		} catch (error) {
			// Пользователь не дал доступ к камере
		}
	}

	private async startCaptureDisplay() {
		try {
			this.localMedia[MediaType.DISPlAY] = await navigator.mediaDevices.getDisplayMedia({
				audio: true,
				video: {
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					frameRate: { ideal: 30, max: 60 }
				}
			})
		} catch (error) {
			// Пользователь не дал доступ к показу экрана
		}
	}

	setMediaElement(clientName: string, mediaElement: HTMLVideoElement, type: MediaType) {
		if (!mediaElement) return
		if (this.peerMediaElements[clientName]?.[type] != null) {
			// Уже есть видео от пользователя
			// Сюда попадают все video при перерисовке компонента
			// Но из-за того что индексы сохраняются заново присваивать медиа поток не нужно
			return
		}

		if (clientName === SELF_CLIENT) {
			console.log("[setMediaElement] SELF_CLIENT")
			mediaElement.srcObject = this.localMedia[type]
			mediaElement.volume = 0
		}

		if (!this.peerMediaElements[clientName]) {
			this.peerMediaElements[clientName] = {} as any
		}
		this.peerMediaElements[clientName][type] = mediaElement

		if (this.streamsQueue[clientName]) {
			// Установка mediaStream в srcObject тега video из очереди streamsQueue
			this.peerMediaElements[clientName][type].srcObject = this.streamsQueue[clientName]
			delete this.streamsQueue[clientName]
		}
	}

	private findClientByUUID(uuid: string) {
		return this.clients.find(client => client.uuid === uuid)
	}

	private findSelfClient() {
		return this.findClientByUUID(SELF_CLIENT)
	}
}

export const callManager = new CallManager()

// DEBUG
//@ts-ignore
window.callManager = callManager

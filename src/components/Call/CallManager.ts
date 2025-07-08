import freeice from "freeice"
import { action, computed, makeAutoObservable } from "mobx"
import { InputMessagesTypes, OutputMessagesTypes } from "../../socket/interface"
import SocketService from "../../socket/SocketService"
import { Room, sessionStore } from "../../store"

export const LOCAL = {
	WEBCAM: "LOCAL_WEBCAM",
	DISPLAY: "LOCAL_DISPLAY"
} as const

type LOCAL = (typeof LOCAL)[keyof typeof LOCAL]

type Client = {
	uuid: string
	isWebcamActive: boolean
}

class CallManager {
	private socketService: SocketService

	clients: Client[] = []

	private peerConnections: Record<string, RTCPeerConnection> = {}
	private dataChannels: Record<string, RTCDataChannel> = {}
	private streamsQueue: Record<string, MediaStream> = {}

	private localMedia: Record<LOCAL, MediaStream> = {
		[LOCAL.WEBCAM]: null,
		[LOCAL.DISPLAY]: null
	}
	// react ref из тегов video
	private peerMediaElements: Record<LOCAL & string, HTMLMediaElement> = {
		[LOCAL.WEBCAM]: null,
		[LOCAL.DISPLAY]: null
	}

	private localStatuses: Record<LOCAL, { audio: boolean; video: boolean }> = {
		[LOCAL.WEBCAM]: {
			audio: false,
			video: false
		},
		[LOCAL.DISPLAY]: {
			audio: false,
			video: false
		}
	}

	constructor() {
		makeAutoObservable(this, {
			setMediaElement: action.bound,
			isOnWebcamAudio: computed,
			isOnWebcamVideo: computed,
			isCaptureDisplay: computed
		})

		setInterval(this.checkClientsActiveVideo.bind(this), 3000)
	}

	setSocket(socketService: SocketService) {
		this.socketService = socketService
	}

	async start(room: Room) {
		console.log("[CallManager] start 1")
		this.socketService.on(InputMessagesTypes.ADD_PEER, this.handleNewPeer.bind(this))
		this.socketService.on(InputMessagesTypes.SESSION_DESCRIPTION, this.setRemoteMedia.bind(this))
		this.socketService.on(InputMessagesTypes.ICE_CANDIDATE, this.handleIceCandidate.bind(this))
		this.socketService.on(InputMessagesTypes.REMOVE_PEER, this.handleRemovePeer.bind(this))
		await this.startCaptureWebCam()
		sessionStore.join(room)
		console.log("[CallManager] start 2")
	}

	stop() {
		sessionStore.leave()
		this.socketService.off(InputMessagesTypes.ADD_PEER)
		this.socketService.off(InputMessagesTypes.SESSION_DESCRIPTION)
		this.socketService.off(InputMessagesTypes.ICE_CANDIDATE)
		this.socketService.off(InputMessagesTypes.REMOVE_PEER)

		if (this.localMedia) {
			Object.entries(this.localMedia).forEach(([key, media]) => {
				media?.getTracks().forEach(track => {
					console.debug("Track stop")
					track.stop()
				})
			})
		}

		this.localMedia = null
		this.clients = []
		this.peerMediaElements = {
			[LOCAL.WEBCAM]: null,
			[LOCAL.DISPLAY]: null
		}
		Object.values(this.dataChannels).forEach(datachannel => datachannel.close())
		Object.values(this.peerConnections).forEach(peerConnection => peerConnection.close())
		this.dataChannels = {}
		this.peerConnections = {}
	}

	get isOnWebcamAudio(): boolean {
		return this.localStatuses.LOCAL_WEBCAM.audio
	}

	get isOnWebcamVideo() {
		return this.localStatuses.LOCAL_WEBCAM.video
	}

	get isCaptureDisplay() {
		return this.localStatuses.LOCAL_DISPLAY.video
	}

	switchWebcamAudioMode() {
		const audioTrack = this.localMedia.LOCAL_WEBCAM?.getAudioTracks()[0]
		if (audioTrack) {
			audioTrack.enabled = !audioTrack.enabled
			this.localStatuses.LOCAL_WEBCAM.audio = audioTrack.enabled
		}
	}

	switchWebcamVideoMode() {
		const videoTrack = this.localMedia.LOCAL_WEBCAM?.getVideoTracks()[0]
		if (videoTrack) {
			videoTrack.enabled = !videoTrack.enabled
			this.localStatuses.LOCAL_WEBCAM.video = videoTrack.enabled
		}
	}

	switchCaptureDisplayMode() {
		if (this.localStatuses.LOCAL_DISPLAY.video) {
			this.stopCaptureDisplay()
			this.localStatuses.LOCAL_DISPLAY.video = false
		} else {
			this.startCaptureDisplay()
			this.localStatuses.LOCAL_DISPLAY.video = true
		}
	}

	private addClient(clientName: string, remoteStream?: MediaStream) {
		console.log("addClient", clientName)
		this.clients.push({ uuid: clientName, isWebcamActive: false })

		// Видеопоток от удалённого пользователя
		if (remoteStream) {
			// Тут нужно устанавливать srcObject в объект который установит компонент
			if (this.peerMediaElements[clientName]) {
				this.peerMediaElements[clientName] = { srcObject: remoteStream } as any
			} else {
				// В этот момент для клиента еще не создан html тег video и некуда присваивать поток данных
				// Он будет присвоен в методе setMediaElement вызываемом компонентом
				this.streamsQueue[clientName] = remoteStream
			}
		}
	}

	private addDataChannel(peerID: string, dataChannel: RTCDataChannel) {
		this.dataChannels[peerID] = dataChannel
		this.dataChannels[peerID].onmessage = msg => {
			console.log("Сообщение из datachannel:", msg?.data)
		}
	}

	private removeClient(clientName: string) {
		this.clients = this.clients.filter(client => client.uuid !== clientName)

		if (this.peerConnections[clientName]) {
			this.peerConnections[clientName].close()
		}
		if (this.dataChannels[clientName]) {
			this.dataChannels[clientName].close()
		}

		delete this.dataChannels[clientName]
		delete this.peerConnections[clientName]
		delete this.peerMediaElements[clientName]
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

		let tracksNumber = 0
		this.peerConnections[peerID].ontrack = ({ streams: [remoteStream] }) => {
			// Вызывается при поступлении медиа данных от удалённого peer
			tracksNumber++ // TODO: ПОДУМАТЬ КАК ИЗБАВИТЬСЯ ОТ ЭТОГО КОСТЫЛЯ

			if (tracksNumber === 2) {
				console.log("ontrack", { peerID })
				// video & audio tracks received
				tracksNumber = 0
				this.addClient(peerID, remoteStream)
			}
		}

		this.peerConnections[peerID].ondatachannel = event => {
			this.addDataChannel(peerID, event.channel)
		}

		// Отправка подключающемуся пользователю своего видеопотока
		Object.entries(this.localMedia).forEach(([key, media]) => {
			// console.log("send local tracks to remote client", key, media)
			media?.getTracks().forEach(track => {
				this.peerConnections[peerID].addTrack(track, media)
			})
		})

		// Это делает подключающийся пользователь
		if (createOffer) {
			if (!this.dataChannels[peerID]) {
				// Создание канала передачи данных поверх уже открытого RTCPeerConnection
				const dataChannel = this.peerConnections[peerID].createDataChannel("talk")
				dataChannel.onopen = () => {
					this.addDataChannel(peerID, dataChannel)
				}
				dataChannel.onerror = error => {
					console.error("DATACHANNEL onerror", error)
				}
			}

			const offer = await this.peerConnections[peerID].createOffer()

			await this.peerConnections[peerID].setLocalDescription(offer)

			this.socketService.send(OutputMessagesTypes.RELAY_SDP, {
				peer_id: peerID,
				session_description: offer
			})
		}

		this.peerConnections[peerID].onconnectionstatechange = (event) => {
			console.log("onconnectionstatechange", event)
		}
		this.peerConnections[peerID].oniceconnectionstatechange = (event) => {
			console.log("oniceconnectionstatechange", event)
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

	private async startCaptureWebCam() {
		try {
			this.localMedia.LOCAL_WEBCAM = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: {
					aspectRatio: { ideal: 1 },
					frameRate: { ideal: 30, max: 60 }
				}
			})

			// Для добавления самого себя в список пользователей
			this.addClient(LOCAL.WEBCAM)
		} catch (error) {
			// Пользователь не дал доступ к камере
		}
	}

	private async startCaptureDisplay() {
		try {
			this.localMedia.LOCAL_DISPLAY = await navigator.mediaDevices.getDisplayMedia({
				audio: true,
				video: {
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					frameRate: { ideal: 30, max: 60 }
				}
			})

			this.addClient(LOCAL.DISPLAY)
		} catch (error) {
			// Пользователь не дал доступ к показу экрана
		}
	}

	private async stopCaptureDisplay() {
		this.localMedia.LOCAL_DISPLAY = null
		this.removeClient(LOCAL.DISPLAY)
	}

	// TODO: Переписать на передачу статуса через RTCDataChannel
	private checkClientsActiveVideo() {
		for (const client of this.clients) {
			const mediaStream = this.peerMediaElements[client.uuid]?.srcObject
			client.isWebcamActive = mediaStream?.getVideoTracks()?.some(track => track.enabled)
		}
	}

	setMediaElement(clientName: string, mediaElement: HTMLVideoElement) {
		if (!mediaElement) return

		if (clientName === LOCAL.WEBCAM || clientName === LOCAL.DISPLAY) {
			if (this.peerMediaElements[clientName] != null) {
				// Уже есть видео от пользователя
				return
			}
			mediaElement.volume = 0 // Чтобы не слышать самого себя
			mediaElement.srcObject = this.localMedia[clientName]
			if (clientName === LOCAL.WEBCAM) {
				// По умолчанию выключаем вебку
				this.localMedia[LOCAL.WEBCAM].getTracks()?.forEach(track => (track.enabled = false))
			}
		}

		this.peerMediaElements[clientName] = mediaElement

		if (this.streamsQueue[clientName]) {
			this.peerMediaElements[clientName].srcObject = this.streamsQueue[clientName]
			delete this.streamsQueue[clientName]
		}
	}
}

export const callManager = new CallManager()

// DEBUG
//@ts-ignore
window.callManager = callManager

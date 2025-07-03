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

class CallManager {
	private socketService: SocketService

	clients: any[] = [] // TODO: ТИПИЗИРОВАТЬ

	private peerConnections: Record<string, RTCPeerConnection> = {}
	private streamsQueue: Record<string, MediaStream> = {}

	private localMedia: Record<LOCAL, MediaStream> = {
		[LOCAL.WEBCAM]: null,
		[LOCAL.DISPLAY]: null
	}
	private peerMediaElements: Record<LOCAL & string, HTMLMediaElement> = {
		[LOCAL.WEBCAM]: null,
		[LOCAL.DISPLAY]: null
	}

	private statuses: Record<LOCAL, { audio: boolean; video: boolean }> = {
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
		Object.values(this.peerConnections).forEach(peerConnection => peerConnection.close())
		this.peerConnections = {}
	}

	get isOnWebcamAudio(): boolean {
		return this.statuses.LOCAL_WEBCAM.audio
	}

	get isOnWebcamVideo() {
		return this.statuses.LOCAL_WEBCAM.video
	}

	get isCaptureDisplay() {
		return this.statuses.LOCAL_DISPLAY.video
	}

	switchWebcamAudioMode() {
		const audioTrack = this.localMedia.LOCAL_WEBCAM?.getAudioTracks()[0]
		if (audioTrack) {
			audioTrack.enabled = !audioTrack.enabled
			this.statuses.LOCAL_WEBCAM.audio = audioTrack.enabled
		}
	}

	switchWebcamVideoMode() {
		const videoTrack = this.localMedia.LOCAL_WEBCAM?.getVideoTracks()[0]
		if (videoTrack) {
			videoTrack.enabled = !videoTrack.enabled
			this.statuses.LOCAL_WEBCAM.video = videoTrack.enabled
		}
	}

	switchCaptureDisplayMode() {
		if (this.statuses.LOCAL_DISPLAY.video) {
			this.stopCaptureDisplay()
			this.statuses.LOCAL_DISPLAY.video = false
		} else {
			this.startCaptureDisplay()
			this.statuses.LOCAL_DISPLAY.video = true
		}
	}

	private addClient(clientName: string, remoteStream?: MediaStream) {
		console.log("addClient", clientName)
		this.clients.push(clientName)

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

	private removeClient(clientName: string) {
		this.clients = this.clients.filter(client => client !== clientName)

		if (this.peerConnections[clientName]) {
			this.peerConnections[clientName].close()
		}

		delete this.peerConnections[clientName]
		delete this.peerMediaElements[clientName]
		delete this.streamsQueue[clientName]
	}

	private async handleNewPeer({ peer_id: peerID, create_offer: createOffer }) {
		if (peerID in this.peerConnections) {
			return console.warn(`Already connected to peer ${peerID}`)
		}

		this.peerConnections[peerID] = new RTCPeerConnection({
			iceServers: freeice()
		})

		this.peerConnections[peerID].onicecandidate = event => {
			if (event.candidate) {
				console.log("ICE CANDIDATE", event.candidate)
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
				// video & audio tracks received
				tracksNumber = 0
				this.addClient(peerID, remoteStream)
			}
		}

		Object.entries(this.localMedia).forEach(([key, media]) =>
			media?.getTracks().forEach(track => {
				this.peerConnections[peerID].addTrack(track, media)
			})
		)

		// Это делает подключающийся пользователь
		if (createOffer) {
			const offer = await this.peerConnections[peerID].createOffer()

			console.log("setLocalDescription offer", offer)
			await this.peerConnections[peerID].setLocalDescription(offer)

			this.socketService.send(OutputMessagesTypes.RELAY_SDP, {
				peer_id: peerID,
				session_description: offer
			})
		}
	}

	private async setRemoteMedia({ peer_id: peerID, session_description: remoteDescription }) {
		console.log(peerID, remoteDescription)
		await this.peerConnections[peerID]?.setRemoteDescription(new RTCSessionDescription(remoteDescription))

		if (remoteDescription.type === "offer") {
			const answer = await this.peerConnections[peerID].createAnswer()

			console.log("setLocalDescription answer")
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
					width: { ideal: 1920 },
					height: { ideal: 1080 },
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

	setMediaElement(clientName: string, mediaElement: HTMLVideoElement) {
		if (!mediaElement) return

		if (clientName === LOCAL.WEBCAM || clientName === LOCAL.DISPLAY) {
			mediaElement.volume = 1 // Чтобы не слышать самого себя
			mediaElement.srcObject = this.localMedia[clientName]
			if (clientName === LOCAL.WEBCAM) {
				// По умолчанию выключаем вебку
				const videoTrack = this.localMedia[clientName].getTracks()[0]
				videoTrack.enabled = false
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

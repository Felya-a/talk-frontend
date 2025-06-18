import freeice from "freeice"
import { makeAutoObservable } from "mobx"
import { InputMessagesTypes, OutputMessagesTypes } from "../../socket/interface"
import SocketService from "../../socket/SocketService"
import { Room, sessionStore } from "../../store"

export const LOCAL_VIDEO = "LOCAL_VIDEO"

class CallManager {
	socketService: SocketService

	clients: any[] = [] // TODO: ТИПИЗИРОВАТЬ

	peerConnections: Record<string, RTCPeerConnection> = {}
	localMediaElement: MediaStream
	peerMediaElements: Record<string, HTMLMediaElement> = {
		[LOCAL_VIDEO]: null
	}
	streamsQueue: Record<string, MediaStream> = {}

	constructor() {
		makeAutoObservable(this)
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
		await this.startCapture()
		sessionStore.join(room)
		console.log("[CallManager] start 2")
	}

	stop() {
		sessionStore.leave()
		this.socketService.off(InputMessagesTypes.ADD_PEER)
		this.socketService.off(InputMessagesTypes.SESSION_DESCRIPTION)
		this.socketService.off(InputMessagesTypes.ICE_CANDIDATE)
		this.socketService.off(InputMessagesTypes.REMOVE_PEER)

		if (this.localMediaElement) {
			this.localMediaElement.getTracks().forEach(track => {
				console.debug("Track stop")
				track.stop()
			})
		}

		this.localMediaElement = null
		this.clients = []
		this.peerMediaElements = {
			[LOCAL_VIDEO]: null
		}
		Object.values(this.peerConnections).forEach((peerConnection) => peerConnection.close())
		this.peerConnections = {}
	}

	private addClient(clientName: string, remoteStream?: MediaStream) {
		console.log("addClient", clientName)
		this.clients.push(clientName)

		if (remoteStream) {
			// Тут нужно устанавливать srcObject в объект который установит компонент
			if (this.peerMediaElements[clientName]) {
				this.peerMediaElements[clientName] = {srcObject: remoteStream} as any
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

	}

	async handleNewPeer({ peer_id: peerID, create_offer: createOffer }) {
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
		this.peerConnections[peerID].ontrack = ({streams: [remoteStream]}) => {
			// Вызывается при поступлении медиа данных от удалённого peer
			tracksNumber++ // TODO: ПОДУМАТЬ КАК ИЗБАВИТЬСЯ ОТ ЭТОГО КОСТЫЛЯ

			if (tracksNumber === 2) {
				// video & audio tracks received
				tracksNumber = 0
				this.addClient(peerID, remoteStream)
			}
		}

		console.log(this.localMediaElement)
		this.localMediaElement.getTracks().forEach(track => {
			this.peerConnections[peerID].addTrack(track, this.localMediaElement)
		})

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

	async setRemoteMedia({ peer_id: peerID, session_description: remoteDescription }) {
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

	async handleIceCandidate({ peer_id: peerID, ice_candidate: iceCandidate }) {
		this.peerConnections[peerID]?.addIceCandidate(new RTCIceCandidate(iceCandidate))
	}

	handleRemovePeer({ peer_id: peerID }) {
		this.removeClient(peerID)
	}

	async startCapture() {
		this.localMediaElement = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: {
				width: { ideal: 1920 },
				height: { ideal: 1080 },
				frameRate: { ideal: 30, max: 60 }
			}
		})

		this.addClient(LOCAL_VIDEO)
	}

	setMediaElement(clientName: string, mediaElement: HTMLVideoElement) {
		if (!mediaElement) return

		if (clientName === LOCAL_VIDEO) {
			mediaElement.volume = 0 // Чтобы не слышать самого себя
			mediaElement.srcObject = this.localMediaElement
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
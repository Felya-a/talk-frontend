import { makeAutoObservable } from "mobx"
import { OutputMessagesTypes } from "../socket/interface"
import SocketService from "../socket/SocketService"
import { authStore } from "./AuthStore"

export interface Client {
	uuid: string
	nickname: string
}

export interface Room {
	// clients: Client[]
	clients: string[]
	uuid: string
	name: string
}

class SessionStore {
	socketService: SocketService // TODO: Убрать зависимость от конкретного класса
	rooms: Room[] = []
	selectedRoom: Room
	myUuid: string

	constructor() {
		makeAutoObservable(this)
	}

	setSocket(socketService: SocketService) {
		this.socketService = socketService
	}

	updateRooms(rooms: Room[]) {
		this.rooms = rooms
	}

	createRoom() {
		this.socketService.send(OutputMessagesTypes.CREATE_ROOM, {
			room_name: "test_from_react" // TODO: Изменить имя создаваемой комнаты
		})
	}

	selectRoom(room: Room) {
		this.selectedRoom = room
	}

	join(room: Room) {
		console.log("[SessionStore] JOINROOM")
		this.socketService.send(OutputMessagesTypes.JOIN, {
			room_uuid: room.uuid
		})
	}

	leave() {
		// this.selectedRoom = null
		this.socketService.send(OutputMessagesTypes.LEAVE, null)
	}

	getMyRoom(): Room {
		return this.rooms.find(room => room.clients.find(client => client === this.myUuid))
	}

	setUuid(uuid: string) {
		this.myUuid = uuid
	}
}

export const sessionStore = new SessionStore();
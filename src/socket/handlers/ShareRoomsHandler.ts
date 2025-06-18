import { sessionStore } from "../../store"
import { MessageHandler } from "../interface"

export class ShareRoomsHandler implements MessageHandler {
	async handle(data: any) {
        sessionStore.updateRooms(data)
    }
}

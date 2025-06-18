import { sessionStore } from "../../store"
import { MessageHandler } from "../interface"

export class ClientInfoHandler implements MessageHandler {
	async handle(data: any) {
        sessionStore.setUuid(data.uuid)
    }
}

import { makeAutoObservable } from "mobx"

interface Message {
    clientId: string
    text: string
    image: ArrayBuffer
}

export default class ChatManager {
    messages: Message[] = []

    constructor() {
        makeAutoObservable(this)
    }

    receive(message: Message) {
        if (!message.text && !message.image) return
        this.messages.push(message)
    }

    clear() {
        this.messages = []
    }
}
import { MessagesDto } from "./dto"

export enum InputMessagesTypes {
	PING = "ping",
	PONG = "pong",
	CLIENT_INFO = "client_info",
	SHARE_ROOMS = "share-rooms",
	ADD_PEER = "add-peer",
	REMOVE_PEER = "remove-peer",
	ICE_CANDIDATE = "ice-candidate",
	SESSION_DESCRIPTION = "session-description"
}

export enum OutputMessagesTypes {
	PING = "ping",
	CREATE_ROOM = "create-room",
	JOIN = "join",
	LEAVE = "leave",
	RELAY_SDP = "relay-sdp",
	RELAY_ICE = "relay-ice"
}

export interface ReceiveMessage {
	type: InputMessagesTypes
	data: any
}

export interface TransmitMessage<T extends OutputMessagesTypes> {
	type: T
	data: TransmitData<T>
}

export type TransmitData<T extends OutputMessagesTypes> = T extends keyof MessagesDto ? MessagesDto[T] : never

export interface MessageHandler {
	handle(data: any): Promise<void>
}

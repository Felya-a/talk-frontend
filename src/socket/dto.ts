import { OutputMessagesTypes } from "./interface"

export interface CreateRoomDto {
    room_name: string
}

export interface JoinDto {
    room_uuid: string
}

export type LeaveDto = null

export interface RelayIceDto {
    peer_id: string
    ice_candidate: RTCIceCandidate
}

export interface RelaySdpDto {
    peer_id: string
    session_description: RTCSessionDescriptionInit
}

export type MessagesDto = {
    [OutputMessagesTypes.CREATE_ROOM]: CreateRoomDto;
    [OutputMessagesTypes.JOIN]: JoinDto;
    [OutputMessagesTypes.LEAVE]: LeaveDto;
    [OutputMessagesTypes.RELAY_ICE]: RelayIceDto;
    [OutputMessagesTypes.RELAY_SDP]: RelaySdpDto;
};
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { sessionStore } from "../../store"
import Chat from "./Chat"
import { ActionButtons, Call, CallSpace, Video, Videos } from "./styles"
import MicButton from "./Buttons/MicButton"
import CamButton from "./Buttons/CamButton"
import ScreenShareButton from "./Buttons/ScreenShareButton"
import LeaveButton from "./Buttons/LeaveButton"
import useWebRTC, { LOCAL_VIDEO } from "../../hooks/useWebRTC"
import { callManager } from "./CallManager"

// TODO: ПЕРЕПИСАТЬ НАХУЙ
function layout(clientsNumber = 1) {
	const pairs = Array.from({ length: clientsNumber }).reduce<any>((acc, next, index, arr) => {
		if (index % 2 === 0) {
			acc.push(arr.slice(index, index + 2))
		}

		return acc
	}, []) as any[]

	const rowsNumber = pairs.length
	const height = `${100 / rowsNumber}%`

	return pairs
		.map((row, index, arr) => {
			if (index === arr.length - 1 && row.length === 1) {
				return [
					{
						width: "100%",
						height
					}
				]
			}

			return row.map(() => ({
				width: "50%",
				height
			}))
		})
		.flat()
}

const CallComponent = observer(() => {
	// const { clients, provideMediaRef, error } = useWebRTC(sessionStore.selectedRoom)
	const { clients } = callManager
	const [isEnableChat, setEnableChat] = useState(false)
	const [isMute, setMute] = useState(false) // DEBUG

	const leave = () => {
		sessionStore.selectRoom(null)
	}

	// DEBUG: LOG ONLY. Лучше через reaction
	// useEffect(() => {
	// 	console.log("[CallComponent] update clients", clients, clients.length)
	// }, [clients])

	return (
		<Call $isVisibleChat={isEnableChat}>
			<CallSpace>
				<Videos>
					{clients?.length ? (
						clients.map((clientID, index) => (
							<Video key={clientID} id={clientID}>
								<video
									ref={instance => {
										console.log("[CallComponent] video ref", clientID)
										callManager.setMediaElement(clientID, instance)
									}}
									autoPlay
									playsInline
									muted={clientID === LOCAL_VIDEO}
								/>
							</Video>
						))
					) : (
						<>debug: нет клиентов</>
					)}
				</Videos>

				<ActionButtons>
					<MicButton
						isActive={isMute}
						switchMode={() => {
							setMute(prev => !prev)
						}}
					/>
					<CamButton isActive={false} switchMode={() => {}} />
					<ScreenShareButton isActive={false} switchMode={() => {}} />
					<LeaveButton leave={leave} />
				</ActionButtons>
			</CallSpace>
			{isEnableChat && <Chat />}
		</Call>
	)
})

export default CallComponent

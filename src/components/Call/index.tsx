import { observer } from "mobx-react-lite"
import { useState } from "react"
import { sessionStore } from "../../store"
import ActionButtons from "./ActionsButtons"
import { MicrophoneStatus } from "./Buttons/MicrophoneStatus"
import { callManager, MediaType } from "./CallManager"
import Chat from "./Chat"
import { Call, CallSpace, Placeholder, Video, Videos } from "./styles"

const CallComponent = observer(() => {
	const { clients } = callManager
	const [isEnableChat, setEnableChat] = useState(false)

	const leave = () => {
		sessionStore.selectRoom(null)
	}

	return (
		<Call $isVisibleChat={isEnableChat}>
			<CallSpace>
				<Videos>
					{clients.map((client) => (
						<Video key={client.uuid + MediaType.WEBCAM}>
							<video
								ref={instance => {
									// console.log("[CallComponent] video ref", client.uuid)
									callManager.setMediaElement(client.uuid, instance, MediaType.WEBCAM)
								}}
								autoPlay
								playsInline
							/>
							{!client.statuses.webcam && (
								<Placeholder $isShow={true} color={getColorFromUUID(client.uuid)}>
									{client.uuid}
								</Placeholder>
							)}
							<MicrophoneStatus isEnabled={client.statuses.microphone} />
						</Video>
					))}
					{clients
						.filter(client => client.statuses.display)
						.map((client) => (
							<Video key={client.uuid + MediaType.DISPlAY}>
								<video
									ref={instance => {
										console.log("[CallComponent] display video ref", client.uuid)
										callManager.setMediaElement(client.uuid, instance, MediaType.DISPlAY)
									}}
									autoPlay
									playsInline
								/>
							</Video>
						))}
				</Videos>
				<ActionButtons leave={leave} />
			</CallSpace>
			{isEnableChat && <Chat />}
		</Call>
	)
})

export default CallComponent

function getRandomColor() {
	return Math.floor(Math.random() * (255 - 120 + 1)) + 120
}

function getColorFromUUID(uuid: string) {
	const hash = Array.from(uuid).reduce((acc, char) => acc + char.charCodeAt(0), 0)
	const r = 120 + (hash * 37) % 135
	const g = 120 + (hash * 59) % 135
	const b = 120 + (hash * 83) % 135
	return `rgb(${r},${g},${b})`
}

import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { sessionStore } from "../../store"
import ActionButtons from "./ActionsButtons"
import { callManager } from "./CallManager"
import Chat from "./Chat"
import { Call, CallSpace, Video, Videos, Placeholder } from "./styles"

const CallComponent = observer(() => {
	const { clients } = callManager
	const [isEnableChat, setEnableChat] = useState(false)

	const leave = () => {
		sessionStore.selectRoom(null)
	}

	useEffect(() => {
		console.log("UPDATE CLIENTS LIST", clients)
	}, [clients])

	useEffect(() => {
		console.log("--- RERENDER --- CallComponent")
	}, [])

	return (
		<Call $isVisibleChat={isEnableChat}>
			<CallSpace>
				<Videos>
					{clients.map((client, index) => (
						<Video key={index}>
							<video
								ref={instance => {
									// console.log("[CallComponent] video ref", client.uuid)
									callManager.setMediaElement(client.uuid, instance)
								}}
								autoPlay
								playsInline
							/>
							{/* <Placeholder $isShow={!client.isWebcamActive} color={`rgb(${getRandomColor()},${getRandomColor()},${getRandomColor()})`}>{client.uuid}</Placeholder> */}
							{!client.isWebcamActive && (
								<Placeholder $isShow={true} color={`rgb(${getRandomColor()},${getRandomColor()},${getRandomColor()})`}>
									{client.uuid}
								</Placeholder>
							)}
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

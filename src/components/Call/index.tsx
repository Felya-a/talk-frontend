import { observer } from "mobx-react-lite"
import { useState } from "react"
import { LOCAL_VIDEO } from "../../hooks/useWebRTC"
import { sessionStore } from "../../store"
import ActionButtons from "./ActionsButtons"
import { callManager } from "./CallManager"
import Chat from "./Chat"
import { Call, CallSpace, Video, Videos } from "./styles"

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
	const { clients } = callManager
	const [isEnableChat, setEnableChat] = useState(false)

	const leave = () => {
		sessionStore.selectRoom(null)
	}

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
				<ActionButtons leave={leave}/>
			</CallSpace>
			{isEnableChat && <Chat />}
		</Call>
	)
})

export default CallComponent

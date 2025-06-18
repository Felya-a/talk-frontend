import { RoomStyle, RoomName } from "./styles"
import { ReactComponent as SoundSVG } from "../../../assets/sound.svg"
import Clients from "./Clients"
import { observer } from "mobx-react-lite"
import { Room, sessionStore } from "../../../store"

interface RoomProps {
	room: Room
	isCurrentRoom: boolean
}

const RoomComponent = observer(({ room, isCurrentRoom }: RoomProps) => {
	function onClickRoom() {
		sessionStore.selectRoom(room)
	}

	return (
		<RoomStyle onClick={onClickRoom} $isCurrentRoom={isCurrentRoom}>
			<RoomName>
				<SoundSVG />
				{room.name}
			</RoomName>
			<Clients clients={room.clients.map(clientUuid => ({uuid: clientUuid, nickname: "fake"}))} />
			{/* <Clients
				clients={[
					{ uuid: "1", nickname: "Илья Федосеев" },
					{ uuid: "2", nickname: "Иван Иванов" },
					{ uuid: "3", nickname: "Сергей Сергеев" },
					{ uuid: "4", nickname: "Петр Петров" }
				].filter(() => Math.random() > 0.5)}
			/> */}
		</RoomStyle>
	)
})

export default RoomComponent
import { observer } from "mobx-react-lite"
import { useNavigate } from "react-router"
import { sessionStore } from "../../store"
import Room from "./Room"
import { CreateRoom, Rooms, RoomsList, Title } from "./styles"

const RoomsComponent = observer(() => {
	const navigate = useNavigate()

	return (
		<Rooms>
			<Title>Комнаты</Title>
			<RoomsList>
				{sessionStore.rooms.map((room, index) => (
					<Room room={room} key={index} isCurrentRoom={sessionStore.getMyRoom()?.uuid === room.uuid}/>
				))}
			</RoomsList>
			<CreateRoom
				onClick={() => {
					sessionStore.createRoom()
				}}
			>
				Создать
			</CreateRoom>
		</Rooms>
	)
})

export default RoomsComponent

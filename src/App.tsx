import { BrowserRouter, Route, Routes } from "react-router-dom"
import NotFound404 from "./components/NotFound404"
import { MainLayout } from "./layout"
import Chat from "./components/Call/Chat"
import Rooms from "./components/Rooms"
import Call from "./components/Call"
import Servers from "./components/Servers"
import { sessionStore } from "./store"
import WaitCall from "./components/Call/WaitCall"
import { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { reaction } from "mobx"
import { callManager } from "./components/Call/CallManager"

const App = observer(() => {
	const [isInCall, setIsInCall] = useState(false)

	useEffect(() => {
		const disposer = reaction(
			() => sessionStore.selectedRoom,
			async (selectedRoom, previousRoom) => {
				console.log("selectedRoom changed:", previousRoom, "→", selectedRoom)
				switch (true) {
					case previousRoom == null && selectedRoom != null:
						setIsInCall(true)
						await callManager.start(selectedRoom)
						break
					case previousRoom != null && selectedRoom != null:
						callManager.stop()
						await callManager.start(selectedRoom)
						break
					case selectedRoom == null:
						setIsInCall(false)
						callManager.stop()
						break
					default:
						break
				}
			}
		)

		// Очистка подписки при размонтировании компонента
		return () => disposer()
	}, [])

	return (
		<BrowserRouter>
			<MainLayout>
				{/* <Servers/> */}
				<Rooms />
				{isInCall ? <Call key="call" /> : <WaitCall key="wait" />}
			</MainLayout>
		</BrowserRouter>
	)
})

export default App

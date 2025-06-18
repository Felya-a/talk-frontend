import ReactDOM from "react-dom/client"
import App from "./App"
import WithAuth from "./hoc/WithAuth"
import "./index.css"
import { WebSocketProvider } from "./socket/Context"

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(
	// <WithAuth>
		<WebSocketProvider url={process.env.REACT_APP_SERVER_WS_URL}> 
			<App />
		</WebSocketProvider>
	// </WithAuth>
)

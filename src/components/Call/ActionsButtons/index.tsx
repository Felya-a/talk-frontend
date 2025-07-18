import { observer } from "mobx-react-lite"
import CamButton from "../Buttons/CamButton"
import LeaveButton from "../Buttons/LeaveButton"
import MicButton from "../Buttons/MicButton"
import ScreenShareButton from "../Buttons/ScreenShareButton"
import { callManager } from "../CallManager"
import { ActionButtonsStyles } from "../styles"
import ChatButton from "../Buttons/ChatButton"

interface ActionButtonsProps {
	leave: () => void
	isActiveChat: boolean
	enableChat: () => void
}

const ActionButtons = observer((props: ActionButtonsProps) => {
	return (
		<ActionButtonsStyles>
			<MicButton isActive={callManager.isOnWebcamAudio} switchMode={callManager.switchWebcamAudioMode.bind(callManager)} />
			<CamButton isActive={callManager.isOnWebcamVideo} switchMode={callManager.switchWebcamVideoMode.bind(callManager)} />
			<ScreenShareButton isActive={callManager.isCaptureDisplay} switchMode={callManager.switchCaptureDisplayMode.bind(callManager)} />
			<ChatButton isActive={props.isActiveChat} switchMode={props.enableChat}/>
			<LeaveButton leave={props.leave} />
		</ActionButtonsStyles>
	)
})

export default ActionButtons

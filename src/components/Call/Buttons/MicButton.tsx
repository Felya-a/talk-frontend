import MicIcon from "@mui/icons-material/Mic"
import MicOffIcon from "@mui/icons-material/MicOff"
import { ActionButton } from "./styles"
import { ActionButtonProps } from "./interface"
import { Tooltip } from "@mui/material"

function MicButton(props: ActionButtonProps) {
	return (
		<Tooltip title={props.isActive ? "Выключить микрофон" : "Включить микрофон"}>
			<ActionButton onClick={props.switchMode}>
				{props.isActive ? <MicIcon /> : <MicOffIcon />}
			</ActionButton>
		</Tooltip>
	)
}

export default MicButton

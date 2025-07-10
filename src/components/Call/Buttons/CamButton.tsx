import VideocamIcon from "@mui/icons-material/Videocam"
import VideocamOffIcon from "@mui/icons-material/VideocamOff"
import { ActionButton } from "./styles"
import { ActionButtonProps } from "./interface"
import { Tooltip } from "@mui/material"

function CamButton(props: ActionButtonProps) {
	return (
		<Tooltip title={props.isActive ? "Выключить камеру" : "Включить камеру"}>
			<ActionButton onClick={props.switchMode}>{props.isActive ? <VideocamIcon /> : <VideocamOffIcon />}</ActionButton>
		</Tooltip>
	)
}

export default CamButton

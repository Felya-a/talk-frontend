import MicIcon from "@mui/icons-material/Mic"
import MicOffIcon from "@mui/icons-material/MicOff"
import { ActionButton } from "./styles"
import { ActionButtonProps } from "./interface"

function MicButton(props: ActionButtonProps) {
	return (
        <ActionButton onClick={props.switchMode}>
            {props.isActive
                ? <MicOffIcon/>
                : <MicIcon/>
            }
        </ActionButton>
    )
}

export default MicButton

import MicIcon from "@mui/icons-material/Mic"
import MicOffIcon from "@mui/icons-material/MicOff"
import { ActionButton } from "./styles"
import { ActionButtonProps } from "./interface"

function MicButton(props: ActionButtonProps) {
	return (
        <ActionButton onClick={props.switchMode}>
            {typeof props.isActive == "function" && props.isActive() || props.isActive
                ? <MicIcon/>
                : <MicOffIcon/>
            }
        </ActionButton>
    )
}

export default MicButton

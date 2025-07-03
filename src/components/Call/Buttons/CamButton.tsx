import VideocamIcon from "@mui/icons-material/Videocam"
import VideocamOffIcon from "@mui/icons-material/VideocamOff"
import { ActionButton } from "./styles"
import { ActionButtonProps } from "./interface"

function CamButton(props: ActionButtonProps) {
    return (
        <ActionButton onClick={props.switchMode}>
            {typeof props.isActive == "function" && props.isActive() || props.isActive
                ? <VideocamIcon/>
                : <VideocamOffIcon/>
            }
        </ActionButton>
    )
}

export default CamButton

import VideocamIcon from "@mui/icons-material/Videocam"
import VideocamOffIcon from "@mui/icons-material/VideocamOff"
import { ActionButton } from "./styles"
import { ActionButtonProps } from "./interface"

function CamButton(props: ActionButtonProps) {
    return (
        <ActionButton onClick={props.switchMode}>
            {props.isActive
                ? <VideocamOffIcon/>
                : <VideocamIcon/>
            }
        </ActionButton>
    )
}

export default CamButton

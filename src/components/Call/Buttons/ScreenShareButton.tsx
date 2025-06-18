import ScreenShareIcon from '@mui/icons-material/ScreenShareOutlined';
import ScreenShareOffIcon from '@mui/icons-material/StopScreenShareOutlined';
import { ActionButton } from "./styles"
import { ActionButtonProps } from "./interface"

function ScreenShareButton(props: ActionButtonProps) {
    return (
        <ActionButton onClick={props.switchMode}>
            {props.isActive
                ? <ScreenShareOffIcon/>
                : <ScreenShareIcon/>
            }
        </ActionButton>
    )
}

export default ScreenShareButton

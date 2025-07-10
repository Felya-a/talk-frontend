import ScreenShareIcon from '@mui/icons-material/ScreenShareOutlined';
import ScreenShareOffIcon from '@mui/icons-material/StopScreenShareOutlined';
import { ActionButton } from "./styles"
import { ActionButtonProps } from "./interface"
import { Tooltip } from '@mui/material'

function ScreenShareButton(props: ActionButtonProps) {
    return (
        <Tooltip title={props.isActive ? "Выключить демонстрацию" : "Включить демонстрацию"}>
        <ActionButton onClick={props.switchMode}>
            {props.isActive
                ? <ScreenShareOffIcon/>
                : <ScreenShareIcon/>
            }
        </ActionButton>
        </Tooltip>
    )
}

export default ScreenShareButton

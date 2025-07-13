import MicOffIcon from "@mui/icons-material/MicOff"
import { MicrophoneStatusStyle } from "./styles"

export function MicrophoneStatus ({isEnabled}) {
    return (
        <MicrophoneStatusStyle $isEnabled={isEnabled}>
            {!isEnabled && <MicOffIcon/>}
        </MicrophoneStatusStyle>
    )
}
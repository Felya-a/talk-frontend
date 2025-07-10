import MicIcon from "@mui/icons-material/Mic"
import MicOffIcon from "@mui/icons-material/MicOff"
import { MicrophoneStatusStyle } from "./styles"
import { useEffect } from "react"

export function MicrophoneStatus ({isEnabled}) {
    useEffect(() => console.log({isEnabled}), [isEnabled])
    return (
        <MicrophoneStatusStyle $isEnabled={isEnabled}>
            {!isEnabled && <MicOffIcon/>}
        </MicrophoneStatusStyle>
    )
}
import ChatRoundedIcon from "@mui/icons-material/ChatRounded"
import { ActionButton } from "./styles"
import { ActionButtonProps } from "./interface"
import { Tooltip } from "@mui/material"

function ChatButton(props: ActionButtonProps) {
	return (
		<Tooltip title={props.isActive ? "Закрыть чат" : "Открыть чат"}>
			<ActionButton onClick={props.switchMode}>
				<ChatRoundedIcon />
			</ActionButton>
		</Tooltip>
	)
}

export default ChatButton

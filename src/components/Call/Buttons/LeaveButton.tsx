import { Tooltip } from "@mui/material"
import { ActionButton } from "./styles"
import CallEndIcon from "@mui/icons-material/CallEnd"

interface LeaveButtonProps {
	leave: () => void
}

function LeaveButton(props: LeaveButtonProps) {
	return (
		<Tooltip title={"Покинуть комнату"}>
			<ActionButton datatype="leave" onClick={props.leave}>
				<CallEndIcon />
			</ActionButton>
		</Tooltip>
	)
}

export default LeaveButton

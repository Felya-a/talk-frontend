import { ActionButton } from "./styles"
import CallEndIcon from '@mui/icons-material/CallEnd';

interface LeaveButtonProps {
    leave: () => void
}

function LeaveButton(props: LeaveButtonProps) {
	return (
        <ActionButton datatype="leave" onClick={props.leave}><CallEndIcon/></ActionButton>
    )
}

export default LeaveButton

import styled from "styled-components"

export const ActionButton = styled.div`
	user-select: none;
	width: 45px;
	height: 45px;
	cursor: pointer;

	border-radius: 10px;
	background-color: transparent;
	transition: all 0.2s;

	display: grid;
	place-items: center;

	& > svg {
		height: 25px;
		width: 25px;
	}

	&:hover {
		background-color: black;
	}

	&[datatype="leave"] {
		background-color: #c30000;
		color: white;
	}
`

export const MicrophoneStatusStyle = styled.div<{ $isEnabled: boolean }>`
	position: absolute;
	bottom: 15px;
	right: 15px;
	z-index: 4;

	& * {
		position: relative;
		z-index: 5;
	}

	&::before {
		content: "";
		/* display: ${props => (props.$isEnabled ? "none" : "block")}; */
		position: absolute;
		right: -4px;
		bottom: 0px;
		height: 30px;
		width: 30px;
		/* background-color: rgba(10, 10, 10, 0.3); */
		background-color: ${props => (props.$isEnabled ? "transparent" : "rgba(10, 10, 10, 0.3)")};
		/* background-color: red; */
		border-radius: 50%;
		z-index: 4;
	}
`

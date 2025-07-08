import styled from "styled-components"

export const Call = styled.div<{ $isVisibleChat }>`
	display: grid;
	${({ $isVisibleChat }) => $isVisibleChat && "grid-template-columns: 3fr 1fr;"}

	background-color: rgb(43,49,53);
	border-radius: 5px;
`

export const CallSpace = styled.div`
	background-color: black;
	border-radius: 5px;
	display: grid;
	grid-template-rows: auto 90px;
`

export const Videos = styled.div`
	display: grid;
	margin: 10px;
	grid-template-columns: repeat(auto-fit, minmax(150px, 250px));
	justify-content: center;
	align-content: center;
	gap: 10px;
`

export const Video = styled.div`
	display: grid;
	grid-column: auto;
	place-items: center;
	position: relative;
	background-color: transparent;
	user-select: none;

	video {
		align-self: center;
		width: 100%;
		height: 100%;
		border-radius: 5px;
		border: 1px solid gray;
		z-index: 2;
		user-select: none;
	}
`

export const Placeholder = styled.div<{ color: string; $isShow: boolean }>`
	position: absolute;
	width: 100%;
	height: 100%;
	z-index: ${props => (props.$isShow ? "3" : "1")};
	border-radius: 5px;
	background-color: ${props => props.color};
	color: black;
	font-weight: 700;
	display: grid;
	place-items: center;
`

export const ActionButtonsStyles = styled.div`
	height: calc(100% - 20px);
	width: calc(4 * 100px);
	border-radius: 10px;
	margin-bottom: 20px;
	background-color: #8080805e;

	display: grid;
	place-items: center;
	justify-self: center;
	justify-content: center;
	grid-auto-flow: column;
	grid-template-columns: repeat(auto-fit, 100px);
`

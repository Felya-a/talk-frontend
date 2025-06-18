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
	grid-template-columns: repeat(auto-fit, minmax(250px, 350px));
	justify-content: center;
`
export const Video = styled.div`
    /* grid-column: span 3; */
	align-self: center;
	aspect-ratio: 16/9;
	background-color: beige;
	outline: 1px red solid; // debug
	
	video {
		width: 100%;
		height: 100%;
	}
`

export const ActionButtons = styled.div`
	
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

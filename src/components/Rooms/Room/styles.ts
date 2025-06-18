import styled from "styled-components"

/*
rgb(154, 174, 188)
rgb(205, 215, 222)
white
*/

export const RoomStyle = styled.div<{ $isCurrentRoom }>`
	font-size: 16px;
	margin-top: 10px;
	padding: 5px 0;

	background-color: rgb(54, 61, 66);
	border-radius: 5px;

	color: ${({$isCurrentRoom}) => $isCurrentRoom ? "rgb(205, 215, 222)" : "rgb(154, 174, 188)"};

	user-select: none;

	&:hover {
		color: white;
		cursor: pointer;
	}
`

export const logoOffset = "35px"
export const RoomName = styled.div`
	height: 30px;
	display: grid;
	grid-template-columns: ${logoOffset} auto;
	align-items: center;

	> svg {
		justify-self: center;
		height: 18px;
		width: 18px;
	}
`

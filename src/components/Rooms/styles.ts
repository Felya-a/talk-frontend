import styled from "styled-components"

export const Rooms = styled.div`
    height: 100%;
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    overflow: auto;
    display: grid;
    grid-template-rows: auto 1fr auto;

    background-color: rgb(43,49,53);
    border-radius: 5px;
`

export const RoomsList = styled.div`
    overflow: auto;
    height: 100%;
    width: 100%;
    max-width: 100%;
    max-height: 100%;

    border-radius: 5px;
`

export const Title = styled.div`
    font-size: 20px;
    font-weight: 500;
`

export const CreateRoom = styled.div`
	margin-top: 10px;
	display: grid;
	place-items: center;

	height: 70px;
	font-size: 20px;
	font-weight: 500;
	border-radius: 10px;
	background-color: rgb(67, 76, 83);

	cursor: pointer;
	user-select: none;
`

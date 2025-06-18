import styled from "styled-components"

export const ActionButton = styled.div`
	user-select: none;
	width: 45px;
	height: 45px;
	cursor: pointer;

	border-radius: 10px;
	background-color: transparent;
    transition: all .2s;

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

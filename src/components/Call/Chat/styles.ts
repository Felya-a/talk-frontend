import styled from "styled-components"

export const ChatStyle = styled.div<{ $isDrag }>`
	display: grid;
	height: 100%;
	overflow-x: hidden;
	overflow-y: auto;
	grid-template-rows: ${props => (props.$isDrag ? "auto 1fr" : "auto 1fr auto")};
	margin-left: 10px;
`

export const ChatTitle = styled.div`
	font-weight: 500;
	font-size: 20px;
	margin-bottom: 20px;
`

export const Messages = styled.div`
	position: relative;
	height: 100%;

	& > div {
		position: absolute;
		overflow: auto;
		height: 100%;
		width: 100%;
		display: grid;
		grid-auto-flow: row;
		align-content: start;
		gap: 10px;
		padding: 0 5px 5px 0;

		// Стилизация скролла для Firefox
		scrollbar-width: thin; /* auto | thin | none */
		scrollbar-color: rgba(200, 200, 200, 0.4) transparent;

		&::-webkit-scrollbar {
			width: 8px;
			height: 8px;
		}

		&::-webkit-scrollbar-track {
			background: transparent;
		}

		&::-webkit-scrollbar-thumb {
			background-color: rgba(200, 200, 200, 0.4);
			border-radius: 4px;
		}
	}
`
export const MessageStyle = styled.div`
	display: grid;
	${props => props.theme.$isSelf && "justify-items: end;"}
`

export const MessageClientName = styled.div`
	font-weight: 500;
	text-wrap: nowrap;
	margin-bottom: 5px;
`
export const MessageContentStyle = styled.div<{ $hasImage }>`
	padding: 10px;
	background-color: grey;
	border-radius: ${props => (props.theme.$isSelf ? "10px 0px 10px 10px" : "0px 10px 10px 10px")};
	${props => !props.$hasImage && "height: min-content;width: min-content;"}
`
export const MessageImage = styled.div``
export const MessageText = styled.div`
	height: min-content;
	width: min-content;
`

export const InputBlock = styled.div`
	display: grid;
	grid-auto-flow: column;
	grid-template-columns: 5fr 1fr;
	align-items: center;
	margin-bottom: 20px;
	gap: 10px;
`
export const InputStyle = styled.div`
	input {
		height: 40px;
		width: 100%;
		font-size: 14px;
		background-color: transparent;
		color: white;
		border: 1px solid rgb(67, 76, 83);
		border-radius: 5px;
		padding: 3px 5px;
	}
	input:focus {
		border-color: white;
	}
`
export const SendButton = styled.div`
	height: 100%;
	width: 100%;
	cursor: pointer;
	display: grid;
	place-items: center;
`

export const DragWindow = styled.div`
	height: 100%;
	width: 100%;
	border: 5px dashed white;
	border-radius: 10px;
	font-size: 25px;
	font-weight: 500;
	display: grid;
	place-items: center;
	text-align: center;
`

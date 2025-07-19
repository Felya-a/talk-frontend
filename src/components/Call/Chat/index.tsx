import SendRoundedIcon from "@mui/icons-material/SendRounded"
import { observer } from "mobx-react-lite"
import { useEffect, useRef, useState } from "react"
import { callManager } from "../CallManager"
import {
	ChatStyle,
	ChatTitle,
	DragWindow,
	InputBlock,
	InputStyle,
	MessageClientName,
	MessageContentStyle,
	MessageImage,
	Messages,
	MessageStyle,
	MessageText,
	SendButton
} from "./styles"
import ModalImage from "react-modal-image"
import { sessionStore } from "../../../store"
import { ThemeProvider } from "styled-components"

interface ChatProps {
	onClickSendChatMessage: (text: string, image: ArrayBuffer) => void
}

const Chat = observer((props: ChatProps) => {
	const [messageText, setMessageText] = useState("")
	const [isDragMode, setDragMode] = useState(false)
	const {
		chatManager: { messages }
	} = callManager
	const messagesBlockRef = useRef(null)

	function onClickSend() {
		const textForSend = messageText
		setMessageText("")
		props.onClickSendChatMessage(textForSend, null)
	}

	function onDrop(event) {
		event.preventDefault()
		event.stopPropagation()
		setDragMode(false)
		const files = event.dataTransfer.files
		if (files.length === 0) {
			return
		}

		const file = files[0]
		const allowedTypes = ["image/jpeg", "image/png"]

		if (!allowedTypes.includes(file.type)) {
			// setError("Можно загружать только JPG или PNG файлы.")
			console.error("такой тип файла не подходит")
			return
		}

		console.log("Dropped file:", file)

		const reader = new FileReader()
		reader.onload = () => {
			const arrayBuffer = reader.result as ArrayBuffer
			setMessageText("")
			props.onClickSendChatMessage(messageText, arrayBuffer)
		}
		reader.readAsArrayBuffer(file)
	}

	function onDragOver(event) {
		event.preventDefault()
		event.stopPropagation()
	}

	useEffect(() => {
		// Прокрутка скролла вниз при появлении нового сообщения
		const el = messagesBlockRef.current
		if (el) {
			el.scrollTop = el.scrollHeight
		}
	}, [messages.length])

	return (
		<ChatStyle
			onDragEnter={() => setDragMode(true)}
			onDragLeave={() => setDragMode(false)}
			onDragOver={onDragOver}
			onDrop={onDrop}
			$isDrag={isDragMode}
		>
			<ChatTitle>Чат</ChatTitle>
			{isDragMode ? (
				<DragWindow>Бросьте сюда файл</DragWindow>
			) : (
				<>
					<Messages>
						<div ref={messagesBlockRef}>
							{messages.map((message, index) => (
								<ThemeProvider key={index} theme={{ $isSelf: message.clientId === sessionStore.myUuid }}>
									<MessageStyle>
										{/* Если предыдущее сообщение от этого-то же пользователя, то ник не пишем */}
										{messages[index - 1]?.clientId !== message.clientId && (
											<MessageClientName>{message.clientId.slice(0, 10)}</MessageClientName>
										)}
										<MessageContentStyle $hasImage={!!message.image}>
											{message.image && (
												<MessageImage>
													<ModalImage
														small={arrayBufferToImageSrc(message.image)}
														large={arrayBufferToImageSrc(message.image)}
														alt=""
													/>
												</MessageImage>
											)}
											{message.text && <MessageText>{message.text}</MessageText>}
										</MessageContentStyle>
									</MessageStyle>
								</ThemeProvider>
							))}
						</div>
					</Messages>
					<InputBlock>
						<InputStyle>
							<input
								placeholder="Сообщение"
								value={messageText}
								onChange={event => setMessageText(event.target.value)}
								onKeyDown={event => event.code === "Enter" && onClickSend()}
							/>
							{/* <input type="file" onChange={onFileUpload} /> */}
						</InputStyle>
						<SendButton onClick={onClickSend}>
							<SendRoundedIcon />
						</SendButton>
					</InputBlock>
				</>
			)}
		</ChatStyle>
	)
})

export default Chat

function arrayBufferToImageSrc(buffer: ArrayBuffer): string {
	const blob = new Blob([buffer], { type: "image/png" }) // или image/jpeg
	return URL.createObjectURL(blob)
}
// const img = document.createElement("img")
// img.src = arrayBufferToImageSrc(message.data.image)
// document.body.appendChild(img) // или вставь в чат

import SendRoundedIcon from "@mui/icons-material/SendRounded"
import { observer } from "mobx-react-lite"
import { useState } from "react"
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

interface ChatProps {
	onClickSendChatMessage: (text: string, image: ArrayBuffer) => void
}

const Chat = observer((props: ChatProps) => {
	const [messageText, setMessageText] = useState("")
	const [isDragMode, setDragMode] = useState(false)
	const {
		chatManager: { messages }
	} = callManager

	function onClickSend() {
		const textForSend = messageText
		setMessageText("")
		props.onClickSendChatMessage(textForSend, null)
	}

	// function onFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
	// 	const file = event.target?.files?.[0]
	// 	if (!file) {
	// 		console.debug("файла нет")
	// 		return
	// 	}

	// 	event.target.value = "" // Очистка input

	// 	const reader = new FileReader()
	// 	reader.onload = () => {
	// 		const arrayBuffer = reader.result as ArrayBuffer
	// 		console.log(arrayBuffer)
	// 		// console.log(new Uint8Array(arrayBuffer))
	// 		props.onClickSendChatMessage("", arrayBuffer)
	// 	}
	// 	reader.readAsArrayBuffer(file)
	// }

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
						{messages.map((message, index, array) => (
							<MessageStyle key={index}>
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
											{/* <ModalImage
											small={"https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"}
											large={"https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"}
											alt=""
										/> */}
											{/* <img src={arrayBufferToImageSrc(message.image)} alt="" /> */}
										</MessageImage>
									)}
									{message.text && <MessageText>{message.text}</MessageText>}
								</MessageContentStyle>
							</MessageStyle>
						))}
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

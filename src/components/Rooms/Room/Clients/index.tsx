import { observer } from "mobx-react-lite"
import { ClientsList, Avatar, ClientStyle, ClientName } from "./styles"
import { Client, sessionStore } from "../../../../store"

interface ClientsProps {
	clients: Client[]
}

export default observer(({ clients }: ClientsProps) => {
	if (!clients?.length) {
		return null
	}

	return (
		<ClientsList>
			{clients.map((client, index) => (
				<ClientStyle key={index}>
					<Avatar />
					<ClientName $itsMe={client.uuid === sessionStore.myUuid}>{client.nickname}</ClientName>
				</ClientStyle>
			))}
		</ClientsList>
	)
})

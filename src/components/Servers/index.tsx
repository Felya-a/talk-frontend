import { observer } from "mobx-react-lite"
import { Servers, ServersList, Title } from "./styles"
import { sessionStore } from "../../store"

export default observer(() => {
    return (
        <Servers>
            <Title>Серверы</Title>
            <ServersList>
                {/* {sessionStore.servers.map((room, index) => (
                    <>Server</>
                ))} */}
            </ServersList>
        </Servers>
    )
})
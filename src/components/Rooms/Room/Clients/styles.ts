import styled from "styled-components"
import { logoOffset } from "../styles"

export const ClientsList = styled.div`
    padding-bottom: 5px;
`

export const ClientStyle = styled.div`
    margin-top: 5px;

    display: grid;
    grid-template-columns: 15px auto;
    gap: 5px;
    align-content: center;

    padding: 0 0 0px ${logoOffset};
`

export const Avatar = styled.div`
    align-self: center;

    width: 10px;
    height: 10px;

    border-radius: 50%;
    background-color: green;
`

export const ClientName = styled.div<{$itsMe}>`
    font-weight: ${props => props.$itsMe ? "700" : "400"};
`

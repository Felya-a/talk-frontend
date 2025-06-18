import styled from "styled-components"

export const Layout = styled.div`
    height: 100%;
    width: 100%;
    max-height: 100%;
    max-width: 100%;
    padding: 5px;

    display: grid;
    /* grid-template-columns: minmax(100px, 12%) minmax(280px, 18%) auto; */
    grid-template-columns: minmax(280px, 18%) auto;
    gap: 5px;

    & > * {
        /* border: 1px solid red; */
        /* height: 100%; */
        padding: 10px;
    }
`
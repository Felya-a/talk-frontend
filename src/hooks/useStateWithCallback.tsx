import { useState, useCallback, useRef, useEffect } from "react"

const useStateWithCallback = (initialState: any) => {
	const [state, setState] = useState(initialState)
	const cbRef = useRef(null)

	const updateState = useCallback((newState: any, cb: any) => {
		cbRef.current = cb

		setState(prev => (typeof newState === "function" ? newState(prev) : newState))
	}, [])

	useEffect(() => {
		if (cbRef.current) {
			cbRef.current(state)
			cbRef.current = null
		}
	}, [state])

	return [state, updateState]
}

export default useStateWithCallback

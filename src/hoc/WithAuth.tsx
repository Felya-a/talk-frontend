import { useEffect, useState } from "react"
import { authStore } from "../store"
import { observer } from "mobx-react-lite"

const redirectUrl = `${window.location.origin}/callback`

// Функция проверки токена
// function getToken() {
// 	const cookies = document.cookie.split(";")
// 	console.log("cookies", cookies)
// 	for (let cookie of cookies) {
// 		const [key, value] = cookie.trim().split("=")
// 		if (key === "access_token") {
// 			return value
// 		}
// 	}
// 	return null
// }

// Компонент авторизации
function WithAuth({ children }) {

	useEffect(() => {
		// ;(async function () {
		// 	const params = new URLSearchParams(new URL(window.location.href).search)
		// 	const authorizationCode = params.get("authorization_code")

		// 	if (authorizationCode) {
		// 		const talkServerUrl = new URL(process.env.REACT_APP_TALK_SERVER_URL+"/auth")
		// 		talkServerUrl.searchParams.set("authorization_code", authorizationCode)
		// 		console.log({talkServerUrl})
		// 		try {
		// 			const response = await axios.get(talkServerUrl.toString())
		// 		} catch (error) {
					
		// 		}
		// 	}

		// 	if (!(await checkAuth())) {
		// 		// Перенаправление на форму авторизации SSO
		// 		const ssoClientUrl = new URL(SSO_CONFIG.clientUrl)
		// 		ssoClientUrl.searchParams.set("redirect_url", encodeURIComponent(SSO_CONFIG.redirectUrl))

		// 		console.log({ ssoClientUrl: ssoClientUrl.toString() })
		// 		setIsAuth(false)
		// 		// window.location.href = ssoClientUrl.toString()
		// 	} else {
		// 		console.log("Токен найден")
		// 		setIsAuth(true)
		// 	}
		// })()

		authStore.auth()
	}, [])

	if (authStore.isAuth == null) {
		return <>Процесс Авторизации</>
	}

	if (authStore.isAuth === false) {
		return <>Требуется авторизация</>
	}

	return <>{children}</>
}

export default observer(WithAuth)

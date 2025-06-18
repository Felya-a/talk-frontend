import axios from "axios"
import { makeAutoObservable } from "mobx"

interface SuccessResponseDto<T> {
	status:  string     
	message: string     
	data:    T 
}

interface AuthResponseDto {
	redirect_url: string
	user: {
		user_id: number
		email: string
	}
}

interface User {
	userId: number
	email: string
}

class AuthStore {
	isAuth: boolean
	user: User

    constructor() {
		makeAutoObservable(this)

		this.user = {} as any
	}

	async auth() {
		try {
			const response = await axios.get<SuccessResponseDto<AuthResponseDto>>(process.env.REACT_APP_SERVER_HTTP_URL + "/api/v1/auth", {
				withCredentials: true,
				params: new URLSearchParams(window.location.search)
			})

			await new Promise(res => setTimeout(res, 500)) // DEBUG ONLY

			if (response.data.data.redirect_url !== "") {
				document.location.href = response.data.data.redirect_url
			}

			if (!response.data.data.user) {
				// ошибка
				throw new Error("нет данных пользователя")
			}

			const {user_id, email} = response.data.data.user

			this.user.userId = user_id
			this.user.email = email

			this.isAuth = true
		} catch (error) {
			console.error(error)
			clearQueryString()
		}
	}
}

function clearQueryString() {
	document.location.href = document.location.origin
}

export const authStore = new AuthStore()
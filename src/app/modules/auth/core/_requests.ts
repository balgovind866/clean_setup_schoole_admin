import { AuthModel, UserModel } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

export const GET_USER_BY_ACCESSTOKEN_URL = `${API_URL}/verify_token`
export const LOGIN_URL = `${API_URL}/login`
export const REGISTER_URL = `${API_URL}/register`
export const REQUEST_PASSWORD_URL = `${API_URL}/forgot_password`

// Server should return AuthModel
export function login(email: string, password: string) {
  return new Promise<{ data: AuthModel }>((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          api_token: 'dummy_token',
          refreshToken: 'dummy_refresh_token',
        } as AuthModel
      })
    }, 1000)
  })
}

// Server should return AuthModel
export function register(
  email: string,
  firstname: string,
  lastname: string,
  password: string,
  password_confirmation: string
) {
  // Mock registration or throw error since we are removing it
  return new Promise((_, reject) => {
    reject(new Error("Registration is disabled"))
  })
}

// Server should return object => { result: boolean } (Is Email in DB)
export function requestPassword(email: string) {
  return new Promise((_, reject) => {
    reject(new Error("Forgot Password is disabled"))
  })
}

export function getUserByToken(token: string) {
  return new Promise<{ data: UserModel }>((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          id: 1,
          username: 'admin',
          email: 'admin@demo.com',
          first_name: 'Admin',
          last_name: 'User',
          fullname: 'Admin User',
          pic: './assets/media/avatars/300-1.jpg',
          roles: [1],
          occupation: 'Manager',
          companyName: 'Keenthemes',
          phone: '1234567890',
          address: {
            addressLine: '123 St',
            city: 'City',
            state: 'State',
            postCode: '12345'
          },
          website: 'https://keenthemes.com',
          socialNetworks: {
            linkedIn: 'https://linkedin.com/admin',
            facebook: 'https://facebook.com/admin',
            twitter: 'https://twitter.com/admin',
            instagram: 'https://instagram.com/admin'
          }
        } as UserModel
      })
    }, 500)
  })
}

import { AuthModel, UserModel } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

export const GET_USER_BY_ACCESSTOKEN_URL = `${API_URL}/verify_token`
export const LOGIN_URL = `${API_URL}/login`
export const REGISTER_URL = `${API_URL}/register`
export const REQUEST_PASSWORD_URL = `${API_URL}/forgot_password`

// Server should return AuthModel
export function login(email: string, password: string, role: string = 'schooladmin') {
  return new Promise<{ data: AuthModel }>((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          api_token: role === 'superadmin' ? 'super_admin_token' : 'school_admin_token',
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
      const isSuperAdmin = token === 'super_admin_token'
      resolve({
        data: {
          id: isSuperAdmin ? 1 : 2,
          username: isSuperAdmin ? 'superadmin' : 'schooladmin',
          email: isSuperAdmin ? 'admin@eduadmin.com' : 'admin@dps001.edu.in',
          first_name: isSuperAdmin ? 'Super' : 'School',
          last_name: 'Admin',
          fullname: isSuperAdmin ? 'Super Admin' : 'School Admin',
          pic: './assets/media/avatars/300-1.jpg',
          role: isSuperAdmin ? 'superadmin' : 'schooladmin',
          roles: [isSuperAdmin ? 1 : 2],
          occupation: isSuperAdmin ? 'System Admin' : 'Principal',
          companyName: isSuperAdmin ? 'EduAdmin Group' : 'Delhi Public School',
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

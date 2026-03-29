export interface AuthModel {
  api_token: string
  refreshToken?: string
}

export interface UserAddressModel {
  addressLine: string
  city: string
  state: string
  postCode: string
}

export interface UserCommunicationModel {
  email: boolean
  sms: boolean
  phone: boolean
}

export interface UserEmailSettingsModel {
  emailNotification?: boolean
  sendCopyToPersonalEmail?: boolean
  activityRelatesEmail?: {
    youHaveNewNotifications?: boolean
    youAreSentADirectMessage?: boolean
    someoneAddsYouAsAsAConnection?: boolean
    uponNewOrder?: boolean
    newMembershipApproval?: boolean
    memberRegistration?: boolean
  }
  updatesFromKeenthemes?: {
    newsAboutKeenthemesProductsAndFeatureUpdates?: boolean
    tipsOnGettingMoreOutOfKeen?: boolean
    thingsYouMissedSindeYouLastLoggedIntoKeen?: boolean
    newsAboutPartnerProductsAndOtherServices?: boolean
    tipsOnStartBusinessProducts?: boolean
  }
}

export interface UserSocialNetworksModel {
  linkedIn: string
  facebook: string
  twitter: string
  instagram: string
}

export interface UserModel {
  id: number
  name: string
  email: string
  role: 'super_admin' | 'admin' | string
  school_name?: string
  username?: string
  password?: string
  first_name?: string
  last_name?: string
  fullname?: string
  occupation?: string
  companyName?: string
  phone?: string
  roles?: Array<number>
  pic?: string
  language?: 'en' | 'de' | 'es' | 'fr' | 'ja' | 'zh' | 'ru'
  timeZone?: string
  website?: string
  emailSettings?: UserEmailSettingsModel
  auth?: AuthModel
  communication?: UserCommunicationModel
  address?: UserAddressModel
  socialNetworks?: UserSocialNetworksModel
}

export interface SchoolModel {
  id: number
  code: string
  name: string
  subdomain: string
  db_host?: string
  db_port?: number
  db_username?: string
  db_password?: string
  schema?: string
  database?: string
  app_url?: string
  is_active: boolean
  setup_completed: boolean
  createdAt?: string
  principalName?: string
  phone?: string
  email?: string
  address?: string
}

export interface SchoolCreationData {
  code: string
  name: string
  subdomain: string
  db_host: string
  db_port: number
  db_username: string
  db_password: string
  address: string
  phone: string
  email: string
}

export interface SchoolResponse {
  success: boolean
  message: string
  data: {
    school: SchoolModel
  }
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user?: UserModel
    admin?: UserModel
  }
}

export interface SchoolsListResponse {
  success: boolean
  message: string
  data: {
    schools: SchoolModel[]
  }
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface ProfessionModel {
  id: number
  name: string
  description?: string
  category: "teaching" | "administrative" | "support" | "technical" | "other" | string
  is_active: boolean
  created_by?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface ProfessionCreationData {
  name: string
  description?: string
  category: string
  is_active?: boolean
}

export interface ProfessionResponse {
  success: boolean
  message: string
  data: {
    profession?: ProfessionModel
  }
}

export interface ProfessionsListResponse {
  success: boolean
  message: string
  data: {
    professions: ProfessionModel[]
  }
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

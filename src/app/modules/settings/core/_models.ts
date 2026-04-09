export interface EnabledModules {
    exams: boolean;
    fees: boolean;
    notices: boolean;
    assignments: boolean;
    timetable: boolean;
    attendance: boolean;
}

export interface AppSettingsResponseData {
    id: number;
    primary_color: string;
    secondary_color: string;
    app_logo_url: string | null;
    app_banner_url: string | null;
    enabled_modules: EnabledModules;
    is_active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetAppSettingsResponse {
    success: boolean;
    data: AppSettingsResponseData;
}

export interface UpdateAppSettingsPayload {
    primary_color: string;
    secondary_color: string;
    enabled_modules: EnabledModules;
}

export interface UpdateAppSettingsResponse {
    success: boolean;
    message: string;
    data: AppSettingsResponseData;
}

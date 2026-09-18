export interface UserSettingsResponse {
  id: number;
  email: string;
  displayName: string;
  cycleStartDay: number;
  currency: string;
  timezone: string;
}

export interface UpdateUserSettingsRequest {
  cycleStartDay?: number;
  displayName?: string;
}

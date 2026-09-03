import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface AuthenticationSettings {
  id: string;
  company_id: string;
  otp_enabled: boolean;
  email_otp_enabled: boolean;
  sms_otp_enabled: boolean;
  google_location_enabled: boolean;
  location_provider: 'MANUAL' | 'GOOGLE';
  email_delivery_configured: boolean;
  sms_delivery_configured: boolean;
  development_mode: boolean;
  updated_at: string;
}

export type AuthenticationSettingsPayload = Pick<
  AuthenticationSettings,
  'otp_enabled' | 'email_otp_enabled' | 'sms_otp_enabled'
  | 'google_location_enabled'
  | 'location_provider'
>;

interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class AuthenticationSettingsService {
  private readonly endpoint = `${environment.apiUrl}/authentication-settings`;

  constructor(private readonly http: HttpClient) {}

  get(): Observable<ApiResponse<AuthenticationSettings>> {
    return this.http.get<ApiResponse<AuthenticationSettings>>(this.endpoint);
  }

  update(
    payload: AuthenticationSettingsPayload
  ): Observable<ApiResponse<AuthenticationSettings>> {
    return this.http.patch<ApiResponse<AuthenticationSettings>>(this.endpoint, payload);
  }

  getLocationPreference(): Observable<ApiResponse<Pick<AuthenticationSettings, 'location_provider'>>> {
    return this.http.get<ApiResponse<Pick<AuthenticationSettings, 'location_provider'>>>(
      `${this.endpoint}/location`
    );
  }
}

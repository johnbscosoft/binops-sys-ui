import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TwoFactorChallenge {
  requires_two_factor: true;
  challenge_id: string;
  masked_email: string;
  masked_phone: string | null;
  delivery_channels: Array<'email' | 'sms' | 'development'>;
  expires_in_seconds: number;
  resend_available_in_seconds: number;
  development_otp?: string | null;
}

export interface PendingTwoFactorChallenge extends TwoFactorChallenge {
  email: string;
  return_url: string;
}

export type LoginResult = TokenPair | TwoFactorChallenge;

export interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly authUrl = `${environment.apiUrl}/auth`;

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<ApiResponse<LoginResult>> {
    return this.http.post<ApiResponse<LoginResult>>(`${this.authUrl}/login`, { email, password });
  }

  verifyTwoFactor(challengeId: string, otp: string): Observable<ApiResponse<TokenPair>> {
    return this.http.post<ApiResponse<TokenPair>>(`${this.authUrl}/2fa/verify`, {
      challenge_id: challengeId,
      otp
    });
  }

  resendTwoFactor(challengeId: string): Observable<ApiResponse<TwoFactorChallenge>> {
    return this.http.post<ApiResponse<TwoFactorChallenge>>(`${this.authUrl}/2fa/resend`, {
      challenge_id: challengeId
    });
  }

  forgotPassword(email: string): Observable<ApiResponse<{ token?: string }>> {
    return this.http.post<ApiResponse<{ token?: string }>>(
      `${this.authUrl}/forgot-password`,
      { email }
    );
  }
}

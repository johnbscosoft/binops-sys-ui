import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface UserRole {
  id: string;
  name: string;
  description: string | null;
}

export interface ApiUser {
  id: string;
  company_id: string;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  roles: UserRole[];
}

export interface CompanyReference {
  id: string;
  company_code: string;
  name: string;
}

export interface UserCreatePayload {
  company_code: string;
  email: string;
  password: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  avatar_url: string | null;
}

export type UserUpdatePayload = Omit<UserCreatePayload, 'company_code' | 'password'>;

interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly endpoint = `${environment.apiUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  getAllUsers(): Observable<ApiResponse<ApiUser>> {
    return this.http.get<ApiResponse<ApiUser>>(this.endpoint);
  }

  currentUser(): Observable<ApiResponse<ApiUser>> {
    return this.http.get<ApiResponse<ApiUser>>(`${this.endpoint}/me`);
  }

  getCompany(companyId: string): Observable<ApiResponse<CompanyReference>> {
    return this.http.get<ApiResponse<CompanyReference>>(`${environment.apiUrl}/companies/${companyId}`);
  }

  listCompanies(): Observable<ApiResponse<CompanyReference>> {
    return this.http.get<ApiResponse<CompanyReference>>(`${environment.apiUrl}/companies`);
  }

  create(payload: UserCreatePayload): Observable<ApiResponse<ApiUser>> {
    return this.http.post<ApiResponse<ApiUser>>(this.endpoint, payload);
  }

  update(userId: string, payload: UserUpdatePayload): Observable<ApiResponse<ApiUser>> {
    return this.http.patch<ApiResponse<ApiUser>>(`${this.endpoint}/${userId}`, payload);
  }

  updateStatus(userId: string, isActive: boolean): Observable<ApiResponse<ApiUser>> {
    return this.http.patch<ApiResponse<ApiUser>>(`${this.endpoint}/${userId}/status`, {
      is_active: isActive
    });
  }

  delete(userId: string): Observable<ApiResponse<never>> {
    return this.http.delete<ApiResponse<never>>(`${this.endpoint}/${userId}`);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Company {
  id: string;
  company_code: string;
  name: string;
  email: string;
  contact_person: string;
  phone_number: string;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

export type CompanyPayload = Pick<
  Company,
  'name' | 'email' | 'contact_person' | 'phone_number' | 'logo'
>;

interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class CompanySettingsService {
  private readonly endpoint = `${environment.apiUrl}/companies`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ApiResponse<Company>> {
    return this.http.get<ApiResponse<Company>>(this.endpoint);
  }

  create(payload: CompanyPayload): Observable<ApiResponse<Company>> {
    return this.http.post<ApiResponse<Company>>(this.endpoint, payload);
  }

  update(companyId: string, payload: CompanyPayload): Observable<ApiResponse<Company>> {
    return this.http.patch<ApiResponse<Company>>(`${this.endpoint}/${companyId}`, payload);
  }

  delete(companyId: string): Observable<ApiResponse<never>> {
    return this.http.delete<ApiResponse<never>>(`${this.endpoint}/${companyId}`);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface CustomerContract {
  id: string;
  contract_code: string;
  company_id: string;
  customer_id: number;
  subscription_plan_id: string;
  customer_code: string;
  customer_name: string;
  plan_duration: string;
  pickup_frequency: string;
  agreed_amount: number;
  start_date: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
}

export interface ContractPayload {
  customer_id: number;
  start_date: string;
}

interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly endpoint = `${environment.apiUrl}/contracts`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ApiResponse<CustomerContract>> {
    return this.http.get<ApiResponse<CustomerContract>>(this.endpoint);
  }

  create(payload: ContractPayload): Observable<ApiResponse<CustomerContract>> {
    return this.http.post<ApiResponse<CustomerContract>>(this.endpoint, payload);
  }

  pdf(contractId: string): Observable<Blob> {
    return this.http.get(`${this.endpoint}/${contractId}/pdf`, {
      params: { v: Date.now().toString() },
      responseType: 'blob'
    });
  }

  delete(contractId: string): Observable<ApiResponse<never>> {
    return this.http.delete<ApiResponse<never>>(`${this.endpoint}/${contractId}`);
  }
}

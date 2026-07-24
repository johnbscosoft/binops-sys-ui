import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ApiCustomer {
  id: number;
  name: string;
  phone_no: string;
  email: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  flat_no: string | null;
  house_no: string | null;
  subscription_plan_id: string | null;
  status: 'Active' | 'Inactive';
}

export type CustomerPayload = Omit<ApiCustomer, 'id' | 'subscription_plan_id'> & {
  subscription_plan_id: string;
};

interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly endpoint = `${environment.apiUrl}/customers`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ApiResponse<ApiCustomer>> {
    return this.http.get<ApiResponse<ApiCustomer>>(this.endpoint);
  }

  create(payload: CustomerPayload): Observable<ApiResponse<ApiCustomer>> {
    return this.http.post<ApiResponse<ApiCustomer>>(this.endpoint, payload);
  }

  update(customerId: number, payload: CustomerPayload): Observable<ApiResponse<ApiCustomer>> {
    return this.http.put<ApiResponse<ApiCustomer>>(`${this.endpoint}/${customerId}`, payload);
  }

  delete(customerId: number): Observable<ApiResponse<never>> {
    return this.http.delete<ApiResponse<never>>(`${this.endpoint}/${customerId}`);
  }
}

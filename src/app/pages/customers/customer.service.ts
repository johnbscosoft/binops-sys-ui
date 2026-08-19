import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ApiCustomer {
  id: number;
  name: string;
  phone_no: string | null;
  email: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  number_of_bags: number;
  notes: string | null;
  customer_type: 'STANDARD' | 'PROPERTY' | 'OCCUPANT';
  agreed_price: number | null;
  property_id: string | null;
  property_name: string | null;
  property_type: 'APARTMENT' | 'RENTAL' | null;
  property_billing_mode: 'OWNER' | 'TENANT' | null;
  property_unit_id: string | null;
  occupancy_start_date: string | null;
  client_category_id: string | null;
  subscription_plan_id: string | null;
  service_arrangement: 'LANDLORD' | 'DIRECT_TENANT' | null;
  room_pricing_mode: 'SHARED' | 'PER_ROOM' | null;
  caretaker_name: string | null;
  caretaker_phone: string | null;
  property_customer_id: number | null;
  room_id: string | null;
  room_number: string | null;
  rooms: ApiCustomerRoom[];
  status: 'Active' | 'Inactive';
  date_entered: string;
  date_updated: string | null;
}

export interface ApiCustomerRoom {
  id: string | null;
  occupant_customer_id: number | null;
  room_number: string;
  occupancy_status: 'Occupied' | 'Vacant';
  occupant_name: string | null;
  phone_number: string | null;
  email: string | null;
  subscription_plan_id: string | null;
  price: number | null;
  number_of_bags: number;
  uses_default_pricing: boolean;
  account_status: 'Active' | 'Inactive';
}

export type CustomerPayload = Omit<ApiCustomer,
  | 'id'
  | 'customer_type'
  | 'agreed_price'
  | 'property_name'
  | 'property_type'
  | 'property_billing_mode'
  | 'property_customer_id'
  | 'room_id'
  | 'room_number'
  | 'client_category_id'
  | 'subscription_plan_id'
  | 'date_entered'
  | 'date_updated'
  | 'rooms'> & {
  client_category_id: string;
  subscription_plan_id: string | null;
  agreed_price: number | null;
  property_id: string | null;
  property_unit_id: string | null;
  occupancy_start_date: string | null;
  rooms: ApiCustomerRoom[];
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

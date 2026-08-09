import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type PropertyType = 'APARTMENT' | 'RENTAL';
export type PropertyBillingMode = 'OWNER' | 'TENANT';

export interface PropertyUnit {
  id: string | null;
  property_id?: string;
  room_number: string;
  is_active: boolean;
  occupancy_status: 'Occupied' | 'Vacant';
  is_available?: boolean;
  occupant_customer_id?: number | null;
  occupant_name?: string | null;
}

export interface PropertyRecord {
  id: string;
  property_code: string;
  name: string;
  property_type: PropertyType;
  billing_mode: PropertyBillingMode;
  owner_customer_id: number | null;
  owner_name: string | null;
  owner_phone_number: string | null;
  owner_email: string | null;
  subscription_plan_id: string | null;
  location: string | null;
  status: 'Active' | 'Inactive';
  unit_count: number;
  occupied_unit_count: number;
  units: PropertyUnit[];
  created_at: string;
  updated_at: string;
}

export interface PropertyPayload {
  name: string;
  property_type: PropertyType;
  billing_mode: PropertyBillingMode;
  owner_customer_id: number | null;
  owner_name: string | null;
  owner_phone_number: string | null;
  owner_email: string | null;
  subscription_plan_id: string | null;
  location: string;
  status: 'Active' | 'Inactive';
  units: Array<Pick<PropertyUnit, 'id' | 'room_number' | 'is_active' | 'occupancy_status'>>;
}

interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private readonly endpoint = `${environment.apiUrl}/properties`;

  constructor(private readonly http: HttpClient) {}

  list(activeOnly = false): Observable<ApiResponse<PropertyRecord>> {
    return this.http.get<ApiResponse<PropertyRecord>>(this.endpoint, {
      params: activeOnly ? { active_only: true } : {}
    });
  }

  listUnits(
    propertyId: string,
    availableOnly = false,
    includeCustomerId?: number
  ): Observable<ApiResponse<PropertyUnit>> {
    const params: Record<string, string | boolean | number> = {};
    if (availableOnly) params['available_only'] = true;
    if (includeCustomerId) params['include_customer_id'] = includeCustomerId;
    return this.http.get<ApiResponse<PropertyUnit>>(`${this.endpoint}/${propertyId}/units`, { params });
  }

  create(payload: PropertyPayload): Observable<ApiResponse<PropertyRecord>> {
    return this.http.post<ApiResponse<PropertyRecord>>(this.endpoint, payload);
  }

  update(propertyId: string, payload: PropertyPayload): Observable<ApiResponse<PropertyRecord>> {
    return this.http.put<ApiResponse<PropertyRecord>>(`${this.endpoint}/${propertyId}`, payload);
  }

  delete(propertyId: string): Observable<ApiResponse<never>> {
    return this.http.delete<ApiResponse<never>>(`${this.endpoint}/${propertyId}`);
  }
}

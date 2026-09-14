import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Vehicle { id: string; plate_number: string; model: string; chassis_number: string | null; vehicle_type: string | null; purchase_date: string | null; third_party_insurance_expiry: string | null; truck_photo_name: string | null; truck_photo_data: string | null; logbook_name: string | null; logbook_data: string | null; driver_id: string | null; driver_name: string | null; status: 'Active' | 'Inactive'; created_at: string; }
export type VehiclePayload = Pick<Vehicle, 'plate_number' | 'model' | 'chassis_number' | 'vehicle_type' | 'purchase_date' | 'third_party_insurance_expiry' | 'truck_photo_name' | 'truck_photo_data' | 'logbook_name' | 'logbook_data' | 'driver_id' | 'status'>;
interface ApiResponse<T> { status: boolean; message: string; data: T; }
@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly endpoint = `${environment.apiUrl}/vehicles`;
  constructor(private readonly http: HttpClient) {}
  list(): Observable<ApiResponse<Vehicle[]>> { return this.http.get<ApiResponse<Vehicle[]>>(this.endpoint); }
  create(payload: VehiclePayload): Observable<ApiResponse<Vehicle>> { return this.http.post<ApiResponse<Vehicle>>(this.endpoint, payload); }
  update(id: string, payload: VehiclePayload): Observable<ApiResponse<Vehicle>> { return this.http.put<ApiResponse<Vehicle>>(`${this.endpoint}/${id}`, payload); }
  delete(id: string): Observable<ApiResponse<unknown>> { return this.http.delete<ApiResponse<unknown>>(`${this.endpoint}/${id}`); }
}

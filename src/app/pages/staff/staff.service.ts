import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Designation = string;
export interface Staff { id: string; first_name: string; last_name: string; employment_date: string | null; designation: Designation; phone_number: string | null; residence: string | null; permit_number: string | null; permit_expiry_date: string | null; date_of_birth: string | null; gender: 'Male' | 'Female' | 'Other' | null; attachment_name: string | null; attachment_data: string | null; status: 'Active' | 'Inactive'; created_at: string; }
export type StaffPayload = Omit<Staff, 'id' | 'created_at'>;
interface ApiResponse<T> { status: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly endpoint = `${environment.apiUrl}/staff`;
  constructor(private readonly http: HttpClient) {}
  list(): Observable<ApiResponse<Staff[]>> { return this.http.get<ApiResponse<Staff[]>>(this.endpoint); }
  listDrivers(): Observable<ApiResponse<Staff[]>> { return this.http.get<ApiResponse<Staff[]>>(`${this.endpoint}/drivers`); }
  create(payload: StaffPayload): Observable<ApiResponse<Staff>> { return this.http.post<ApiResponse<Staff>>(this.endpoint, payload); }
  update(id: string, payload: StaffPayload): Observable<ApiResponse<Staff>> { return this.http.put<ApiResponse<Staff>>(`${this.endpoint}/${id}`, payload); }
  delete(id: string): Observable<ApiResponse<unknown>> { return this.http.delete<ApiResponse<unknown>>(`${this.endpoint}/${id}`); }
}

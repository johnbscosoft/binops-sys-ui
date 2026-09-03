import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type CollectionStatus = 'Active' | 'Inactive';

export interface CollectionArea {
  id: string;
  company_id: string;
  area_code: string;
  name: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  service_model: 'DIRECT' | 'SUBCONTRACT';
  contracting_organisation_id: string | null;
  status: CollectionStatus;
  created_at: string;
  updated_at: string;
}

export interface CollectionRoute {
  id: string;
  company_id: string;
  area_id: string;
  area_code: string;
  area_name: string | null;
  name: string;
  vehicle_id: string | null;
  vehicle_plate?: string | null;
  status: CollectionStatus;
  created_at: string;
  updated_at: string;
}

export type CollectionAreaPayload = Omit<Pick<CollectionArea, 'area_code' | 'name' | 'description' | 'location' | 'latitude' | 'longitude' | 'place_id' | 'service_model' | 'contracting_organisation_id' | 'status'>, 'area_code'> & { area_code: string | null };
export type CollectionRoutePayload = Pick<CollectionRoute, 'area_id' | 'area_code' | 'name' | 'vehicle_id' | 'status'>;
export interface ContractingOrganisation { id: string; name: string; commission_type: 'PERCENTAGE_OF_LUMP_SUM' | 'PERCENTAGE_PER_COLLECTION' | 'FIXED_AMOUNT_OF_LUMP_SUM' | 'FIXED_AMOUNT_PER_COLLECTION'; commission_rate: number; contract_start_date: string | null; contract_end_date: string | null; }
export type ContractingOrganisationPayload = Omit<ContractingOrganisation, 'id'>;

interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly endpoint = `${environment.apiUrl}/collection`;

  constructor(private readonly http: HttpClient) {}

  listAreas(): Observable<ApiResponse<CollectionArea[]>> {
    return this.http.get<ApiResponse<CollectionArea[]>>(`${this.endpoint}/areas`);
  }

  createArea(payload: CollectionAreaPayload): Observable<ApiResponse<CollectionArea[]>> {
    return this.http.post<ApiResponse<CollectionArea[]>>(`${this.endpoint}/areas`, payload);
  }

  updateArea(id: string, payload: CollectionAreaPayload): Observable<ApiResponse<CollectionArea[]>> {
    return this.http.put<ApiResponse<CollectionArea[]>>(`${this.endpoint}/areas/${id}`, payload);
  }

  deleteArea(id: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.endpoint}/areas/${id}`);
  }
  listContractingOrganisations(): Observable<ApiResponse<ContractingOrganisation[]>> { return this.http.get<ApiResponse<ContractingOrganisation[]>>(`${this.endpoint}/contracting-organisations`); }
  createContractingOrganisation(payload: ContractingOrganisationPayload): Observable<ApiResponse<ContractingOrganisation[]>> { return this.http.post<ApiResponse<ContractingOrganisation[]>>(`${this.endpoint}/contracting-organisations`, payload); }

  listRoutes(): Observable<ApiResponse<CollectionRoute[]>> {
    return this.http.get<ApiResponse<CollectionRoute[]>>(`${this.endpoint}/routes`);
  }

  createRoute(payload: CollectionRoutePayload): Observable<ApiResponse<CollectionRoute>> {
    return this.http.post<ApiResponse<CollectionRoute>>(`${this.endpoint}/routes`, payload);
  }

  updateRoute(id: string, payload: CollectionRoutePayload): Observable<ApiResponse<CollectionRoute>> {
    return this.http.put<ApiResponse<CollectionRoute>>(`${this.endpoint}/routes/${id}`, payload);
  }

  deleteRoute(id: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.endpoint}/routes/${id}`);
  }
}

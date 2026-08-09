import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ClientCategory {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ClientCategoryPayload = Pick<ClientCategory, 'name' | 'is_active'>;

interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class ClientCategoryService {
  private readonly endpoint = `${environment.apiUrl}/client-categories`;

  constructor(private readonly http: HttpClient) {}

  list(activeOnly = false): Observable<ApiResponse<ClientCategory>> {
    return this.http.get<ApiResponse<ClientCategory>>(this.endpoint, {
      params: activeOnly ? { active_only: true } : {}
    });
  }

  create(payload: ClientCategoryPayload): Observable<ApiResponse<ClientCategory>> {
    return this.http.post<ApiResponse<ClientCategory>>(this.endpoint, payload);
  }

  update(
    categoryId: string,
    payload: Partial<ClientCategoryPayload>
  ): Observable<ApiResponse<ClientCategory>> {
    return this.http.patch<ApiResponse<ClientCategory>>(
      `${this.endpoint}/${categoryId}`,
      payload
    );
  }

  delete(categoryId: string): Observable<ApiResponse<never>> {
    return this.http.delete<ApiResponse<never>>(`${this.endpoint}/${categoryId}`);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface SubscriptionPlan {
  id: string;
  duration: string;
  pickup_frequency: string;
  amount: number;
  notes: string | null;
  is_custom: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionPlanPayload = Pick<
  SubscriptionPlan,
  'duration' | 'pickup_frequency' | 'amount' | 'notes' | 'is_custom' | 'is_active'
>;

interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class SubscriptionPlanService {
  private readonly endpoint = `${environment.apiUrl}/subscription-plans`;

  constructor(private readonly http: HttpClient) {}

  list(activeOnly = false): Observable<ApiResponse<SubscriptionPlan>> {
    return this.http.get<ApiResponse<SubscriptionPlan>>(this.endpoint, {
      params: activeOnly ? { active_only: true } : {}
    });
  }

  create(payload: SubscriptionPlanPayload): Observable<ApiResponse<SubscriptionPlan>> {
    return this.http.post<ApiResponse<SubscriptionPlan>>(this.endpoint, payload);
  }

  update(
    planId: string,
    payload: Partial<SubscriptionPlanPayload>
  ): Observable<ApiResponse<SubscriptionPlan>> {
    return this.http.patch<ApiResponse<SubscriptionPlan>>(`${this.endpoint}/${planId}`, payload);
  }

  delete(planId: string): Observable<ApiResponse<never>> {
    return this.http.delete<ApiResponse<never>>(`${this.endpoint}/${planId}`);
  }
}

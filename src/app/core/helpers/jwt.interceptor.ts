import { HttpClient, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, finalize, switchMap, take, throwError } from 'rxjs';

import { ApiResponse, TokenPair } from '../../account/auth/auth-api.service';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private readonly refreshedAccessToken = new BehaviorSubject<string | null>(null);

  constructor(
    private readonly http: HttpClient,
    private readonly tokenStorage: TokenStorageService,
    private readonly router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isAuthRequest = request.url.startsWith(`${environment.apiUrl}/auth/`);
    const accessToken = this.tokenStorage.getAccessToken();
    const authenticatedRequest = accessToken && !isAuthRequest
      ? this.withBearerToken(request, accessToken)
      : request;

    return next.handle(authenticatedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 401 || isAuthRequest) {
          return throwError(() => error);
        }
        return this.refreshAndRetry(authenticatedRequest, next);
      })
    );
  }

  private refreshAndRetry(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      this.endSession();
      return throwError(() => new Error('Your session has expired. Please sign in again.'));
    }

    if (this.isRefreshing) {
      return this.refreshedAccessToken.pipe(
        filter((token): token is string => Boolean(token)),
        take(1),
        switchMap((token) => next.handle(this.withBearerToken(request, token)))
      );
    }

    this.isRefreshing = true;
    this.refreshedAccessToken.next(null);

    return this.http
      .post<ApiResponse<TokenPair>>(`${environment.apiUrl}/auth/refresh`, {
        refresh_token: refreshToken
      })
      .pipe(
        switchMap((response) => {
          const tokens = response.data[0];
          if (!tokens?.access_token || !tokens?.refresh_token) {
            throw new Error('The server returned an invalid token response.');
          }
          this.tokenStorage.saveTokens(tokens.access_token, tokens.refresh_token);
          this.refreshedAccessToken.next(tokens.access_token);
          return next.handle(this.withBearerToken(request, tokens.access_token));
        }),
        catchError((error) => {
          this.endSession();
          return throwError(() => error);
        }),
        finalize(() => this.isRefreshing = false)
      );
  }

  private withBearerToken(
    request: HttpRequest<unknown>,
    accessToken: string
  ): HttpRequest<unknown> {
    return request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
  }

  private endSession(): void {
    this.tokenStorage.signOut();
    void this.router.navigate(['/auth/signin/basic']);
  }
}

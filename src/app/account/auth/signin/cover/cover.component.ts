import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import {
  AuthApiService,
  PendingTwoFactorChallenge,
  TokenPair,
  TwoFactorChallenge
} from '../../auth-api.service';
import { TokenStorageService } from '../../../../core/services/token-storage.service';

@Component({
    selector: 'app-cover',
    templateUrl: './cover.component.html',
    styleUrls: ['./cover.component.scss'],
    standalone: false
})

/**
 * Cover Component
 */
export class CoverComponent implements OnInit {

  // Login Form
  loginForm!: UntypedFormGroup;
  submitted = false;
  fieldTextType!: boolean;
  error = '';
  isLoading = false;
  returnUrl!: string;
  // set the current year
  year: number = new Date().getFullYear();
  // Carousel navigation arrow show
  showNavigationArrows: any;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authApi: AuthApiService,
    private tokenStorage: TokenStorageService
  ) { }

  ngOnInit(): void {
    /**
     * Form Validatyion
     */
     this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  /**
   * Form submit
   */
   onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }
    this.isLoading = true;
    this.error = '';
    const email = this.f['email'].value.trim();
    this.authApi.login(email, this.f['password'].value).subscribe({
      next: (response) => {
        const result = response.data[0];
        if (this.isTwoFactorChallenge(result)) {
          const pendingChallenge: PendingTwoFactorChallenge = {
            ...result,
            email,
            return_url: this.route.snapshot.queryParams['returnUrl'] || '/'
          };
          sessionStorage.setItem('two_factor_challenge', JSON.stringify(pendingChallenge));
          this.isLoading = false;
          void this.router.navigate(['/auth/twostep/basic']);
          return;
        }
        if (!this.isTokenPair(result)) {
          this.isLoading = false;
          void Swal.fire({
            title: 'Login failed',
            text: 'The server returned an invalid login response.',
            icon: 'error',
            confirmButtonColor: '#f06548'
          });
          return;
        }
        this.tokenStorage.saveTokens(result.access_token, result.refresh_token);
        this.tokenStorage.saveUser({ email, token: result.access_token });
        sessionStorage.setItem('toast', 'true');
        this.isLoading = false;
        void this.router.navigate([this.route.snapshot.queryParams['returnUrl'] || '/']);
      },
      error: (error: Error) => {
        this.isLoading = false;
        void Swal.fire({
          title: 'Login failed',
          text: error.message || 'Check your email and password, then try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  private isTwoFactorChallenge(value: unknown): value is TwoFactorChallenge {
    return Boolean(
      value
      && typeof value === 'object'
      && 'requires_two_factor' in value
      && (value as TwoFactorChallenge).requires_two_factor
    );
  }

  private isTokenPair(value: unknown): value is TokenPair {
    return Boolean(
      value
      && typeof value === 'object'
      && 'access_token' in value
      && 'refresh_token' in value
    );
  }

  /**
   * Password Hide/Show
   */
   toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

}

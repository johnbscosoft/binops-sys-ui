import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import {
  AuthApiService,
  PendingTwoFactorChallenge,
  TwoFactorChallenge
} from '../../auth-api.service';
import { TokenStorageService } from '../../../../core/services/token-storage.service';

@Component({
    selector: 'app-basic',
    templateUrl: './basic.component.html',
    styleUrls: ['./basic.component.scss'],
    standalone: false
})

/**
 * Two Step Basic Component
 */
export class BasicComponent implements OnInit, OnDestroy {

  // set the current year
  year: number = new Date().getFullYear();

  challenge: PendingTwoFactorChallenge | null = null;
  otp = '';
  isVerifying = false;
  isResending = false;
  expiresRemaining = 0;
  resendRemaining = 0;
  private countdown?: ReturnType<typeof setInterval>;

  constructor(
    private readonly router: Router,
    private readonly authApi: AuthApiService,
    private readonly tokenStorage: TokenStorageService
  ) { }

  ngOnInit(): void {
    const savedChallenge = sessionStorage.getItem('two_factor_challenge');
    if (!savedChallenge) {
      void this.returnToSignIn('Your verification session was not found. Please sign in again.');
      return;
    }
    try {
      this.challenge = JSON.parse(savedChallenge) as PendingTwoFactorChallenge;
      this.expiresRemaining = this.challenge.expires_in_seconds;
      this.resendRemaining = this.challenge.resend_available_in_seconds;
      this.startCountdown();
      if (this.challenge.development_otp) {
        void Swal.fire({
          title: 'Development verification code',
          text: `Use ${this.challenge.development_otp}. Configure SMTP and Twilio before production.`,
          icon: 'info',
          confirmButtonColor: '#405189'
        });
      }
    } catch {
      sessionStorage.removeItem('two_factor_challenge');
      void this.returnToSignIn('Your verification session is invalid. Please sign in again.');
    }
  }

  ngOnDestroy(): void {
    if (this.countdown) {
      clearInterval(this.countdown);
    }
  }

   /**
   * Confirm Otp Verification
   */
    config = {
      allowNumbersOnly: true,
      length: 6,
      isPasswordInput: false,
      disableAutoFocus: false,
      placeholder: '',
      inputStyles: {
        'width': '52px',
        'height': '50px'
      }
    };

  onOtpChange(value: string): void {
    this.otp = value;
  }

  confirmOtp(): void {
    if (!this.challenge || this.otp.length !== 6 || this.isVerifying) {
      return;
    }
    if (this.expiresRemaining <= 0) {
      void Swal.fire({
        title: 'Code expired',
        text: 'Request a new verification code to continue.',
        icon: 'warning',
        confirmButtonColor: '#405189'
      });
      return;
    }

    this.isVerifying = true;
    this.authApi.verifyTwoFactor(this.challenge.challenge_id, this.otp).subscribe({
      next: (response) => {
        const tokens = response.data[0];
        this.isVerifying = false;
        if (!tokens?.access_token || !tokens?.refresh_token || !this.challenge) {
          void Swal.fire({
            title: 'Verification failed',
            text: 'The server returned an invalid verification response.',
            icon: 'error',
            confirmButtonColor: '#f06548'
          });
          return;
        }
        const destination = this.challenge.return_url || '/';
        this.tokenStorage.saveTokens(tokens.access_token, tokens.refresh_token);
        this.tokenStorage.saveUser({
          email: this.challenge.email,
          token: tokens.access_token
        });
        sessionStorage.removeItem('two_factor_challenge');
        sessionStorage.setItem('toast', 'true');
        void Swal.fire({
          title: 'Identity verified',
          text: 'Two-factor verification was successful.',
          icon: 'success',
          timer: 1200,
          showConfirmButton: false
        }).then(() => this.router.navigate([destination]));
      },
      error: (error: Error) => {
        this.isVerifying = false;
        this.otp = '';
        void Swal.fire({
          title: 'Verification failed',
          text: error.message || 'The verification code is incorrect or expired.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  resendOtp(): void {
    if (!this.challenge || this.resendRemaining > 0 || this.isResending) {
      return;
    }
    this.isResending = true;
    this.authApi.resendTwoFactor(this.challenge.challenge_id).subscribe({
      next: (response) => {
        this.isResending = false;
        const refreshed = response.data[0];
        if (!refreshed || !this.challenge) {
          return;
        }
        this.updateChallenge(refreshed);
        this.otp = '';
        const text = refreshed.development_otp
          ? `A new development code was created: ${refreshed.development_otp}`
          : 'A new code was sent to your available email and phone channels.';
        void Swal.fire({
          title: 'Code resent',
          text,
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: (error: Error) => {
        this.isResending = false;
        void Swal.fire({
          title: 'Unable to resend code',
          text: error.message || 'Please wait and try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  cancelVerification(): void {
    sessionStorage.removeItem('two_factor_challenge');
    void this.router.navigate(['/auth/signin/basic']);
  }

  get deliveryDescription(): string {
    if (!this.challenge) {
      return '';
    }
    const destinations: string[] = [];
    if (this.challenge.delivery_channels.includes('email')) {
      destinations.push(this.challenge.masked_email);
    }
    if (this.challenge.delivery_channels.includes('sms') && this.challenge.masked_phone) {
      destinations.push(this.challenge.masked_phone);
    }
    if (this.challenge.delivery_channels.includes('development')) {
      destinations.push('the development console');
    }
    return destinations.join(' and ');
  }

  formatSeconds(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }

  private startCountdown(): void {
    this.countdown = setInterval(() => {
      this.expiresRemaining = Math.max(0, this.expiresRemaining - 1);
      this.resendRemaining = Math.max(0, this.resendRemaining - 1);
    }, 1000);
  }

  private updateChallenge(challenge: TwoFactorChallenge): void {
    if (!this.challenge) {
      return;
    }
    this.challenge = { ...this.challenge, ...challenge };
    this.expiresRemaining = challenge.expires_in_seconds;
    this.resendRemaining = challenge.resend_available_in_seconds;
    sessionStorage.setItem('two_factor_challenge', JSON.stringify(this.challenge));
  }

  private async returnToSignIn(message: string): Promise<void> {
    await Swal.fire({
      title: 'Sign in required',
      text: message,
      icon: 'warning',
      confirmButtonColor: '#405189'
    });
    await this.router.navigate(['/auth/signin/basic']);
  }
}

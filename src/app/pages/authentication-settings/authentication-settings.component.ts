import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';

import {
  AuthenticationSettings,
  AuthenticationSettingsPayload,
  AuthenticationSettingsService
} from './authentication-settings.service';

@Component({
  selector: 'app-authentication-settings',
  templateUrl: './authentication-settings.component.html',
  styleUrls: ['./authentication-settings.component.scss'],
  standalone: false
})
export class AuthenticationSettingsComponent implements OnInit {
  breadCrumbItems: Array<{}> = [
    { label: 'Administration' },
    { label: 'Authentication Settings', active: true }
  ];
  settings: AuthenticationSettings | null = null;
  form: AuthenticationSettingsPayload = {
    otp_enabled: true,
    email_otp_enabled: true,
    sms_otp_enabled: true
  };
  isLoading = true;
  isSaving = false;
  private originallyEnabled = true;

  constructor(private readonly settingsService: AuthenticationSettingsService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.settingsService.get().subscribe({
      next: (response) => {
        const settings = response.data[0];
        this.settings = settings;
        this.form = {
          otp_enabled: settings.otp_enabled,
          email_otp_enabled: settings.email_otp_enabled,
          sms_otp_enabled: settings.sms_otp_enabled
        };
        this.originallyEnabled = settings.otp_enabled;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        void Swal.fire({
          title: 'Unable to load authentication settings',
          text: 'Authentication settings could not be loaded. Please try again.',
          icon: 'error',
          showCancelButton: true,
          confirmButtonText: 'Retry',
          cancelButtonText: 'Close',
          confirmButtonColor: '#405189',
          cancelButtonColor: '#74788d'
        }).then((result) => {
          if (result.isConfirmed) {
            this.loadSettings();
          }
        });
      }
    });
  }

  async saveSettings(): Promise<void> {
    if (
      this.form.otp_enabled
      && !this.form.email_otp_enabled
      && !this.form.sms_otp_enabled
    ) {
      await Swal.fire({
        title: 'Select a delivery channel',
        text: 'Enable email OTP, SMS OTP, or both before enabling two-factor authentication.',
        icon: 'warning',
        confirmButtonColor: '#405189'
      });
      return;
    }

    if (this.originallyEnabled && !this.form.otp_enabled) {
      const confirmation = await Swal.fire({
        title: 'Disable OTP authentication?',
        text: 'Users will sign in with only their email and password. This reduces account security.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, disable OTP',
        cancelButtonText: 'Keep OTP enabled',
        confirmButtonColor: '#f06548',
        cancelButtonColor: '#405189',
        reverseButtons: true,
        focusCancel: true
      });
      if (!confirmation.isConfirmed) {
        this.form.otp_enabled = true;
        return;
      }
    }

    this.isSaving = true;
    this.settingsService.update(this.form).subscribe({
      next: (response) => {
        this.settings = response.data[0];
        this.originallyEnabled = this.form.otp_enabled;
        this.isSaving = false;
        void Swal.fire({
          title: 'Authentication settings updated',
          text: this.form.otp_enabled
            ? 'OTP authentication is enabled and will apply to the next login.'
            : 'OTP authentication is disabled. Users will sign in with their password only.',
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: (error: Error) => {
        this.isSaving = false;
        void Swal.fire({
          title: 'Update failed',
          text: error.message || 'Authentication settings could not be updated.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  get selectedChannels(): string {
    const channels: string[] = [];
    if (this.form.email_otp_enabled) {
      channels.push('Email');
    }
    if (this.form.sms_otp_enabled) {
      channels.push('SMS');
    }
    return channels.join(' and ') || 'No channel selected';
  }
}

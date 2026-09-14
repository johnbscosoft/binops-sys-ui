import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Company, CompanySettingsService } from '../company-settings/company-settings.service';
import { InvoiceSettings, InvoiceSettingsService } from './invoice-settings.service';

@Component({ selector: 'app-invoice-settings', templateUrl: './invoice-settings.component.html', styleUrls: ['./invoice-settings.component.scss'], standalone: false })
export class InvoiceSettingsComponent implements OnInit {
  activeTab = 1;
  saving = false;
  settings: InvoiceSettings;
  company: Company | null = null;
  loadingCompany = false;
  companyError = '';
  readonly currencies = ['UGX', 'USD', 'KES', 'TZS'];
  readonly dueDays = [0, 7, 14, 30, 45, 60];
  constructor(private readonly service: InvoiceSettingsService, private readonly companyService: CompanySettingsService, private readonly router: Router) { this.settings = this.service.getCached(); }
  ngOnInit(): void { this.loadCompany(); this.service.load().subscribe({ next: settings => this.settings = settings, error: () => void Swal.fire('Unable to load invoice settings', 'Invoice settings could not be loaded.', 'error') }); }
  loadCompany(): void {
    this.loadingCompany = true;
    this.companyError = '';
    this.companyService.list().subscribe({
      next: response => { this.company = response.data[0] ?? null; this.loadingCompany = false; },
      error: () => { this.companyError = 'Company information could not be loaded.'; this.loadingCompany = false; }
    });
  }
  openCompanySettings(): void { void this.router.navigate(['/administration/company-settings']); }
  save(): void {
    this.saving = true;
    this.settings.invoicePrefix = this.settings.invoicePrefix.trim().toUpperCase() || 'INV';
    this.settings.dueInDays = Math.max(0, Number(this.settings.dueInDays) || 0);
    this.settings.vatRate = Math.max(0, Number(this.settings.vatRate) || 0);
    this.settings.reminderDaysBefore = Math.max(0, Number(this.settings.reminderDaysBefore) || 0);
    this.settings.reminderDaysAfter = Math.max(0, Number(this.settings.reminderDaysAfter) || 0);
    this.service.save(this.settings).subscribe({ next: settings => { this.settings = settings; this.saving = false; void Swal.fire({ title: 'Settings saved', text: 'Invoice defaults have been updated.', icon: 'success', confirmButtonColor: '#0ab39c' }); }, error: error => { this.saving = false; void Swal.fire('Settings could not be saved', error.error?.message ?? 'Please try again.', 'error'); } });
  }
}

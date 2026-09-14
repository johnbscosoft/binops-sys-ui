import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Company, CompanySettingsService } from '../company-settings/company-settings.service';
import { DemoInvoice, InvoiceDemoService, InvoiceStatus } from './invoice-demo.service';
import { InvoiceSettings, InvoiceSettingsService } from './invoice-settings.service';

@Component({ selector: 'app-invoice-details', templateUrl: './invoice-details.component.html', standalone: false })
export class InvoiceDetailsComponent implements OnInit {
  invoice?: DemoInvoice; company: Company | null = null; settings: InvoiceSettings; loading = true;
  constructor(private readonly route: ActivatedRoute, private readonly router: Router, private readonly invoices: InvoiceDemoService, private readonly companyService: CompanySettingsService, private readonly settingsService: InvoiceSettingsService) { this.settings = this.settingsService.getCached(); }
  ngOnInit(): void { this.companyService.list().subscribe({ next: response => this.company = response.data[0] ?? null }); this.settingsService.load().subscribe({ next: settings => this.settings = settings }); this.route.paramMap.subscribe(params => { const id = params.get('id'); if (!id) return; this.loading = true; this.invoices.get(id).subscribe({ next: invoice => { this.invoice = invoice; this.loading = false; }, error: () => { this.invoice = undefined; this.loading = false; } }); }); }
  total(): number { return this.invoice ? this.invoices.total(this.invoice) : 0; }
  badge(status: InvoiceStatus): string { return ({ Paid: 'bg-success-subtle text-success', Issued: 'bg-primary-subtle text-primary', Overdue: 'bg-danger-subtle text-danger', Draft: 'bg-secondary-subtle text-secondary', 'Partially Paid': 'bg-info-subtle text-info', Cancelled: 'bg-dark-subtle text-dark' } as Record<string, string>)[status] ?? 'bg-secondary-subtle text-secondary'; }
  back(): void { void this.router.navigate(['/finance/invoices']); }
  print(): void { window.print(); }
  get paymentMethods(): string { const methods = this.settings.paymentMethods; return [methods.cash ? 'Cash' : '', methods.mobileMoney ? 'Mobile Money' : '', methods.bankTransfer ? 'Bank Transfer' : '', methods.cheque ? 'Cheque' : ''].filter(Boolean).join(', '); }
}

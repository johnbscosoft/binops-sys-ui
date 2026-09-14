import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ApiCustomer, CustomerService } from '../customers/customer.service';
import { InvoiceDemoService, InvoiceLine } from './invoice-demo.service';
import { InvoiceSettingsService } from './invoice-settings.service';

@Component({ selector: 'app-invoice-create', templateUrl: './invoice-create.component.html', standalone: false })
export class InvoiceCreateComponent implements OnInit {
  saving = false; loadingCustomers = false; customerId: number | null = null; issueDate = this.today(); dueDate = this.addDays(7); status: 'Draft' | 'Issued' = 'Draft'; notes = ''; currency = 'UGX';
  lines: InvoiceLine[] = [{ description: 'Waste collection service', quantity: 1, unitPrice: 0 }]; customers: ApiCustomer[] = [];
  constructor(private readonly invoices: InvoiceDemoService, private readonly customersService: CustomerService, private readonly settingsService: InvoiceSettingsService, private readonly router: Router) {}
  ngOnInit(): void { this.loadingCustomers = true; this.customersService.list().subscribe({ next: response => { this.customers = response.data.filter(customer => customer.status === 'Active'); this.loadingCustomers = false; }, error: () => { this.loadingCustomers = false; void Swal.fire('Unable to load customers', 'Customers could not be loaded for invoicing.', 'error'); } }); this.settingsService.load().subscribe({ next: settings => { this.currency = settings.currency; this.dueDate = this.addDays(settings.dueInDays); this.notes = settings.defaultNotes; } }); }
  get total(): number { return this.lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0); }
  addLine(): void { this.lines.push({ description: '', quantity: 1, unitPrice: 0 }); }
  removeLine(index: number): void { if (this.lines.length > 1) this.lines.splice(index, 1); }
  save(): void { const linesValid = this.lines.every(line => line.description.trim() && Number(line.quantity) > 0 && Number(line.unitPrice) >= 0); if (!this.customerId || !this.issueDate || !linesValid) { void Swal.fire('Complete required fields', 'Choose a customer and complete every invoice line.', 'warning'); return; } this.saving = true; this.invoices.create({ customer_id: this.customerId, issue_date: this.issueDate, due_date: this.dueDate, status: this.status, notes: this.notes.trim(), lines: this.lines.map(line => ({ description: line.description.trim(), quantity: Number(line.quantity), unit_price: Number(line.unitPrice) })) }).subscribe({ next: record => { this.saving = false; void Swal.fire({ title: 'Invoice created', text: `${record.id} is ready to view or print.`, icon: 'success', confirmButtonColor: '#0ab39c' }).then(() => this.router.navigate(['/finance/invoices', record.id])); }, error: error => { this.saving = false; void Swal.fire('Invoice could not be created', error.error?.message ?? 'Please check the invoice information.', 'error'); } }); }
  cancel(): void { void this.router.navigate(['/finance/invoices']); }
  private today(): string { return new Date().toISOString().slice(0, 10); }
  private addDays(days: number): string { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
}

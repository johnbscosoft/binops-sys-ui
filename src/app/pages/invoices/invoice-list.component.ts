import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { DemoInvoice, InvoiceDemoService, InvoiceStatus } from './invoice-demo.service';

@Component({ selector: 'app-invoice-list', templateUrl: './invoice-list.component.html', standalone: false })
export class InvoiceListComponent implements OnInit {
  search = ''; status = 'All'; loading = false; records: DemoInvoice[] = [];
  readonly statuses: Array<'All' | InvoiceStatus> = ['All', 'Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'];
  constructor(private readonly invoices: InvoiceDemoService, private readonly router: Router) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.loading = true; this.invoices.list().subscribe({ next: records => { this.records = records; this.loading = false; }, error: () => { this.loading = false; void Swal.fire('Unable to load invoices', 'Invoices could not be loaded. Please try again.', 'error'); } }); }
  get filteredRecords(): DemoInvoice[] { const term = this.search.trim().toLowerCase(); return this.records.filter(item => (!term || [item.invoiceNumber, item.customer, item.customerCode].some(value => value.toLowerCase().includes(term))) && (this.status === 'All' || item.status === this.status)); }
  total(item: DemoInvoice): number { return this.invoices.total(item); }
  badge(status: InvoiceStatus): string { return ({ Paid: 'bg-success-subtle text-success', Issued: 'bg-primary-subtle text-primary', Pending: 'bg-warning-subtle text-warning', Overdue: 'bg-danger-subtle text-danger', Draft: 'bg-secondary-subtle text-secondary', 'Partially Paid': 'bg-info-subtle text-info', Cancelled: 'bg-dark-subtle text-dark' } as Record<string, string>)[status] ?? 'bg-secondary-subtle text-secondary'; }
  view(item: DemoInvoice): void { void this.router.navigate(['/finance/invoices', item.id]); }
  create(): void { void this.router.navigate(['/finance/invoices/create']); }
  async generateDrafts(): Promise<void> { const result = await Swal.fire({ title: 'Generate draft invoices', text: 'Enter the billing month for unbilled collections.', input: 'text', inputValue: new Date().toISOString().slice(0, 7), inputPlaceholder: 'YYYY-MM', showCancelButton: true, confirmButtonText: 'Generate drafts', confirmButtonColor: '#0ab39c', inputValidator: value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? undefined : 'Enter a billing month in YYYY-MM format.' }); if (!result.isConfirmed) return; this.invoices.generateDrafts(result.value).subscribe({ next: invoices => { this.load(); void Swal.fire('Draft invoices generated', `${invoices.length} draft invoice(s) were created.`, 'success'); }, error: error => void Swal.fire('Generation failed', error.error?.message ?? 'Draft invoices could not be generated.', 'error') }); }
  async remove(item: DemoInvoice): Promise<void> { if (item.status !== 'Draft') { void Swal.fire('Draft required', 'Only draft invoices can be deleted.', 'info'); return; } const result = await Swal.fire({ title: `Delete ${item.invoiceNumber}?`, text: 'This draft invoice will be permanently removed.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#f06548' }); if (result.isConfirmed) this.invoices.delete(item.id).subscribe({ next: () => { this.load(); void Swal.fire('Deleted', 'Draft invoice deleted.', 'success'); }, error: error => void Swal.fire('Delete failed', error.error?.message ?? 'The invoice could not be deleted.', 'error') }); }
}

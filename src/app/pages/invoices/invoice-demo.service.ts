import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export type InvoiceStatus = 'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
export interface InvoiceLine { description: string; quantity: number; unitPrice: number; amount?: number; }
export interface DemoInvoice { id: string; invoiceNumber: string; customer: string; customerCode: string; customerEmail: string; customerLocation: string; issueDate: string; dueDate: string; status: InvoiceStatus; currency: string; notes?: string; termsAndConditions?: string; paymentInstructions?: string; lines: InvoiceLine[]; subtotal: number; taxAmount: number; totalAmount: number; }
export interface InvoiceCreatePayload { customer_id: number; issue_date: string; due_date: string; status: 'Draft' | 'Issued'; notes?: string; lines: Array<{ description: string; quantity: number; unit_price: number }>; }
interface ApiResponse<T> { status: boolean; status_code: number; message: string; data: T[]; }

@Injectable({ providedIn: 'root' })
export class InvoiceDemoService {
  private readonly endpoint = `${environment.apiUrl}/invoices`;
  constructor(private readonly http: HttpClient) {}
  list(): Observable<DemoInvoice[]> { return this.http.get<ApiResponse<unknown>>(this.endpoint).pipe(map(response => response.data.map(value => this.toInvoice(value as Record<string, unknown>)))); }
  get(id: string): Observable<DemoInvoice> { return this.http.get<ApiResponse<unknown>>(`${this.endpoint}/${id}`).pipe(map(response => this.toInvoice(response.data[0] as Record<string, unknown>))); }
  create(payload: InvoiceCreatePayload): Observable<DemoInvoice> { return this.http.post<ApiResponse<unknown>>(this.endpoint, payload).pipe(map(response => this.toInvoice(response.data[0] as Record<string, unknown>))); }
  generateDrafts(billingMonth: string): Observable<DemoInvoice[]> { return this.http.post<ApiResponse<unknown>>(`${this.endpoint}/generate-drafts`, { billing_month: billingMonth }).pipe(map(response => response.data.map(value => this.toInvoice(value as Record<string, unknown>)))); }
  delete(id: string): Observable<void> { return this.http.delete<ApiResponse<unknown>>(`${this.endpoint}/${id}`).pipe(map(() => void 0)); }
  total(invoice: DemoInvoice): number { return Number(invoice.totalAmount ?? invoice.lines.reduce((total, line) => total + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0)); }
  private toInvoice(raw: Record<string, unknown>): DemoInvoice { const lines = (raw['lines'] as Array<Record<string, unknown>> ?? []).map(line => ({ description: String(line['description'] ?? ''), quantity: Number(line['quantity'] ?? 0), unitPrice: Number(line['unit_price'] ?? 0), amount: Number(line['amount'] ?? 0) })); return { id: String(raw['id']), invoiceNumber: String(raw['invoice_number'] ?? ''), customer: String(raw['customer'] ?? ''), customerCode: String(raw['customer_code'] ?? ''), customerEmail: String(raw['customer_email'] ?? ''), customerLocation: String(raw['customer_location'] ?? ''), issueDate: String(raw['issue_date']), dueDate: String(raw['due_date']), status: raw['status'] as InvoiceStatus, currency: String(raw['currency'] ?? 'UGX'), notes: raw['notes'] as string | undefined, termsAndConditions: raw['terms_and_conditions'] as string | undefined, paymentInstructions: raw['payment_instructions'] as string | undefined, lines, subtotal: Number(raw['subtotal'] ?? 0), taxAmount: Number(raw['tax_amount'] ?? 0), totalAmount: Number(raw['total_amount'] ?? 0) }; }
}

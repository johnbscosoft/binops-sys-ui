import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InvoiceSettings { invoicePrefix: string; currency: string; dueInDays: number; paymentMethods: { cash: boolean; mobileMoney: boolean; bankTransfer: boolean; cheque: boolean }; paymentInstructions: string; termsAndConditions: string; vatEnabled: boolean; vatRate: number; pricesIncludeVat: boolean; defaultNotes: string; remindersEnabled: boolean; reminderDaysBefore: number; reminderDaysAfter: number; }
interface ApiResponse<T> { status: boolean; status_code: number; message: string; data: T[]; }
const DEFAULT_SETTINGS: InvoiceSettings = { invoicePrefix: 'INV', currency: 'UGX', dueInDays: 7, paymentMethods: { cash: true, mobileMoney: true, bankTransfer: true, cheque: false }, paymentInstructions: '', termsAndConditions: '', vatEnabled: false, vatRate: 0, pricesIncludeVat: false, defaultNotes: '', remindersEnabled: true, reminderDaysBefore: 3, reminderDaysAfter: 7 };

@Injectable({ providedIn: 'root' })
export class InvoiceSettingsService {
  private readonly endpoint = `${environment.apiUrl}/invoice-settings`; private cached = this.clone(DEFAULT_SETTINGS);
  constructor(private readonly http: HttpClient) {}
  getCached(): InvoiceSettings { return this.clone(this.cached); }
  load(): Observable<InvoiceSettings> { return this.http.get<ApiResponse<Record<string, unknown>>>(this.endpoint).pipe(map(response => this.fromApi(response.data[0])), tap(settings => this.cached = settings)); }
  save(settings: InvoiceSettings): Observable<InvoiceSettings> { return this.http.patch<ApiResponse<Record<string, unknown>>>(this.endpoint, this.toApi(settings)).pipe(map(response => this.fromApi(response.data[0])), tap(saved => this.cached = saved)); }
  private fromApi(raw: Record<string, unknown> | undefined): InvoiceSettings { const methods = raw?.['payment_methods'] as Record<string, boolean> | undefined; return { invoicePrefix: String(raw?.['invoice_prefix'] ?? 'INV'), currency: String(raw?.['currency'] ?? 'UGX'), dueInDays: Number(raw?.['due_in_days'] ?? 7), paymentMethods: { cash: methods?.['cash'] ?? true, mobileMoney: methods?.['mobile_money'] ?? true, bankTransfer: methods?.['bank_transfer'] ?? true, cheque: methods?.['cheque'] ?? false }, paymentInstructions: String(raw?.['payment_instructions'] ?? ''), termsAndConditions: String(raw?.['terms_and_conditions'] ?? ''), vatEnabled: Boolean(raw?.['vat_enabled']), vatRate: Number(raw?.['vat_rate'] ?? 0), pricesIncludeVat: Boolean(raw?.['prices_include_vat']), defaultNotes: String(raw?.['default_notes'] ?? ''), remindersEnabled: raw?.['reminders_enabled'] !== false, reminderDaysBefore: Number(raw?.['reminder_days_before'] ?? 3), reminderDaysAfter: Number(raw?.['reminder_days_after'] ?? 7) }; }
  private toApi(settings: InvoiceSettings): Record<string, unknown> { return { invoice_prefix: settings.invoicePrefix, currency: settings.currency, due_in_days: settings.dueInDays, payment_methods: { cash: settings.paymentMethods.cash, mobile_money: settings.paymentMethods.mobileMoney, bank_transfer: settings.paymentMethods.bankTransfer, cheque: settings.paymentMethods.cheque }, payment_instructions: settings.paymentInstructions || null, terms_and_conditions: settings.termsAndConditions || null, vat_enabled: settings.vatEnabled, vat_rate: settings.vatRate, prices_include_vat: settings.pricesIncludeVat, default_notes: settings.defaultNotes || null, reminders_enabled: settings.remindersEnabled, reminder_days_before: settings.reminderDaysBefore, reminder_days_after: settings.reminderDaysAfter }; }
  private clone(settings: InvoiceSettings): InvoiceSettings { return JSON.parse(JSON.stringify(settings)) as InvoiceSettings; }
}

import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';
import { Staff, StaffPayload, StaffService } from './staff.service';

@Component({ selector: 'app-staff', templateUrl: './staff.component.html', standalone: false })
export class StaffComponent {
  @ViewChild('staffModal') staffModal!: TemplateRef<unknown>;
  staff: Staff[] = [];
  loading = false;
  editing: Staff | null = null;
  selectedAttachmentName = '';
  form: StaffPayload = this.emptyForm();
  designations: Array<{ id: string; name: string; is_active: boolean }> = [];
  quickDesignationName = '';
  readonly quickAddDesignationValue = '__quick_add_designation__';
  searchTerm = '';
  page = 1;
  pageSize = 10;
  sortColumn: keyof Staff = 'first_name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private readonly service: StaffService, private readonly modal: NgbModal, private readonly offcanvas: NgbOffcanvas, private readonly http: HttpClient) {}
  ngOnInit(): void { this.load(); this.loadDesignations(); }
  get isDriver(): boolean { return this.form.designation === 'DRIVER'; }
  get fullName(): string { return this.editing ? `${this.editing.first_name} ${this.editing.last_name}` : 'New Staff Member'; }

  load(): void { this.loading = true; this.service.list().subscribe({ next: r => { this.staff = r.data; this.page = 1; this.loading = false; }, error: () => { this.loading = false; void Swal.fire('Unable to load staff', 'Staff records could not be loaded.', 'error'); } }); }
  open(item?: Staff): void {
    this.editing = item ?? null;
    this.form = item ? { first_name: item.first_name, last_name: item.last_name, employment_date: item.employment_date, designation: item.designation, phone_number: item.phone_number, residence: item.residence, permit_number: item.permit_number, permit_expiry_date: item.permit_expiry_date, date_of_birth: item.date_of_birth, gender: item.gender, attachment_name: item.attachment_name, attachment_data: item.attachment_data, status: item.status } : this.emptyForm();
    this.selectedAttachmentName = this.form.attachment_name ?? '';
    this.modal.open(this.staffModal, { size: 'lg', centered: true, backdrop: 'static' });
  }
  onDesignationChange(): void { if (!this.isDriver) { this.form.permit_number = null; this.form.permit_expiry_date = null; } }
  loadDesignations(): void { this.http.get<any>(`${environment.apiUrl}/staff-designations`).subscribe({ next: response => this.designations = response.data.filter((item: any) => item.is_active) }); }
  onDesignationSelected(value: string, panel: TemplateRef<unknown>): void { if (value !== this.quickAddDesignationValue) { this.onDesignationChange(); return; } this.form.designation = ''; this.quickDesignationName = ''; this.offcanvas.open(panel, { position: 'end', backdrop: false, panelClass: 'custom-subscription-offcanvas' }); }
  saveQuickDesignation(ref: any): void { const name = this.quickDesignationName.trim(); if (!name) return; this.http.post<any>(`${environment.apiUrl}/staff-designations`, { name, is_active: true }).subscribe({ next: response => { const designation = response.data[0]; this.designations = [...this.designations, designation]; this.form.designation = designation.name; ref.close(); void Swal.fire('Added', 'Designation added successfully.', 'success'); }, error: error => void Swal.fire('Save failed', error?.error?.message ?? 'Designation could not be added.', 'error') }); }
  onAttachment(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { void Swal.fire('Attachment too large', 'Choose a file up to 5 MB.', 'warning'); return; } const reader = new FileReader(); reader.onload = () => { this.form.attachment_data = String(reader.result); this.form.attachment_name = file.name; this.selectedAttachmentName = file.name; }; reader.readAsDataURL(file); }
  save(modal: { close: () => void }): void {
    const payload: StaffPayload = {
      ...this.form,
      first_name: this.form.first_name.trim(),
      last_name: this.form.last_name.trim(),
      employment_date: this.form.employment_date || null,
      phone_number: this.form.phone_number?.trim() || null,
      residence: this.form.residence?.trim() || null,
      permit_number: this.form.permit_number?.trim() || null,
      permit_expiry_date: this.form.permit_expiry_date || null,
      date_of_birth: this.form.date_of_birth || null,
    };
    const request = this.editing ? this.service.update(this.editing.id, payload) : this.service.create(payload);
    request.subscribe({ next: () => { modal.close(); this.load(); void Swal.fire('Saved', 'Staff member saved successfully.', 'success'); }, error: e => void Swal.fire('Save failed', e?.error?.message ?? 'The staff record could not be saved.', 'error') });
  }
  async remove(item: Staff): Promise<void> { const result = await Swal.fire({ title: `Delete ${item.first_name}?`, text: 'This staff record will be permanently removed.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#f06548' }); if (result.isConfirmed) this.service.delete(item.id).subscribe({ next: () => { this.load(); void Swal.fire('Deleted', 'Staff member deleted.', 'success'); }, error: e => void Swal.fire('Delete failed', e?.error?.message ?? 'The record could not be deleted.', 'error') }); }
  get filteredStaff(): Staff[] {
    const query = this.searchTerm.trim().toLowerCase();
    const result = !query ? [...this.staff] : this.staff.filter(item => [item.first_name, item.last_name, item.designation, item.phone_number, item.residence, item.permit_number, item.status].some(value => String(value ?? '').toLowerCase().includes(query)));
    return result.sort((left, right) => this.compare(left[this.sortColumn], right[this.sortColumn]));
  }
  get paginatedStaff(): Staff[] { const start = (this.page - 1) * this.pageSize; return this.filteredStaff.slice(start, start + this.pageSize); }
  get firstVisibleStaff(): number { return this.filteredStaff.length ? (this.page - 1) * this.pageSize + 1 : 0; }
  get lastVisibleStaff(): number { return Math.min(this.page * this.pageSize, this.filteredStaff.length); }
  searchStaff(): void { this.page = 1; }
  sortBy(column: keyof Staff): void { if (this.sortColumn === column) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; else { this.sortColumn = column; this.sortDirection = 'asc'; } this.page = 1; }
  sortIcon(column: keyof Staff): string { return this.sortColumn !== column ? 'ri-expand-up-down-line' : this.sortDirection === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'; }
  private compare(left: unknown, right: unknown): number { const first = String(left ?? '').toLowerCase(); const second = String(right ?? '').toLowerCase(); const comparison = first.localeCompare(second, undefined, { numeric: true }); return this.sortDirection === 'asc' ? comparison : -comparison; }
  private emptyForm(): StaffPayload { return { first_name: '', last_name: '', employment_date: null, designation: 'COLLECTOR', phone_number: null, residence: null, permit_number: null, permit_expiry_date: null, date_of_birth: null, gender: null, attachment_name: null, attachment_data: null, status: 'Active' }; }
}

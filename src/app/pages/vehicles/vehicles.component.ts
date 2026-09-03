import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Staff, StaffService } from '../staff/staff.service';
import { Vehicle, VehiclePayload, VehicleService } from './vehicle.service';

@Component({ selector: 'app-vehicles', templateUrl: './vehicles.component.html', standalone: false })
export class VehiclesComponent {
  @ViewChild('vehicleModal') vehicleModal!: TemplateRef<unknown>;
  private vehicleRecords: Vehicle[] = []; drivers: Staff[] = []; loading = false; editing: Vehicle | null = null;
  sortColumn: keyof Vehicle = 'plate_number'; sortDirection: 'asc' | 'desc' = 'asc';
  form: VehiclePayload = this.emptyForm();
  constructor(private readonly service: VehicleService, private readonly staffService: StaffService, private readonly modal: NgbModal) {}
  ngOnInit(): void { this.load(); this.loadDrivers(); }
  load(): void { this.loading = true; this.service.list().subscribe({ next: r => { this.vehicleRecords = r.data; this.loading = false; }, error: () => { this.loading = false; void Swal.fire('Unable to load vehicles', 'Vehicle records could not be loaded.', 'error'); } }); }
  loadDrivers(): void { this.staffService.listDrivers().subscribe({ next: r => this.drivers = r.data, error: () => void Swal.fire('Unable to load drivers', 'Add an active driver in Staff Management, then try again.', 'warning') }); }
  open(item?: Vehicle): void { this.editing = item ?? null; this.form = item ? { plate_number: item.plate_number, model: item.model, driver_id: item.driver_id, status: item.status } : this.emptyForm(); this.modal.open(this.vehicleModal, { centered: true, backdrop: 'static' }); }
  save(modal: { close: () => void }): void { if (!this.form.plate_number.trim() || !this.form.model.trim()) { void Swal.fire('Complete required fields', 'Vehicle number plate and model are required.', 'warning'); return; } const request = this.editing ? this.service.update(this.editing.id, this.form) : this.service.create(this.form); request.subscribe({ next: () => { modal.close(); this.load(); void Swal.fire('Saved', 'Vehicle saved successfully.', 'success'); }, error: e => void Swal.fire('Save failed', e?.error?.message ?? 'The vehicle could not be saved.', 'error') }); }
  async remove(item: Vehicle): Promise<void> { const result = await Swal.fire({ title: `Delete ${item.plate_number}?`, text: 'This vehicle will be permanently removed.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#f06548' }); if (result.isConfirmed) this.service.delete(item.id).subscribe({ next: () => { this.load(); void Swal.fire('Deleted', 'Vehicle deleted.', 'success'); }, error: e => void Swal.fire('Delete failed', e?.error?.message ?? 'The vehicle could not be deleted.', 'error') }); }
  driverLabel = (item: Staff): string => `${item.first_name} ${item.last_name}`;
  get vehicles(): Vehicle[] { return [...this.vehicleRecords].sort((a, b) => { const first = String(a[this.sortColumn] ?? ''); const second = String(b[this.sortColumn] ?? ''); const value = first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' }); return this.sortDirection === 'asc' ? value : -value; }); }
  sortBy(column: keyof Vehicle): void { if (this.sortColumn === column) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; else { this.sortColumn = column; this.sortDirection = 'asc'; } }
  sortIcon(column: keyof Vehicle): string { return this.sortColumn !== column ? 'ri-expand-up-down-line' : this.sortDirection === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'; }
  private emptyForm(): VehiclePayload { return { plate_number: '', model: '', driver_id: null, status: 'Active' }; }
}

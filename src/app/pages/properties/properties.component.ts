import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import { SubscriptionPlan, SubscriptionPlanService } from '../subscriptions/subscription-plan.service';
import {
  PropertyPayload,
  PropertyRecord,
  PropertyService,
  PropertyUnit
} from './property.service';

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss'],
  standalone: false
})
export class PropertiesComponent implements OnInit {
  breadCrumbItems: Array<{}> = [
    { label: 'Customer Management' },
    { label: 'Properties', active: true }
  ];
  properties: PropertyRecord[] = [];
  subscriptionPlans: SubscriptionPlan[] = [];
  propertyForm: PropertyPayload = this.emptyForm();
  editingProperty: PropertyRecord | null = null;
  searchTerm = '';
  isLoading = false;
  isSaving = false;

  constructor(
    private readonly propertyService: PropertyService,
    private readonly subscriptionPlanService: SubscriptionPlanService,
    private readonly modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadProperties();
    this.subscriptionPlanService.list(true).subscribe({
      next: (response) => this.subscriptionPlans = response.data.map((plan) => ({
        ...plan,
        amount: Number(plan.amount)
      }))
    });
  }

  get filteredProperties(): PropertyRecord[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.properties;
    return this.properties.filter((property) => [
      property.property_code,
      property.name,
      property.property_type,
      property.owner_name ?? '',
      property.location ?? ''
    ].some((value) => value.toLowerCase().includes(term)));
  }

  loadProperties(): void {
    this.isLoading = true;
    this.propertyService.list().subscribe({
      next: (response) => {
        this.properties = response.data;
        this.isLoading = false;
      },
      error: (error: Error) => {
        this.isLoading = false;
        void Swal.fire({
          title: 'Unable to load properties',
          text: error.message || 'Properties could not be loaded.',
          icon: 'error',
          confirmButtonColor: '#405189'
        });
      }
    });
  }

  openCreate(content: TemplateRef<unknown>): void {
    this.editingProperty = null;
    this.propertyForm = this.emptyForm();
    this.modalService.open(content, { centered: true, size: 'xl', scrollable: true, backdrop: 'static' });
  }

  openEdit(property: PropertyRecord, content: TemplateRef<unknown>): void {
    this.editingProperty = property;
    this.propertyForm = {
      name: property.name,
      property_type: property.property_type,
      billing_mode: property.billing_mode,
      owner_customer_id: property.owner_customer_id,
      owner_name: property.owner_name,
      owner_phone_number: property.owner_phone_number,
      owner_email: property.owner_email,
      subscription_plan_id: property.subscription_plan_id,
      location: property.location ?? '',
      status: property.status,
      units: property.units.map((unit) => ({
        id: unit.id,
        room_number: unit.room_number,
        is_active: unit.is_active,
        occupancy_status: unit.occupancy_status
      }))
    };
    this.modalService.open(content, { centered: true, size: 'xl', scrollable: true, backdrop: 'static' });
  }

  selectBillingMode(mode: 'OWNER' | 'TENANT'): void {
    this.propertyForm.billing_mode = mode;
    if (mode === 'TENANT') {
      this.propertyForm.owner_customer_id = null;
      this.propertyForm.owner_name = null;
      this.propertyForm.owner_phone_number = null;
      this.propertyForm.owner_email = null;
      this.propertyForm.subscription_plan_id = null;
    }
  }

  addUnit(): void {
    this.propertyForm.units = [
      ...this.propertyForm.units,
      { id: null, room_number: this.nextRoomNumber(), is_active: true, occupancy_status: 'Vacant' }
    ];
  }

  async generateUnits(): Promise<void> {
    const result = await Swal.fire({
      title: 'Generate rooms',
      input: 'number',
      inputLabel: 'Number of rooms to generate',
      inputValue: Math.max(this.propertyForm.units.length, 1),
      inputAttributes: { min: '1', max: '500', step: '1' },
      showCancelButton: true,
      confirmButtonText: 'Generate',
      confirmButtonColor: '#0ab39c',
      inputValidator: (value) => {
        const count = Number(value);
        return Number.isInteger(count) && count > 0 && count <= 500
          ? null
          : 'Enter a whole number between 1 and 500.';
      }
    });
    if (!result.isConfirmed) return;
    const count = Number(result.value);
    const existing = new Set(this.propertyForm.units.map((unit) => unit.room_number.toLowerCase()));
    const generated = Array.from({ length: count }, (_, index) => `Room ${index + 1}`)
      .filter((room) => !existing.has(room.toLowerCase()))
      .map((room_number) => ({
        id: null,
        room_number,
        is_active: true,
        occupancy_status: 'Vacant' as const
      }));
    this.propertyForm.units = [...this.propertyForm.units, ...generated];
  }

  async removeUnit(index: number): Promise<void> {
    const unit = this.propertyForm.units[index];
    if (unit.id) {
      const source = this.editingProperty?.units.find((item) => item.id === unit.id);
      if (source?.occupant_customer_id) {
        await Swal.fire({
          title: 'Room is occupied',
          text: 'Move or deactivate the tenant before removing this room.',
          icon: 'warning',
          confirmButtonColor: '#405189'
        });
        return;
      }
    }
    this.propertyForm.units = this.propertyForm.units.filter((_, unitIndex) => unitIndex !== index);
  }

  toggleUnitOccupancy(unit: PropertyPayload['units'][number], occupied: boolean): void {
    unit.occupancy_status = occupied ? 'Occupied' : 'Vacant';
  }

  saveProperty(): void {
    const units = this.propertyForm.units.map((unit) => ({
      ...unit,
      room_number: unit.room_number.trim()
    }));
    const normalized = units.map((unit) => unit.room_number.toLowerCase());
    if (!this.propertyForm.name.trim() || !this.propertyForm.location.trim() || units.some((unit) => !unit.room_number)) {
      void Swal.fire({ title: 'Check required fields', text: 'Enter the property name, location and every room number.', icon: 'warning' });
      return;
    }
    if (new Set(normalized).size !== normalized.length) {
      void Swal.fire({ title: 'Duplicate room numbers', text: 'Every room number must be unique within the property.', icon: 'warning' });
      return;
    }
    if (this.propertyForm.billing_mode === 'OWNER' && (
      !this.propertyForm.owner_name?.trim() ||
      !/^07\d{8}$/.test(this.propertyForm.owner_phone_number?.trim() ?? '') ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.propertyForm.owner_email?.trim() ?? '') ||
      !this.propertyForm.subscription_plan_id
    )) {
      void Swal.fire({
        title: 'Owner billing details required',
        text: 'Enter a valid owner name, phone number, email and property subscription plan.',
        icon: 'warning',
        confirmButtonColor: '#405189'
      });
      return;
    }

    const payload: PropertyPayload = {
      ...this.propertyForm,
      name: this.propertyForm.name.trim(),
      location: this.propertyForm.location.trim(),
      units
    };
    this.isSaving = true;
    const editing = Boolean(this.editingProperty);
    const request = this.editingProperty
      ? this.propertyService.update(this.editingProperty.id, payload)
      : this.propertyService.create(payload);
    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.modalService.dismissAll();
        this.loadProperties();
        void Swal.fire({
          title: editing ? 'Property updated' : 'Property created',
          text: editing ? 'The property was updated successfully.' : 'The property was created successfully.',
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: (error: Error) => {
        this.isSaving = false;
        void Swal.fire({
          title: editing ? 'Update failed' : 'Creation failed',
          text: error.message || 'The property could not be saved.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  async deleteProperty(property: PropertyRecord): Promise<void> {
    const result = await Swal.fire({
      title: 'Delete property?',
      text: `${property.name} will be permanently deleted. Properties with occupancy history cannot be deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete property',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      reverseButtons: true
    });
    if (!result.isConfirmed) return;
    this.propertyService.delete(property.id).subscribe({
      next: () => {
        this.loadProperties();
        void Swal.fire({ title: 'Property deleted', icon: 'success', confirmButtonColor: '#0ab39c' });
      },
      error: (error: Error) => void Swal.fire({
        title: 'Delete failed',
        text: error.message || 'Deactivate this property if it has occupancy history.',
        icon: 'error',
        confirmButtonColor: '#f06548'
      })
    });
  }

  planLabel(plan: SubscriptionPlan): string {
    return `${plan.duration} — ${plan.pickup_frequency} — UGX ${Number(plan.amount).toLocaleString()}`;
  }

  private nextRoomNumber(): string {
    let number = this.propertyForm.units.length + 1;
    const existing = new Set(this.propertyForm.units.map((unit) => unit.room_number.toLowerCase()));
    while (existing.has(`room ${number}`)) number += 1;
    return `Room ${number}`;
  }

  private emptyForm(): PropertyPayload {
    return {
      name: '',
      property_type: 'APARTMENT',
      billing_mode: 'TENANT',
      owner_customer_id: null,
      owner_name: null,
      owner_phone_number: null,
      owner_email: null,
      subscription_plan_id: null,
      location: '',
      status: 'Active',
      units: []
    };
  }
}

/// <reference types="google.maps" />

import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import {
  SubscriptionPlan,
  SubscriptionPlanService
} from '../subscriptions/subscription-plan.service';
import { ApiCustomer, CustomerPayload, CustomerService } from './customer.service';

interface Client {
  id: number;
  customer_id: string;
  name: string;
  phone_no: string;
  email: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string;
  flat_no: string;
  house_no: string;
  subscription_plan_id: string;
  status: 'Active' | 'Inactive';
}

type ClientForm = Pick<Client, 
'name' | 
'phone_no' | 
'email' | 
'location' | 
'latitude' |
'longitude' |
'place_id' |
'flat_no' | 
'house_no' | 
'subscription_plan_id' |
'status'>;

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
  standalone: false
})
export class CustomersComponent implements OnInit {
  @ViewChild('locationAutocompleteContainer')
  private locationAutocompleteContainer?: ElementRef<HTMLDivElement>;

  breadCrumbItems: Array<{}> = [
    { label: 'Client Management' },
    { label: 'Client', active: true }
  ];

  customers: Client[] = [];
  searchTerm = '';
  page = 1;
  pageSize = 5;
  isLoading = true;
  isSaving = false;
  editingCustomer: Client | null = null;
  selectedCustomer: Client | null = null;
  customerForm: ClientForm = this.emptyForm();
  selectedAttachment: File | null = null;
  attachmentError = '';
  isAttachmentDragActive = false;
  locationError = '';
  subscriptionPlans: SubscriptionPlan[] = [];
  subscriptionPlansLoading = false;
  readonly googleMapsApiKeyConfigured = Boolean(environment.googleMapsApiKey.trim());
  useGoogleLocations = this.googleMapsApiKeyConfigured;

  constructor(  
    private readonly modalService: NgbModal,
    private readonly subscriptionPlanService: SubscriptionPlanService,
    private readonly customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadSubscriptionPlans();
  }

  loadSubscriptionPlans(): void {
    this.subscriptionPlansLoading = true;
    this.subscriptionPlanService.list(true).subscribe({
      next: (response) => {
        this.subscriptionPlans = response.data
          .map((plan) => ({ ...plan, amount: Number(plan.amount) }))
          .sort((first, second) => this.compareSubscriptionPlans(first, second));
        this.subscriptionPlansLoading = false;
      },
      error: () => {
        this.subscriptionPlansLoading = false;
        void this.showRetryAlert(
          'Unable to load subscription plans',
          'Subscription plans could not be loaded. Please try again.',
          () => this.loadSubscriptionPlans()
        );
      }
    });
  }

  subscriptionPlanLabel(plan: SubscriptionPlan): string {
    return `${plan.duration} — ${plan.pickup_frequency} — UGX ${Number(plan.amount).toLocaleString()}`;
  }

  get filteredCustomers(): Client[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.customers;
    }

    return this.customers.filter((customer) =>
      [customer.customer_id, customer.name, customer.phone_no, customer.email, customer.location, customer.status]
        .some((value) => value.toLowerCase().includes(term))
    );
  }

  get paginatedCustomers(): Client[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredCustomers.slice(start, start + this.pageSize);
  }

  get firstVisibleCustomer(): number {
    return this.filteredCustomers.length ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get lastVisibleCustomer(): number {
    return Math.min(this.page * this.pageSize, this.filteredCustomers.length);
  }

  searchCustomers(): void {
    this.page = 1;
  }

  loadCustomers(): void {
    this.isLoading = true;

    this.customerService.list().subscribe({
        next: (response) => {
          this.customers = response.data.map((customer) => this.mapApiCustomer(customer));
          this.page = 1;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          void this.showRetryAlert(
            'Unable to load customers',
            'Customers could not be loaded. Please try again.',
            () => this.loadCustomers()
          );
        }
      });
  }

  openAddCustomer(content: TemplateRef<unknown>): void {
    this.editingCustomer = null;
    this.customerForm = this.emptyForm();
    this.selectedAttachment = null;
    this.attachmentError = '';
    this.isAttachmentDragActive = false;
    this.locationError = '';
    this.useGoogleLocations = this.googleMapsApiKeyConfigured;
    this.openCustomerModal(content);
  }

  openCustomerDetails(content: TemplateRef<unknown>, customer: Client): void {
    this.selectedCustomer = customer;
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  selectedCustomerPlanLabel(customer: Client): string {
    const plan = this.subscriptionPlans.find((item) => item.id === customer.subscription_plan_id);
    return plan ? this.subscriptionPlanLabel(plan) : 'Not available';
  }

  openEditCustomer(content: TemplateRef<unknown>, customer: Client): void {
    this.editingCustomer = customer;
    this.selectedAttachment = null;
    this.attachmentError = '';
    this.isAttachmentDragActive = false;
    this.customerForm = {
      name: customer.name,
      phone_no: customer.phone_no,
      email: customer.email,
      location: customer.location,
      latitude: customer.latitude,
      longitude: customer.longitude,
      place_id: customer.place_id,
      flat_no: customer.flat_no,
      house_no: customer.house_no,
      subscription_plan_id: customer.subscription_plan_id,
      status: customer.status
    };
    this.locationError = '';
    this.useGoogleLocations = this.googleMapsApiKeyConfigured;
    this.openCustomerModal(content);
  }

  private openCustomerModal(content: TemplateRef<unknown>): void {
    const modalRef: NgbModalRef = this.modalService.open(content, { centered: true });
    modalRef.shown.subscribe(() => {
      if (this.useGoogleLocations) {
        void this.initializeLocationAutocomplete();
      }
    });
  }

  private async initializeLocationAutocomplete(): Promise<void> {
    const container = this.locationAutocompleteContainer?.nativeElement;
    if (!container || container.childElementCount) {
      return;
    }

    try {
      await this.loadGoogleMapsScript();
      // The installed Google typings lag behind the new web-component API.
      const placesLibrary = await google.maps.importLibrary('places') as any;
      const autocomplete = new placesLibrary.PlaceAutocompleteElement({
        includedRegionCodes: ['ug']
      });

      autocomplete.style.width = '100%';
      autocomplete.addEventListener('gmp-select', async (event: Event) => {
        const prediction = (event as any).placePrediction;
        const place = prediction.toPlace();
        await place.fetchFields({ fields: ['id', 'formattedAddress', 'location'] });

        this.customerForm.location = place.formattedAddress ?? prediction.text.toString();
        this.customerForm.latitude = place.location?.lat() ?? null;
        this.customerForm.longitude = place.location?.lng() ?? null;
        this.customerForm.place_id = place.id ?? '';
        this.locationError = '';
      });

      container.appendChild(autocomplete);
    } catch {
      this.locationError = 'Google locations could not be loaded. Check the Maps API key and enabled APIs.';
      this.useGoogleLocations = false;
      void Swal.fire({
        title: 'Google locations unavailable',
        text: 'Google locations could not be loaded. You can enter the location manually.',
        icon: 'warning',
        confirmButtonColor: '#405189'
      });
    }
  }

  private loadGoogleMapsScript(): Promise<void> {
    if (typeof google !== 'undefined' && Boolean(google.maps)) {
      return Promise.resolve();
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps-loader]');
    if (existingScript) {
      return new Promise((resolve, reject) => {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Google Maps failed to load.')), { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.dataset['googleMapsLoader'] = 'true';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(environment.googleMapsApiKey)}&loading=async&libraries=places&v=weekly`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Maps failed to load.'));
      document.head.appendChild(script);
    });
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      return;
    }

    this.validateAttachment(file, () => input.value = '');
  }

  onAttachmentDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isAttachmentDragActive = true;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onAttachmentDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isAttachmentDragActive = false;
  }

  onAttachmentDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isAttachmentDragActive = false;

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.validateAttachment(file);
    }
  }

  removeAttachment(input: HTMLInputElement): void {
    this.selectedAttachment = null;
    this.attachmentError = '';
    this.isAttachmentDragActive = false;
    input.value = '';
  }

  private validateAttachment(file: File, clearInput: () => void = () => undefined): void {
    this.attachmentError = '';

    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      this.selectedAttachment = null;
      this.attachmentError = 'Only PDF files are allowed.';
      clearInput();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.selectedAttachment = null;
      this.attachmentError = 'The PDF must not exceed 5 MB.';
      clearInput();
      return;
    }

    this.selectedAttachment = file;
  }

  saveCustomer(): void {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isInvalid =
      this.customerForm.name.trim().length < 2 ||
      !/^07\d{8}$/.test(this.customerForm.phone_no.trim()) ||
      !emailPattern.test(this.customerForm.email.trim()) ||
      !this.customerForm.location.trim() ||
      (this.useGoogleLocations && (
        this.customerForm.latitude === null ||
        this.customerForm.longitude === null ||
        !this.customerForm.place_id
      )) ||
      !this.customerForm.subscription_plan_id.trim() ||
      !this.customerForm.status;

    if (isInvalid || this.attachmentError) {
      return;
    }

    const selectedPlan = this.subscriptionPlans.find(
      (plan) => plan.id === this.customerForm.subscription_plan_id
    );
    if (!selectedPlan) {
      void Swal.fire({
        title: 'Invalid subscription plan',
        text: 'Select a valid subscription plan before saving the customer.',
        icon: 'warning',
        confirmButtonColor: '#405189'
      });
      return;
    }

    const payload: CustomerPayload = {
      name: this.customerForm.name.trim(),
      phone_no: this.customerForm.phone_no.trim(),
      email: this.customerForm.email.trim(),
      location: this.customerForm.location.trim(),
      latitude: this.customerForm.latitude,
      longitude: this.customerForm.longitude,
      place_id: this.customerForm.place_id || null,
      flat_no: this.customerForm.flat_no || null,
      house_no: this.customerForm.house_no || null,
      subscription_plan_id: selectedPlan.id,
      status: this.customerForm.status
    };
    this.isSaving = true;
    const wasEditing = Boolean(this.editingCustomer);
    const request = this.editingCustomer
      ? this.customerService.update(this.editingCustomer.id, payload)
      : this.customerService.create(payload);
    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.modalService.dismissAll();
        this.loadCustomers();
        void Swal.fire({
          title: wasEditing ? 'Customer updated' : 'Customer created',
          text: wasEditing
            ? 'The customer details were updated successfully.'
            : 'The customer was created successfully.',
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: (error: Error) => {
        this.isSaving = false;
        void Swal.fire({
          title: wasEditing ? 'Update failed' : 'Creation failed',
          text: error.message || 'The customer could not be saved. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  async deleteCustomer(customer: Client): Promise<void> {
    const confirmation = await Swal.fire({
      title: 'Delete customer?',
      text: `${customer.name} will be permanently deleted. This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d',
      reverseButtons: true,
      focusCancel: true
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    this.customerService.delete(customer.id).subscribe({
      next: () => {
        this.loadCustomers();
        void Swal.fire({
          title: 'Customer deleted',
          text: `${customer.name} was deleted successfully.`,
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: () => {
        void Swal.fire({
          title: 'Delete failed',
          text: 'The customer could not be deleted. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  async deactivateCustomer(customer: Client): Promise<void> {
    const confirmation = await Swal.fire({
      title: 'Deactivate customer?',
      text: `${customer.name} will no longer be active.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Deactivate',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f7b84b',
      cancelButtonColor: '#74788d',
      reverseButtons: true
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    this.customerService.update(customer.id, this.customerPayload(customer, 'Inactive')).subscribe({
      next: () => {
        this.loadCustomers();
        void Swal.fire({
          title: 'Customer deactivated',
          text: `${customer.name} was deactivated successfully.`,
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: () => {
        void Swal.fire({
          title: 'Deactivation failed',
          text: 'The customer could not be deactivated. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  private customerPayload(customer: Client, status: 'Active' | 'Inactive'): CustomerPayload {
    return {
      name: customer.name,
      phone_no: customer.phone_no,
      email: customer.email,
      location: customer.location,
      latitude: customer.latitude,
      longitude: customer.longitude,
      place_id: customer.place_id || null,
      flat_no: customer.flat_no || null,
      house_no: customer.house_no || null,
      subscription_plan_id: customer.subscription_plan_id,
      status
    };
  }

  private async showRetryAlert(title: string, text: string, retry: () => void): Promise<void> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Retry',
      cancelButtonText: 'Close',
      confirmButtonColor: '#405189',
      cancelButtonColor: '#74788d'
    });
    if (result.isConfirmed) {
      retry();
    }
  }

  private compareSubscriptionPlans(first: SubscriptionPlan, second: SubscriptionPlan): number {
    const durationOrder = ['1 Month', '3 Months', '6 Months'];
    const frequencyOrder = ['Once a Week', 'Twice a Week', 'Thrice a Week'];
    const firstDuration = durationOrder.indexOf(first.duration);
    const secondDuration = durationOrder.indexOf(second.duration);
    const durationComparison = (firstDuration < 0 ? durationOrder.length : firstDuration)
      - (secondDuration < 0 ? durationOrder.length : secondDuration);
    if (durationComparison !== 0) {
      return durationComparison;
    }
    const firstFrequency = frequencyOrder.indexOf(first.pickup_frequency);
    const secondFrequency = frequencyOrder.indexOf(second.pickup_frequency);
    return (firstFrequency < 0 ? frequencyOrder.length : firstFrequency)
      - (secondFrequency < 0 ? frequencyOrder.length : secondFrequency);
  }

  private mapApiCustomer(customer: ApiCustomer): Client {
    return {
      id: customer.id,
      customer_id: `CUST-${String(customer.id).padStart(4, '0')}`,
      name: customer.name,
      phone_no: customer.phone_no,
      email: customer.email,
      location: customer.location,
      latitude: customer.latitude,
      longitude: customer.longitude,
      place_id: customer.place_id ?? '',
      flat_no: customer.flat_no ?? '',
      house_no: customer.house_no ?? '',
      subscription_plan_id: customer.subscription_plan_id ?? '',
      status: customer.status
    };
  }

  private emptyForm(): ClientForm {
    return {
      name: '',
      phone_no: '',
      email: '',
      location: '',
      latitude: null,
      longitude: null,
      place_id: '',
      flat_no: '',
      house_no: '',
      subscription_plan_id: '',
      status: 'Active'
};
  }
}

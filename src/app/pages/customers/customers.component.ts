/// <reference types="google.maps" />

import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import {
  PICKUP_FREQUENCY_OPTIONS,
  SUBSCRIPTION_DURATION_OPTIONS,
  SubscriptionPlan,
  SubscriptionPlanPayload,
  SubscriptionPlanService
} from '../subscriptions/subscription-plan.service';
import {
  ClientCategory,
  ClientCategoryService
} from '../client-categories/client-category.service';
import {
  ApiCustomer,
  ApiCustomerRoom,
  CustomerPayload,
  CustomerService
} from './customer.service';
import {
  PropertyRecord,
  PropertyService,
  PropertyUnit
} from '../properties/property.service';

type ServiceArrangement = 'LANDLORD' | 'DIRECT_TENANT';
type RoomPricingMode = 'SHARED' | 'PER_ROOM';

interface CustomerRoomForm {
  id: string | null;
  occupant_customer_id: number | null;
  room_number: string;
  occupancy_status: 'Occupied' | 'Vacant';
  occupant_name: string;
  phone_number: string;
  email: string;
  subscription_plan_id: string;
  price: number | null;
  number_of_bags: number;
  uses_default_pricing: boolean;
  account_status: 'Active' | 'Inactive';
}

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
  number_of_bags: number;
  notes: string;
  customer_type: 'STANDARD' | 'PROPERTY' | 'OCCUPANT';
  agreed_price: number | null;
  property_id: string;
  property_name: string;
  property_billing_mode: 'OWNER' | 'TENANT' | null;
  property_unit_id: string;
  occupancy_start_date: string;
  client_category_id: string;
  subscription_plan_id: string;
  service_arrangement: ServiceArrangement | null;
  room_pricing_mode: RoomPricingMode | null;
  caretaker_name: string;
  caretaker_phone: string;
  property_customer_id: number | null;
  room_id: string;
  room_number: string;
  rooms: CustomerRoomForm[];
  status: 'Active' | 'Inactive';
  date_added: string;
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
'number_of_bags' |
'notes' |
'property_id' |
'property_unit_id' |
'occupancy_start_date' |
'client_category_id' |
'subscription_plan_id' |
'service_arrangement' |
'room_pricing_mode' |
'caretaker_name' |
'caretaker_phone' |
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
  pageSize = 10;
  isLoading = true;
  isSaving = false;
  customerFormStep: 1 | 2 | 3 = 1;
  readonly customerFormSteps = [
    { number: 1, label: 'Customer Details' },
    { number: 2, label: 'Service & Property' },
    { number: 3, label: 'Documents & Notes' }
  ] as const;
  editingCustomer: Client | null = null;
  selectedCustomer: Client | null = null;
  customerForm: ClientForm = this.emptyForm();
  customerRooms: CustomerRoomForm[] = [];
  selectedAttachment: File | null = null;
  attachmentError = '';
  isAttachmentDragActive = false;
  locationError = '';
  subscriptionPlans: SubscriptionPlan[] = [];
  subscriptionPlansLoading = false;
  customPlanForm: SubscriptionPlanPayload = this.emptyCustomPlanForm();
  isSavingCustomPlan = false;
  isCustomPlanPanelOpen = false;
  readonly customPlanOptionValue = '__add_custom_subscription__';
  readonly customDurationOptions = [...SUBSCRIPTION_DURATION_OPTIONS];
  readonly customPickupFrequencyOptions = [...PICKUP_FREQUENCY_OPTIONS];
  clientCategories: ClientCategory[] = [];
  clientCategoriesLoading = false;
  properties: PropertyRecord[] = [];
  availablePropertyUnits: PropertyUnit[] = [];
  propertiesLoading = false;
  propertyUnitsLoading = false;
  readonly googleMapsApiKeyConfigured = Boolean(environment.googleMapsApiKey.trim());
  useGoogleLocations = this.googleMapsApiKeyConfigured;

  constructor(  
    private readonly modalService: NgbModal,
    private readonly offcanvasService: NgbOffcanvas,
    private readonly subscriptionPlanService: SubscriptionPlanService,
    private readonly clientCategoryService: ClientCategoryService,
    private readonly propertyService: PropertyService,
    private readonly customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadSubscriptionPlans();
    this.loadClientCategories();
    this.loadProperties();
  }

  loadClientCategories(): void {
    this.clientCategoriesLoading = true;
    this.clientCategoryService.list().subscribe({
      next: (response) => {
        this.clientCategories = response.data;
        this.clientCategoriesLoading = false;
      },
      error: () => {
        this.clientCategoriesLoading = false;
        void this.showRetryAlert(
          'Unable to load client categories',
          'Client categories could not be loaded. Please try again.',
          () => this.loadClientCategories()
        );
      }
    });
  }

  clientCategoryName(categoryId: string): string {
    return this.clientCategories.find((category) => category.id === categoryId)?.name
      ?? 'Not available';
  }

  availableClientCategories(): ClientCategory[] {
    return this.clientCategories.filter((category) =>
      category.is_active || category.id === this.customerForm.client_category_id
    );
  }

  get isPropertyCustomer(): boolean {
    return this.selectedPropertyCategoryType !== null;
  }

  private get selectedPropertyCategoryType(): 'APARTMENT' | 'RENTAL' | null {
    const categoryName = this.clientCategoryName(this.customerForm.client_category_id)
      .trim()
      .toLowerCase();
    if (categoryName === 'apartment' || categoryName === 'apartments') return 'APARTMENT';
    if (categoryName === 'rental' || categoryName === 'rentals') return 'RENTAL';
    return null;
  }

  get dealsDirectlyWithTenants(): boolean {
    return this.selectedProperty?.billing_mode === 'TENANT';
  }

  get defaultPlanRequired(): boolean {
    return !this.isPropertyCustomer || this.selectedProperty?.billing_mode === 'TENANT';
  }

  get selectedProperty(): PropertyRecord | null {
    return this.properties.find((property) => property.id === this.customerForm.property_id) ?? null;
  }

  get matchingProperties(): PropertyRecord[] {
    const expectedType = this.selectedPropertyCategoryType;
    if (!expectedType) return [];
    return this.properties.filter((property) =>
      property.status === 'Active' && property.property_type === expectedType
    );
  }

  get occupiedRoomCount(): number {
    return this.customerRooms.filter((room) => room.occupancy_status === 'Occupied').length;
  }

  get vacantRoomCount(): number {
    return this.customerRooms.filter((room) => room.occupancy_status === 'Vacant').length;
  }

  get expectedRoomRevenue(): number {
    return this.customerRooms.reduce((total, room) => {
      if (room.occupancy_status !== 'Occupied') {
        return total;
      }
      if (room.price !== null && Number.isFinite(Number(room.price))) {
        return total + Number(room.price);
      }
      const planId = room.subscription_plan_id || this.customerForm.subscription_plan_id;
      const plan = this.subscriptionPlans.find((item) => item.id === planId);
      return total + Number(plan?.amount ?? 0);
    }, 0);
  }

  onClientCategoryChange(categoryId: string): void {
    this.customerForm.client_category_id = categoryId;
    if (!this.isPropertyCustomer) {
      this.customerForm.property_id = '';
      this.customerForm.property_unit_id = '';
      this.customerForm.occupancy_start_date = '';
      this.availablePropertyUnits = [];
      this.customerForm.service_arrangement = null;
      this.customerForm.room_pricing_mode = null;
      this.customerForm.caretaker_name = '';
      this.customerForm.caretaker_phone = '';
      this.customerRooms = [];
      return;
    }
    this.customerForm.property_id = '';
    this.customerForm.property_unit_id = '';
    this.customerForm.occupancy_start_date ||= new Date().toISOString().slice(0, 10);
    this.availablePropertyUnits = [];
    this.customerForm.service_arrangement = null;
    this.customerForm.room_pricing_mode = null;
  }

  loadProperties(): void {
    this.propertiesLoading = true;
    this.propertyService.list(true).subscribe({
      next: (response) => {
        this.properties = response.data;
        this.propertiesLoading = false;
      },
      error: () => {
        this.propertiesLoading = false;
        void Swal.fire({
          title: 'Unable to load properties',
          text: 'Properties could not be loaded. Configure properties before assigning apartment or rental customers.',
          icon: 'error',
          confirmButtonColor: '#405189'
        });
      }
    });
  }

  onPropertyChange(propertyId: string): void {
    this.customerForm.property_id = propertyId;
    this.customerForm.property_unit_id = '';
    this.availablePropertyUnits = [];
    if (!propertyId) return;
    const property = this.properties.find((item) => item.id === propertyId);
    if (property?.location) {
      this.customerForm.location = property.location;
      this.customerForm.latitude = null;
      this.customerForm.longitude = null;
      this.customerForm.place_id = '';
      this.locationError = '';
    }
    this.loadAvailableUnits(propertyId);
  }

  private loadAvailableUnits(propertyId: string, selectedUnitId = ''): void {
    this.propertyUnitsLoading = true;
    this.propertyService.listUnits(
      propertyId,
      true,
      this.editingCustomer?.id
    ).subscribe({
      next: (response) => {
        this.availablePropertyUnits = response.data;
        this.propertyUnitsLoading = false;
        if (selectedUnitId && response.data.some((unit) => unit.id === selectedUnitId)) {
          this.customerForm.property_unit_id = selectedUnitId;
        }
      },
      error: () => {
        this.propertyUnitsLoading = false;
        void Swal.fire({
          title: 'Unable to load rooms',
          text: 'Available rooms could not be loaded for this property.',
          icon: 'error',
          confirmButtonColor: '#405189'
        });
      }
    });
  }

  selectServiceArrangement(arrangement: ServiceArrangement): void {
    this.customerForm.service_arrangement = arrangement;
    if (arrangement === 'LANDLORD') {
      this.customerForm.room_pricing_mode = 'SHARED';
      this.customerRooms = this.customerRooms.map((room) => ({
        ...room,
        subscription_plan_id: '',
        price: null,
        uses_default_pricing: true
      }));
    } else {
      this.customerForm.room_pricing_mode ??= 'SHARED';
    }
  }

  selectRoomPricingMode(mode: RoomPricingMode): void {
    this.customerForm.room_pricing_mode = mode;
    if (mode === 'SHARED') {
      this.customerRooms = this.customerRooms.map((room) => ({
        ...room,
        subscription_plan_id: '',
        price: null,
        uses_default_pricing: true
      }));
    }
  }

  addRoom(): void {
    this.customerRooms = [...this.customerRooms, this.emptyRoom(this.nextRoomNumber())];
  }

  async generateRooms(): Promise<void> {
    const result = await Swal.fire({
      title: 'Generate rooms',
      text: 'Enter the total number of numbered rooms to add.',
      input: 'number',
      inputValue: Math.max(this.customerRooms.length, 1),
      inputAttributes: { min: '1', max: '500', step: '1' },
      showCancelButton: true,
      confirmButtonText: 'Generate',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0ab39c',
      cancelButtonColor: '#74788d',
      inputValidator: (value) => {
        const count = Number(value);
        return Number.isInteger(count) && count >= 1 && count <= 500
          ? null
          : 'Enter a whole number between 1 and 500.';
      }
    });
    if (!result.isConfirmed) {
      return;
    }

    const count = Number(result.value);
    const existingNames = new Set(
      this.customerRooms.map((room) => room.room_number.trim().toLowerCase())
    );
    const generated = Array.from({ length: count }, (_, index) => `Room ${index + 1}`)
      .filter((roomNumber) => !existingNames.has(roomNumber.toLowerCase()))
      .map((roomNumber) => this.emptyRoom(roomNumber));
    this.customerRooms = [...this.customerRooms, ...generated];

    void Swal.fire({
      title: 'Rooms generated',
      text: generated.length
        ? `${generated.length} room${generated.length === 1 ? '' : 's'} added.`
        : 'All of those rooms already exist.',
      icon: generated.length ? 'success' : 'info',
      confirmButtonColor: '#0ab39c'
    });
  }

  async removeRoom(index: number): Promise<void> {
    const room = this.customerRooms[index];
    const result = await Swal.fire({
      title: 'Remove room?',
      text: `${room.room_number || `Room ${index + 1}`} will be removed when the customer is saved.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove room',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d',
      reverseButtons: true
    });
    if (result.isConfirmed) {
      this.customerRooms = this.customerRooms.filter((_, roomIndex) => roomIndex !== index);
    }
  }

  onRoomOccupancyChange(room: CustomerRoomForm): void {
    if (room.occupancy_status === 'Vacant') {
      room.occupant_name = '';
      room.phone_number = '';
      room.email = '';
      room.account_status = 'Inactive';
      room.number_of_bags = 0;
      if (this.customerForm.room_pricing_mode === 'PER_ROOM') {
        room.subscription_plan_id = '';
        room.price = null;
      }
    } else {
      room.account_status = 'Active';
    }
  }

  serviceArrangementLabel(customer: Client): string {
    if (customer.service_arrangement === 'LANDLORD') {
      return 'Landlord / Property Manager';
    }
    if (customer.service_arrangement === 'DIRECT_TENANT') {
      return 'Direct Tenant';
    }
    return 'Not applicable';
  }

  roomPlanLabel(room: CustomerRoomForm): string {
    const planId = room.subscription_plan_id || this.customerForm.subscription_plan_id;
    const plan = this.subscriptionPlans.find((item) => item.id === planId);
    return plan ? this.subscriptionPlanLabel(plan) : 'Not assigned';
  }

  selectedRoomPlanLabel(room: CustomerRoomForm, customer: Client): string {
    const planId = room.subscription_plan_id || customer.subscription_plan_id;
    const plan = this.subscriptionPlans.find((item) => item.id === planId);
    return plan ? this.subscriptionPlanLabel(plan) : 'Not assigned';
  }

  customerRoomCount(customer: Client, occupancy: 'Occupied' | 'Vacant'): number {
    return customer.rooms.filter((room) => room.occupancy_status === occupancy).length;
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

  onSubscriptionPlanSelection(
    planId: string,
    content: TemplateRef<unknown>
  ): void {
    if (planId !== this.customPlanOptionValue) {
      this.customerForm.subscription_plan_id = planId;
      return;
    }

    this.customPlanForm = this.emptyCustomPlanForm();
    const offcanvasRef = this.offcanvasService.open(content, {
      position: 'end',
      backdrop: false,
      panelClass: 'custom-subscription-offcanvas'
    });
    this.isCustomPlanPanelOpen = true;
    offcanvasRef.closed.subscribe(() => this.isCustomPlanPanelOpen = false);
    offcanvasRef.dismissed.subscribe(() => this.isCustomPlanPanelOpen = false);
  }

  saveCustomSubscription(offcanvas: { close: (result?: unknown) => void }): void {
    const duration = this.customPlanForm.duration.trim();
    const pickupFrequency = this.customPlanForm.pickup_frequency.trim();
    const amount = Number(this.customPlanForm.amount);
    if (duration.length < 2 || pickupFrequency.length < 2 || !Number.isFinite(amount) || amount < 0) {
      return;
    }

    const payload: SubscriptionPlanPayload = {
      duration,
      pickup_frequency: pickupFrequency,
      amount,
      notes: this.customPlanForm.notes?.trim() || null,
      is_custom: true,
      is_active: true
    };
    this.isSavingCustomPlan = true;
    this.subscriptionPlanService.create(payload).subscribe({
      next: (response) => {
        this.isSavingCustomPlan = false;
        const createdPlan = response.data[0];
        if (!createdPlan) {
          offcanvas.close('Created');
          this.loadSubscriptionPlans();
          void Swal.fire({
            title: 'Plan created, but not selected',
            text: 'Reload the subscription plans and select the new plan.',
            icon: 'warning',
            confirmButtonColor: '#405189'
          });
          return;
        }

        const normalizedPlan = { ...createdPlan, amount: Number(createdPlan.amount) };
        this.subscriptionPlans = [...this.subscriptionPlans, normalizedPlan]
          .sort((first, second) => this.compareSubscriptionPlans(first, second));
        this.customerForm.subscription_plan_id = normalizedPlan.id;
        offcanvas.close('Created');
        void Swal.fire({
          title: 'Custom subscription created',
          text: 'The new plan was created and selected for this client.',
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: (error: Error) => {
        this.isSavingCustomPlan = false;
        void Swal.fire({
          title: 'Creation failed',
          text: error.message || 'The custom subscription could not be created. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  get filteredCustomers(): Client[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.customers;
    }

    return this.customers.filter((customer) =>
      [
        customer.customer_id,
        customer.name,
        customer.phone_no,
        customer.email,
        customer.location,
        customer.property_name,
        customer.room_number,
        this.clientCategoryName(customer.client_category_id),
        customer.status
      ]
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
    this.customerFormStep = 1;
    this.customerForm = this.emptyForm();
    this.customerRooms = [];
    this.selectedAttachment = null;
    this.attachmentError = '';
    this.isAttachmentDragActive = false;
    this.locationError = '';
    this.useGoogleLocations = this.googleMapsApiKeyConfigured;
    this.openCustomerModal(content);
  }

  openCustomerDetails(content: TemplateRef<unknown>, customer: Client): void {
    this.selectedCustomer = customer;
    this.modalService.open(content, { centered: true, size: 'xl', scrollable: true });
  }

  selectedCustomerPlanLabel(customer: Client): string {
    const plan = this.subscriptionPlans.find((item) => item.id === customer.subscription_plan_id);
    return plan ? this.subscriptionPlanLabel(plan) : 'Not available';
  }

  openEditCustomer(content: TemplateRef<unknown>, customer: Client): void {
    this.editingCustomer = customer;
    this.customerFormStep = 1;
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
      number_of_bags: customer.number_of_bags,
      notes: customer.notes,
      property_id: customer.property_id,
      property_unit_id: customer.property_unit_id,
      occupancy_start_date: customer.occupancy_start_date,
      client_category_id: customer.client_category_id,
      subscription_plan_id: customer.subscription_plan_id,
      service_arrangement: customer.service_arrangement,
      room_pricing_mode: customer.room_pricing_mode,
      caretaker_name: customer.caretaker_name,
      caretaker_phone: customer.caretaker_phone,
      status: customer.status
    };
    this.customerRooms = customer.rooms.map((room) => ({ ...room }));
    this.availablePropertyUnits = [];
    if (customer.property_id) {
      this.loadAvailableUnits(customer.property_id, customer.property_unit_id);
    }
    this.locationError = '';
    this.useGoogleLocations = this.googleMapsApiKeyConfigured;
    this.openCustomerModal(content);
  }

  nextCustomerStep(): void {
    const validationMessage = this.customerFormStep === 1
      ? this.validateCustomerDetailsStep()
      : this.validateCustomerServiceStep();
    if (validationMessage) {
      void Swal.fire({
        title: 'Complete this step',
        text: validationMessage,
        icon: 'warning',
        confirmButtonColor: '#405189'
      });
      return;
    }
    if (this.customerFormStep < 3) {
      this.customerFormStep = (this.customerFormStep + 1) as 2 | 3;
    }
  }

  previousCustomerStep(): void {
    if (this.customerFormStep <= 1) return;
    this.customerFormStep = (this.customerFormStep - 1) as 1 | 2;
    if (this.customerFormStep === 1 && this.useGoogleLocations) {
      setTimeout(() => void this.initializeLocationAutocomplete());
    }
  }

  private validateCustomerDetailsStep(): string | null {
    const bags = Number(this.customerForm.number_of_bags ?? 0);
    if (this.customerForm.name.trim().length < 2) return 'Enter a customer name of at least 2 characters.';
    if (!/^07\d{8}$/.test(this.customerForm.phone_no.trim())) return 'Enter a valid 10-digit phone number starting with 07.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.customerForm.email.trim())) return 'Enter a valid email address.';
    if (!this.customerForm.client_category_id) return 'Select a client category.';
    if (!Number.isInteger(bags) || bags < 0) return 'Number of bags must be a whole number equal to zero or greater.';
    if (!this.isPropertyCustomer && !this.customerForm.location.trim()) return 'Enter the customer location.';
    if (!this.isPropertyCustomer && this.useGoogleLocations && (
      this.customerForm.latitude === null ||
      this.customerForm.longitude === null ||
      !this.customerForm.place_id
    )) return 'Select the location from the Google suggestions.';
    return null;
  }

  private validateCustomerServiceStep(): string | null {
    if (this.isPropertyCustomer) {
      if (!this.customerForm.property_id) return 'Select a configured property.';
      if (!this.selectedProperty) return 'The selected property is unavailable or does not match the client category.';
      if (!this.customerForm.property_unit_id) return 'Select an available room number.';
    }
    if (this.defaultPlanRequired && !this.customerForm.subscription_plan_id) {
      return 'Select a subscription plan.';
    }
    if (!this.customerForm.status) return 'Select the customer status.';
    return null;
  }

  private openCustomerModal(content: TemplateRef<unknown>): void {
    const modalRef: NgbModalRef = this.modalService.open(content, {
      centered: true,
      size: 'xl',
      scrollable: true,
      backdrop: 'static'
    });
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
    const numberOfBags = Number(this.customerForm.number_of_bags ?? 0);

    if (!this.customerForm.location.trim()) {
      void Swal.fire({
        title: 'Location required',
        text: this.useGoogleLocations
          ? 'Type the location and select one of the Google location suggestions.'
          : 'Enter the customer location.',
        icon: 'warning',
        confirmButtonColor: '#405189'
      });
      return;
    }

    if (this.useGoogleLocations && !this.isPropertyCustomer && (
      this.customerForm.latitude === null ||
      this.customerForm.longitude === null ||
      !this.customerForm.place_id
    )) {
      void Swal.fire({
        title: 'Confirm the location',
        text: 'Select the location from the Google suggestions before adding the customer.',
        icon: 'warning',
        confirmButtonColor: '#405189'
      });
      return;
    }

    const isInvalid =
      this.customerForm.name.trim().length < 2 ||
      !/^07\d{8}$/.test(this.customerForm.phone_no.trim()) ||
      !emailPattern.test(this.customerForm.email.trim()) ||
      !this.customerForm.client_category_id.trim() ||
      (this.defaultPlanRequired && !this.customerForm.subscription_plan_id.trim()) ||
      !Number.isInteger(numberOfBags) ||
      numberOfBags < 0 ||
      !this.customerForm.status;

    if (isInvalid || this.attachmentError) {
      void Swal.fire({
        title: 'Check required fields',
        text: 'Complete the required customer fields and correct any highlighted values.',
        icon: 'warning',
        confirmButtonColor: '#405189'
      });
      return;
    }

    const selectedPlan = this.customerForm.subscription_plan_id
      ? this.subscriptionPlans.find((plan) => plan.id === this.customerForm.subscription_plan_id)
      : null;
    if (this.defaultPlanRequired && !selectedPlan) {
      void Swal.fire({
        title: 'Invalid subscription plan',
        text: 'Select a valid subscription plan before saving the customer.',
        icon: 'warning',
        confirmButtonColor: '#405189'
      });
      return;
    }

    const selectedCategory = this.clientCategories.find(
      (category) => category.id === this.customerForm.client_category_id
    );
    if (!selectedCategory) {
      void Swal.fire({
        title: 'Invalid client category',
        text: 'Select a valid client category before saving the customer.',
        icon: 'warning',
        confirmButtonColor: '#405189'
      });
      return;
    }

    if (this.isPropertyCustomer) {
      if (!this.customerForm.property_id || !this.customerForm.property_unit_id) {
        void Swal.fire({
          title: 'Property and room required',
          text: 'Select the configured property and an available room number.',
          icon: 'warning',
          confirmButtonColor: '#405189'
        });
        return;
      }
      if (!this.selectedProperty) {
        void Swal.fire({
          title: 'Invalid property',
          text: 'Select an active property matching this client category.',
          icon: 'warning',
          confirmButtonColor: '#405189'
        });
        return;
      }
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
      number_of_bags: numberOfBags,
      notes: this.customerForm.notes.trim() || null,
      agreed_price: null,
      property_id: this.isPropertyCustomer ? this.customerForm.property_id : null,
      property_unit_id: this.isPropertyCustomer ? this.customerForm.property_unit_id : null,
      occupancy_start_date: this.isPropertyCustomer
        ? this.customerForm.occupancy_start_date || null
        : null,
      client_category_id: selectedCategory.id,
      subscription_plan_id: selectedPlan?.id ?? null,
      service_arrangement: null,
      room_pricing_mode: null,
      caretaker_name: null,
      caretaker_phone: null,
      rooms: [],
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

  private validateRooms(): string | null {
    const roomNumbers = new Set<string>();
    for (let index = 0; index < this.customerRooms.length; index += 1) {
      const room = this.customerRooms[index];
      const label = room.room_number.trim() || `Room ${index + 1}`;
      const normalizedRoomNumber = room.room_number.trim().toLowerCase();
      if (!normalizedRoomNumber) {
        return `Enter a room number for room row ${index + 1}.`;
      }
      if (roomNumbers.has(normalizedRoomNumber)) {
        return `${label} is duplicated. Every room number must be unique.`;
      }
      roomNumbers.add(normalizedRoomNumber);

      const bags = Number(room.number_of_bags ?? 0);
      if (!Number.isInteger(bags) || bags < 0) {
        return `${label} must have a whole number of bags equal to zero or greater.`;
      }

      if (room.occupancy_status === 'Occupied' && room.occupant_name.trim().length < 2) {
        return `Enter the occupant name for ${label}.`;
      }

      if (this.dealsDirectlyWithTenants && room.occupancy_status === 'Occupied') {
        if (!/^07\d{8}$/.test(room.phone_number.trim())) {
          return `Enter a valid 10-digit tenant phone number starting with 07 for ${label}.`;
        }
        if (this.customerForm.room_pricing_mode === 'PER_ROOM') {
          const roomPlan = this.subscriptionPlans.find(
            (plan) => plan.id === room.subscription_plan_id
          );
          if (!roomPlan) {
            return `Select a subscription plan for ${label}.`;
          }
        }
      }
    }
    return null;
  }

  private roomPayload(room: CustomerRoomForm): ApiCustomerRoom {
    const perRoomPricing = this.dealsDirectlyWithTenants
      && this.customerForm.room_pricing_mode === 'PER_ROOM';
    return {
      id: room.id,
      occupant_customer_id: room.occupant_customer_id,
      room_number: room.room_number.trim(),
      occupancy_status: room.occupancy_status,
      occupant_name: room.occupant_name.trim() || null,
      phone_number: room.phone_number.trim() || null,
      email: room.email.trim() || null,
      subscription_plan_id: perRoomPricing && room.occupancy_status === 'Occupied'
        ? room.subscription_plan_id || null
        : null,
      price: perRoomPricing && room.occupancy_status === 'Occupied' && room.price !== null
        ? Number(room.price)
        : null,
      number_of_bags: Number(room.number_of_bags ?? 0),
      uses_default_pricing: !perRoomPricing,
      account_status: room.occupancy_status === 'Occupied' ? room.account_status : 'Inactive'
    };
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
      number_of_bags: customer.number_of_bags,
      notes: customer.notes.trim() || null,
      agreed_price: customer.agreed_price,
      property_id: customer.property_id || null,
      property_unit_id: customer.property_unit_id || null,
      occupancy_start_date: customer.occupancy_start_date || null,
      client_category_id: customer.client_category_id,
      subscription_plan_id: customer.subscription_plan_id || null,
      service_arrangement: customer.service_arrangement,
      room_pricing_mode: customer.room_pricing_mode,
      caretaker_name: customer.caretaker_name || null,
      caretaker_phone: customer.caretaker_phone || null,
      rooms: customer.rooms.map((room) => ({
        id: room.id,
        occupant_customer_id: room.occupant_customer_id,
        room_number: room.room_number,
        occupancy_status: room.occupancy_status,
        occupant_name: room.occupant_name || null,
        phone_number: room.phone_number || null,
        email: room.email || null,
        subscription_plan_id: room.subscription_plan_id || null,
        price: room.price,
        number_of_bags: room.number_of_bags,
        uses_default_pricing: room.uses_default_pricing,
        account_status: room.account_status
      })),
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
    const durationOrder = [
      ...SUBSCRIPTION_DURATION_OPTIONS,
      '1 Month',
      '3 Months',
      '6 Months',
      '12 Months'
    ];
    const frequencyOrder: string[] = [...PICKUP_FREQUENCY_OPTIONS];
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
      phone_no: customer.phone_no ?? '',
      email: customer.email ?? '',
      location: customer.location,
      latitude: customer.latitude,
      longitude: customer.longitude,
      place_id: customer.place_id ?? '',
      flat_no: customer.flat_no ?? '',
      house_no: customer.house_no ?? '',
      number_of_bags: Number(customer.number_of_bags ?? 0),
      notes: customer.notes ?? '',
      customer_type: customer.customer_type ?? 'STANDARD',
      agreed_price: customer.agreed_price === null ? null : Number(customer.agreed_price),
      property_id: customer.property_id ?? '',
      property_name: customer.property_name ?? '',
      property_billing_mode: customer.property_billing_mode ?? null,
      property_unit_id: customer.property_unit_id ?? '',
      occupancy_start_date: customer.occupancy_start_date ?? '',
      client_category_id: customer.client_category_id ?? '',
      subscription_plan_id: customer.subscription_plan_id ?? '',
      service_arrangement: customer.service_arrangement ?? null,
      room_pricing_mode: customer.room_pricing_mode ?? null,
      caretaker_name: customer.caretaker_name ?? '',
      caretaker_phone: customer.caretaker_phone ?? '',
      property_customer_id: customer.property_customer_id ?? null,
      room_id: customer.room_id ?? '',
      room_number: customer.room_number ?? '',
      rooms: (customer.rooms ?? []).map((room) => ({
        id: room.id,
        occupant_customer_id: room.occupant_customer_id ?? null,
        room_number: room.room_number,
        occupancy_status: room.occupancy_status,
        occupant_name: room.occupant_name ?? '',
        phone_number: room.phone_number ?? '',
        email: room.email ?? '',
        subscription_plan_id: room.subscription_plan_id ?? '',
        price: room.price === null ? null : Number(room.price),
        number_of_bags: Number(room.number_of_bags ?? 0),
        uses_default_pricing: room.uses_default_pricing,
        account_status: room.account_status
      })),
      status: customer.status,
      date_added: customer.date_entered
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
      number_of_bags: 0,
      notes: '',
      property_id: '',
      property_unit_id: '',
      occupancy_start_date: '',
      client_category_id: '',
      subscription_plan_id: '',
      service_arrangement: null,
      room_pricing_mode: null,
      caretaker_name: '',
      caretaker_phone: '',
      status: 'Active'
    };
  }

  private emptyRoom(roomNumber = ''): CustomerRoomForm {
    return {
      id: null,
      occupant_customer_id: null,
      room_number: roomNumber,
      occupancy_status: 'Vacant',
      occupant_name: '',
      phone_number: '',
      email: '',
      subscription_plan_id: '',
      price: null,
      number_of_bags: 0,
      uses_default_pricing: true,
      account_status: 'Inactive'
    };
  }

  private nextRoomNumber(): string {
    let number = this.customerRooms.length + 1;
    const existing = new Set(
      this.customerRooms.map((room) => room.room_number.trim().toLowerCase())
    );
    while (existing.has(`room ${number}`)) {
      number += 1;
    }
    return `Room ${number}`;
  }

  private emptyCustomPlanForm(): SubscriptionPlanPayload {
    return {
      duration: SUBSCRIPTION_DURATION_OPTIONS[0],
      pickup_frequency: PICKUP_FREQUENCY_OPTIONS[0],
      amount: 0,
      notes: null,
      is_custom: true,
      is_active: true
    };
  }
}

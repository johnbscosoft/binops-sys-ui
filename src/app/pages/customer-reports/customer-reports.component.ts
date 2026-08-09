import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { ApiCustomer, CustomerService } from '../customers/customer.service';
import { PropertyRecord, PropertyService, PropertyUnit } from '../properties/property.service';
import { SubscriptionPlan, SubscriptionPlanService } from '../subscriptions/subscription-plan.service';

type CustomerReportType = 'summary' | 'status' | 'property-occupancy' | 'property-collections' | 'subscriptions';

interface ReportOption {
  value: CustomerReportType;
  label: string;
  description: string;
}

@Component({
  selector: 'app-customer-reports',
  templateUrl: './customer-reports.component.html',
  styleUrls: ['./customer-reports.component.scss'],
  standalone: false
})
export class CustomerReportsComponent implements OnInit {
  readonly reportOptions: ReportOption[] = [
    { value: 'summary', label: 'Customer Summary', description: 'Complete customer register and account details.' },
    { value: 'status', label: 'Customer Status', description: 'Active and inactive customer accounts.' },
    { value: 'property-occupancy', label: 'Property Occupancy', description: 'Configured, occupied and vacant property rooms.' },
    { value: 'property-collections', label: 'Property Collection Register', description: 'Property contacts, rooms and expected collection amounts based on assigned subscription plans.' },
    { value: 'subscriptions', label: 'Customer Subscriptions', description: 'Plans assigned to customers and owner-paid properties.' }
  ];
  breadCrumbItems: Array<{}> = [
    { label: 'Customer Management' },
    { label: 'Reports', active: true }
  ];
  reportType: CustomerReportType = 'summary';
  customers: ApiCustomer[] = [];
  properties: PropertyRecord[] = [];
  plans: SubscriptionPlan[] = [];
  isLoading = false;
  statusFilter: 'All' | 'Active' | 'Inactive' = 'All';
  generatedAt = new Date();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly customerService: CustomerService,
    private readonly propertyService: PropertyService,
    private readonly subscriptionPlanService: SubscriptionPlanService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const requested = params.get('type') as CustomerReportType | null;
      this.reportType = this.reportOptions.some((option) => option.value === requested)
        ? requested!
        : 'summary';
    });
    this.loadReportData();
  }

  get currentReport(): ReportOption {
    return this.reportOptions.find((option) => option.value === this.reportType)!;
  }

  get displayedCustomers(): ApiCustomer[] {
    if (this.reportType !== 'status' || this.statusFilter === 'All') return this.customers;
    return this.customers.filter((customer) => customer.status === this.statusFilter);
  }

  get activeCustomers(): number {
    return this.customers.filter((customer) => customer.status === 'Active').length;
  }

  get occupiedRooms(): number {
    return this.properties.reduce((total, property) => total + property.occupied_unit_count, 0);
  }

  get totalRooms(): number {
    return this.properties.reduce((total, property) => total + property.unit_count, 0);
  }

  get expectedPropertyCollection(): number {
    return this.properties.reduce((total, property) => total + this.propertyExpectedAmount(property), 0);
  }

  selectReport(type: CustomerReportType): void {
    void this.router.navigate(['/customers/reports', type]);
  }

  planLabel(planId: string | null): string {
    if (!planId) return 'Property owner pays / No individual plan';
    const plan = this.plans.find((item) => item.id === planId);
    return plan
      ? `${plan.duration} · ${plan.pickup_frequency} · UGX ${Number(plan.amount).toLocaleString()}`
      : 'Plan unavailable';
  }

  reportUnits(property: PropertyRecord): PropertyUnit[] {
    return property.units
      .filter((unit) => unit.is_active)
      .sort((first, second) => first.room_number.localeCompare(
        second.room_number,
        undefined,
        { numeric: true, sensitivity: 'base' }
      ));
  }

  unitOccupant(unit: PropertyUnit): ApiCustomer | null {
    return this.customers.find((customer) =>
      customer.id === unit.occupant_customer_id || customer.property_unit_id === unit.id
    ) ?? null;
  }

  roomExpectedAmount(property: PropertyRecord, unit: PropertyUnit): number | null {
    if (unit.occupancy_status !== 'Occupied' || property.billing_mode === 'OWNER') return null;
    return this.planAmount(this.unitOccupant(unit)?.subscription_plan_id ?? null);
  }

  propertyExpectedAmount(property: PropertyRecord): number {
    if (property.billing_mode === 'OWNER') {
      return this.planAmount(property.subscription_plan_id) ?? 0;
    }
    return this.reportUnits(property).reduce(
      (total, unit) => total + (this.roomExpectedAmount(property, unit) ?? 0),
      0
    );
  }

  refresh(): void {
    this.generatedAt = new Date();
    this.loadReportData();
  }

  printReport(): void {
    window.print();
  }

  private planAmount(planId: string | null): number | null {
    if (!planId) return null;
    const plan = this.plans.find((item) => item.id === planId);
    return plan ? Number(plan.amount) : null;
  }

  private loadReportData(): void {
    this.isLoading = true;
    let completed = 0;
    const finish = (): void => {
      completed += 1;
      if (completed === 3) this.isLoading = false;
    };
    const fail = (message: string): void => {
      finish();
      void Swal.fire({
        title: 'Unable to load report data',
        text: message,
        icon: 'error',
        confirmButtonColor: '#405189'
      });
    };

    this.customerService.list().subscribe({
      next: (response) => { this.customers = response.data; finish(); },
      error: () => fail('Customer data could not be loaded.')
    });
    this.propertyService.list().subscribe({
      next: (response) => { this.properties = response.data; finish(); },
      error: () => fail('Property data could not be loaded.')
    });
    this.subscriptionPlanService.list().subscribe({
      next: (response) => { this.plans = response.data; finish(); },
      error: () => fail('Subscription-plan data could not be loaded.')
    });
  }
}

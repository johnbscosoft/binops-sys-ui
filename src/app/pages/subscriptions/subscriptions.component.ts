import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import {
  SubscriptionPlan,
  SubscriptionPlanPayload,
  SubscriptionPlanService
} from './subscription-plan.service';

export interface SubscriptionOption {
  id: number;
  billingCycle: string;
  pickupFrequency: string;
  price: number;
}

// Retained for the customer form until it is migrated to load plans from the API.
export const SUBSCRIPTION_OPTIONS: SubscriptionOption[] = [
  { id: 1, billingCycle: '1 Month', pickupFrequency: 'Once a Week', price: 35000 },
  { id: 2, billingCycle: '1 Month', pickupFrequency: 'Twice a Week', price: 70000 },
  { id: 3, billingCycle: '1 Month', pickupFrequency: 'Thrice a Week', price: 90000 },
  { id: 4, billingCycle: '3 Months', pickupFrequency: 'Once a Week', price: 105000 },
  { id: 5, billingCycle: '3 Months', pickupFrequency: 'Twice a Week', price: 210000 },
  { id: 6, billingCycle: '3 Months', pickupFrequency: 'Thrice a Week', price: 270000 },
  { id: 7, billingCycle: '6 Months', pickupFrequency: 'Once a Week', price: 210000 },
  { id: 8, billingCycle: '6 Months', pickupFrequency: 'Twice a Week', price: 420000 },
  { id: 9, billingCycle: '6 Months', pickupFrequency: 'Thrice a Week', price: 540000 }
];

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
  standalone: false
})
export class SubscriptionsComponent implements OnInit {
  breadCrumbItems: Array<{}> = [
    { label: 'Subscriptions' },
    { label: 'Subscription Plans', active: true }
  ];

  plans: SubscriptionPlan[] = [];
  selectedDuration = '1 Month';
  editingPlan: SubscriptionPlan | null = null;
  planForm: SubscriptionPlanPayload = this.emptyForm();
  isLoading = false;
  isSaving = false;

  constructor(
    private readonly planService: SubscriptionPlanService,
    private readonly modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  get durations(): string[] {
    const preferredOrder = ['1 Month', '3 Months', '6 Months'];
    const availableDurations = new Set(this.plans.map((plan) => plan.duration));
    const orderedDurations = preferredOrder.filter((duration) => availableDurations.has(duration));
    const otherDurations = [...availableDurations].filter(
      (duration) => !preferredOrder.includes(duration)
    );
    return [...orderedDurations, ...otherDurations, 'All'];
  }

  get visiblePlans(): SubscriptionPlan[] {
    return this.selectedDuration === 'All'
      ? this.plans
      : this.plans.filter((plan) => plan.duration === this.selectedDuration);
  }

  loadPlans(): void {
    this.isLoading = true;
    this.planService.list().subscribe({
      next: (response) => {
        this.plans = response.data.map((plan) => ({ ...plan, amount: Number(plan.amount) }));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        void this.showRetryAlert(
          'Unable to load subscription plans',
          'Subscription plans could not be loaded. Please try again.',
          () => this.loadPlans()
        );
      }
    });
  }

  selectDuration(duration: string): void {
    this.selectedDuration = duration;
  }

  openCreate(content: TemplateRef<unknown>, isCustom = false): void {
    this.editingPlan = null;
    this.planForm = this.emptyForm(isCustom);
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  openEdit(plan: SubscriptionPlan, content: TemplateRef<unknown>): void {
    this.editingPlan = plan;
    this.planForm = {
      duration: plan.duration,
      pickup_frequency: plan.pickup_frequency,
      amount: Number(plan.amount),
      notes: plan.notes,
      is_custom: plan.is_custom,
      is_active: plan.is_active
    };
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  savePlan(): void {
    this.isSaving = true;
    const wasEditing = Boolean(this.editingPlan);
    const request = this.editingPlan
      ? this.planService.update(this.editingPlan.id, this.planForm)
      : this.planService.create(this.planForm);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.modalService.dismissAll();
        this.loadPlans();
        void Swal.fire({
          title: wasEditing ? 'Plan updated' : 'Plan created',
          text: wasEditing
            ? 'The subscription plan was updated successfully.'
            : 'The subscription plan was created successfully.',
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: () => {
        this.isSaving = false;
        void Swal.fire({
          title: wasEditing ? 'Update failed' : 'Creation failed',
          text: 'The subscription plan could not be saved. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  toggleActive(plan: SubscriptionPlan): void {
    const isActivating = !plan.is_active;
    this.planService.update(plan.id, { is_active: isActivating }).subscribe({
      next: () => {
        this.loadPlans();
        void Swal.fire({
          title: isActivating ? 'Plan activated' : 'Plan deactivated',
          text: `The subscription plan was ${isActivating ? 'activated' : 'deactivated'} successfully.`,
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: () => {
        void Swal.fire({
          title: 'Status update failed',
          text: 'The subscription plan status could not be updated. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  async deletePlan(plan: SubscriptionPlan): Promise<void> {
    const confirmation = await Swal.fire({
      title: 'Delete subscription plan?',
      text: `${plan.duration} — ${plan.pickup_frequency} will be permanently deleted.`,
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
    this.planService.delete(plan.id).subscribe({
      next: () => {
        this.loadPlans();
        void Swal.fire({
          title: 'Plan deleted',
          text: 'The subscription plan was deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: () => {
        void Swal.fire({
          title: 'Delete failed',
          text: 'The subscription plan could not be deleted. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
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

  formatAmount(amount: number): string {
    return `UGX ${Number(amount).toLocaleString()}`;
  }

  private emptyForm(isCustom = false): SubscriptionPlanPayload {
    return {
      duration: isCustom ? 'Custom' : '1 Month',
      pickup_frequency: isCustom ? 'Custom' : 'Once a Week',
      amount: 0,
      notes: null,
      is_custom: isCustom,
      is_active: true
    };
  }
}

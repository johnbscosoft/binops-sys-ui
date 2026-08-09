import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import {
  ClientCategory,
  ClientCategoryPayload,
  ClientCategoryService
} from './client-category.service';

@Component({
  selector: 'app-client-categories',
  templateUrl: './client-categories.component.html',
  styleUrls: ['./client-categories.component.scss'],
  standalone: false
})
export class ClientCategoriesComponent implements OnInit {
  breadCrumbItems: Array<{}> = [
    { label: 'Administration' },
    { label: 'Client Categories', active: true }
  ];

  categories: ClientCategory[] = [];
  categoryForm: ClientCategoryPayload = this.emptyForm();
  editingCategory: ClientCategory | null = null;
  searchTerm = '';
  isLoading = false;
  isSaving = false;

  constructor(
    private readonly categoryService: ClientCategoryService,
    private readonly modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  get filteredCategories(): ClientCategory[] {
    const term = this.searchTerm.trim().toLowerCase();
    return term
      ? this.categories.filter((category) =>
          [category.name, category.is_active ? 'active' : 'inactive']
            .some((value) => value.toLowerCase().includes(term))
        )
      : this.categories;
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.list().subscribe({
      next: (response) => {
        this.categories = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        void this.showRetryAlert();
      }
    });
  }

  openCreate(content: TemplateRef<unknown>): void {
    this.editingCategory = null;
    this.categoryForm = this.emptyForm();
    this.modalService.open(content, { centered: true });
  }

  openEdit(category: ClientCategory, content: TemplateRef<unknown>): void {
    this.editingCategory = category;
    this.categoryForm = {
      name: category.name,
      is_active: category.is_active
    };
    this.modalService.open(content, { centered: true });
  }

  saveCategory(): void {
    const name = this.categoryForm.name.trim();
    if (name.length < 2) {
      return;
    }

    this.isSaving = true;
    const wasEditing = Boolean(this.editingCategory);
    const payload: ClientCategoryPayload = {
      name,
      is_active: this.categoryForm.is_active
    };
    const request = this.editingCategory
      ? this.categoryService.update(this.editingCategory.id, payload)
      : this.categoryService.create(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.modalService.dismissAll();
        this.loadCategories();
        void Swal.fire({
          title: wasEditing ? 'Category updated' : 'Category created',
          text: wasEditing
            ? 'The client category was updated successfully.'
            : 'The client category was created successfully.',
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: (error: Error) => {
        this.isSaving = false;
        void Swal.fire({
          title: wasEditing ? 'Update failed' : 'Creation failed',
          text: error.message || 'The client category could not be saved.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  toggleStatus(category: ClientCategory): void {
    const isActivating = !category.is_active;
    this.categoryService.update(category.id, { is_active: isActivating }).subscribe({
      next: () => {
        this.loadCategories();
        void Swal.fire({
          title: isActivating ? 'Category activated' : 'Category deactivated',
          text: `${category.name} is now ${isActivating ? 'available' : 'unavailable'} for new clients.`,
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: () => {
        void Swal.fire({
          title: 'Status update failed',
          text: 'The client category status could not be changed.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  async deleteCategory(category: ClientCategory): Promise<void> {
    const confirmation = await Swal.fire({
      title: 'Delete client category?',
      text: `${category.name} will be permanently deleted. Categories assigned to clients cannot be deleted.`,
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

    this.categoryService.delete(category.id).subscribe({
      next: () => {
        this.loadCategories();
        void Swal.fire({
          title: 'Category deleted',
          text: `${category.name} was deleted successfully.`,
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: (error: Error) => {
        void Swal.fire({
          title: 'Delete failed',
          text: error.message || 'The category may still be assigned to one or more clients.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  private async showRetryAlert(): Promise<void> {
    const result = await Swal.fire({
      title: 'Unable to load client categories',
      text: 'Client categories could not be loaded. Please try again.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Retry',
      cancelButtonText: 'Close',
      confirmButtonColor: '#405189',
      cancelButtonColor: '#74788d'
    });
    if (result.isConfirmed) {
      this.loadCategories();
    }
  }

  private emptyForm(): ClientCategoryPayload {
    return { name: '', is_active: true };
  }
}

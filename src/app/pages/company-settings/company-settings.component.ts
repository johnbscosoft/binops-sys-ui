import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import {
  Company,
  CompanyPayload,
  CompanySettingsService
} from './company-settings.service';

@Component({
  selector: 'app-company-settings',
  templateUrl: './company-settings.component.html',
  styleUrls: ['./company-settings.component.scss'],
  standalone: false
})
export class CompanySettingsComponent implements OnInit {
  breadCrumbItems: Array<{}> = [
    { label: 'Administration' },
    { label: 'Company Settings', active: true }
  ];

  companies: Company[] = [];
  companyForm: CompanyPayload = this.emptyForm();
  editingCompany: Company | null = null;
  isLoading = false;
  isSaving = false;
  deletingCompanyId = '';
  searchTerm = '';
  logoError = '';
  logoPreview = '';
  selectedLogoName = '';
  isLogoDragActive = false;

  constructor(
    private readonly companyService: CompanySettingsService,
    private readonly modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  get filteredCompanies(): Company[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.companies;
    }

    return this.companies.filter((company) =>
      [
        company.company_code,
        company.name,
        company.email,
        company.contact_person,
        company.phone_number
      ].some((value) => value.toLowerCase().includes(term))
    );
  }

  loadCompanies(): void {
    this.isLoading = true;
    this.companyService.list().subscribe({
      next: (response) => {
        this.companies = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        void Swal.fire({
          title: 'Unable to load companies',
          text: 'Companies could not be loaded. Please try again.',
          icon: 'error',
          showCancelButton: true,
          confirmButtonText: 'Retry',
          cancelButtonText: 'Close',
          confirmButtonColor: '#405189',
          cancelButtonColor: '#74788d'
        }).then((result) => {
          if (result.isConfirmed) {
            this.loadCompanies();
          }
        });
      }
    });
  }

  openCreate(content: TemplateRef<unknown>): void {
    this.editingCompany = null;
    this.companyForm = this.emptyForm();
    this.resetLogoSelection();
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  openEdit(company: Company, content: TemplateRef<unknown>): void {
    this.editingCompany = company;
    this.companyForm = {
      name: company.name,
      email: company.email,
      contact_person: company.contact_person,
      phone_number: company.phone_number,
      logo: company.logo
    };
    this.logoError = '';
    this.logoPreview = company.logo ?? '';
    this.selectedLogoName = '';
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.readLogo(file, () => input.value = '');
  }

  onLogoDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isLogoDragActive = true;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onLogoDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isLogoDragActive = false;
  }

  onLogoDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isLogoDragActive = false;

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.readLogo(file);
    }
  }

  onCompanyLogoError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.classList.add('d-none');
    image.nextElementSibling?.classList.remove('d-none');
  }

  private readLogo(file: File, clearInput: () => void = () => undefined): void {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];

    this.logoError = '';

    if (!allowedTypes.includes(file.type)) {
      this.logoError = 'Select a PNG, JPEG, or WebP image.';
      clearInput();
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.logoError = 'The logo must not exceed 2 MB.';
      clearInput();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = typeof reader.result === 'string' ? reader.result : '';
      if (!imageData) {
        this.logoError = 'The selected logo could not be read.';
        return;
      }
      this.companyForm.logo = imageData;
      this.logoPreview = imageData;
      this.selectedLogoName = file.name;
    };
    reader.onerror = () => {
      this.logoError = 'The selected logo could not be read.';
      clearInput();
    };
    reader.readAsDataURL(file);
  }

  removeLogo(input: HTMLInputElement): void {
    this.companyForm.logo = null;
    this.logoPreview = '';
    this.selectedLogoName = '';
    this.logoError = '';
    this.isLogoDragActive = false;
    input.value = '';
  }

  saveCompany(): void {
    if (this.logoError) {
      return;
    }

    const payload: CompanyPayload = {
      name: this.companyForm.name.trim(),
      email: this.companyForm.email.trim(),
      contact_person: this.companyForm.contact_person.trim(),
      phone_number: this.companyForm.phone_number.trim(),
      logo: this.companyForm.logo?.trim() || null
    };

    this.isSaving = true;
    const wasEditing = Boolean(this.editingCompany);
    const request = this.editingCompany
      ? this.companyService.update(this.editingCompany.id, payload)
      : this.companyService.create(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.modalService.dismissAll();
        this.loadCompanies();
        void Swal.fire({
          title: wasEditing ? 'Company updated' : 'Company created',
          text: wasEditing
            ? 'The company details were updated successfully.'
            : 'The company was created successfully.',
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: () => {
        this.isSaving = false;
        void Swal.fire({
          title: wasEditing ? 'Update failed' : 'Creation failed',
          text: wasEditing
            ? 'The company could not be updated. Check the details and try again.'
            : 'The company could not be created. Its name or email may already exist.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  async deleteCompany(company: Company): Promise<void> {
    const confirmation = await Swal.fire({
      title: 'Delete company?',
      text: `${company.name} will be permanently deleted. This action cannot be undone.`,
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

    this.deletingCompanyId = company.id;
    this.companyService.delete(company.id).subscribe({
      next: () => {
        this.deletingCompanyId = '';
        this.loadCompanies();
        void Swal.fire({
          title: 'Company deleted',
          text: `${company.name} was deleted successfully.`,
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: () => {
        this.deletingCompanyId = '';
        void Swal.fire({
          title: 'Delete failed',
          text: 'The company could not be deleted. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  private emptyForm(): CompanyPayload {
    return {
      name: '',
      email: '',
      contact_person: '',
      phone_number: '',
      logo: null
    };
  }

  private resetLogoSelection(): void {
    this.logoError = '';
    this.logoPreview = '';
    this.selectedLogoName = '';
    this.isLogoDragActive = false;
  }
}

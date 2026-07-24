import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import { ApiCustomer, CustomerService } from '../customers/customer.service';
import { ContractService, CustomerContract } from './contract.service';

@Component({
  selector: 'app-contracts',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.scss'],
  standalone: false
})
export class ContractsComponent implements OnInit, OnDestroy {
  @ViewChild('pdfFrame') private pdfFrame?: ElementRef<HTMLIFrameElement>;

  breadCrumbItems: Array<{}> = [
    { label: 'Customer Management' },
    { label: 'Customer Contracts', active: true }
  ];
  contracts: CustomerContract[] = [];
  customers: ApiCustomer[] = [];
  searchTerm = '';
  page = 1;
  pageSize = 10;
  isLoading = true;
  isSaving = false;
  isLoadingCustomers = false;
  isLoadingPdf = false;
  selectedCustomerId: number | null = null;
  startDate = this.today();
  selectedContract: CustomerContract | null = null;
  pdfUrl: SafeResourceUrl | null = null;
  private pdfObjectUrl: string | null = null;

  constructor(
    private readonly modalService: NgbModal,
    private readonly sanitizer: DomSanitizer,
    private readonly customerService: CustomerService,
    private readonly contractService: ContractService
  ) {}

  ngOnInit(): void {
    this.loadContracts();
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.releasePdf();
  }

  get filteredContracts(): CustomerContract[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.contracts;
    }
    return this.contracts.filter((contract) =>
      [contract.contract_code, contract.customer_name, contract.customer_code, contract.expiry_date]
        .some((value) => value.toLowerCase().includes(term))
    );
  }

  get paginatedContracts(): CustomerContract[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredContracts.slice(start, start + this.pageSize);
  }

  get firstVisibleContract(): number {
    return this.filteredContracts.length ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get lastVisibleContract(): number {
    return Math.min(this.page * this.pageSize, this.filteredContracts.length);
  }

  loadContracts(): void {
    this.isLoading = true;
    this.contractService.list().subscribe({
      next: (response) => {
        this.contracts = response.data.map((contract) => ({
          ...contract,
          agreed_amount: Number(contract.agreed_amount)
        }));
        this.page = 1;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        void this.retryAlert(
          'Unable to load contracts',
          'Customer contracts could not be loaded. Please try again.',
          () => this.loadContracts()
        );
      }
    });
  }

  loadCustomers(): void {
    this.isLoadingCustomers = true;
    this.customerService.list().subscribe({
      next: (response) => {
        this.customers = response.data
          .filter((customer) => customer.status === 'Active')
          .sort((first, second) => first.name.localeCompare(second.name));
        this.isLoadingCustomers = false;
      },
      error: () => {
        this.isLoadingCustomers = false;
        void this.retryAlert(
          'Unable to load customers',
          'Customers could not be loaded for contract generation.',
          () => this.loadCustomers()
        );
      }
    });
  }

  openGenerate(content: TemplateRef<unknown>): void {
    this.selectedCustomerId = null;
    this.startDate = this.today();
    this.modalService.open(content, { centered: true });
  }

  generateContract(): void {
    if (!this.selectedCustomerId || !this.startDate || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.contractService.create({
      customer_id: this.selectedCustomerId,
      start_date: this.startDate
    }).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.modalService.dismissAll();
        this.loadContracts();
        const contract = response.data[0];
        void Swal.fire({
          title: 'Contract generated',
          text: contract
            ? `${contract.contract_code} was generated successfully.`
            : 'The customer contract was generated successfully.',
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: (error: Error) => {
        this.isSaving = false;
        void Swal.fire({
          title: 'Generation failed',
          text: error.message || 'The contract could not be generated. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  viewPdf(content: TemplateRef<unknown>, contract: CustomerContract): void {
    this.isLoadingPdf = true;
    this.selectedContract = contract;
    this.releasePdf();
    this.contractService.pdf(contract.id).subscribe({
      next: (blob) => {
        this.isLoadingPdf = false;
        this.pdfObjectUrl = URL.createObjectURL(blob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl);
        const modalRef = this.modalService.open(content, {
          centered: true,
          size: 'xl',
          scrollable: false,
          windowClass: 'contract-pdf-modal'
        });
        void modalRef.result.finally(() => this.releasePdf());
      },
      error: () => {
        this.isLoadingPdf = false;
        void Swal.fire({
          title: 'Unable to open PDF',
          text: 'The contract PDF could not be generated. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  printPdf(): void {
    const printWindow = this.pdfFrame?.nativeElement.contentWindow;
    if (!printWindow) {
      void Swal.fire({
        title: 'Print unavailable',
        text: 'The PDF is not ready yet. Please wait a moment and try again.',
        icon: 'warning',
        confirmButtonColor: '#405189'
      });
      return;
    }
    printWindow.focus();
    printWindow.print();
  }

  async deleteContract(contract: CustomerContract): Promise<void> {
    const confirmation = await Swal.fire({
      title: 'Delete contract?',
      text: `${contract.contract_code} for ${contract.customer_name} will be permanently deleted.`,
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
    this.contractService.delete(contract.id).subscribe({
      next: () => {
        this.loadContracts();
        void Swal.fire({
          title: 'Contract deleted',
          text: `${contract.contract_code} was deleted successfully.`,
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: () => {
        void Swal.fire({
          title: 'Delete failed',
          text: 'The contract could not be deleted. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  customerCode(customer: ApiCustomer): string {
    return `CUST-${String(customer.id).padStart(4, '0')}`;
  }

  searchContracts(): void {
    this.page = 1;
  }

  private releasePdf(): void {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
    }
    this.pdfObjectUrl = null;
    this.pdfUrl = null;
  }

  private today(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  private async retryAlert(title: string, text: string, retry: () => void): Promise<void> {
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
}

import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import {
  ApiUser,
  CompanyReference,
  UserCreatePayload,
  UserService,
  UserUpdatePayload
} from './user.service';

interface UserForm {
  company_code: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  avatar_url: string;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: false
})
export class UsersComponent implements OnInit {
  readonly defaultPassword = 'open1234567';

  breadCrumbItems: Array<{}> = [
    { label: 'Administration' },
    { label: 'Users', active: true }
  ];

  users: ApiUser[] = [];
  companies: CompanyReference[] = [];
  currentUserId = '';
  currentCompanyCode = '';
  editingUser: ApiUser | null = null;
  userForm: UserForm = this.emptyForm();
  searchTerm = '';
  isLoading = false;
  isSaving = false;
  actionUserId = '';

  constructor(
    private readonly userService: UserService,
    private readonly modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get filteredUsers(): ApiUser[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.users;
    }

    return this.users.filter((user) =>
      [
        user.email,
        user.username ?? '',
        user.first_name ?? '',
        user.last_name ?? '',
        user.phone_number ?? '',
        this.companyCode(user)
      ].some((value) => value.toLowerCase().includes(term))
    );
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        this.users = response.data;
        this.isLoading = false;
        this.loadCurrentUserContext();
      },
      error: (error: Error) => {
        this.isLoading = false;
        void this.showRetryAlert(error.message || 'Users could not be loaded.');
      }
    });
  }

  private loadCurrentUserContext(): void {
    this.userService.currentUser().subscribe({
      next: (response) => {
        const signedInUser = response.data[0];
        if (!signedInUser) {
          return;
        }

        this.currentUserId = signedInUser.id;
        this.userService.listCompanies().subscribe({
          next: (companiesResponse) => {
            this.companies = companiesResponse.data;
            this.currentCompanyCode = this.companyCodeFromId(signedInUser.company_id);
          },
          error: () => {
            // Company context only enriches the code and must not block the user list.
          }
        });
      },
      error: () => {
        // Profile context only protects actions on the signed-in account.
      }
    });
  }

  openCreate(content: TemplateRef<unknown>): void {
    this.editingUser = null;
    this.userForm = { ...this.emptyForm(), company_code: this.currentCompanyCode };
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  openEdit(user: ApiUser, content: TemplateRef<unknown>): void {
    this.editingUser = user;
    this.userForm = {
      company_code: this.companyCode(user),
      email: user.email,
      username: user.username ?? '',
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone_number: user.phone_number ?? '',
      avatar_url: user.avatar_url ?? ''
    };
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  saveUser(): void {
    const updatePayload: UserUpdatePayload = {
      email: this.userForm.email.trim(),
      username: this.userForm.username.trim(),
      first_name: this.userForm.first_name.trim(),
      last_name: this.userForm.last_name.trim(),
      phone_number: this.userForm.phone_number.trim(),
      avatar_url: this.userForm.avatar_url.trim() || null
    };
    const wasEditing = Boolean(this.editingUser);
    const request = this.editingUser
      ? this.userService.update(this.editingUser.id, updatePayload)
      : this.userService.create({
          ...updatePayload,
          company_code: this.userForm.company_code.trim(),
          password: this.defaultPassword
        } as UserCreatePayload);

    this.isSaving = true;
    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.modalService.dismissAll();
        this.loadUsers();
        void Swal.fire({
          title: wasEditing ? 'User updated' : 'User created',
          text: wasEditing
            ? 'The user details were updated successfully.'
            : `The user was created with the default password ${this.defaultPassword}.`,
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: (error: Error) => {
        this.isSaving = false;
        void Swal.fire({
          title: wasEditing ? 'Update failed' : 'Creation failed',
          text: error.message || 'The user could not be saved. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  async toggleStatus(user: ApiUser): Promise<void> {
    const isActivating = !user.is_active;
    const result = await Swal.fire({
      title: `${isActivating ? 'Activate' : 'Deactivate'} user?`,
      text: `${this.displayName(user)} will be ${isActivating ? 'allowed to sign in' : 'signed out and prevented from signing in'}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isActivating ? 'Activate' : 'Deactivate',
      cancelButtonText: 'Cancel',
      confirmButtonColor: isActivating ? '#0ab39c' : '#f7b84b',
      cancelButtonColor: '#74788d',
      reverseButtons: true
    });
    if (!result.isConfirmed) {
      return;
    }

    this.actionUserId = user.id;
    this.userService.updateStatus(user.id, isActivating).subscribe({
      next: () => {
        this.actionUserId = '';
        this.loadUsers();
        void Swal.fire({
          title: isActivating ? 'User activated' : 'User deactivated',
          text: `${this.displayName(user)} was ${isActivating ? 'activated' : 'deactivated'} successfully.`,
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: () => {
        this.actionUserId = '';
        void Swal.fire({
          title: 'Status update failed',
          text: 'The user status could not be updated. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  async deleteUser(user: ApiUser): Promise<void> {
    const result = await Swal.fire({
      title: 'Delete user?',
      text: `${this.displayName(user)} will lose access and their sessions will be revoked.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete user',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d',
      reverseButtons: true,
      focusCancel: true
    });
    if (!result.isConfirmed) {
      return;
    }

    this.actionUserId = user.id;
    this.userService.delete(user.id).subscribe({
      next: () => {
        this.actionUserId = '';
        this.loadUsers();
        void Swal.fire({
          title: 'User deleted',
          text: `${this.displayName(user)} was deleted successfully.`,
          icon: 'success',
          confirmButtonColor: '#0ab39c'
        });
      },
      error: () => {
        this.actionUserId = '';
        void Swal.fire({
          title: 'Delete failed',
          text: 'The user could not be deleted. Please try again.',
          icon: 'error',
          confirmButtonColor: '#f06548'
        });
      }
    });
  }

  companyCode(user: ApiUser): string {
    return this.companyCodeFromId(user.company_id) || '—';
  }

  displayName(user: ApiUser): string {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return name || user.username || user.email;
  }

  initials(user: ApiUser): string {
    const values = [user.first_name, user.last_name].filter(Boolean) as string[];
    return values.length
      ? values.map((value) => value.charAt(0)).join('').slice(0, 2).toUpperCase()
      : (user.username || user.email).slice(0, 2).toUpperCase();
  }

  onAvatarError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.classList.add('d-none');
    image.nextElementSibling?.classList.remove('d-none');
  }

  private companyCodeFromId(companyId: string): string {
    return this.companies.find((company) => company.id === companyId)?.company_code ?? '';
  }

  private async showRetryAlert(message: string): Promise<void> {
    const result = await Swal.fire({
      title: 'Unable to load users',
      text: message,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Retry',
      cancelButtonText: 'Close',
      confirmButtonColor: '#405189',
      cancelButtonColor: '#74788d'
    });
    if (result.isConfirmed) {
      this.loadUsers();
    }
  }

  private emptyForm(): UserForm {
    return {
      company_code: '',
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      avatar_url: ''
    };
  }
}

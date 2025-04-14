import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import * as bootstrap from 'bootstrap';
import { AccountsService } from '../accounts.service';
import { AuthService } from '../../../../Auth/Auth.service';
import { Accounts } from '../../../../Auth/Accounts.model';

@Component({
  selector: 'app-accounts-info',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxPaginationModule],
  templateUrl: './accounts-info.component.html',
  styleUrl: './accounts-info.component.css'
})
export class AccountsInfoComponent {
  accounts: Accounts[] = [];
  accountsForm: Accounts = {
    id_account: 0,
    username: '',
    password: '',
    email: '',
    fullname: '',
    role: '',
    status: '',
    create_at: '', // Sử dụng kiểu Date cho datetime
    refreshToken: '',
    refreshTokenExpiry: '',
    verificationCode: '',
    codeExpiry: '',
  };

  loggedInUsername: string | null = null;
  searchQuery: string = '';
  page: number = 1;
  pageSize: number = 8;

  isEditMode: boolean = false;
  successMessage: string = '';

  loggedInId: number | null = null; // Lưu ID của tài khoản đăng nhập

  constructor(
    private accountsService: AccountsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loggedInUsername = localStorage.getItem('username'); // Lấy username đang đăng nhập
    if (this.loggedInUsername) {
      this.loadUserAccount();
    }
  }


  // Lấy thông tin tài khoản theo username
  loadUserAccount(): void {
    this.accountsService.GetAccounts().subscribe({
      next: (accounts) => {
        const userAccount = accounts.find(acc => acc.username === this.loggedInUsername);
        if (userAccount) {
          this.loggedInId = userAccount.id_account; // Lưu ID để gọi API chi tiết
          this.getAccountDetails(this.loggedInId);
        } else {
          console.error('Không tìm thấy tài khoản đăng nhập.');
        }
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách tài khoản:', err);
      }
    });
  }

  // Lấy thông tin tài khoản chi tiết theo ID
  getAccountDetails(id: number): void {
    this.accountsService.GetAccountsById(id).subscribe({
      next: (account) => {
        this.accountsForm = account; // Gán dữ liệu vào accountsForm
      },
      error: (err) => {
        console.error('Lỗi khi lấy thông tin theo ID:', err);
      }
    });
  }


  // Mở modal chỉnh sửa thông tin cá nhân
  openEditProfileModal(): void {
    this.isEditMode = true;
    this.accountsForm = { ...this.accountsForm }; 
    const modalElement = document.getElementById('editProfileModal');
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  }

  saveAccounts_Update(): void {
    console.log('Dữ liệu gửi đi:', this.accountsForm);

    this.accountsService.UpdateAccount(this.accountsForm.id_account, this.accountsForm).subscribe({
        next: (response) => {
            console.log('Sửa tài khoản thành công:', response);
            this.loadUserAccount(); // Load lại danh sách
            this.showSuccessMessage("Sửa tài khoản thành công!");
            setTimeout(() => {
              this.closeModal_update();
            }, 2000);
        },
        error: (err) => {
            console.error('Lỗi khi sửa tài khoản:', err);
            this.showSuccessMessage("Lỗi khi sửa tài khoản: " + (err.error?.message || err.message));
        }
    });
  }

  closeModal_update(): void {
    const modalElement = document.getElementById('editProfileModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance?.hide();
    }
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  /***********************************Cập nhật mật khẩu*******************************/
  changePasswordForm = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

    // Mở modal thay đổi mật khẩu
  openChangePasswordModal(): void {
    this.isEditMode = true;
    this.changePasswordForm = { ...this.changePasswordForm }; 
    const modalElement = document.getElementById('changePasswordModal');
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  }

  updatePassword(): void {
    if (this.changePasswordForm.newPassword !== this.changePasswordForm.confirmPassword) {
      alert("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    const requestData = {
      id_account: this.accountsForm.id_account,
      oldPassword: this.changePasswordForm.oldPassword,
      newPassword: this.changePasswordForm.newPassword
    };

    this.accountsService.UpdatePassword(requestData).subscribe({
      next: (response) => {
        this.showSuccessMessage("Mật khẩu đã được thay đổi thành công!");
        this.loadUserAccount(); // Load lại danh sách
            setTimeout(() => {
              this.closeModal();
            }, 2000);
      },
      error: (err) => {
        this.showSuccessMessage(err.error?.message || "Lỗi khi cập nhật mật khẩu");
      }
    });
  }

  closeModal(): void {
    const modalElement = document.getElementById('changePasswordModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance?.hide();
    }
  }

  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  togglePasswordVisibility(type: string): void {
    if (type === 'old') {
      this.showOldPassword = !this.showOldPassword;
    } else if (type === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else if (type === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

}

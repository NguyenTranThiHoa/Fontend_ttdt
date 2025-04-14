import { Component, OnInit } from '@angular/core';
import { AccountsService } from '../accounts.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import * as bootstrap from 'bootstrap';
import { AuthService } from '../../../../Auth/Auth.service';
import { Accounts } from '../../../../Auth/Accounts.model';
import { AssignPermissions } from '../assignPermissions.model';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxPaginationModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsListComponent implements OnInit {
  accounts: Accounts[] = [];
  searchQuery: string = '';
  page: number = 1;
  pageSize: number = 8;

  isEditMode: boolean = false;
  successMessage: string = '';
  
  selectedAccountId: number | null = null;

  selectedRole: string | null = null;
  isAdminAllowedToChangeRole: boolean = false;

  role: string | null = null;

  isAdmin: boolean = false;
  isManager: boolean = false;


  selectedManagerId: number | null = null;
  
  // loggedInUserId: number | null = null; // Lưu tên tài khoản đã đăng nhập

  permissions!: AssignPermissions; // Không gán giá trị mặc định
  loggedInUserRole: string = ''; // Thêm dòng này vào
  loggedInUserId: number = 0;    // Nếu chưa khai báo thì thêm luôn

  constructor(
    private accountsService: AccountsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loggedInUsername = localStorage.getItem('username'); // Lấy username từ localStorage
    this.loadManagers();
    this.role = localStorage.getItem('role'); // Kiểm tra role từ LocalStorage
    

    this.role = localStorage.getItem('role'); // Lấy vai trò từ localStorage

    this.isAdmin = this.role === 'Admin';
    this.isManager = this.role === 'Manager';

    this.loggedInUserId = Number(localStorage.getItem('id_account')); 

    if (this.isManager && this.loggedInUserId) {
      this.loadPermissions(this.loggedInUserId); // 🔥 Tự động lấy quyền của Manager
    }

    this.loggedInUserRole = localStorage.getItem('role') || '';
    this.loggedInUserId = Number(localStorage.getItem('id_account')) || 0;

    if (this.loggedInUserRole === 'Manager') {
      const storedPermissions = localStorage.getItem('permissions');
      this.permissions = storedPermissions ? JSON.parse(storedPermissions) : {};
    }
     
    this.loadAccounts();

    // Gọi API lấy thông tin tài khoản đang đăng nhập để kiểm tra vai trò
    this.accountsService.GetAccounts().subscribe({
        next: (data) => {
            const loggedInUser = data.find(account => account.username === this.loggedInUsername);
            if (loggedInUser) {
                this.isManager = loggedInUser.role === 'Manager'; // Nếu là Manager thì set true
            }
        },
        error: (err) => {
            console.error('Lỗi khi lấy danh sách tài khoản:', err);
        }
    });
  }

  loadAccounts(): void {
    this.accountsService.GetAccounts().subscribe({
      next: (data) => {
        this.accounts = data;
        console.log('Accounts:', this.accounts);
      },
      error: (err) => {
        console.error('Error fetching accounts:', err);
      }
    });
  }

  get filteredAccounts(): Accounts[] {
    if (!this.searchQuery) {
      return this.accounts;
    }
    return this.accounts.filter(account =>
      account.username.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  showModal(modalId: string, message?: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
    if (message) {
      this.successMessage = message; // Lưu thông báo để hiển thị
    }
  }

  hideModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  getModalInstance(modalId: string): bootstrap.Modal | null {
    const modalElement = document.getElementById(modalId);
    return modalElement ? bootstrap.Modal.getInstance(modalElement) : null;
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  /***************Phân trang***************/
  get totalPages(): number {
    return Math.ceil(this.filteredAccounts.length / this.pageSize);
  }

  getPaginationArray(): number[] {
      return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  /******************************Vô hiệu hóa tài khoản****************************/
  selectedAccount: Accounts | null = null;

  disableAccount(account: Accounts): void {
    if (account.status === 'Inactive') return; // Không cho phép nếu đã bị vô hiệu hóa trước đó.

    this.selectedAccount = account; // Lưu tài khoản được chọn
    this.showModal('confirmDisableModal'); // Hiển thị modal xác nhận
  }

  confirmDisableAccount(): void {
    if (!this.selectedAccount) return;

    this.accountsService.DisableAccount(this.selectedAccount.id_account).subscribe({
      next: () => {
        this.selectedAccount!.status = 'Inactive'; // Cập nhật trạng thái trên giao diện
        this.showSuccessMessage(`Tài khoản ${this.selectedAccount!.username} đã bị vô hiệu hóa.`);
        this.hideModal('confirmDisableModal'); // Đóng modal sau khi cập nhật thành công
      },
      error: (err) => {
        console.error("Lỗi khi vô hiệu hóa tài khoản:", err);
      }
    });
  }

  /******************Kiểm tra danh sách********************/
  loggedInUsername: string | null = null; // Lưu tên tài khoản đã đăng nhập

  /****************Nâng cấp tài khoản lên Admin***********************/
  openUpgradeModal(account: Accounts): void {
    // Nếu tài khoản đang đăng nhập trùng với tài khoản cần nâng cấp, báo lỗi
    if (account.username === this.loggedInUsername) {
        this.showModal('warningModal', `Bạn không thể tự nâng cấp tài khoản của chính mình.`);
        return;
    }
    this.selectedAccount = account;
    const modalElement = document.getElementById('confirmUpgradeModal');
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  }

  confirmUpgradeToAdmin(): void {
    if (!this.selectedAccount) return;

    this.accountsService.UpgradeToAdmin(this.selectedAccount.id_account).subscribe({
      next: () => {
        this.selectedAccount!.role = 'Admin'; // Cập nhật UI ngay lập tức
        this.showSuccessMessage(`Tài khoản ${this.selectedAccount!.username} đã được nâng cấp thành Admin.`);

        // Ẩn modal sau khi thành công
        const modalElement = document.getElementById('confirmUpgradeModal');
        if (modalElement) {
          const modalInstance = bootstrap.Modal.getInstance(modalElement);
          modalInstance?.hide();
        }
      },
      error: (err) => {
        console.error("Lỗi khi nâng cấp tài khoản:", err);
      }
    });
  }

  /***********************************************/
  // permissions: AssignPermissions = {
  //   managerId: 0,
  //   canAddUser: false,
  //   canEditUser: false,
  //   canDeleteUser: false,
  //   canManageRoles: false,
  //   canManagePermissions: false,
  //   canViewUsers: true
  // };

  // permissions: AssignPermissions | null = null; // Không có giá trị mặc định
  
  permissionList = [
    { name: 'Thêm tài khoản', key: 'canAddUser' },
    { name: 'Sửa tài khoản', key: 'canEditUser' },
    { name: 'Xóa tài khoản', key: 'canDeleteUser' },
    // { name: 'Quản lý vai trò', key: 'canManageRoles' },
    // { name: 'Quản lý quyền', key: 'canManagePermissions' }
  ];

  selectedManager: Accounts | null = null;

  managers: Accounts[] = []; // Danh sách tất cả Manager
  selectManager(manager: Accounts): void {
    this.selectedManager = manager;
    this.loadAccounts();
  }

  loadManagers(): void {
    this.accountsService.GetAccounts().subscribe({
      next: (data) => {
        console.log("Danh sách tất cả tài khoản:", data); // 🛠 Kiểm tra tất cả tài khoản
        this.managers = data.filter(account => account.role === 'Manager');
        console.log("Danh sách tài khoản Manager:", this.managers); // 🛠 Kiểm tra danh sách Manager
        
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách Managers:', err);
      }
    });
  }

  onManagerChange(): void {
    console.log("Manager ID được chọn trước khi ép kiểu:", this.selectedManagerId);

    // Ép kiểu về số
    const managerId = Number(this.selectedManagerId);

    console.log("Manager ID sau khi ép kiểu:", managerId);

    if (!managerId) {
      this.selectedManager = null;
      return;
    }

    // Tìm Manager theo ID
    this.selectedManager = this.managers.find(m => m.id_account === managerId) || null;

    console.log("Manager được chọn:", this.selectedManager);

    if (this.selectedManager) {
      this.loadPermissions(this.selectedManager.id_account);
    }
  }


  loadPermissions(managerId: number): void {
    this.accountsService.getPermissionsByManagerId(managerId).subscribe({
      next: (data) => {
        console.log("Quyền nhận được từ API:", data); // 🛠 Kiểm tra dữ liệu từ API
        this.permissions = { ...data, managerId }; // ✅ Cập nhật quyền vào biến permissions
        console.log("Quyền của người dùng hiện tại:", this.permissions); // 🛠 Kiểm tra quyền hiện tại
        
      },
      error: (err) => {
        console.error('Lỗi khi lấy quyền:', err);
      }
    });
  }

  selectedPermissions: AssignPermissions | null = null;

  // Kiểm tra khi hiển thị quyền trên UI, tránh lỗi khi permissions là null
  updatePermission(permissionKey: keyof AssignPermissions, value: boolean): void {
    if (this.permissions) {
      this.permissions[permissionKey] = value;
    }
  }

  savePermissions(): void {
    if (!this.selectedManager || !this.permissions) return;

    const model: AssignPermissions = {
      managerId: this.selectedManager.id_account,
      canAddUser: this.permissions.canAddUser,
      canEditUser: this.permissions.canEditUser,
      canDeleteUser: this.permissions.canDeleteUser
    };

    console.log("Dữ liệu gửi lên API:", model); 
 
    this.accountsService.assignPermissions(model).subscribe({
      next: () => {
        this.showSuccessMessage(`Quyền đã được cập nhật thành công!.`);
        this.closeModal_savePermissions(); // Đóng modal
        this.loadAccounts(); // Load lại dữ liệu mới nhất
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật quyền:', err);
      }
    });
  }

  closeModal_savePermissions() {
    const modalElement = document.getElementById('confirmUpgradeModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal?.hide();
    }
  }

  clearPermissions(): void {
    if (!this.selectedManager) return;

    // Đặt tất cả quyền về false
    Object.keys(this.permissions).forEach(key => {
      if (key !== 'managerId') {
        this.permissions[key] = false;
      }
    });

    console.log("Tất cả quyền đã được đặt lại:", this.permissions); // 🛠 Kiểm tra trong Console
  }

  // isManager: boolean = false; // Kiểm tra nếu tài khoản đăng nhập là Manager


  /*********************************Thêm người dùng*******************************/
  registerModel: { username: string; password: string; email: string; fullname: string; role: string } = {
    username: '',
    password: '',
    email: '',
    fullname: '',
    role: 'Manager'
  };

  openCreateModal() {
    this.registerModel = { // Reset dữ liệu trước khi mở modal
      username: '',
      password: '',
      email: '',
      fullname: '',
      role: 'Manager'
    };
    const modal = new bootstrap.Modal(document.getElementById('accountsModal')!);
    modal.show();
  }

  closeModal() {
    const modalElement = document.getElementById('accountsModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal?.hide();
    }
  }

  saveAccounts(): void {
    console.log('Dữ liệu gửi đi:', this.registerModel);

    this.authService.register(this.registerModel).subscribe({
        next: (response) => {
            console.log('Tạo tài khoản thành công:', response);
            this.showSuccessMessage("Tạo tài khoản thành công!");
            this.closeModal(); // Đóng modal
            this.loadAccounts(); // Load lại dữ liệu mới nhất
      },
        error: (err) => {
            console.error('Lỗi khi tạo tài khoản:', err);
            this.showSuccessMessage("Lỗi khi tạo tài khoản: " + (err.error?.message || err.message));
        }
    });
  }

  /*********************************Sửa người dùng**************************/

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

  openEditModal(account: Accounts): void {
      this.isEditMode = true;
      this.accountsForm = { ...account }; // Sao chép dữ liệu tài khoản được chọn
      console.log('Tài khoản đang chỉnh sửa:', this.accountsForm);
      this.showModal('updateAccountsModal');
  }

  closeModal_update() {
    const modalElement = document.getElementById('updateAccountsModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal?.hide();
    }

    // ✅ Reset dữ liệu khi đóng modal
    this.accountsForm = { 
        id_account: 0,
        username: '',
        password: '',
        email: '',
        fullname: '',
        role: '',
        status: '',
        create_at: '',
        refreshToken: '',
        refreshTokenExpiry: '',
        verificationCode: '',
        codeExpiry: '',
    };
  }

  saveAccounts_Update(): void {
    console.log('Dữ liệu gửi đi:', this.accountsForm);

    this.accountsService.UpdateAccount(this.accountsForm.id_account, this.accountsForm).subscribe({
        next: (response) => {
            console.log('Sửa tài khoản thành công:', response);
            this.showSuccessMessage("Sửa tài khoản thành công!");
            this.closeModal_update(); // Đóng modal
            this.loadAccounts(); // Load lại danh sách
        },
        error: (err) => {
            console.error('Lỗi khi sửa tài khoản:', err);
            this.showSuccessMessage("Lỗi khi sửa tài khoản: " + (err.error?.message || err.message));
        }
    });
  }

  /*************************************Xóa tài khoản*********************************/
  openDeleteModal(account: Accounts): void {
    if (account.status !== "Inactive") {
        alert("Chỉ có thể xóa tài khoản đã bị vô hiệu hóa.");
        return;
    }

    this.selectedAccount = account;
    const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal')!);
    modal.show();
  }

  closeModal_delete() {
    const modalElement = document.getElementById('confirmDeleteModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal?.hide();
    }
  }

  confirmDeleteAccount(): void {
    if (!this.selectedAccount) return;

    this.accountsService.DeleteAccount(this.selectedAccount.id_account).subscribe({
      next: (res) => {
        this.showSuccessMessage(`Xóa tài khoản thành công!.`);

        this.closeModal_delete(); // Đóng modal    
        this.loadAccounts(); // Cập nhật danh sách sau khi xóa
      },
        error: (err) => {
            console.error("Lỗi khi xóa tài khoản:", err);
            this.showSuccessMessage(err.error?.message || "Xóa tài khoản thất bại.");
        }
    });
  }

}

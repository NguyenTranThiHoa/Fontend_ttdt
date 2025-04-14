import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../Auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginModel: { username: string; password: string } = { username: '', password: '' };
  error: string | null = null;
  successMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  // Biến để điều khiển việc hiển thị mật khẩu
  passwordVisible: boolean = false;

  // Hàm chuyển đổi giữa hiển thị và ẩn mật khẩu
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
  
  onLogin() {
    this.authService.login(this.loginModel).subscribe(
      res => {
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken); // Nếu có
        localStorage.setItem('role', res.role);
        localStorage.setItem('username', this.loginModel.username); // Thêm dòng này
        localStorage.setItem('id_account', res.id_account.toString()); // 🔹 Lưu ID tài khoản

         // Nếu là Manager, gọi API lấy quyền
        if (res.role === 'Manager') {
          this.authService.getPermissionsByManagerId(res.id_account).subscribe((permissions) => {
            localStorage.setItem('permissions', JSON.stringify(permissions));
          });
        }

        this.successMessage = 'Đăng nhập thành công!';
        setTimeout(() => {
          if (res.role === 'Admin' || res.role === 'Manager') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']);
          }
        }, 1500);
      },
      err => {
        this.error = 'Sai tên đăng nhập hoặc mật khẩu';
      }
    );
  }
}
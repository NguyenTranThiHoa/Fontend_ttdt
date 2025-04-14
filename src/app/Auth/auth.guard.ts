import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './Auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      console.warn("🚨 Không tìm thấy token, điều hướng về đăng nhập.");
      this.authService.logout();
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (!role || (role !== 'Admin' && role !== 'Manager')) {
      console.warn("🚨 Quyền không hợp lệ:", role);
      this.authService.logout();
      this.router.navigate(['/auth/login']);
      return false;
    }

    return true;
  }
}
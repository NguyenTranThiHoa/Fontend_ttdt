import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../Auth.service';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerModel: { username: string; password: string; email: string; fullname: string; role: string } = {
    username: '',
    password: '',
    email: '',
    fullname: '',
    role: 'Manager'
  };
  error: string | null = null;
  successMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    this.authService.register(this.registerModel).subscribe(
      res => {
        this.successMessage = 'Đăng ký thành công! Vui lòng đăng nhập.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      err => {
        this.error = 'Có lỗi xảy ra khi đăng ký, vui lòng thử lại.';
      }
    );
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { ForgotpasswordService } from './forgotpassword.service';
import * as bootstrap from 'bootstrap';
import { ForgotPasswordModel } from './forgotpassword.model';
import { VerifyResetCodeModel } from './verifyresetcode.model';

@Component({
  selector: 'app-forgotpassword',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxPaginationModule],
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.css']
})
export class ForgotpasswordComponent {

  forgotpassword: ForgotPasswordModel = { email: '' };
  newPassword: string = '';
  verificationModal: any;
  successMessage = '';

  // Model chứa thông tin nhập mã xác nhận
  verificationCodeModel: VerifyResetCodeModel = {
    email: '',
    code: '',
    newPassword: ''
  };

  // Mã xác nhận gồm 5 số (để binding với input)
  verificationCode: string[] = ['', '', '', '', ''];

  constructor(private forgotPasswordService: ForgotpasswordService) { }
  
  showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000); // Ẩn thông báo sau 3 giây
  }

  // Gửi mã xác nhận về email
  sendVerificationCode(): void {
    if (!this.forgotpassword.email || !this.newPassword) {
        alert('Vui lòng nhập email và mật khẩu mới.');
        return;
    }

    this.forgotPasswordService.sendResetCode(this.forgotpassword).subscribe({
        next: () => {
            this.showSuccessMessage('Mã xác nhận đã được gửi đến email của bạn.');
            this.verificationCodeModel.email = this.forgotpassword.email; 
            this.verificationCodeModel.newPassword = this.newPassword;
            this.showModal('verifyCodeModal');
        },
        error: (err) => {
            console.error('Lỗi khi gửi mã xác nhận:', err);
            alert('Không thể gửi mã xác nhận, kiểm tra lại email.');
        }
    });
  }


  // Kiểm tra mã xác nhận và đổi mật khẩu
  verifyCode(): void {
    this.verificationCodeModel.code = this.verificationCode.join('');

    if (this.verificationCodeModel.code.length !== 5) {
        alert('Mã xác nhận phải gồm 5 chữ số.');
        return;
    }

    this.forgotPasswordService.verifyResetCode(this.verificationCodeModel).subscribe({
        next: () => {
            this.showSuccessMessage('Mật khẩu đã được cập nhật thành công.');
            this.hideModal('verifyCodeModal');
        },
        error: (err) => {
            console.error('Lỗi khi xác nhận mã:', err);
            alert('Mã xác nhận không hợp lệ hoặc đã hết hạn.');
        }
    });
  }

  resendVerificationCode(): void {
    if (!this.forgotpassword.email) {
        this.showSuccessMessage('Không tìm thấy email, vui lòng nhập lại.');
        return;
    }

    this.forgotPasswordService.sendResetCode(this.forgotpassword).subscribe({
        next: () => {
            this.showSuccessMessage('Mã xác nhận đã được gửi lại.');
        },
        error: (err) => {
            console.error('Lỗi khi gửi lại mã:', err);
            this.showSuccessMessage('Không thể gửi lại mã xác nhận, vui lòng thử lại.');
        }
    });
  }



  // Hiển thị modal
  showModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      try {
        this.verificationModal = new bootstrap.Modal(modalElement);
        this.verificationModal.show();
      } catch (error) {
        console.error("Lỗi khi hiển thị modal:", error);
      }
    }
  }

  // Ẩn modal
  hideModal(modalId: string): void {
    if (this.verificationModal) {
      this.verificationModal.hide();
    }
  }

  // Chuyển sang ô input tiếp theo sau khi nhập
  moveToNext(event: any, index: number): void {
    if (event.target.value.length === 1 && index < this.verificationCode.length) {
      const nextInput = document.querySelectorAll('input')[index] as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  // Ẩn và mở con mắt mật khẩu
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


  // Khi nhập số, tự nhảy qua ô kế tiếp nếu là số
  onInput(event: any, index: number): void {
    const value = event.target.value;
    // Chỉ cho nhập số, nếu không phải số thì xóa
    if (!/^[0-9]$/.test(value)) {
      event.target.value = '';
      this.verificationCode[index] = '';
      return;
    }

    this.verificationCode[index] = value;

    // Tự nhảy qua ô tiếp theo nếu chưa phải ô cuối
    const inputs = document.querySelectorAll('.modal-body input');
    if (index < inputs.length - 1) {
      (inputs[index + 1] as HTMLInputElement).focus();
    }
  }

  // Khi nhấn phím Backspace thì quay lại ô trước
  onKeyDown(event: KeyboardEvent, index: number): void {
    const inputs = document.querySelectorAll('.modal-body input');

    if (event.key === 'Backspace') {
      if (this.verificationCode[index] === '') {
        if (index > 0) {
          (inputs[index - 1] as HTMLInputElement).focus();
        }
      } else {
        this.verificationCode[index] = '';
      }
    }
  }
}

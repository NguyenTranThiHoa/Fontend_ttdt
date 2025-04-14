export interface Accounts {
    id_account: number;
    username: string;
    password: string;
    email: string;
    fullname: string;
    role: string;
    status: string;
    create_at: string; // Sử dụng kiểu Date cho datetime
    refreshToken: string;
    refreshTokenExpiry: string;
    verificationCode: string;
    codeExpiry: string;

    permissions?: {
    canAddUser?: boolean;
    canEditUser?: boolean;
    canDeleteUser?: boolean;
  };
}


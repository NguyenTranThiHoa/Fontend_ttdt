export interface AssignPermissions {
    managerId: number;
    canAddUser: boolean;
    canEditUser: boolean;
    canDeleteUser: boolean;
    // canManageRoles: boolean;
    // canManagePermissions: boolean;
    // canViewUsers: boolean;

    // ✅ Thêm index signature để TypeScript cho phép truy cập bằng key
    [key: string]: boolean | number;
}

export interface Procedure {
    id_procedures: number;    
    id_thutuc: string;           
    name_procedures: string;
    id_Field: number;
    description: string;  
    date_issue: string;       
    create_at: string;  
    id_account: number;           
    formatText: string;
    selected?: boolean;    
    isVisible: boolean; // ✅ Thêm trạng thái ẩn/hiện
    categoryName?: string;
}

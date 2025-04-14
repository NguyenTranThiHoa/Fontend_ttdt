export interface Documents {
    id_document: number;
    title: string;
    file_path: string;
    description_short: string;
    description: string;
    create_at: string; 
    id_account: number;
    view_documents: number;
    id_category_document: number | null; // Giữ nguyên tên này
    selected?: boolean;  
    isVisible: boolean; // ✅ Thêm trạng thái ẩn/hiện
    categoryName?: string;
}


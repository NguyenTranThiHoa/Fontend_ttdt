export interface News_Events {
    id_newsevent: number;    
    title: string;           // Tiêu đề của tin tức/sự kiện
    description_short: string;
    content: string;         // Nội dung của tin tức/sự kiện  
    id_account: number;      // ID của tài khoản
    image: string;           // Đường dẫn hình ảnh    // Ngày kết thúc (ISO 8601 format)
    create_at: string;       // Ngày tạo (ISO 8601 format)
    formatted_content: string;
    view: number;
    id_categories: number;
    selected?: boolean;      // Thuộc tính tùy chọn để đánh dấu
    isVisible: boolean; // ✅ Thêm trạng thái ẩn/hiện
    categoryName?: string;
}

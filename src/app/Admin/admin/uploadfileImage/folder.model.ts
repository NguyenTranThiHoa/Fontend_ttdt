export interface Folder {
    id_folder: number;    
    name_folder: string;           
    parentId: number | null; 
    children: Folder[];     
    createdAt: string;      
    isExpanded?: boolean; // Thêm thuộc tính này
}
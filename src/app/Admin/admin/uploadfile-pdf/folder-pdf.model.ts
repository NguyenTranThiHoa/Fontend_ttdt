export interface FolderPdf {
    id_folder_pdf: number;    
    name_folder: string;           
    parentId: number | null; 
    children: FolderPdf[];     
    createdAt: string;      
    isExpanded?: boolean;
}
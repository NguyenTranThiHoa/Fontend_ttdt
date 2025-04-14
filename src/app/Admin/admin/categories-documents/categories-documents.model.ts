export interface Category_documents  {
    id_category_document: number;
    name_category_document: string;
    documentParentId: number | null;
    selected?: boolean; 
    children: Category_documents[]; 
}

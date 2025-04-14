export interface Categories {
    id_categories: number;
    name_category: string;
    parentId: number | null; 
    selected?: boolean; 
    children: Categories[]; 
}
export interface Categogy_field{
    id_Field: number;
    name_Field: string;
    fielParentId: number | null; 
    selected?: boolean; 
    children: Categogy_field[]; 
}
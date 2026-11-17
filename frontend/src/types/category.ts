export interface Category {
  id: string;
  name: string;
  color: string | null;
}

export interface CategoryInput {
  name: string;
  color?: string;
}

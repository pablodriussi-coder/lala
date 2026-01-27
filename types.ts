
export enum MaterialUnit {
  METERS = 'm',
  UNITS = 'u',
  KILOGRAMS = 'kg'
}

export interface Material {
  id: string;
  name: string;
  unit: MaterialUnit;
  costPerUnit: number;
  widthCm?: number; 
}

export interface ProductMaterialRequirement {
  materialId: string;
  quantity: number; 
  widthCm?: number; 
  heightCm?: number; 
}

export interface DesignOption {
  id: string;
  name: string;
  image?: string; // Base64 de la tela
}

export interface Category {
  id: string;
  name: string;
  image?: string; // Imagen representativa para la tienda
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId?: string; // Relación con la categoría
  materials: ProductMaterialRequirement[];
  baseLaborCost: number;
  images?: string[]; 
  designOptions?: DesignOption[]; 
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface QuoteItem {
  productId: string;
  quantity: number;
  customPrice?: number;
  selectedDesign?: string; 
}

export interface Quote {
  id: string;
  clientId: string;
  items: QuoteItem[];
  profitMarginPercent: number;
  createdAt: number;
  totalCost: number;
  totalPrice: number;
  status: 'pending' | 'accepted' | 'rejected';
  discountValue?: number;
  discountReason?: string;
}

export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 'venta' | 'materia_prima' | 'mantenimiento' | 'servicios' | 'alquiler' | 'otros' | 'capital_inicial';

export interface Transaction {
  id: string;
  date: number;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
}

export interface AppData {
  materials: Material[];
  products: Product[];
  categories: Category[]; // Nueva sección de datos
  clients: Client[];
  quotes: Quote[];
  transactions: Transaction[];
  settings: {
    brandName: string;
    defaultMargin: number;
    whatsappNumber: string;
    initialFunds?: number;
  };
}

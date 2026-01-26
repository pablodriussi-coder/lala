
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
  widthCm?: number; // Para telas (ancho comercial)
}

export interface ProductMaterialRequirement {
  materialId: string;
  quantity: number; // Para unidades o kg
  widthCm?: number; // Para cortes de tela
  heightCm?: number; // Para cortes de tela
}

export interface Product {
  id: string;
  name: string;
  description: string;
  materials: ProductMaterialRequirement[];
  baseLaborCost: number;
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
  clients: Client[];
  quotes: Quote[];
  transactions: Transaction[];
  settings: {
    brandName: string;
    defaultMargin: number;
    initialFunds?: number;
  };
}

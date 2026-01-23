
import { AppData, Material, Product, Client, Quote } from './types';

const STORAGE_KEY = 'lala_accesorios_data';

const INITIAL_DATA: AppData = {
  materials: [],
  products: [],
  clients: [],
  quotes: [],
  settings: {
    brandName: 'Lala accesorios',
    defaultMargin: 50
  }
};

export const loadData = (): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing saved data", e);
    }
  }
  return INITIAL_DATA;
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

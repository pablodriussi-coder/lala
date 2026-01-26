
import { AppData, Material, Product, Client, Quote, Transaction, Receipt } from './types';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'lala_master_data';

const INITIAL_DATA: AppData = {
  materials: [],
  products: [],
  clients: [],
  quotes: [],
  receipts: [],
  transactions: [],
  settings: {
    brandName: 'Lala accesorios',
    defaultMargin: 50,
    whatsappNumber: '5491122334455'
  }
};

const getLocal = (): AppData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return INITIAL_DATA;
    }
  }
  return INITIAL_DATA;
};

const saveLocal = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const fetchAllData = async (): Promise<AppData> => {
  const localData = getLocal();
  
  try {
    // Intentar cargar de Supabase con un tiempo límite corto
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const results = await Promise.all([
      supabase.from('materials').select('*'),
      supabase.from('products').select('*, product_materials(*)'),
      supabase.from('clients').select('*'),
      supabase.from('quotes').select('*, quote_items(*)'),
      supabase.from('receipts').select('*, receipt_items(*)'),
      supabase.from('transactions').select('*')
    ]);

    clearTimeout(timeoutId);

    const [
      { data: materials, error: e1 },
      { data: products, error: e2 },
      { data: clients, error: e3 },
      { data: quotes, error: e4 },
      { data: receipts, error: e5 },
      { data: transactions, error: e6 }
    ] = results;

    if (e1 || e2 || e3 || e4 || e5 || e6) throw new Error("Supabase connection issues");

    const cloudData: AppData = {
      materials: (materials || []).map((m: any) => ({
        ...m,
        costPerUnit: Number(m.cost_per_unit) || 0,
        widthCm: m.width_cm ? Number(m.width_cm) : undefined
      })),
      products: (products || []).map((p: any) => ({
        ...p,
        baseLaborCost: Number(p.base_labor_cost) || 0,
        imageUrl: p.image_url,
        materials: (p.product_materials || []).map((pm: any) => ({
          materialId: pm.material_id,
          quantity: Number(pm.quantity) || 0,
          widthCm: pm.width_cm ? Number(pm.width_cm) : undefined,
          heightCm: pm.height_cm ? Number(pm.height_cm) : undefined
        }))
      })),
      clients: clients || [],
      quotes: (quotes || []).map((q: any) => ({
        ...q,
        totalCost: Number(q.total_cost) || 0,
        totalPrice: Number(q.total_price) || 0,
        profitMarginPercent: Number(q.profit_margin_percent) || 0,
        discountValue: Number(q.discount_value || 0),
        clientId: q.client_id,
        createdAt: q.created_at ? new Date(q.created_at).getTime() : Date.now(),
        items: (q.quote_items || []).map((qi: any) => ({
          productId: qi.product_id,
          quantity: Number(qi.quantity) || 0
        }))
      })),
      receipts: (receipts || []).map((r: any) => ({
        ...r,
        totalPrice: Number(r.total_price) || 0,
        discountValue: Number(r.discount_value || 0),
        createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
        clientId: r.client_id,
        quoteId: r.quote_id,
        items: (r.receipt_items || []).map((ri: any) => ({
          productId: ri.product_id,
          quantity: Number(ri.quantity) || 0
        }))
      })),
      transactions: (transactions || []).map((t: any) => ({
        ...t, 
        amount: Number(t.amount) || 0,
        date: t.date ? (isNaN(Number(t.date)) ? new Date(t.date).getTime() : Number(t.date)) : Date.now()
      })),
      settings: localData.settings // Preferir settings locales
    };

    saveLocal(cloudData);
    return cloudData;
  } catch (error) {
    console.warn("Usando base de datos local (Supabase no responde o URL inválida)");
    return localData;
  }
};

export const syncProduct = async (product: Product) => {
  try {
    await supabase.from('products').upsert({
      id: product.id,
      name: product.name,
      description: product.description,
      base_labor_cost: product.baseLaborCost,
      image_url: product.imageUrl
    });
    await supabase.from('product_materials').delete().eq('product_id', product.id);
    if (product.materials.length > 0) {
      await supabase.from('product_materials').insert(
        product.materials.map(m => ({
          product_id: product.id,
          material_id: m.materialId,
          quantity: m.quantity,
          width_cm: m.widthCm,
          height_cm: m.heightCm
        }))
      );
    }
  } catch (e) {}
};

export const syncQuote = async (quote: Quote) => {
  try {
    await supabase.from('quotes').upsert({
      id: quote.id,
      client_id: quote.clientId,
      profit_margin_percent: quote.profitMarginPercent,
      total_cost: quote.totalCost,
      total_price: quote.totalPrice,
      status: quote.status,
      discount_value: quote.discountValue,
      created_at: new Date(quote.createdAt).toISOString()
    });
    await supabase.from('quote_items').delete().eq('quote_id', quote.id);
    if (quote.items.length > 0) {
      await supabase.from('quote_items').insert(
        quote.items.map(item => ({
          quote_id: quote.id,
          product_id: item.productId,
          quantity: item.quantity
        }))
      );
    }
  } catch (e) {}
};

export const syncReceipt = async (receipt: Receipt) => {
  try {
    await supabase.from('receipts').upsert({
      id: receipt.id,
      quote_id: receipt.quoteId,
      client_id: receipt.clientId,
      total_price: receipt.totalPrice,
      discount_value: receipt.discountValue,
      payment_method: receipt.paymentMethod,
      receipt_number: receipt.receiptNumber,
      created_at: new Date(receipt.createdAt).toISOString()
    });
  } catch (e) {}
};

export const syncMaterialsBatch = async (materials: Material[]) => {
  try {
    await supabase.from('materials').upsert(materials.map(m => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      cost_per_unit: m.costPerUnit,
      width_cm: m.widthCm
    })));
  } catch (e) {}
};

export const syncClientsBatch = async (clients: Client[]) => {
  try { await supabase.from('clients').upsert(clients); } catch (e) {}
};

export const syncTransactionsBatch = async (transactions: Transaction[]) => {
  try {
    await supabase.from('transactions').upsert(transactions.map(t => ({
      ...t,
      date: new Date(t.date).toISOString()
    })));
  } catch (e) {}
};

export const saveFullBackup = (data: AppData) => saveLocal(data);

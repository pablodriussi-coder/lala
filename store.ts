
import { AppData, Material, Product, Client, Quote, Transaction, Receipt } from './types';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'lala_backup_data';

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

// Guardar copia local de seguridad
const saveLocalBackup = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Cargar copia local de seguridad
const getLocalBackup = (): AppData => {
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

export const fetchAllData = async (): Promise<AppData> => {
  console.log("Intentando conectar con Supabase...");
  
  try {
    // Intentamos peticiones con un timeout corto para no bloquear la app
    const fetchWithTimeout = async (promise: Promise<any>, ms: number = 5000) => {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
      return Promise.race([promise, timeout]);
    };

    const results = await Promise.all([
      supabase.from('materials').select('*'),
      supabase.from('products').select('*, product_materials(*)'),
      supabase.from('clients').select('*'),
      supabase.from('quotes').select('*, quote_items(*)'),
      supabase.from('receipts').select('*, receipt_items(*)'),
      supabase.from('transactions').select('*')
    ]);

    // Si llegamos aquí, la conexión funcionó
    const [
      { data: materials },
      { data: products },
      { data: clients },
      { data: quotes },
      { data: receipts },
      { data: transactions }
    ] = results;

    const adaptedData: AppData = {
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
        discountReason: q.discount_reason || '',
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
      settings: INITIAL_DATA.settings
    };

    // Actualizamos el backup local con los datos frescos de la nube
    saveLocalBackup(adaptedData);
    return adaptedData;

  } catch (error) {
    console.warn("No se pudo conectar con Supabase (Error de Red). Cargando datos locales...");
    // Si falla la red, devolvemos el backup local
    return getLocalBackup();
  }
};

// Las funciones de sincronización ahora intentan subir pero no bloquean
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
    await supabase.from('receipt_items').delete().eq('receipt_id', receipt.id);
    if (receipt.items.length > 0) {
      await supabase.from('receipt_items').insert(
        receipt.items.map(item => ({
          receipt_id: receipt.id,
          product_id: item.productId,
          quantity: item.quantity
        }))
      );
    }
  } catch (e) {
    console.error("Error al sincronizar en la nube:", e);
  }
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
      discount_reason: quote.discountReason,
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
  } catch (e) { console.error(e); }
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
  } catch (e) { console.error(e); }
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
    } catch (e) { console.error(e); }
};

export const syncClientsBatch = async (clients: Client[]) => {
    try { await supabase.from('clients').upsert(clients); } catch (e) { console.error(e); }
};

export const syncTransactionsBatch = async (transactions: Transaction[]) => {
    try {
      await supabase.from('transactions').upsert(transactions.map(t => ({
        ...t,
        date: new Date(t.date).toISOString()
      })));
    } catch (e) { console.error(e); }
};

export const deleteFromSupabase = async (table: string, id: string) => {
    try { await supabase.from(table).delete().eq('id', id); } catch (e) { console.error(e); }
};

export const saveFullBackup = (data: AppData) => saveLocalBackup(data);

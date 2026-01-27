
import { AppData, Material, Product, Client, Quote, Transaction } from './types';
import { supabase } from './supabaseClient';

const INITIAL_DATA: AppData = {
  materials: [],
  products: [],
  clients: [],
  quotes: [],
  transactions: [],
  settings: {
    brandName: 'Lala accesorios',
    defaultMargin: 400
  }
};

export const fetchAllData = async (): Promise<AppData> => {
  try {
    const [
      { data: materials, error: mErr },
      { data: products, error: pErr },
      { data: clients, error: cErr },
      { data: quotes, error: qErr },
      { data: transactions, error: tErr }
    ] = await Promise.all([
      supabase.from('materials').select('*'),
      supabase.from('products').select('*, product_materials(*)'),
      supabase.from('clients').select('*'),
      supabase.from('quotes').select('*, quote_items(*)'),
      supabase.from('transactions').select('*')
    ]);

    if (mErr || pErr || cErr || qErr || tErr) {
        console.error("Error cargando tablas:", { mErr, pErr, cErr, qErr, tErr });
    }

    const adaptedProducts = (products || []).map(p => ({
      ...p,
      baseLaborCost: Number(p.base_labor_cost),
      images: Array.isArray(p.images) ? p.images : [], 
      materials: (p.product_materials || []).map((pm: any) => ({
        materialId: pm.material_id,
        quantity: Number(pm.quantity),
        widthCm: pm.width_cm ? Number(pm.width_cm) : undefined,
        heightCm: pm.height_cm ? Number(pm.height_cm) : undefined
      }))
    }));

    const adaptedQuotes = (quotes || []).map(q => ({
      ...q,
      totalCost: Number(q.total_cost),
      totalPrice: Number(q.total_price),
      profitMarginPercent: Number(q.profit_margin_percent),
      discountValue: Number(q.discount_value || 0),
      discountReason: q.discount_reason || '',
      createdAt: new Date(q.created_at).getTime(),
      items: (q.quote_items || []).map((qi: any) => ({
        productId: qi.product_id,
        quantity: Number(qi.quantity)
      }))
    }));

    return {
      materials: (materials || []).map(m => ({
        ...m,
        costPerUnit: Number(m.cost_per_unit),
        widthCm: m.width_cm ? Number(m.width_cm) : undefined
      })),
      products: adaptedProducts,
      clients: clients || [],
      quotes: adaptedQuotes,
      transactions: (transactions || []).map(t => ({
        ...t, 
        amount: Number(t.amount),
        date: Number(t.date)
      })),
      settings: INITIAL_DATA.settings
    };
  } catch (error) {
    console.error('Error crítico en fetchAllData:', error);
    return INITIAL_DATA;
  }
};

export const syncMaterialsBatch = async (materials: Material[]) => {
    const toUpsert = materials.map(m => ({
        id: m.id,
        name: m.name,
        unit: m.unit,
        cost_per_unit: m.costPerUnit,
        width_cm: m.widthCm
    }));
    const { error } = await supabase.from('materials').upsert(toUpsert);
    if (error) alert("Error al guardar materiales: " + error.message);
};

export const syncClientsBatch = async (clients: Client[]) => {
    const { error } = await supabase.from('clients').upsert(clients);
    if (error) alert("Error al guardar clientes: " + error.message);
};

export const syncTransactionsBatch = async (transactions: Transaction[]) => {
    const { error } = await supabase.from('transactions').upsert(transactions);
    if (error) alert("Error al guardar contabilidad: " + error.message);
};

export const syncProduct = async (product: Product) => {
  const productData = {
    id: product.id,
    name: product.name,
    description: product.description,
    base_labor_cost: product.baseLaborCost,
    images: product.images || []
  };

  const { error: pError } = await supabase.from('products').upsert(productData);
  
  if (pError) {
    console.error('Error al sincronizar producto:', pError);
    if (pError.message.includes('images')) {
        alert("⚠️ Error: La columna 'images' no existe en Supabase. Debes ejecutar el comando SQL: ALTER TABLE products ADD COLUMN images text[] DEFAULT '{}';");
    } else {
        alert("Error al guardar producto: " + pError.message);
    }
    return;
  }

  await supabase.from('product_materials').delete().eq('product_id', product.id);
  if (product.materials.length > 0) {
    const { error: pmError } = await supabase.from('product_materials').insert(
      product.materials.map(m => ({
        product_id: product.id,
        material_id: m.materialId,
        quantity: m.quantity,
        width_cm: m.widthCm,
        height_cm: m.heightCm
      }))
    );
    if (pmError) console.error('Error syncing materials for product:', pmError.message);
  }
};

export const syncQuote = async (quote: Quote) => {
  const { error: qError } = await supabase.from('quotes').upsert({
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

  if (qError) return console.error('Error syncing quote:', qError.message);

  await supabase.from('quote_items').delete().eq('quote_id', quote.id);
  if (quote.items.length > 0) {
    const { error: itemsError } = await supabase.from('quote_items').insert(
      quote.items.map(item => ({
        quote_id: quote.id,
        product_id: item.productId,
        quantity: item.quantity
      }))
    );
    if (itemsError) console.error('Error syncing items for quote:', itemsError.message);
  }
};

export const deleteFromSupabase = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.error(`Error eliminando de ${table}:`, error.message);
};

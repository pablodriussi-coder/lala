
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
    defaultMargin: 50
  }
};

export const fetchAllData = async (): Promise<AppData> => {
  try {
    const [
      { data: materials },
      { data: products },
      { data: clients },
      { data: quotes },
      { data: transactions }
    ] = await Promise.all([
      supabase.from('materials').select('*'),
      supabase.from('products').select('*, product_materials(*)'),
      supabase.from('clients').select('*'),
      supabase.from('quotes').select('*, quote_items(*)'),
      supabase.from('transactions').select('*')
    ]);

    // Adaptar estructura de Supabase a los tipos de la App
    const adaptedProducts = (products || []).map(p => ({
      ...p,
      baseLaborCost: Number(p.base_labor_cost),
      materials: p.product_materials.map((pm: any) => ({
        materialId: pm.material_id,
        quantity: pm.quantity,
        widthCm: pm.width_cm,
        heightCm: pm.height_cm
      }))
    }));

    const adaptedQuotes = (quotes || []).map(q => ({
      ...q,
      totalCost: Number(q.total_cost),
      totalPrice: Number(q.total_price),
      profitMarginPercent: Number(q.profit_margin_percent),
      discountValue: Number(q.discount_value),
      discountReason: q.discount_reason,
      createdAt: new Date(q.created_at).getTime(),
      items: q.quote_items.map((qi: any) => ({
        productId: qi.product_id,
        quantity: qi.quantity
      }))
    }));

    return {
      materials: (materials || []).map(m => ({
        ...m,
        costPerUnit: Number(m.cost_per_unit),
        widthCm: m.width_cm
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
    console.error('Error fetching from Supabase:', error);
    return INITIAL_DATA;
  }
};

export const syncTransaction = async (transaction: Transaction) => {
  const { error } = await supabase.from('transactions').upsert({
    id: transaction.id,
    date: transaction.date,
    type: transaction.type,
    category: transaction.category,
    amount: transaction.amount,
    description: transaction.description
  });
  if (error) console.error('Sync error transaction:', error);
};

export const syncMaterial = async (material: Material) => {
  const { error } = await supabase.from('materials').upsert({
    id: material.id,
    name: material.name,
    unit: material.unit,
    cost_per_unit: material.costPerUnit,
    width_cm: material.widthCm
  });
  if (error) console.error('Sync error material:', error);
};

export const syncProduct = async (product: Product) => {
  // 1. Upsert product
  const { error: pError } = await supabase.from('products').upsert({
    id: product.id,
    name: product.name,
    description: product.description,
    base_labor_cost: product.baseLaborCost
  });
  if (pError) return console.error('Sync error product:', pError);

  // 2. Refresh requirements
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
    if (pmError) console.error('Sync error product_materials:', pmError);
  }
};

export const syncClient = async (client: Client) => {
  const { error } = await supabase.from('clients').upsert(client);
  if (error) console.error('Sync error client:', error);
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

  if (qError) return console.error('Sync error quote:', qError);

  await supabase.from('quote_items').delete().eq('quote_id', quote.id);
  if (quote.items.length > 0) {
    const { error: itemsError } = await supabase.from('quote_items').insert(
      quote.items.map(item => ({
        quote_id: quote.id,
        product_id: item.productId,
        quantity: item.quantity
      }))
    );
    if (itemsError) console.error('Sync items error:', itemsError);
  }
};

export const deleteFromSupabase = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.error(`Delete error from ${table}:`, error);
};

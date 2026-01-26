
import { AppData, Material, Product, Client, Quote, Transaction, Receipt } from './types';
import { supabase } from './supabaseClient';

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

export const fetchAllData = async (): Promise<AppData> => {
  try {
    const [
      { data: materials },
      { data: products },
      { data: clients },
      { data: quotes },
      { data: receipts },
      { data: transactions }
    ] = await Promise.all([
      supabase.from('materials').select('*'),
      supabase.from('products').select('*, product_materials(*)'),
      supabase.from('clients').select('*'),
      supabase.from('quotes').select('*, quote_items(*)'),
      supabase.from('receipts').select('*, receipt_items(*)'),
      supabase.from('transactions').select('*')
    ]);

    const adaptedProducts = (products || []).map((p: any) => ({
      ...p,
      baseLaborCost: Number(p.base_labor_cost),
      imageUrl: p.image_url,
      materials: (p.product_materials || []).map((pm: any) => ({
        materialId: pm.material_id,
        quantity: Number(pm.quantity),
        widthCm: pm.width_cm ? Number(pm.width_cm) : undefined,
        heightCm: pm.height_cm ? Number(pm.height_cm) : undefined
      }))
    }));

    const adaptedQuotes = (quotes || []).map((q: any) => ({
      ...q,
      totalCost: Number(q.total_cost),
      totalPrice: Number(q.total_price),
      profitMarginPercent: Number(q.profit_margin_percent),
      discountValue: Number(q.discount_value || 0),
      discountReason: q.discount_reason || '',
      clientId: q.client_id,
      createdAt: new Date(q.created_at).getTime(),
      items: (q.quote_items || []).map((qi: any) => ({
        productId: qi.product_id,
        quantity: Number(qi.quantity)
      }))
    }));

    const adaptedReceipts = (receipts || []).map((r: any) => ({
      ...r,
      totalPrice: Number(r.total_price),
      discountValue: Number(r.discount_value || 0),
      createdAt: new Date(r.created_at).getTime(),
      clientId: r.client_id,
      quoteId: r.quote_id,
      items: (r.receipt_items || []).map((ri: any) => ({
        productId: ri.product_id,
        quantity: Number(ri.quantity)
      }))
    }));

    return {
      materials: (materials || []).map((m: any) => ({
        ...m,
        costPerUnit: Number(m.cost_per_unit),
        widthCm: m.width_cm ? Number(m.width_cm) : undefined
      })),
      products: adaptedProducts,
      clients: clients || [],
      quotes: adaptedQuotes,
      receipts: adaptedReceipts,
      transactions: (transactions || []).map((t: any) => ({
        ...t, 
        amount: Number(t.amount),
        date: Number(t.date)
      })),
      settings: INITIAL_DATA.settings
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return INITIAL_DATA;
  }
};

export const syncReceipt = async (receipt: Receipt) => {
  const { error: rError } = await supabase.from('receipts').upsert({
    id: receipt.id,
    quote_id: receipt.quoteId,
    client_id: receipt.clientId,
    total_price: receipt.totalPrice,
    discount_value: receipt.discountValue,
    payment_method: receipt.paymentMethod,
    receipt_number: receipt.receiptNumber,
    created_at: new Date(receipt.createdAt).toISOString()
  });

  if (rError) console.error("Error syncing receipt:", rError.message);

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

  if (qError) console.error("Error syncing quote:", qError.message);

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
};

export const syncProduct = async (product: Product) => {
  const { error: pError } = await supabase.from('products').upsert({
    id: product.id,
    name: product.name,
    description: product.description,
    base_labor_cost: product.baseLaborCost,
    image_url: product.imageUrl
  });

  if (pError) console.error("Error syncing product:", pError.message);

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
};

export const syncMaterialsBatch = async (materials: Material[]) => {
    await supabase.from('materials').upsert(materials.map(m => ({
        id: m.id,
        name: m.name,
        unit: m.unit,
        cost_per_unit: m.costPerUnit,
        width_cm: m.widthCm
    })));
};

export const syncClientsBatch = async (clients: Client[]) => {
    await supabase.from('clients').upsert(clients);
};

export const syncTransactionsBatch = async (transactions: Transaction[]) => {
    await supabase.from('transactions').upsert(transactions);
};

export const deleteFromSupabase = async (table: string, id: string) => {
    await supabase.from(table).delete().eq('id', id);
};

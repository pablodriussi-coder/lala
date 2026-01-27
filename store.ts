
import { AppData, Material, Product, Client, Quote, Transaction, Category } from './types';
import { supabase } from './supabaseClient';

const INITIAL_DATA: AppData = {
  materials: [],
  products: [],
  categories: [],
  clients: [],
  quotes: [],
  transactions: [],
  settings: {
    brandName: 'Lala accesorios',
    defaultMargin: 400,
    whatsappNumber: '5491100000000',
    shopBannerText: 'Confecciones artesanales hechas con amor para tu bebé'
  }
};

export const fetchAllData = async (): Promise<AppData> => {
  try {
    const [
      { data: materials },
      { data: products },
      { data: categories },
      { data: clients },
      { data: quotes },
      { data: transactions },
      { data: settingsData }
    ] = await Promise.all([
      supabase.from('materials').select('*'),
      supabase.from('products').select('*, product_materials(*)'),
      supabase.from('categories').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('quotes').select('*, quote_items(*)'),
      supabase.from('transactions').select('*'),
      supabase.from('settings').select('*').eq('id', 'default').single()
    ]);

    const adaptedProducts = (products || []).map(p => ({
      ...p,
      categoryId: p.category_id,
      baseLaborCost: Number(p.base_labor_cost || 0),
      images: Array.isArray(p.images) ? p.images : [], 
      designOptions: Array.isArray(p.design_options) ? p.design_options : [],
      materials: (p.product_materials || []).map((pm: any) => ({
        materialId: pm.material_id,
        quantity: Number(pm.quantity || 0),
        widthCm: pm.width_cm ? Number(pm.width_cm) : undefined,
        heightCm: pm.height_cm ? Number(pm.height_cm) : undefined
      }))
    }));

    return {
      materials: (materials || []).map(m => ({
        ...m,
        costPerUnit: Number(m.cost_per_unit || 0),
        widthCm: m.width_cm ? Number(m.width_cm) : undefined
      })),
      products: adaptedProducts,
      categories: categories || [],
      clients: clients || [],
      quotes: (quotes || []).map((q: any) => ({
        ...q,
        clientId: q.client_id,
        totalCost: Number(q.total_cost || 0),
        totalPrice: Number(q.total_price || 0),
        profitMarginPercent: Number(q.profit_margin_percent || 0),
        createdAt: new Date(q.created_at).getTime(),
        items: (q.quote_items || []).map((qi: any) => ({
          productId: qi.product_id,
          quantity: Number(qi.quantity || 1),
          selectedDesign: qi.selected_design
        }))
      })),
      transactions: (transactions || []).map(t => ({
        ...t, 
        amount: Number(t.amount || 0),
        date: Number(t.date || Date.now())
      })),
      settings: settingsData ? {
        brandName: settingsData.brand_name || INITIAL_DATA.settings.brandName,
        defaultMargin: Number(settingsData.default_margin || INITIAL_DATA.settings.defaultMargin),
        whatsappNumber: settingsData.whatsapp_number || INITIAL_DATA.settings.whatsappNumber,
        shopBannerImage: settingsData.shop_banner_image,
        shopBannerText: settingsData.shop_banner_text || INITIAL_DATA.settings.shopBannerText,
        shopLogo: settingsData.shop_logo
      } : INITIAL_DATA.settings
    };
  } catch (error) {
    console.error('Error crítico en fetchAllData:', error);
    return INITIAL_DATA;
  }
};

export const syncSettings = async (settings: AppData['settings']) => {
  await supabase.from('settings').upsert({
    id: 'default',
    brand_name: settings.brandName,
    default_margin: settings.defaultMargin,
    whatsapp_number: settings.whatsappNumber,
    shop_banner_image: settings.shopBannerImage,
    shop_banner_text: settings.shopBannerText,
    shop_logo: settings.shopLogo
  });
};

export const syncProduct = async (product: Product) => {
  const { error } = await supabase.from('products').upsert({
    id: product.id,
    name: product.name,
    description: product.description,
    category_id: product.categoryId,
    base_labor_cost: Number(product.baseLaborCost) || 0,
    images: product.images || [],
    design_options: product.designOptions || []
  });
  if (error) console.error("Error al guardar producto:", error.message);
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
export const syncCategory = async (category: Category) => {
  await supabase.from('categories').upsert({
    id: category.id,
    name: category.name,
    image: category.image
  });
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
export const syncQuote = async (quote: Quote) => {
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
        quantity: item.quantity,
        selected_design: item.selectedDesign
      }))
    );
  }
};
export const deleteFromSupabase = async (table: string, id: string) => {
    await supabase.from(table).delete().eq('id', id);
};

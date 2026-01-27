
import { Product, Material, ProductMaterialRequirement, MaterialUnit } from '../types';

export const calculateRequirementCost = (req: ProductMaterialRequirement, materials: Material[]) => {
  const material = materials.find(m => m.id === req.materialId);
  if (!material) return 0;

  const cost = Number(material.costPerUnit) || 0;
  const quantity = Number(req.quantity) || 0;

  if (material.unit === MaterialUnit.METERS && req.widthCm && req.heightCm && material.widthCm) {
    const areaNeeded = Number(req.widthCm) * Number(req.heightCm);
    const areaOneMeter = Number(material.widthCm) * 100;
    const usagePercentage = areaNeeded / areaOneMeter;
    return cost * usagePercentage;
  }

  return cost * quantity;
};

export const calculateProductCost = (product: Product, materials: Material[]) => {
  const materialsCost = (product.materials || []).reduce((acc, req) => {
    return acc + calculateRequirementCost(req, materials);
  }, 0);
  const labor = Number(product.baseLaborCost) || 0;
  return materialsCost + labor;
};

export const calculateFinalPrice = (product: Product, materials: Material[], marginPercent: number) => {
  const cost = calculateProductCost(product, materials);
  const margin = Number(marginPercent) || 0;
  const price = cost * (1 + margin / 100);
  return isNaN(price) ? 0 : price;
};


import { Product, Material, ProductMaterialRequirement, MaterialUnit } from '../types';

export const calculateRequirementCost = (req: ProductMaterialRequirement, materials: Material[]) => {
  const material = materials.find(m => m.id === req.materialId);
  if (!material) return 0;

  if (material.unit === MaterialUnit.METERS && req.widthCm && req.heightCm && material.widthCm) {
    const areaNeeded = req.widthCm * req.heightCm;
    const areaOneMeter = material.widthCm * 100;
    const usagePercentage = areaNeeded / areaOneMeter;
    return material.costPerUnit * usagePercentage;
  }

  return material.costPerUnit * req.quantity;
};

export const calculateProductCost = (product: Product, materials: Material[]) => {
  const materialsCost = product.materials.reduce((acc, req) => {
    return acc + calculateRequirementCost(req, materials);
  }, 0);
  return materialsCost + (Number(product.baseLaborCost) || 0);
};

export const calculateFinalPrice = (product: Product, materials: Material[], marginPercent: number) => {
  const cost = calculateProductCost(product, materials);
  return cost * (1 + marginPercent / 100);
};

// Shared ingredient density database: grams per US cup (236.6 ml), USDA-style
// kitchen averages. Used by the Grams↔Cups converter and the Measurement→Weight
// recipe converter.
export interface IngredientDensity {
  name: string;
  gPerCup: number;
  note?: string;
}

export const DENSITIES: IngredientDensity[] = [
  { name: "All-purpose flour", gPerCup: 125 },
  { name: "Bread flour", gPerCup: 127 },
  { name: "Cake flour", gPerCup: 114 },
  { name: "Whole wheat flour", gPerCup: 120 },
  { name: "Rye flour", gPerCup: 102 },
  { name: "Oat flour", gPerCup: 92 },
  { name: "Almond flour", gPerCup: 96 },
  { name: "Granulated sugar", gPerCup: 200 },
  { name: "Brown sugar (packed)", gPerCup: 220 },
  { name: "Powdered sugar", gPerCup: 120 },
  { name: "Butter (melted)", gPerCup: 227 },
  { name: "Butter (solid, packed)", gPerCup: 227 },
  { name: "Rolled oats", gPerCup: 80 },
  { name: "Quick oats", gPerCup: 80 },
  { name: "White rice (uncooked)", gPerCup: 185 },
  { name: "Brown rice (uncooked)", gPerCup: 195 },
  { name: "Quinoa (uncooked)", gPerCup: 170 },
  { name: "Couscous (uncooked)", gPerCup: 173 },
  { name: "Semolina", gPerCup: 160 },
  { name: "Cornmeal", gPerCup: 138 },
  { name: "Dry pasta (small shapes)", gPerCup: 105 },
  { name: "Honey", gPerCup: 340 },
  { name: "Maple syrup", gPerCup: 322 },
  { name: "Molasses", gPerCup: 337 },
  { name: "Olive oil", gPerCup: 216 },
  { name: "Vegetable oil", gPerCup: 218 },
  { name: "Coconut oil (melted)", gPerCup: 218 },
  { name: "Milk (whole)", gPerCup: 244 },
  { name: "Heavy cream", gPerCup: 238 },
  { name: "Plain yogurt", gPerCup: 245 },
  { name: "Sour cream", gPerCup: 242 },
  { name: "Cream cheese", gPerCup: 226 },
  { name: "Unsweetened cocoa powder", gPerCup: 85 },
  { name: "Cornstarch", gPerCup: 128 },
  { name: "Peanut butter", gPerCup: 258 },
  { name: "Chocolate chips", gPerCup: 170 },
  { name: "Shredded coconut", gPerCup: 80 },
  { name: "Raisins", gPerCup: 145 },
  { name: "Whole almonds", gPerCup: 143 },
  { name: "Sliced almonds", gPerCup: 92 },
  { name: "Chopped walnuts", gPerCup: 120 },
  { name: "Chopped pecans", gPerCup: 109 },
  { name: "Dry breadcrumbs", gPerCup: 108 },
  { name: "Grated parmesan", gPerCup: 100 },
  { name: "Shredded cheddar", gPerCup: 113 },
  { name: "Cooked chickpeas", gPerCup: 164 },
  { name: "Cooked lentils", gPerCup: 200 },
  { name: "Mashed banana", gPerCup: 225 },
  { name: "Applesauce", gPerCup: 244 },
  { name: "Pumpkin puree", gPerCup: 245 },
  { name: "Water", gPerCup: 236.6 }
];

export const DENSITY_MAP: Record<string, number> = Object.fromEntries(
  DENSITIES.map((d) => [d.name, d.gPerCup])
);

// Standard US kitchen volume ratios (relative to 1 cup).
export const CUP_TO_TBSP = 16;
export const CUP_TO_TSP = 48;
export const CUP_TO_FL_OZ = 8;
export const CUP_TO_ML = 236.588;

"use client";

import dynamic from "next/dynamic";

const loaders: Record<string, React.ComponentType> = {
  "recipe-scaler": dynamic(() => import("./RecipeScaler")),
  "unit-converter": dynamic(() => import("./UnitConverter")),
  "temperature-converter": dynamic(() => import("./TemperatureConverter")),
  "recipe-cost-calculator": dynamic(() => import("./RecipeCostCalculator")),
  "meat-cooking-time": dynamic(() => import("./MeatCookingTime")),
  "baking-pan-converter": dynamic(() => import("./BakingPanConverter")),
  "nutrition-calculator": dynamic(() => import("./NutritionCalculator")),
  "ingredient-substitution": dynamic(() => import("./IngredientSubstitution")),
  "meal-prep-planner": dynamic(() => import("./MealPrepPlanner")),
  "kitchen-timers": dynamic(() => import("./KitchenTimers")),
  "sous-vide-guide": dynamic(() => import("./SousVideGuide")),
  "pizza-dough-calculator": dynamic(() => import("./PizzaDoughCalculator")),
  "sweetener-converter": dynamic(() => import("./SweetenerConverter")),
  "bread-hydration": dynamic(() => import("./BreadHydration")),
  "sourdough-calculator": dynamic(() => import("./SourdoughCalculator")),
  "brine-calculator": dynamic(() => import("./BrineCalculator")),
  "food-storage-guide": dynamic(() => import("./FoodStorageGuide")),
  "caffeine-calculator": dynamic(() => import("./CaffeineCalculator")),
  "alcohol-cookoff": dynamic(() => import("./AlcoholCookoff")),
  "water-intake": dynamic(() => import("./WaterIntake")),
  "pressure-cooker-converter": dynamic(() => import("./PressureCooker")),
  "weekly-menu-generator": dynamic(() => import("./WeeklyMenuGenerator")),
  "dough-batch-converter": dynamic(() => import("./DoughBatchConverter")),
  "frying-temperature": dynamic(() => import("./FryingTemperature")),
  "egg-timer": dynamic(() => import("./EggTimer")),
  "recipe-comparator": dynamic(() => import("./RecipeComparator")),
  "coffee-espresso-calculator": dynamic(() => import("./CoffeeEspressoCalculator")),
  "grams-cups-converter": dynamic(() => import("./GramsCupsConverter")),
  "meat-doneness-guide": dynamic(() => import("./MeatDonenessGuide")),
  "food-shelf-life": dynamic(() => import("./FoodShelfLife")),
  "measurement-to-weight": dynamic(() => import("./MeasurementToWeight"))
};

export function ToolWidget({ slug }: { slug: string }) {
  const Cmp = loaders[slug];
  if (!Cmp) {
    return (
      <div className="rounded-lg border border-dashed border-ink-200 p-8 text-center text-sm text-ink-500">
        This tool widget is being prepared. Please check back soon.
      </div>
    );
  }
  return <Cmp />;
}

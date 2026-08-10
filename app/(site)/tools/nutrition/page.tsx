import type { Metadata } from "next";
import CategoryHubPage, { hubMetadata } from "../CategoryHubPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = hubMetadata("nutrition");

export default function NutritionHubPage() {
  return <CategoryHubPage slug="nutrition" />;
}

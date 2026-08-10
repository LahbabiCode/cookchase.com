import type { Metadata } from "next";
import CategoryHubPage, { hubMetadata } from "../CategoryHubPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = hubMetadata("drinks");

export default function DrinksHubPage() {
  return <CategoryHubPage slug="drinks" />;
}

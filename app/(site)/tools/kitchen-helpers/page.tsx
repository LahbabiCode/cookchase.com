import type { Metadata } from "next";
import CategoryHubPage, { hubMetadata } from "../CategoryHubPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = hubMetadata("kitchen-helpers");

export default function KitchenHelpersHubPage() {
  return <CategoryHubPage slug="kitchen-helpers" />;
}

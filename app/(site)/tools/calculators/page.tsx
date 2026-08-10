import type { Metadata } from "next";
import CategoryHubPage, { hubMetadata } from "../CategoryHubPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = hubMetadata("calculators");

export default function CalculatorsHubPage() {
  return <CategoryHubPage slug="calculators" />;
}

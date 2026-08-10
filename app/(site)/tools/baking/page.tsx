import type { Metadata } from "next";
import CategoryHubPage, { hubMetadata } from "../CategoryHubPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = hubMetadata("baking");

export default function BakingHubPage() {
  return <CategoryHubPage slug="baking" />;
}

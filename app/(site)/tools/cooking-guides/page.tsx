import type { Metadata } from "next";
import CategoryHubPage, { hubMetadata } from "../CategoryHubPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = hubMetadata("cooking-guides");

export default function CookingGuidesHubPage() {
  return <CategoryHubPage slug="cooking-guides" />;
}

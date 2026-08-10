import type { Metadata } from "next";
import CategoryHubPage, { hubMetadata } from "../CategoryHubPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = hubMetadata("planners");

export default function PlannersHubPage() {
  return <CategoryHubPage slug="planners" />;
}

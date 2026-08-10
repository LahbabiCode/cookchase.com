import type { Metadata } from "next";
import CategoryHubPage, { hubMetadata } from "../CategoryHubPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = hubMetadata("meat-and-seafood");

export default function MeatAndSeafoodHubPage() {
  return <CategoryHubPage slug="meat-and-seafood" />;
}

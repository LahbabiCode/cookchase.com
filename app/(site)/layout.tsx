import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

// Speculation Rules: prerender the pages visitors most often click next (tool
// and blog pages) so navigation feels instant. `moderate` eagerness fires only
// after a short hover — intent-correlated, rarely wasted. Prerenders are
// excluded from view analytics via the Sec-Purpose guard in the tool page.
const SPECULATION_RULES = JSON.stringify({
  prerender: [
    {
      where: { href_matches: "/tools/*" },
      eagerness: "moderate"
    },
    {
      where: { href_matches: "/blog/*" },
      eagerness: "moderate"
    },
    {
      where: { href_matches: "/" },
      eagerness: "moderate"
    }
  ]
});

export default function SiteLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script type="speculationrules" dangerouslySetInnerHTML={{ __html: SPECULATION_RULES }} />
      <Header />
      <main>{children}</main>
      <Footer />
      <CookieConsent />
    </>
  );
}

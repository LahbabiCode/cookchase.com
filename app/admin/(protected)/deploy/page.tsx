import DeployPanel from "@/components/admin/DeployPanel";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false }
};

export default function AdminDeployPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Deploy</h1>
        <p className="mt-1 text-sm text-ink-500">
          Run the one-command deploy script from the browser and watch every
          step live — with the post-deploy health checks built in.
        </p>
      </div>
      <div className="mt-6">
        <DeployPanel />
      </div>
    </div>
  );
}

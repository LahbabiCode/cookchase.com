import TrafficAnalytics from "@/components/admin/TrafficAnalytics";

export const dynamic = "force-dynamic";

export default function AdminStatsPage() {
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Traffic analytics</h1>
          <p className="mt-1 text-sm text-ink-500">
            Daily views per tool over the last 7, 30 or 90 days — compare tools
            side by side on one chart, follow each tool&apos;s day-over-day and
            week-over-week growth, and spot spike days and threshold crossings.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <TrafficAnalytics />
      </div>
    </div>
  );
}

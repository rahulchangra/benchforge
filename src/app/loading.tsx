import { SkeletonDashboard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-neutral-800/60" />
        <div className="h-4 w-72 animate-pulse rounded bg-neutral-800/60" />
      </div>
      <SkeletonDashboard />
    </div>
  );
}

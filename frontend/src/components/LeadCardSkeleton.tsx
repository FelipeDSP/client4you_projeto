import { Card } from "@/components/ui/card";

export function LeadCardSkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          {/* Título e Badge */}
          <div className="flex items-center gap-2">
            <div className="h-5 bg-gray-200 rounded w-48"></div>
            <div className="h-5 bg-gray-200 rounded w-20"></div>
          </div>

          {/* Informações */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-40"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-gray-200 rounded"></div>
          <div className="h-9 w-9 bg-gray-200 rounded"></div>
        </div>
      </div>
    </Card>
  );
}

export function LeadCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <LeadCardSkeleton key={idx} />
      ))}
    </div>
  );
}

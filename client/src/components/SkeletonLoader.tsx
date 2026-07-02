export function HabitCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-6 bg-slate-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-slate-100 rounded w-4/5"></div>
        </div>
        <div className="flex gap-2 ml-3">
          <div className="h-6 bg-slate-200 rounded w-12"></div>
          <div className="h-6 bg-slate-200 rounded w-16"></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 rounded p-2 h-16"></div>
        <div className="bg-slate-50 rounded p-2 h-16"></div>
        <div className="bg-slate-50 rounded p-2 h-16"></div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="h-4 bg-slate-200 rounded w-20"></div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
          <div className="h-8 bg-slate-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}

export function HabitCardSkeletonList() {
  return (
    <div className="grid gap-4">
      <HabitCardSkeleton />
      <HabitCardSkeleton />
      <HabitCardSkeleton />
    </div>
  );
}

export function StreakStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8 animate-pulse">
      <div className="bg-slate-50 rounded-lg p-4 h-24"></div>
      <div className="bg-slate-50 rounded-lg p-4 h-24"></div>
      <div className="bg-slate-50 rounded-lg p-4 h-24"></div>
    </div>
  );
}

export function CheckInHistorySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} className="aspect-square bg-slate-100 rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function RecentCheckInsSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="h-5 w-5 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

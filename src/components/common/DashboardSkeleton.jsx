import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton({ isDark = false }) {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className={`h-8 w-64 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
        <Skeleton className={`h-4 w-48 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'}`}>
            <Skeleton className={`h-10 w-10 rounded-lg mb-3 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
            <Skeleton className={`h-4 w-24 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
          </div>
        ))}
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`p-5 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'}`}>
            <Skeleton className={`h-4 w-20 mb-2 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
            <Skeleton className={`h-8 w-12 mb-2 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
            <Skeleton className={`h-3 w-16 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 rounded-xl border p-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'}`}>
          <Skeleton className={`h-6 w-32 mb-4 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className={`h-16 w-full ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
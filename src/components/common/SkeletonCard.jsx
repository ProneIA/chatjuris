import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function SkeletonCard({ isDark }) {
  return (
    <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className={`h-12 w-12 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
          <div className="flex-1 space-y-2">
            <Skeleton className={`h-4 w-3/4 ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
            <Skeleton className={`h-3 w-1/2 ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
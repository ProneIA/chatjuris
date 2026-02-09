import React from "react";

export default function LandingPageSkeleton() {
  return (
    <div className="min-h-screen w-full bg-white animate-pulse">
      {/* Hero Skeleton */}
      <div className="min-h-screen w-full relative bg-gray-200">
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Nav Skeleton */}
          <nav className="w-full px-4 sm:px-6 md:px-12 py-4 sm:py-6 flex items-center justify-between">
            <div className="h-8 w-20 bg-white/20 rounded" />
            <div className="hidden md:flex items-center gap-6">
              <div className="h-4 w-20 bg-white/20 rounded" />
              <div className="h-4 w-24 bg-white/20 rounded" />
              <div className="h-4 w-20 bg-white/20 rounded" />
              <div className="h-10 w-32 bg-white/30 rounded" />
            </div>
          </nav>

          {/* Title Skeleton */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <div className="h-12 sm:h-16 w-80 sm:w-96 bg-white/20 rounded mx-auto" />
              <div className="h-12 sm:h-16 w-72 sm:w-80 bg-white/30 rounded mx-auto" />
              <div className="w-20 h-0.5 bg-white/20 mx-auto mt-8" />
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
                <div className="h-12 w-48 bg-white/30 rounded" />
                <div className="h-12 w-40 bg-white/20 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vantagens Skeleton */}
      <div className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-20 space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
            <div className="h-10 w-96 bg-gray-200 rounded mx-auto" />
            <div className="h-10 w-80 bg-gray-200 rounded mx-auto" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-6 sm:p-8 border border-gray-200">
                <div className="w-12 h-12 bg-gray-200 rounded mb-6" />
                <div className="h-6 w-40 bg-gray-200 rounded mb-3" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-100 rounded" />
                  <div className="h-4 w-5/6 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
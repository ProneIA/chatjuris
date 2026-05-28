import React, { useEffect, lazy, Suspense } from "react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import LandingPageLayout from "@/components/landing/PublicLayout";

const AffiliateTracker = lazy(() => import("@/components/subscription/AffiliateTracker"));

export default function LandingPage() {
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) window.location.href = createPageUrl("Dashboard");
    };
    checkAuth();
  }, []);

  return (
    <>
      <Suspense fallback={null}><AffiliateTracker /></Suspense>
      <LandingPageLayout />
    </>
  );
}
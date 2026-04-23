import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageNotFound from "@/lib/PageNotFound";

export default function ProtectedAdminRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return null; // loading

  if (!user || user.role !== "admin") return <PageNotFound />;

  return children;
}
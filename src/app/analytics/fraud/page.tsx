"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FraudRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/analytics/fraud-detection");
  }, [router]);

  return null;
}

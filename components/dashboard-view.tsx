"use client";

import { useState } from "react";

import { ScanForm } from "@/components/scan-form";
import { ScannedVideosPanel } from "@/components/scanned-videos-panel";

export function DashboardView() {
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="space-y-8">
      <ScanForm onScanComplete={() => setRefreshSignal((value) => value + 1)} />
      <ScannedVideosPanel refreshSignal={refreshSignal} />
    </div>
  );
}

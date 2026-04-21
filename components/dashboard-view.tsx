"use client";

import { useState } from "react";

import { ScanForm } from "@/components/scan-form";
import { ScannedVideosPanel } from "@/components/scanned-videos-panel";

type Props = {
  initialInput: string;
};

export function DashboardView({ initialInput }: Props) {
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="space-y-8">
      <ScanForm initialInput={initialInput} onScanComplete={() => setRefreshSignal((value) => value + 1)} />
      <ScannedVideosPanel refreshSignal={refreshSignal} />
    </div>
  );
}

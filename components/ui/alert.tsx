import * as React from "react";

import { cn } from "@/lib/utils";

function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("w-full rounded-lg border border-border bg-card p-4 text-sm", className)} role="alert" {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return <h5 className={cn("mb-1 font-medium", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-muted-foreground", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
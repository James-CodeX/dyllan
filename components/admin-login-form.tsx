"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { verifyAdminPassword } from "@/app/actions/auth";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await verifyAdminPassword(password);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Failed to login.");
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto mt-10 w-full max-w-md border-border/60">
      <CardHeader>
        <CardTitle>Admin Access Required</CardTitle>
        <CardDescription>Please enter the admin password to access the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            required
          />
          {error && (
            <Alert className="border-destructive/40 bg-destructive/5 py-3">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Verifying..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
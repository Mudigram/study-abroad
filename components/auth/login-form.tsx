"use client";

import { useActionState } from "react";

import {
  signInWithMagicLink,
  type AuthActionState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    signInWithMagicLink,
    initialState,
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Invite-only access. Enter your email and we&apos;ll send a magic link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>

          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          {state.success ? (
            <p className="text-sm text-muted-foreground">
              Check your email for a sign-in link.
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Sending link..." : "Send magic link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

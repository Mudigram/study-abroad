"use client";

import { useActionState } from "react";

import {
  updateProfile,
  type ProfileActionState,
} from "@/app/actions/profile";
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
import type { Profile } from "@/lib/types/database";

const initialState: ProfileActionState = {};

const currencies = ["USD", "EUR", "GBP", "HUF", "PLN", "NGN"];

interface ProfileSetupFormProps {
  profile: Profile | null;
}

export function ProfileSetupForm({ profile }: ProfileSetupFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Set up your profile</CardTitle>
        <CardDescription>
          This drives budget tracking and application defaults across the app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={profile?.full_name ?? ""}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="home_country">Home country</Label>
            <Input
              id="home_country"
              name="home_country"
              defaultValue={profile?.home_country ?? "Nigeria"}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="highest_degree">Highest degree</Label>
            <Input
              id="highest_degree"
              name="highest_degree"
              placeholder="B.Sc. Computer Science"
              defaultValue={profile?.highest_degree ?? ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="yoe">Years of experience</Label>
            <Input
              id="yoe"
              name="yoe"
              type="number"
              min={0}
              defaultValue={profile?.yoe ?? 0}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="total_budget">Total budget</Label>
              <Input
                id="total_budget"
                name="total_budget"
                type="number"
                min={0}
                step="0.01"
                defaultValue={profile?.total_budget ?? 0}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="base_currency">Base currency</Label>
              <select
                id="base_currency"
                name="base_currency"
                defaultValue={profile?.base_currency ?? "USD"}
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-slate-800 outline-none transition-all hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 shadow-2xs cursor-pointer"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save and continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

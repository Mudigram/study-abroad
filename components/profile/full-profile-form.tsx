"use client";

import { useActionState, useState } from "react";
import {
  User,
  Globe2,
  Wallet,
  GraduationCap,
  Bell,
  Sparkles,
  CheckCircle2,
  Save,
} from "lucide-react";
import { updateProfile, type ProfileActionState } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomSelect } from "@/components/ui/custom-select";
import { useToast } from "@/components/ui/toast";
import type { Profile } from "@/lib/types/database";

const CURRENCIES = ["USD", "EUR", "GBP", "HUF", "PLN", "NGN"];
const INTAKES = ["Fall 2026", "Spring 2027", "Fall 2027", "Spring 2028"];

interface FullProfileFormProps {
  profile: Profile | null;
}

export function FullProfileForm({ profile }: FullProfileFormProps) {
  const { toast } = useToast();
  const [baseCurrency, setBaseCurrency] = useState(profile?.base_currency ?? "USD");
  const [intake, setIntake] = useState("Fall 2026");

  const [state, formAction, pending] = useActionState(
    async (prevState: ProfileActionState, formData: FormData) => {
      const res = await updateProfile(prevState, formData);
      if (res.error) {
        toast({ title: "Failed to update profile", description: res.error, type: "error" });
      } else {
        toast({ title: "Profile updated successfully! 🎉", description: "Your study abroad preferences have been saved.", type: "success" });
      }
      return res;
    },
    {},
  );

  return (
    <form action={formAction} className="space-y-8 max-w-4xl w-full">
      {/* ─── 1. Academic & Personal Identity ───────────────────────────────────── */}
      <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-6 sm:p-8 shadow-sm shadow-playful space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 font-bold">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-black text-slate-900">Personal & Academic Profile</h2>
            <p className="text-xs font-semibold text-slate-500">Your core identity and educational background.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={profile?.full_name ?? ""}
              placeholder="e.g. Alex Morgan"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="home_country">Home Country</Label>
            <Input
              id="home_country"
              name="home_country"
              defaultValue={profile?.home_country ?? "Nigeria"}
              placeholder="e.g. Nigeria"
              required
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="highest_degree">Highest Academic Degree</Label>
            <Input
              id="highest_degree"
              name="highest_degree"
              placeholder="e.g. B.Sc. Computer Science"
              defaultValue={profile?.highest_degree ?? ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="yoe">Years of Work Experience (YOE)</Label>
            <Input
              id="yoe"
              name="yoe"
              type="number"
              min={0}
              defaultValue={profile?.yoe ?? 0}
            />
          </div>
        </div>
      </div>

      {/* ─── 2. Target Budget & Currency Setup ─────────────────────────────────── */}
      <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-6 sm:p-8 shadow-sm shadow-playful space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 font-bold">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-black text-slate-900">Study Abroad Budget & FX Currency</h2>
            <p className="text-xs font-semibold text-slate-500">Drives real-time FX rate conversions and expense tracking.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="total_budget">Total Available Capital Budget</Label>
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
            <Label htmlFor="base_currency">Base Reporting Currency</Label>
            <CustomSelect
              id="base_currency"
              name="base_currency"
              value={baseCurrency}
              onChange={setBaseCurrency}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          </div>
        </div>
      </div>

      {/* ─── 3. Target Intake & Study Goals ───────────────────────────────────── */}
      <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-6 sm:p-8 shadow-sm shadow-playful space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 font-bold">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-black text-slate-900">Target Intake & Preferences</h2>
            <p className="text-xs font-semibold text-slate-500">Specify your preferred admission term and target destinations.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="target_intake">Target Intake Term</Label>
            <CustomSelect
              value={intake}
              onChange={setIntake}
              options={INTAKES.map((i) => ({ value: i, label: i }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="target_countries">Target Countries / Destinations</Label>
            <Input
              id="target_countries"
              defaultValue="Germany, Italy, United Kingdom"
              placeholder="e.g. Germany, UK, USA"
            />
          </div>
        </div>
      </div>

      {/* ─── 4. Notifications & Alerts ─────────────────────────────────────────── */}
      <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-6 sm:p-8 shadow-sm shadow-playful space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 font-bold">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-black text-slate-900">System Notification Alerts</h2>
            <p className="text-xs font-semibold text-slate-500">Stay ahead of cut-offs and financial movements.</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-slate-900 block">7-Day Urgent Deadline Email Warnings</span>
              <span className="text-[11px] font-bold text-slate-500">Get notified when scholarship or program deadlines are due within 7 days.</span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-slate-900 block">FX Rate Fluctuation Alerts</span>
              <span className="text-[11px] font-bold text-slate-500">Receive alerts when EUR/USD/NGN rates change significantly.</span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {state.error ? (
        <p className="text-xs font-black text-rose-600 bg-rose-50 p-4 rounded-2xl border border-rose-200">
          {state.error}
        </p>
      ) : null}

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-indigo-600 px-8 py-3.5 text-xs font-black text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
        >
          <Save className="h-4 w-4 mr-2" />
          {pending ? "Saving Changes..." : "Save Profile Settings"}
        </Button>
      </div>
    </form>
  );
}

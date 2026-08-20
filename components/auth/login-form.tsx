"use client";

import { useActionState } from "react";
import {
  signInWithPassword,
  type AuthActionState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Sparkles, Loader2 } from "lucide-react";

const initialState: AuthActionState = {};

interface LoginFormProps {
  initialError?: string | null;
}

export function LoginForm({ initialError }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(
    signInWithPassword,
    initialState,
  );

  return (
    <div className="flex w-full max-w-4xl min-h-[550px] rounded-[2.5rem] border-2 border-slate-900/10 bg-white overflow-hidden shadow-2xl shadow-playful">
      {/* ─── Left Pane: Colorful Premium Gradient ──────────────────────────────── */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-tr from-indigo-700 via-purple-700 to-amber-500 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Background Decorative Blur Spheres */}
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

        {/* Top Branding Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-xs backdrop-blur-xs">
            <GraduationCap className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-base font-black tracking-tight text-white flex items-center gap-1">
              The Japa Desk <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
            </span>
            <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest leading-none">
              Relocation Workspace
            </span>
          </div>
        </div>

        {/* Middle/Bottom Heading & Pitch Text */}
        <div className="relative z-10 space-y-4">
          <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block bg-white/10 px-3.5 py-1 rounded-full w-max backdrop-blur-xs">
            Now Live for Pilots
          </span>
          <h2 className="font-heading text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white">
            Get access to your personal hub for relocation.
          </h2>
          <p className="text-xs lg:text-sm font-semibold text-indigo-100/90 leading-relaxed max-w-sm">
            Coordinate active pipelines, secure document vaults, upcoming VFS slot queues, and your live multi-currency capital ledgers.
          </p>
        </div>

        {/* Footer Brand Info */}
        <div className="relative z-10 text-[10px] font-black tracking-wider text-indigo-200/80 uppercase">
          © {new Date().getFullYear()} The Japa Desk
        </div>
      </div>

      {/* ─── Right Pane: Sign-In Form ─────────────────────────────────────────── */}
      <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-between bg-white relative z-10">
        <div className="my-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            {/* Small Mobile Logo */}
            <div className="flex md:hidden items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <GraduationCap className="h-4.5 w-4.5" />
              </div>
              <span className="font-heading text-lg font-black text-slate-900">The Japa Desk</span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sign In
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-normal">
              Enter your account credentials provided by your coordinator to access your relocation workspace.
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Your Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="h-11 px-4"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password">Your Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                required
                className="h-11 px-4"
              />
            </div>

            {/* Error alerts */}
            {(state.error || initialError) && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-600">
                {state.error || (initialError === "auth" ? "Sign-in failed. Please check your credentials and try again." : "An error occurred during authentication.")}
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="w-full h-11 rounded-2xl font-extrabold text-sm shadow-md shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useActionState, useState, useTransition } from "react";
import {
  signInWithMagicLink,
  signInWithGoogle,
  type AuthActionState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const initialState: AuthActionState = {};

interface LoginFormProps {
  initialError?: string | null;
}

export function LoginForm({ initialError }: LoginFormProps) {
  const { toast } = useToast();
  const [googlePending, startGoogleTransition] = useTransition();

  const [state, formAction, pending] = useActionState(
    signInWithMagicLink,
    initialState,
  );

  const handleGoogleSignIn = () => {
    startGoogleTransition(async () => {
      const res = await signInWithGoogle();
      if (res?.error) {
        toast({
          title: "Google authentication failed",
          description: res.error,
          type: "error",
        });
      }
    });
  };

  return (
    <div className="flex w-full max-w-4xl min-h-[550px] rounded-[2.5rem] border-2 border-slate-900/10 bg-white overflow-hidden shadow-2xl shadow-playful">
      {/* ─── Left Pane: Colorful Premium Gradient ──────────────────────────────── */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-tr from-indigo-700 via-purple-700 to-amber-500 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Background Decorative Blur Spheres (similar to image 2) */}
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
              Enter your email to receive a passwordless magic link, or continue using your Google account.
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

            {/* Error alerts */}
            {(state.error || initialError) && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-600">
                {state.error || (initialError === "auth" ? "Sign-in failed. Please check your credentials or request a new magic link." : "An error occurred during authentication.")}
              </div>
            )}

            {/* Success state */}
            {state.success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800">
                🎉 Success! Please check your email inbox for a secure login link.
              </div>
            )}

            <Button
              type="submit"
              disabled={pending || googlePending}
              className="w-full h-11 rounded-2xl font-extrabold text-sm shadow-md shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending Link...
                </span>
              ) : (
                "Send Magic Link"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <span className="relative bg-white px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              or continue with
            </span>
          </div>

          {/* Google Sign-in */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={pending || googlePending}
            variant="outline"
            className="w-full h-11 rounded-2xl border-2 border-slate-900/10 font-extrabold text-sm hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-2 text-slate-700"
          >
            {googlePending ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.47c0,-0.61 -0.05,-1.2 -0.15,-1.72Z" fill="#4285F4"/>
                  <path d="M12,20.5c2.3,0 4.23,-0.76 5.64,-2.07l-3.3,-2.57c-0.9,0.6 -2.07,0.97 -3.34,0.97c-2.57,0 -4.75,-1.73 -5.53,-4.07H2.07v2.66c1.44,2.87 4.41,4.08 7.93,4.08Z" fill="#34A853"/>
                  <path d="M6.47,12.76c-0.2,-0.6 -0.31,-1.24 -0.31,-1.9s0.11,-1.3 0.31,-1.9V6.3H2.07C1.41,7.62 1,9.12 1,10.86c0,1.74 0.41,3.24 1.07,4.56l3.4,-2.66Z" fill="#FBBC05"/>
                  <path d="M12,4.64c1.25,0 2.37,0.43 3.25,1.27l2.43,-2.43C16.23,2.1 14.3,1.22 12,1.22c-3.52,0 -6.49,1.21 -7.93,4.08l3.4,2.66c0.78,-2.34 2.96,-4.07 5.53,-4.07Z" fill="#EA4335"/>
                </g>
              </svg>
            )}
            <span>Sign In with Google</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

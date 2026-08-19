"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, GraduationCap, Award, Compass, Loader2 } from "lucide-react";
import { createApplicationFromScholarship } from "@/app/actions/applications";
import { PREMIUM_SCHOLARSHIPS, type Scholarship } from "@/lib/scholarships";
import type { Profile } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ScholarshipMatcherProps {
  profile: Profile | null;
}

export function ScholarshipMatcher({ profile }: ScholarshipMatcherProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Filter logic: show matching scholarships based on user target parameters.
  // Fallback to showing all if no match or profile is empty.
  const userHome = profile?.home_country || "";
  const userDegree = profile?.highest_degree || "Bachelor's";

  const handleAdd = (sc: Scholarship) => {
    startTransition(async () => {
      const res = await createApplicationFromScholarship(
        sc.universityName,
        sc.programName,
        sc.country,
        sc.name,
        sc.templateSearchName
      );

      if (res.error) {
        toast({
          title: "Setup failed",
          description: res.error,
          type: "error",
        });
      } else {
        toast({
          title: "Program Added!",
          description: `Created entry for "${sc.universityName}" and applied matching document checklist tasks.`,
          type: "success",
        });
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-3xl border-2 border-slate-900/10 bg-white p-6 shadow-sm shadow-playful space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-black text-slate-900 flex items-center gap-1.5">
              1-Click Scholarship Matcher
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
            </h3>
            <p className="text-xs text-slate-500 font-medium">Instantly match and create checklist tasks for major programs</p>
          </div>
        </div>
      </div>

      {/* Match Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {PREMIUM_SCHOLARSHIPS.map((sc) => {
          // If applicant holds a Bachelor's degree, they are eligible for Master's programs!
          const isEligible =
            sc.degreeLevel === "All" ||
            (sc.degreeLevel === "Master's" && userDegree === "Bachelor's") ||
            sc.degreeLevel === userDegree;

          return (
            <div
              key={sc.id}
              className="rounded-2xl border-2 border-slate-100 hover:border-indigo-400 p-4.5 bg-slate-50/50 hover:bg-white transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                    {sc.country}
                  </span>
                  {isEligible ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-extrabold text-emerald-800 border border-emerald-200">
                      Eligible Match
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold text-slate-400">
                      Standard
                    </span>
                  )}
                </div>

                <h4 className="font-heading font-black text-sm text-slate-900 leading-tight">
                  {sc.name}
                </h4>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-2">
                  {sc.description}
                </p>

                <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 p-2 rounded-xl space-y-0.5">
                  <div className="flex justify-between">
                    <span>Degree Track:</span>
                    <span className="font-extrabold text-indigo-900">{sc.degreeLevel} Track</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Funding Cover:</span>
                    <span className="font-extrabold text-indigo-900">{sc.fundingType.split(",")[0]}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleAdd(sc)}
                disabled={isPending}
                className="w-full rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Instantiating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    <span>Add to Pipeline &amp; Checklist</span>
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

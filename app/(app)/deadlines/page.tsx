import { Metadata } from "next";
import { getUpcomingDeadlines } from "@/app/actions/deadlines";
import { DeadlinesTimeline } from "@/components/deadlines/deadlines-timeline";
import { CalendarDays, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Deadlines & Calendar | The Japa Desk",
  description: "Interactive calendar grid, chronological timeline, and program milestone matrix for tracking all study abroad deadlines.",
};

export default async function DeadlinesPage() {
  const deadlines = await getUpcomingDeadlines();

  return (
    <div className="flex w-full flex-col gap-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-black text-indigo-700 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Multi-View Command Center</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Deadlines &amp; Calendar
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">
            Track university cut-offs, scholarship deadlines, and task checklists across Calendar, Timeline, and Program Matrix views.
          </p>
        </div>
      </div>

      <DeadlinesTimeline initialItems={deadlines} />
    </div>
  );
}

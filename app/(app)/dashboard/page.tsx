import Image from "next/image";
import Link from "next/link";
import {
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  FolderOpen,
  GanttChart,
  Globe2,
  GraduationCap,
  LockKeyhole,
  MapPin,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";

import { getCapitalSummary } from "@/app/actions/ledger";
import { getProfile } from "@/app/actions/profile";
import { getApplications } from "@/app/actions/applications";
import { getUpcomingDeadlines } from "@/app/actions/deadlines";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ─── Stat Card Component ──────────────────────────────────────────────────────

function ColorfulStatCard({
  title,
  value,
  description,
  Icon,
  variant,
  href,
}: {
  title: string;
  value: string;
  description: string;
  Icon: React.ElementType;
  variant: "amber" | "indigo" | "rose" | "teal";
  href?: string;
}) {
  const variantStyles = {
    amber: {
      cardBg: "bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950",
      iconBg: "bg-black/15 text-slate-950",
      subtext: "text-amber-950/80",
      label: "text-amber-950/70 font-extrabold",
    },
    indigo: {
      cardBg: "bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-xl shadow-indigo-200",
      iconBg: "bg-white/20 text-white",
      subtext: "text-indigo-100",
      label: "text-indigo-200 font-extrabold",
    },
    rose: {
      cardBg: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 text-white shadow-xl shadow-rose-200",
      iconBg: "bg-white/20 text-white",
      subtext: "text-rose-100",
      label: "text-rose-200 font-extrabold",
    },
    teal: {
      cardBg: "bg-gradient-to-br from-teal-400 via-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-200",
      iconBg: "bg-white/20 text-white",
      subtext: "text-emerald-100",
      label: "text-emerald-200 font-extrabold",
    },
  };

  const style = variantStyles[variant];

  const content = (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${style.cardBg}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[11px] uppercase tracking-widest ${style.label}`}>
          {title}
        </span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${style.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4">
        <p className="font-heading text-3xl font-extrabold tracking-tight">
          {value}
        </p>
        <p className={`mt-1.5 text-xs font-semibold ${style.subtext}`}>
          {description}
        </p>
      </div>

      {/* Decorative background shape */}
      <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [profile, capital, applications, deadlines] = await Promise.all([
    getProfile(),
    getCapitalSummary(),
    getApplications(),
    getUpcomingDeadlines(),
  ]);

  const activeApplicationsCount = applications.filter(
    (a) => a.status !== "Rejected",
  ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  const next7DaysDeadlines = deadlines.filter((item) => {
    const due = new Date(item.dueDate);
    return due.getTime() >= today.getTime() && due.getTime() <= sevenDaysLater.getTime();
  });

  const firstName = profile?.full_name
    ? profile.full_name.split(" ")[0]
    : "Scholar";

  function fmtUsd(v: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v);
  }

  return (
    <div className="flex w-full flex-col gap-8 pb-12">
      {/* ─── 1. Prominent "How It Works" Guide Card (AT THE TOP) ────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-white/10 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 fill-amber-300" />
              <span>Interactive Workflow Guide</span>
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
              Discover How Application OS Works 🚀
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200 font-medium max-w-lg leading-relaxed">
              Explore our 6-step roadmap for managing study-abroad applications, document vaults, live FX budgets, and deadlines.
            </p>
          </div>

          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 shrink-0 rounded-full bg-amber-400 px-6 py-3 text-xs font-black text-slate-950 shadow-lg shadow-amber-400/30 transition-all hover:bg-amber-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Compass className="h-4 w-4" />
            <span>Explore How It Works →</span>
          </Link>
        </div>

        {/* Ambient background blur circles */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-indigo-500/30 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-500/30 blur-2xl pointer-events-none" />
      </div>

      {/* ─── 2. Whimsical Welcome Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-purple-100 via-indigo-50 to-amber-50 p-8 sm:p-10 shadow-sm">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-xs backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>Application OS Dashboard</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Hi, {firstName}! <span className="inline-block animate-bounce">👋</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl leading-relaxed">
              Ready to conquer your university & scholarship goals? Let’s check your active pipeline, upcoming deadlines, and funding status!
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <Link
                href="/pipeline"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-95"
              >
                <Compass className="h-4 w-4" />
                <span>View Application Pipeline</span>
              </Link>
              <Link
                href="/ledger"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:border-slate-400 active:scale-95"
              >
                <Wallet className="h-4 w-4 text-indigo-600" />
                <span>Manage Capital Ledger</span>
              </Link>
            </div>
          </div>

          {/* Banner Illustration */}
          <div className="relative h-44 w-full md:h-56 md:w-80 shrink-0 rounded-2xl overflow-hidden shadow-md border-2 border-white/80">
            <Image
              src="/images/welcome-banner.jpg"
              alt="Happy student working on laptop"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* ─── 3. Vibrant Stat Cards ────────────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-extrabold tracking-tight text-slate-900">
            Key Application Metrics
          </h2>
          <span className="text-xs font-semibold text-slate-400">Live Status</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <ColorfulStatCard
            title="Liquid Capital"
            value={fmtUsd(capital.liquidCapital)}
            description="Available to spend freely"
            Icon={BadgeDollarSign}
            variant="amber"
            href="/ledger"
          />

          <ColorfulStatCard
            title="Capital Locked"
            value={fmtUsd(capital.lockedCapital)}
            description="Committed / Blocked Account"
            Icon={LockKeyhole}
            variant="indigo"
            href="/ledger"
          />

          <ColorfulStatCard
            title="Active Applications"
            value={activeApplicationsCount.toString()}
            description="Programs in progress"
            Icon={GanttChart}
            variant="rose"
            href="/pipeline"
          />

          <ColorfulStatCard
            title="Upcoming Deadlines"
            value={next7DaysDeadlines.length.toString()}
            description="Due in next 7 days"
            Icon={CalendarDays}
            variant="teal"
            href="/deadlines"
          />
        </div>
      </div>

      {/* ─── 4. Deadlines Widget (if any) ─────────────────────────────────────── */}
      {next7DaysDeadlines.length > 0 && (
        <Card className="overflow-hidden rounded-3xl border-2 border-amber-200/80 bg-amber-50/50 shadow-md">
          <CardHeader className="bg-amber-100/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="font-heading text-lg font-extrabold text-amber-950">
                    Urgent Deadlines (Next 7 Days)
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-amber-800">
                    Action required on these upcoming targets
                  </CardDescription>
                </div>
              </div>

              <Link
                href="/deadlines"
                className="text-xs font-bold text-amber-900 underline hover:text-amber-950"
              >
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-amber-200/60 bg-white">
            {next7DaysDeadlines.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 transition-colors hover:bg-amber-50/30"
              >
                <div className="space-y-0.5">
                  <span className="font-heading text-sm font-bold text-slate-900 block">
                    {item.title}
                  </span>
                  <span className="text-xs font-medium text-slate-500 block">
                    {item.subtitle}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900 shadow-2xs">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Due {new Date(item.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ─── 5. Profile & Quick Details Grid ─────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-playful">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-extrabold text-slate-900">
                  Applicant Profile
                </h3>
                <p className="text-xs text-slate-500 font-medium">Global settings & target budget</p>
              </div>
            </div>

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
              Verified
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                Home Country
              </span>
              <span className="font-heading text-sm font-extrabold text-slate-900 mt-1 block">
                {profile?.home_country ?? "Not set"}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                Highest Degree
              </span>
              <span className="font-heading text-sm font-extrabold text-slate-900 mt-1 block truncate">
                {profile?.highest_degree ?? "Not set"}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                Work Experience
              </span>
              <span className="font-heading text-sm font-extrabold text-slate-900 mt-1 block">
                {profile?.yoe ?? 0} {profile?.yoe === 1 ? "Year" : "Years"}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                Total Budget
              </span>
              <span className="font-heading text-sm font-extrabold text-indigo-600 mt-1 block">
                {profile?.base_currency}{" "}
                {profile?.total_budget?.toLocaleString() ?? "0"}
              </span>
            </div>
          </div>
        </Card>

        {/* Quick Tools Access Card */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-playful">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-extrabold text-slate-900">
                  Quick Actions
                </h3>
                <p className="text-xs text-slate-500 font-medium">Shortcuts to key features</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/pipeline"
              className="flex flex-col gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 transition-all hover:bg-indigo-100/60 hover:scale-[1.02]"
            >
              <GanttChart className="h-5 w-5 text-indigo-600" />
              <div>
                <span className="font-heading text-xs font-extrabold text-slate-900 block">
                  Kanban Pipeline
                </span>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Track program statuses
                </span>
              </div>
            </Link>

            <Link
              href="/requirements"
              className="flex flex-col gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 transition-all hover:bg-rose-100/60 hover:scale-[1.02]"
            >
              <FileCheck2 className="h-5 w-5 text-rose-600" />
              <div>
                <span className="font-heading text-xs font-extrabold text-slate-900 block">
                  Checklists
                </span>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Task completion lists
                </span>
              </div>
            </Link>

            <Link
              href="/vault"
              className="flex flex-col gap-2 rounded-2xl border border-teal-100 bg-teal-50/50 p-4 transition-all hover:bg-teal-100/60 hover:scale-[1.02]"
            >
              <FolderOpen className="h-5 w-5 text-teal-600" />
              <div>
                <span className="font-heading text-xs font-extrabold text-slate-900 block">
                  Document Vault
                </span>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Upload SOPs & transcripts
                </span>
              </div>
            </Link>

            <Link
              href="/ledger"
              className="flex flex-col gap-2 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 transition-all hover:bg-amber-100/60 hover:scale-[1.02]"
            >
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <div>
                <span className="font-heading text-xs font-extrabold text-slate-900 block">
                  FX Ledger
                </span>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Expenses & exchange rate
                </span>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}




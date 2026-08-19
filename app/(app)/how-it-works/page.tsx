import Link from "next/link";
import {
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Compass,
  FileCheck2,
  FolderOpen,
  GanttChart,
  Layers,
  Sparkles,
  User,
  Wallet,
  ArrowRight,
} from "lucide-react";

export default function HowItWorksPage() {
  const stickerCards = [
    {
      step: "01",
      badge: "✦ profile & budget",
      title: "profile & setup",
      rotation: "-rotate-2",
      bgClass: "bg-[#046A38] text-white border-white/20",
      accentBadge: "bg-black/25 text-emerald-100",
      bullets: [
        "✦ Set target home country & currency",
        "✦ Define total study abroad budget",
        "✦ Track live FX exchange rates",
        "✦ Calculate tuition + living expenses",
      ],
      ctaText: "Configure Profile",
      ctaHref: "/dashboard",
      ctaBtnClass: "bg-white text-emerald-950 hover:bg-emerald-100",
    },
    {
      step: "02",
      badge: "✦ kanban pipeline",
      title: "application pipeline",
      rotation: "rotate-1",
      bgClass: "bg-[#4D7CFF] text-white border-white/20",
      accentBadge: "bg-black/25 text-blue-100",
      bullets: [
        "✦ Drag-and-drop university cards",
        "✦ Move: Wishlist → Preparing → Submitted",
        "✦ Track acceptance & visa status",
        "✦ Add application fees & notes",
      ],
      ctaText: "Open Pipeline",
      ctaHref: "/pipeline",
      ctaBtnClass: "bg-white text-blue-950 hover:bg-blue-100",
    },
    {
      step: "03",
      badge: "✦ task checklists",
      title: "requirements checklist",
      rotation: "-rotate-1",
      bgClass: "bg-[#FF5722] text-white border-white/20",
      accentBadge: "bg-black/25 text-orange-100",
      bullets: [
        "✦ IELTS / TOEFL exam score targets",
        "✦ WES credential evaluation status",
        "✦ SOP & recommendation letter checklist",
        "✦ Visa & blocked account proof",
      ],
      ctaText: "View Requirements",
      ctaHref: "/requirements",
      ctaBtnClass: "bg-white text-orange-950 hover:bg-orange-100",
    },
    {
      step: "04",
      badge: "✦ secure storage",
      title: "document vault",
      rotation: "rotate-2",
      bgClass: "bg-[#8B1E3F] text-white border-white/20",
      accentBadge: "bg-black/25 text-rose-100",
      bullets: [
        "✦ Secure Supabase PDF cloud storage",
        "✦ Upload degree certificates & transcripts",
        "✦ Passport & bank statement storage",
        "✦ Direct linking to application cards",
      ],
      ctaText: "Open Vault",
      ctaHref: "/vault",
      ctaBtnClass: "bg-white text-rose-950 hover:bg-rose-100",
    },
    {
      step: "05",
      badge: "✦ fx capital ledger",
      title: "capital & fx ledger",
      rotation: "-rotate-2",
      bgClass: "bg-[#D946EF] text-white border-white/20",
      accentBadge: "bg-black/25 text-fuchsia-100",
      bullets: [
        "✦ Track liquid vs locked capital",
        "✦ Log application & courier fees",
        "✦ Local currency shadow conversion",
        "✦ Real-time exchange rate updates",
      ],
      ctaText: "View FX Ledger",
      ctaHref: "/ledger",
      ctaBtnClass: "bg-white text-fuchsia-950 hover:bg-fuchsia-100",
    },
    {
      step: "06",
      badge: "✦ zero missed dates",
      title: "deadline alerts",
      rotation: "rotate-1",
      bgClass: "bg-[#EAB308] text-slate-950 border-amber-400/40",
      accentBadge: "bg-black/15 text-amber-950",
      bullets: [
        "✦ 7-day urgent deadline warning widget",
        "✦ University submission cut-offs",
        "✦ Scholarship application windows",
        "✦ Priority status tags",
      ],
      ctaText: "View Deadlines",
      ctaHref: "/deadlines",
      ctaBtnClass: "bg-slate-950 text-white hover:bg-slate-800",
    },
  ];

  return (
    <div className="flex w-full flex-col gap-12 pb-16">
      {/* ─── Top Header (Playful Modern Title) ─────────────────────────────────── */}
      <div className="space-y-4 text-center max-w-2xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-4 py-1.5 text-xs font-black text-amber-950 shadow-sm">
          <Sparkles className="h-4 w-4 text-amber-600 fill-amber-500" />
          <span>Interactive Application Playbook</span>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
          everything you need for your study abroad journey<span className="text-indigo-600">:</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 font-semibold leading-relaxed">
          No lost documents, no budget surprises, no missed deadlines. Application OS organises your entire journey into 6 playful, stress-free stages!
        </p>
      </div>

      {/* ─── Tilted Overlapping Sticker Deck (Modern Playful Palette) ───────────── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-2">
        {stickerCards.map((card) => (
          <div
            key={card.step}
            className={`group relative flex flex-col justify-between rounded-3xl border-2 p-6 shadow-md shadow-slate-900/10 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-950/15 ${card.bgClass} ${card.rotation}`}
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between">
              <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${card.accentBadge}`}>
                {card.badge}
              </span>
              <span className="font-mono text-xl font-black opacity-40">
                #{card.step}
              </span>
            </div>

            {/* Title & Bullets */}
            <div className="my-6 space-y-4">
              <h2 className="font-heading text-2xl font-black tracking-tight underline underline-offset-4 decoration-white/40">
                {card.title}
              </h2>

              <ul className="space-y-2 text-xs font-bold leading-relaxed opacity-95">
                {card.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action CTA Button */}
            <div className="pt-4 border-t border-white/20">
              <Link
                href={card.ctaHref}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black shadow-xs transition-all cursor-pointer ${card.ctaBtnClass}`}
              >
                <span>{card.ctaText}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Bottom Action Card (Soft Gradient Modern Style) ────────────────────── */}
      <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-400 p-8 text-slate-950 shadow-xl shadow-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="font-heading text-2xl sm:text-3xl font-black tracking-tight">
            Ready to start your application adventure? 🎓
          </h3>
          <p className="text-xs sm:text-sm font-bold text-slate-800 max-w-lg leading-relaxed">
            Jump into your Application Pipeline now to add your first target university or set up your liquid capital!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-xs font-black text-white shadow-md transition-all hover:bg-slate-800 active:scale-95 cursor-pointer"
          >
            <Compass className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-black text-slate-950 border-2 border-slate-950 shadow-xs transition-all hover:bg-slate-100 active:scale-95 cursor-pointer"
          >
            <GanttChart className="h-4 w-4 text-indigo-600" />
            <span>Open Pipeline</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


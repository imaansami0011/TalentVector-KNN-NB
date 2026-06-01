import * as React from "react"
import { 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  ExternalLink,
  Star,
  Shield,
  Rocket,
  BarChart3,
  Users,
  Globe,
  Clock,
  CheckCircle2
} from "lucide-react"
import { cn } from "../lib/utils"

const AD_CARDS = [
  {
    id: "pro-plan",
    type: "promo",
    gradient: "from-indigo-600 via-blue-600 to-cyan-500",
    icon: Rocket,
    badge: "Upgrade",
    title: "Talent Vector Pro",
    description: "Unlock AI-powered screening, global candidate search, and advanced analytics.",
    features: ["Unlimited JD Pipelines", "Priority AI Matching", "Team Collaboration"],
    cta: "Explore Pro Plans",
    ctaIcon: ArrowRight,
  },
  {
    id: "ai-insights",
    type: "feature",
    gradient: "from-violet-600 via-purple-600 to-fuchsia-500",
    icon: BarChart3,
    badge: "New Feature",
    title: "Hiring Analytics",
    description: "Visualize your pipeline, track time-to-hire, and benchmark across departments.",
    stats: [
      { label: "Faster Hiring", value: "3.2x" },
      { label: "Match Accuracy", value: "94%" },
    ],
    cta: "Learn More",
    ctaIcon: ExternalLink,
  },
  {
    id: "global-talent",
    type: "stat",
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    icon: Globe,
    badge: "Network",
    title: "Global Talent Pool",
    description: "Access 50K+ verified candidate profiles across tech, design, and product.",
    stats: [
      { label: "Profiles", value: "50K+" },
      { label: "Sectors", value: "24" },
      { label: "Countries", value: "40+" },
    ],
    cta: "Browse Pool",
    ctaIcon: Users,
  },
]

const CANDIDATE_AD_CARDS = [
  {
    id: "candidate-pro",
    type: "promo",
    gradient: "from-indigo-600 via-blue-600 to-cyan-500",
    icon: Rocket,
    badge: "Upgrade",
    title: "Get Hired 3x Faster",
    description: "Get the Pro Talent Vector subscription to show your profile at the top of recruiter lists.",
    features: ["Featured Profile Placement", "Priority Resume Parsing", "Premium Match Insights"],
    cta: "Get Pro Subscription",
    ctaIcon: ArrowRight,
  },
  {
    id: "profile-boost",
    type: "feature",
    gradient: "from-violet-600 via-purple-600 to-fuchsia-500",
    icon: BarChart3,
    badge: "Boost Visibility",
    title: "Profile Optimization",
    description: "Optimize your resume scoring with our AI profile analyzer and rank in the top 5% of candidate matches.",
    stats: [
      { label: "Invite Rate", value: "+180%" },
      { label: "Search Views", value: "5.5x" },
    ],
    cta: "Boost My Profile",
    ctaIcon: ExternalLink,
  },
  {
    id: "direct-placement",
    type: "stat",
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    icon: Globe,
    badge: "Network",
    title: "Direct Placement Network",
    description: "Connect directly with hiring managers at 500+ top tech firms and companies in Pakistan.",
    stats: [
      { label: "Partners", value: "500+" },
      { label: "Avg Response", value: "24 hrs" },
      { label: "Placement Rate", value: "88%" },
    ],
    cta: "Get Verified Badge",
    ctaIcon: Users,
  },
]

const TIPS = [
  { icon: Zap, text: "Use specific JD keywords for higher match accuracy.", color: "text-amber-500" },
  { icon: TrendingUp, text: "Bulk-upload 10+ resumes for best ranking results.", color: "text-emerald-500" },
  { icon: Clock, text: "Screenings process in under 5 seconds per resume.", color: "text-blue-500" },
  { icon: Shield, text: "All data is encrypted at rest and in transit.", color: "text-violet-500" },
  { icon: Award, text: "Shortlisted candidates receive branded emails.", color: "text-rose-500" },
  { icon: CheckCircle2, text: "Track your entire pipeline from source to hire.", color: "text-teal-500" },
]

const CANDIDATE_TIPS = [
  { icon: Zap, text: "Add your latest tech/finance skills for higher match scores.", color: "text-amber-500" },
  { icon: TrendingUp, text: "Keep your experience detailed to match recruiter requirements.", color: "text-emerald-500" },
  { icon: Clock, text: "Recruiters screen profiles within hours of job postings.", color: "text-blue-500" },
  { icon: Shield, text: "Your personal details are encrypted and private.", color: "text-violet-500" },
  { icon: Award, text: "Pro profiles are highlighted in matching dashboards.", color: "text-rose-500" },
  { icon: CheckCircle2, text: "Custom portfolios receive 3x more interview invites.", color: "text-teal-500" },
]

export function AdPanel({ mode = "recruiter" }) {
  const isCandidate = mode === "candidate"
  const cards = isCandidate ? CANDIDATE_AD_CARDS : AD_CARDS
  const tips = isCandidate ? CANDIDATE_TIPS : TIPS
  const review = isCandidate ? {
    text: `"Upgraded to Talent Vector Pro and got 3 interviews in a week! Showing at the top of matching results made all the difference."`,
    name: "Bilal Khan",
    role: "MERN Stack Developer",
    company: "Islamabad",
    initial: "B",
    gradient: "from-violet-500 to-fuchsia-600"
  } : {
    text: `"Talent Vector transformed our hiring pipeline. We reduced time-to-hire by 60% and improved candidate quality dramatically."`,
    name: "Ayesha Malik",
    role: "Sr. HR Manager",
    company: "Systems Limited",
    initial: "A",
    gradient: "from-indigo-500 to-blue-600"
  }

  const [activeCard, setActiveCard] = React.useState(0)

  // Auto-rotate the promo cards every 6 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [cards.length])

  const card = cards[activeCard]
  const CardIcon = card.icon

  // Pick 2 random tips (stable per mount)
  const [tipIndices] = React.useState(() => {
    const shuffled = [...Array(tips.length).keys()].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 3)
  })

  return (
    <aside className="w-[340px] shrink-0 hidden xl:flex flex-col gap-4 py-6 pr-6 select-none">
      
      {/* Rotating Promo Card */}
      <div 
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br p-[1px] shadow-lg transition-all duration-700",
          card.gradient
        )}
      >
        <div className="relative rounded-[15px] bg-gradient-to-br from-slate-950/95 via-slate-900/98 to-slate-950 p-6 overflow-hidden">
          {/* Decorative glow */}
          <div className={cn(
            "absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl bg-gradient-to-br",
            card.gradient
          )} />
          <div className={cn(
            "absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10 blur-xl bg-gradient-to-br",
            card.gradient
          )} />

          <div className="relative z-10 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className={cn(
                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                card.gradient
              )}>
                <CardIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                {card.badge}
              </span>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-base font-black text-white uppercase tracking-tight leading-tight">
                {card.title}
              </h3>
              <p className="text-xs text-white/55 font-medium leading-relaxed">
                {card.description}
              </p>
            </div>

            {/* Features or Stats */}
            {card.features && (
              <div className="space-y-2">
                {card.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-white/65 font-bold">{f}</span>
                  </div>
                ))}
              </div>
            )}

            {card.stats && (
              <div className="flex gap-3">
                {card.stats.map((s, i) => (
                  <div key={i} className="flex-1 text-center py-2.5 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-lg font-black text-white leading-none">{s.value}</div>
                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <button className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r text-white text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all duration-300 hover:brightness-110",
              card.gradient
            )}>
              {card.cta}
              <card.ctaIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex items-center justify-center gap-1.5">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveCard(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === activeCard ? "w-5 bg-primary" : "w-1.5 bg-slate-200 hover:bg-slate-300"
            )}
          />
        ))}
      </div>

      {/* Quick Tips Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Quick Tips</h4>
        </div>
        <div className="space-y-3">
          {tipIndices.map((idx) => {
            const tip = tips[idx]
            const TipIcon = tip.icon
            return (
              <div key={idx} className="flex items-start gap-3 group">
                <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <TipIcon className={cn("w-3.5 h-3.5", tip.color)} />
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{tip.text}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rating / Review Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-sm font-black text-slate-700 ml-1.5 font-sans">4.9</span>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
          {review.text}
        </p>
        <div className="flex items-center gap-2.5 pt-1">
          <div className={cn(
            "w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-black",
            review.gradient
          )}>
            {review.initial}
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{review.name}</p>
            <p className="text-[10px] text-slate-400 font-medium">{review.role}{review.company ? `, ${review.company}` : ""}</p>
          </div>
        </div>
      </div>

      {/* Powered by footer */}
      <div className="text-center pt-1">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300">
          Powered by Talent Vector AI
        </p>
      </div>
    </aside>
  )
}

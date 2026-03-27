import {
  ArrowRight,
  BookOpenText,
  Brain,
  CalendarDays,
  ChevronRight,
  Quote,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { WatashiBrand } from '../../app/ui/brand'
import {
  communityStats,
  communityVoices,
  fluidityFeatures,
  footerLinks,
  learningPathCards,
  learningPathShowcase,
  newsroomCards,
} from './data'
import { LearningAnimation } from './learning-animation'
import { PublicHeader } from './public-header'

function LearningPathsSection() {
  return (
    <section id="learning-paths" className="scroll-mt-24 bg-[#eef2f4] px-5 py-20 sm:px-8 lg:px-0 lg:py-24">
      <div className="mx-auto max-w-[1380px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#176851]">Curated Paths</p>
            <h2 className="font-display mt-4 text-[46px] font-black tracking-[-0.06em] text-[#141c2f] sm:text-[58px]">
              Your Learning Paths
            </h2>
            <p className="mt-4 max-w-[520px] text-[16px] leading-[1.75] text-[#65748a]">
              Curated sequences for rapid expertise acquisition with guided modules, proof-driven milestones, and mentor-calibrated pacing.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 self-start rounded-full border border-[#d7e0e6] bg-white px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#176851] shadow-[0_14px_34px_rgba(17,33,60,0.06)] transition-all hover:-translate-y-0.5"
          >
            {learningPathShowcase.action}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-4 lg:grid-rows-[1fr_1fr]">
          <article className="group relative overflow-hidden rounded-[36px] bg-white p-8 shadow-[0_22px_60px_rgba(17,33,60,0.08)] lg:col-span-2 lg:row-span-2">
            <div className="absolute right-0 top-0 h-56 w-56 translate-x-16 -translate-y-16 rounded-full bg-[#a6f2d4]/45 blur-3xl transition-transform duration-500 group-hover:scale-125" />
            <div className="relative flex h-full flex-col justify-between gap-10">
              <div>
                <span className="inline-flex rounded-full bg-[#daf7ea] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#176851]">
                  {learningPathShowcase.eyebrow}
                </span>
                <h3 className="font-display mt-5 max-w-[460px] text-[34px] font-black leading-[1.02] tracking-[-0.05em] text-[#141c2f] sm:text-[40px]">
                  {learningPathShowcase.title}
                </h3>
                <p className="mt-4 max-w-[360px] text-[15px] leading-[1.75] text-[#69778c]">
                  {learningPathShowcase.description}
                </p>
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {learningPathShowcase.participants.map((image, index) => (
                      <img
                        key={image}
                        src={image}
                        alt={index === 0 ? 'Learner avatar' : 'Mentor avatar'}
                        className="h-11 w-11 rounded-full border-2 border-white object-cover shadow-[0_10px_24px_rgba(17,33,60,0.12)]"
                      />
                    ))}
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7f8da3]">
                    {learningPathShowcase.participantsLabel}
                  </span>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#176851] text-white shadow-[0_18px_30px_rgba(23,104,81,0.22)] transition-transform group-hover:translate-x-1">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-[32px] bg-[linear-gradient(160deg,#645efb_0%,#4b41e1_100%)] p-7 text-white shadow-[0_24px_50px_rgba(75,65,225,0.24)]">
            <div className="flex h-full flex-col justify-between gap-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/14">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-[24px] font-black tracking-[-0.04em]">
                  {learningPathCards[0].title}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-white/76">{learningPathCards[0].description}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[32px] border border-[#dbe4e8] bg-white p-7 shadow-[0_18px_38px_rgba(17,33,60,0.05)]">
            <div className="flex h-full flex-col justify-between gap-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#eef0ff] text-[#4b41e1]">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-[24px] font-black tracking-[-0.04em] text-[#141c2f]">
                  {learningPathCards[1].title}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-[#6b7990]">{learningPathCards[1].description}</p>
              </div>
            </div>
          </article>

          <article className="group rounded-[32px] border border-[#dbe4e8] bg-white p-5 shadow-[0_18px_38px_rgba(17,33,60,0.05)] lg:col-span-2">
            <div className="flex h-full flex-col gap-6 sm:flex-row sm:items-center">
              <div className="h-[180px] overflow-hidden rounded-[24px] bg-[#eef2f5] sm:h-full sm:w-[160px]">
                <img
                  src={learningPathCards[2].image}
                  alt="Abstract curriculum growth chart"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between gap-4">
                <div>
                  <h3 className="font-display text-[30px] font-black leading-[1.02] tracking-[-0.05em] text-[#141c2f]">
                    {learningPathCards[2].title}
                  </h3>
                  <p className="mt-3 max-w-[420px] text-[14px] leading-[1.75] text-[#6b7990]">
                    {learningPathCards[2].description}
                  </p>
                </div>

                <button type="button" className="inline-flex items-center gap-2 self-start text-[13px] font-black text-[#176851] transition-all group-hover:gap-3">
                  {learningPathCards[2].action}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function FluiditySection() {
  const iconMap = {
    adaptive: BookOpenText,
    sync: RefreshCw,
    curation: Sparkles,
  } as const

  return (
    <section id="fluidity" className="scroll-mt-24 bg-[#f6f8fb] px-5 py-24 sm:px-8 lg:px-0 lg:py-28">
      <div className="mx-auto grid max-w-[1380px] gap-14 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#176851]">Built for Fluidity</p>
          <h2 className="font-display mt-4 text-[48px] font-black leading-[0.94] tracking-[-0.06em] text-[#141c2f] sm:text-[62px]">
            Built for <span className="text-[#176851]">Fluidity.</span>
          </h2>

          <div className="mt-10 space-y-8">
            {fluidityFeatures.map((feature) => {
              const Icon = iconMap[feature.icon]

              return (
                <div key={feature.title} className="flex items-start gap-5">
                  <div className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-full ${
                    feature.icon === 'sync'
                      ? 'bg-[#efecff] text-[#4b41e1]'
                      : feature.icon === 'curation'
                        ? 'bg-[#ffe6e2] text-[#8c4843]'
                        : 'bg-[#e8f5ef] text-[#176851]'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-[26px] font-black tracking-[-0.04em] text-[#141c2f]">{feature.title}</h3>
                    <p className="mt-2 max-w-[520px] text-[15px] leading-[1.8] text-[#6a7890]">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            className="mt-12 inline-flex items-center gap-3 rounded-full bg-[#141c2f] px-8 py-4 text-[13px] font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_22px_40px_rgba(20,28,47,0.18)] transition-all hover:-translate-y-0.5"
          >
            Experience the Engine
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[40px] bg-[linear-gradient(180deg,#edf1f5_0%,#e1edf4_100%)] p-8 shadow-[0_34px_80px_rgba(18,33,60,0.12)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(166,242,212,0.5),transparent_28%),radial-gradient(circle_at_72%_68%,rgba(226,223,255,0.5),transparent_26%)]" />
            <div className="relative flex min-h-[420px] items-center justify-center">
              <div className="absolute left-6 top-6 rounded-[22px] bg-white px-4 py-3 shadow-[0_18px_34px_rgba(17,33,60,0.08)]">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#141c2f]">Active Processing</span>
                </div>
              </div>

              <div className="absolute right-8 top-8 rounded-full border border-white/70 bg-white/72 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#4b41e1] backdrop-blur">
                Learning Engine
              </div>

              <div className="flex h-[260px] w-[260px] items-center justify-center rounded-full bg-[#a6f2d4] shadow-[0_0_90px_rgba(23,104,81,0.2)]">
                <div className="flex h-[144px] w-[144px] items-center justify-center rounded-full border border-[#176851]/18 bg-white/58 backdrop-blur">
                  <span className="font-display text-[38px] font-black tracking-[-0.05em] text-[#176851]">Fluid</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CommunitySection() {
  return (
    <section id="community" className="scroll-mt-24 bg-[#eef2f4] px-5 py-20 sm:px-8 lg:px-0 lg:py-24">
      <div className="mx-auto max-w-[1380px]">
        <div className="grid gap-8 lg:grid-cols-2">
          {communityVoices.map((voice) => (
            <article
              key={voice.name}
              className="relative overflow-hidden rounded-[36px] bg-white px-7 py-8 shadow-[0_24px_55px_rgba(17,33,60,0.08)] sm:px-10 sm:py-10"
            >
              <Quote className="absolute right-7 top-7 h-20 w-20 text-[#176851]/12" strokeWidth={2.4} />
              <p className="relative z-10 max-w-[540px] text-[22px] font-bold leading-[1.7] text-[#273244] sm:text-[25px]">
                &quot;{voice.quote}&quot;
              </p>
              <div className="mt-8 flex items-center gap-4">
                <img src={voice.image} alt={`Portrait of ${voice.name}`} className="h-14 w-14 rounded-full object-cover" />
                <div>
                  <div className="text-[15px] font-black text-[#141c2f]">{voice.name}</div>
                  <div className="text-[12px] font-semibold tracking-[0.02em] text-[#718099]">{voice.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-2 gap-8 rounded-[36px] bg-white px-6 py-8 shadow-[0_18px_40px_rgba(17,33,60,0.05)] sm:px-10 lg:grid-cols-4">
          {communityStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-[38px] font-black tracking-[-0.05em] text-[#176851] sm:text-[46px]">{stat.value}</div>
              <div className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#7f8da3]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function NewsroomSection() {
  return (
    <section id="news" className="scroll-mt-24 bg-[#f6f8fb] px-5 py-20 sm:px-8 lg:px-0 lg:py-24">
      <div className="mx-auto max-w-[1380px]">
        <div className="flex items-center gap-4">
          <h2 className="font-display text-[42px] font-black tracking-[-0.06em] text-[#141c2f] sm:text-[54px]">
            Latest from the Newsroom
          </h2>
          <div className="hidden h-px flex-1 bg-[#d7e0e6] sm:block" />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-6 lg:grid-rows-[240px_180px]">
          <article className="group relative overflow-hidden rounded-[34px] bg-[#eef2f4] p-8 lg:col-span-3 lg:row-span-1">
            <img
              src={newsroomCards.spotlight.image}
              alt="Abstract pattern for newsroom story"
              className="absolute inset-0 h-full w-full object-cover opacity-[0.18] grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
            />
            <div className="relative z-10 flex h-full flex-col justify-end">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#176851]">{newsroomCards.spotlight.category}</span>
              <h3 className="font-display mt-3 text-[28px] font-black tracking-[-0.05em] text-[#141c2f]">
                {newsroomCards.spotlight.title}
              </h3>
              <p className="mt-3 max-w-[420px] text-[14px] leading-[1.7] text-[#60708a]">
                {newsroomCards.spotlight.description}
              </p>
            </div>
          </article>

          <article className="rounded-[34px] bg-[linear-gradient(160deg,#176851_0%,#2d8b6d_100%)] p-8 text-white shadow-[0_26px_54px_rgba(23,104,81,0.24)] lg:col-span-3">
            <div className="flex h-full flex-col justify-between gap-10">
              <div className="text-right font-display text-[54px] font-black tracking-[-0.08em] text-white/28">
                {newsroomCards.release.version}
              </div>
              <div>
                <h3 className="font-display text-[30px] font-black tracking-[-0.05em]">{newsroomCards.release.title}</h3>
                <p className="mt-3 max-w-[360px] text-[14px] leading-[1.7] text-white/76">
                  {newsroomCards.release.description}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-[#dbe4e8] bg-white p-6 shadow-[0_18px_40px_rgba(17,33,60,0.05)] lg:col-span-2">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="flex items-center gap-3 text-[#4b41e1]">
                <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#efecff]">
                  <BookOpenText className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#141c2f]">
                  {newsroomCards.podcast.category}
                </span>
              </div>
              <div>
                <h3 className="font-display text-[24px] font-black tracking-[-0.04em] text-[#141c2f]">{newsroomCards.podcast.title}</h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-[#6b7990]">{newsroomCards.podcast.description}</p>
              </div>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[30px] bg-[#e2dfff] p-7 shadow-[0_20px_40px_rgba(75,65,225,0.12)] lg:col-span-4">
            <div className="flex h-full flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <span className="inline-flex rounded-full bg-[#4b41e1] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white">
                  {newsroomCards.event.category}
                </span>
                <h3 className="font-display mt-3 text-[30px] font-black tracking-[-0.05em] text-[#1b1551]">
                  {newsroomCards.event.title}
                </h3>
                <p className="mt-3 max-w-[440px] text-[14px] leading-[1.7] text-[#554e85]">
                  {newsroomCards.event.description}
                </p>
              </div>

              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white/38 text-[#4b41e1] sm:h-32 sm:w-32">
                <CalendarDays className="h-10 w-10" />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export function LandingPage() {
  return (
    <div className="landing-shell min-h-screen bg-[#f6f8fb] font-sans text-slate-900 selection:bg-[#176851]/20">
      <PublicHeader showCenterLinks activeAuth={undefined} />

      <main className="pt-[88px] sm:pt-[96px]">
        <section id="hero" className="relative overflow-hidden px-5 pb-20 pt-8 sm:px-8 md:pt-12 lg:pb-24 lg:pt-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_38%),radial-gradient(circle_at_86%_12%,rgba(220,241,232,0.88),transparent_24%),radial-gradient(circle_at_72%_36%,rgba(233,235,254,0.56),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(223,231,244,0.78),transparent_26%)]" />
          <div className="relative mx-auto max-w-[1380px]">
            <div className="grid min-h-[calc(100vh-120px)] items-center gap-14 lg:grid-cols-[minmax(0,590px)_1fr] lg:gap-10">
              <div className="animate-in slide-in-from-left pt-10 text-left duration-700 sm:pt-16 lg:pt-20">
                <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#8b99af]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#176851]" />
                  The Digital Curator Experience
                </div>

                <h1 className="font-display mt-8 text-[60px] font-black leading-[0.9] tracking-[-0.07em] text-[#14515b] sm:text-[78px] lg:text-[92px]">
                  Watashi
                  <br />
                  Learn.
                  <br />
                  <span className="bg-[linear-gradient(135deg,#1a707d_0%,#214f8f_48%,#4b41e1_100%)] bg-clip-text text-transparent">
                    Zero to Hero.
                  </span>
                </h1>

                <p className="mt-8 max-w-[510px] text-[17px] leading-[1.75] text-[#6d7b92] sm:text-[18px]">
                  Experience an editorial-grade learning journey where curriculum meets high-end curation. Transform from a curious observer to an industry hero.
                </p>

                <Link
                  to="/register"
                  className="mt-10 inline-flex items-center gap-4 rounded-full bg-white px-3 py-3 pr-4 text-[13px] font-semibold text-[#5d6a82] shadow-[0_18px_34px_rgba(17,33,60,0.08)] transition-all hover:-translate-y-0.5"
                >
                  <span className="rounded-full bg-[#f1f5f9] px-4 py-2">Start your path, e.g. Senior UI Designer</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#176851] text-white shadow-[0_12px_22px_rgba(23,104,81,0.22)]">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>

              <div className="animate-in fade-in slide-in-from-right relative mx-auto flex h-[380px] w-full max-w-[650px] items-center justify-center delay-200 duration-1000 sm:h-[460px] lg:h-[640px]">
                <LearningAnimation />
              </div>
            </div>
          </div>
        </section>

        <LearningPathsSection />
        <FluiditySection />
        <CommunitySection />
        <NewsroomSection />

        <footer className="bg-[#f1f5f7] px-5 pb-10 pt-8 sm:px-8 lg:px-0">
          <div className="mx-auto flex max-w-[1380px] flex-col gap-8 rounded-[34px] border border-white/80 bg-white/78 px-6 py-8 shadow-[0_18px_42px_rgba(17,33,60,0.06)] backdrop-blur md:flex-row md:items-end md:justify-between">
            <div>
              <WatashiBrand compact />
              <p className="mt-3 max-w-[320px] text-[12px] leading-[1.7] text-[#7c8aa0]">
                Precision in learning, designed for focused progress from your first lesson to portfolio-ready proof.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-[12px]">
              {footerLinks.map((item) => (
                <a key={item} href="/" className="font-semibold text-[#8c98ad] no-underline transition-colors hover:text-[#141c2f]">
                  {item}
                </a>
              ))}
            </div>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#176851] px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_14px_28px_rgba(23,104,81,0.18)]"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </footer>
      </main>
    </div>
  )
}

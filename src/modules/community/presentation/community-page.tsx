import { ArrowUpRight, Heart, MessageSquare, Users2 } from 'lucide-react'
import { communityStats, discussions, featuredArticle } from '../domain/community-model'
import { WorkspaceEyebrow, WorkspacePanel, cx } from '../../../shared/ui/workspace'

export function CommunityPage() {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_320px]">
      <section className="space-y-8">
        <WorkspacePanel className="overflow-hidden p-0 transition-shadow duration-300 hover:shadow-[var(--shadow-watashi-card)]">
          <div className="relative min-h-[21rem]">
            <img alt={featuredArticle.title} className="absolute inset-0 h-full w-full object-cover" src={featuredArticle.image} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,19,0.12),rgba(8,15,19,0.82))]" />
            <div className="relative flex h-full min-h-[21rem] flex-col justify-end p-8 text-white">
              <span className="inline-flex w-fit rounded-full bg-[var(--color-watashi-primary-fixed)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-watashi-emerald)]">
                {featuredArticle.label}
              </span>
              <h1 className="mt-5 max-w-[14ch] font-display text-[clamp(2.3rem,5vw,3.6rem)] font-black leading-[0.92] tracking-[-0.07em]">
                {featuredArticle.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="font-bold">{featuredArticle.author}</span>
                <span className="text-white/40">|</span>
                <span>{featuredArticle.length}</span>
              </div>
            </div>
          </div>
        </WorkspacePanel>

        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-[2rem] font-black tracking-[-0.05em] text-[var(--color-watashi-text-strong)]">Live Discussions</h2>
              <p className="mt-1 text-sm text-[var(--color-watashi-text)]">Trending conversations with explicit module boundaries and cleaner feed composition.</p>
            </div>
            <div className="inline-flex rounded-full bg-[var(--color-watashi-surface-low)] p-1 text-[11px] font-bold">
              <span className="rounded-full bg-[var(--color-watashi-surface-card)] px-3 py-1.5 text-[var(--color-watashi-emerald)] shadow-sm">Trending</span>
              <span className="px-3 py-1.5 text-[var(--color-watashi-text)]">Latest</span>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {discussions.map((discussion, index) => (
              <WorkspacePanel key={discussion.title} className={cx('rounded-[2rem] p-6 transition-all duration-200 hover:ring-1 hover:ring-[var(--color-watashi-border)]', index === 1 && 'bg-[linear-gradient(180deg,var(--color-watashi-surface-card),var(--color-watashi-surface-low))]')}>
                <WorkspaceEyebrow>{discussion.topic}</WorkspaceEyebrow>
                <h3 className="mt-4 font-display text-[1.65rem] font-black leading-tight tracking-[-0.05em] text-[var(--color-watashi-text-strong)]">
                  {discussion.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[var(--color-watashi-text)]">{discussion.body}</p>
                <div className="mt-8 flex items-center justify-between gap-4 text-sm text-[var(--color-watashi-text)]">
                  <span className="font-semibold">{discussion.author}</span>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" />
                      {discussion.replies}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Heart className="h-4 w-4" />
                      {discussion.likes}
                    </span>
                  </div>
                </div>
              </WorkspacePanel>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <WorkspacePanel className="bg-[linear-gradient(180deg,var(--color-watashi-surface-card),var(--color-watashi-surface-low))]">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-watashi-primary-fixed)] text-[var(--color-watashi-emerald)]">
              <Users2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-[1.55rem] font-black tracking-[-0.04em] text-[var(--color-watashi-text-strong)]">Community Voice</h2>
              <WorkspaceEyebrow>Impact tracker</WorkspaceEyebrow>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {communityStats.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-[1.5rem] bg-[var(--color-watashi-surface-card)] px-4 py-4 ring-1 ring-[var(--color-watashi-border)]">
                <div>
                  <WorkspaceEyebrow>{item.label}</WorkspaceEyebrow>
                  <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--color-watashi-text-strong)]">{item.value}</p>
                </div>
                <span className={cx('flex h-11 w-11 items-center justify-center rounded-2xl', item.tone)}>
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <WorkspacePanel className="bg-[linear-gradient(135deg,var(--color-watashi-indigo),#7066ff)] text-white">
            <WorkspaceEyebrow className="text-white/65">AI</WorkspaceEyebrow>
            <p className="mt-3 font-display text-[1.6rem] font-black tracking-[-0.05em]">Curator&apos;s Guide</p>
          </WorkspacePanel>
          <WorkspacePanel>
            <WorkspaceEyebrow>Study groups</WorkspaceEyebrow>
            <p className="mt-3 font-display text-[1.6rem] font-black tracking-[-0.05em] text-[var(--color-watashi-text-strong)]">Top Curators</p>
            <ol className="mt-5 space-y-3 text-sm text-[var(--color-watashi-text)]">
              <li className="flex items-center justify-between">
                <span>1. Elena Rodriguez</span>
                <span className="font-bold text-[var(--color-watashi-emerald)]">1.4k pts</span>
              </li>
              <li className="flex items-center justify-between">
                <span>2. Marcus Chen</span>
                <span className="font-bold text-[var(--color-watashi-emerald)]">1.1k pts</span>
              </li>
            </ol>
          </WorkspacePanel>
        </div>
      </aside>
    </div>
  )
}

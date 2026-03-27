import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { BookOpenText, Compass, Layers3, Menu, Newspaper, Rocket, Sparkles, UserRound, Users, X } from 'lucide-react'
import { WatashiMark } from '../../app/ui/brand'

function SignInGlyph({ className = '' }: { className?: string }) {
  return <UserRound aria-hidden="true" className={className} strokeWidth={2.1} />
}

function GetStartedGlyph({ className = '' }: { className?: string }) {
  return <Rocket aria-hidden="true" className={className} strokeWidth={2.1} />
}

type PublicHeaderProps = {
  showCenterLinks: boolean
  activeAuth?: 'login' | 'register'
}

const productNavItems = [
  { id: 'hero', label: 'Catalog', type: 'section' as const },
  { id: 'learning-paths', label: 'My Learning', type: 'section' as const },
  { id: 'fluidity', label: 'Certificates', type: 'section' as const },
]

const secondaryNavItems = [
  { id: 'news', label: 'News', type: 'section' as const },
  { id: 'community', label: 'Community', type: 'section' as const },
]

const dockedTopItems = [
  { id: 'hero', label: 'Explore', icon: Compass, type: 'section' as const, target: 'hero' },
  { id: 'learning-paths', label: 'Learning Paths', icon: BookOpenText, type: 'section' as const, target: 'learning-paths' },
  { id: 'fluidity', label: 'Certificates', icon: Sparkles, type: 'section' as const, target: 'fluidity' },
]

const dockedBottomItems = [
  { id: 'news', label: 'News', icon: Newspaper, type: 'section' as const, target: 'news' },
  { id: 'community', label: 'Community', icon: Users, type: 'section' as const, target: 'community' },
]

const authRailItems = [
  { id: 'login', label: 'Sign In', icon: SignInGlyph, to: '/login' as const, tone: 'neutral' as const },
  { id: 'register', label: 'Get Started', icon: GetStartedGlyph, to: '/register' as const, tone: 'accent' as const },
]

const observedSections = ['hero', 'learning-paths', 'fluidity', 'news', 'community']
const neoGrotesqueFont = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export function PublicHeader({ showCenterLinks, activeAuth }: PublicHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDocked, setIsDocked] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const updateDockState = () => {
      const hero = document.getElementById('hero')

      if (!hero) {
        setIsDocked(window.scrollY > 220)
        return
      }

      const heroBottom = hero.getBoundingClientRect().bottom
      setIsDocked(heroBottom <= 116)
    }

    updateDockState()
    window.addEventListener('scroll', updateDockState, { passive: true })
    window.addEventListener('resize', updateDockState)

    return () => {
      window.removeEventListener('scroll', updateDockState)
      window.removeEventListener('resize', updateDockState)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined' || !showCenterLinks) {
      return
    }

    document.body.dataset.navDocked = isDocked ? 'true' : 'false'

    return () => {
      delete document.body.dataset.navDocked
    }
  }, [isDocked, showCenterLinks])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined' || !showCenterLinks) {
      return
    }

    const sections = observedSections
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section instanceof HTMLElement)

    if (sections.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((entryA, entryB) => entryB.intersectionRatio - entryA.intersectionRatio)[0]

        if (visibleEntry?.target.id) {
          setActiveSection(visibleEntry.target.id)
        }
      },
      {
        rootMargin: '-20% 0px -52% 0px',
        threshold: [0.2, 0.45, 0.72],
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => {
      observer.disconnect()
    }
  }, [showCenterLinks])

  const scrollToSection = (id: string) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return
    }

    const element = document.getElementById(id)
    const topOffset = isDocked && window.innerWidth >= 1024 ? 20 : 100

    if (element) {
      const nextTop = element.getBoundingClientRect().top + window.scrollY - topOffset
      window.scrollTo({ top: nextTop, behavior: 'smooth' })
      setActiveSection(id)
    }

    setMenuOpen(false)
  }

  const renderTopNavItem = (item: (typeof productNavItems)[number] | (typeof secondaryNavItems)[number]) => {
    const selected = item.type === 'section' && activeSection === item.id

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => scrollToSection(item.id)}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 transition-all lg:px-3.5 xl:px-4 ${
          selected
            ? 'bg-[#e7f2ec] text-[#2e7a63] shadow-[0_1px_2px_rgba(18,33,60,0.04)]'
            : 'text-[#5d6b82] hover:text-[#14213c]'
        }`}
      >
        <span
          className="text-[11px] font-medium uppercase leading-none tracking-[0.03em] lg:text-[12px]"
          style={{ fontFamily: neoGrotesqueFont }}
        >
          {item.label}
        </span>
      </button>
    )
  }

  const renderMobileNavItem = (item: (typeof productNavItems)[number] | (typeof secondaryNavItems)[number]) => {
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => scrollToSection(item.id)}
        className={`rounded-2xl px-4 py-3 text-left text-[14px] font-medium sm:text-[15px] ${
          activeSection === item.id ? 'bg-[#176851] text-white' : 'border border-[#edf2f7] text-[#14213c]'
        }`}
        style={{ fontFamily: neoGrotesqueFont }}
      >
        {item.label}
      </button>
    )
  }

  const renderDockedItem = (item: (typeof dockedTopItems)[number] | (typeof dockedBottomItems)[number]) => {
    const Icon = item.icon
    const selected = activeSection === item.target

    const content = (
      <span
        className={`group relative flex h-12 w-12 items-center justify-center rounded-[18px] transition-all duration-200 ${
          selected
            ? 'bg-[linear-gradient(180deg,#2f7b63_0%,#176851_100%)] text-white shadow-[0_16px_28px_rgba(23,104,81,0.28)]'
            : 'text-[#7d8a9e] hover:text-[#2e7a63]'
        }`}
      >
        {!selected ? (
          <span className="absolute inset-0 rounded-[18px] bg-[#e7f3ed] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        ) : null}
        <Icon className="relative h-[18px] w-[18px]" />
      </span>
    )

    return (
      <button key={item.id} type="button" title={item.label} aria-label={item.label} onClick={() => scrollToSection(item.target)} className="flex items-center justify-center">
        {content}
      </button>
    )
  }

  const renderRailAuthItem = (item: (typeof authRailItems)[number]) => {
    const Icon = item.icon
    const selected = activeAuth === item.id
    const isAccent = item.tone === 'accent'

    return (
      <Link
        key={item.id}
        to={item.to}
        title={item.label}
        aria-label={item.label}
        className="flex items-center justify-center"
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-[18px] transition-all duration-200 ${
            isAccent
              ? 'bg-[linear-gradient(180deg,#2f7b63_0%,#176851_100%)] text-white shadow-[0_18px_32px_rgba(23,104,81,0.28)]'
              : selected
                ? 'bg-white text-[#314157] shadow-[0_10px_20px_rgba(18,33,60,0.08)] ring-1 ring-[#e9edf3]'
                : 'bg-white/92 text-[#6f7b79] shadow-[0_10px_20px_rgba(18,33,60,0.06)] ring-1 ring-[#eef2f6]'
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
      </Link>
    )
  }

  return (
    <>
      {showCenterLinks ? (
        <aside
          className={`fixed left-5 top-5 z-50 hidden transition-all duration-300 lg:block ${
            isDocked ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-6 opacity-0'
          }`}
          style={{ fontFamily: neoGrotesqueFont }}
        >
          <div className="relative flex h-[calc(100vh-40px)] w-[86px] flex-col items-center rounded-[40px] border border-white/88 bg-[linear-gradient(180deg,#fbfcfe_0%,#eef3f8_100%)] px-4 py-6 shadow-[0_30px_70px_rgba(18,33,60,0.14)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-x-4 top-0 h-24 rounded-b-[30px] bg-[radial-gradient(circle_at_top,rgba(23,104,81,0.14),transparent_72%)]" />

            <Link to="/" title="Watashi Learn" aria-label="Watashi Learn" className="relative flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#2f7b63_0%,#176851_100%)] text-white shadow-[0_16px_28px_rgba(23,104,81,0.28)]">
              <Layers3 className="h-5 w-5" />
            </Link>

            <div className="relative mt-6 flex flex-col gap-4">
              {dockedTopItems.map((item) => renderDockedItem(item))}
            </div>

            <div className="relative my-5 h-px w-9 bg-[#dfe5eb]" />

            <div className="relative flex flex-col gap-4">
              {dockedBottomItems.map((item) => renderDockedItem(item))}
            </div>

            <div className="mt-auto flex flex-col gap-4">
              {authRailItems.map((item) => renderRailAuthItem(item))}
            </div>
          </div>
        </aside>
      ) : null}

      <div
        className={`fixed inset-x-0 top-0 z-50 px-4 pt-4 transition-all duration-300 sm:px-6 sm:pt-5 lg:px-10 ${
          isDocked ? 'lg:pointer-events-none lg:-translate-y-4 lg:opacity-0' : 'opacity-100'
        }`}
      >
        <nav
          className="mx-auto max-w-[1380px] rounded-full border border-white/90 bg-white/86 px-4 py-3 shadow-[0_18px_48px_rgba(28,45,78,0.08)] backdrop-blur-xl sm:px-5"
          style={{ fontFamily: neoGrotesqueFont }}
        >
          <div className="flex min-h-[52px] items-center justify-between gap-4">
            <Link to="/" className="group flex items-center gap-2 rounded-full pl-2 pr-3">
              <WatashiMark className="h-10 w-10" />
              <span className="flex flex-col leading-none">
                <span className="text-[16px] font-black tracking-[-0.04em] text-[#14213c] transition-colors group-hover:text-[#0b162e]">
                  watashi
                </span>
                <span className="mt-1 text-[6px] font-extrabold uppercase tracking-[0.18em] text-[#98a3b5]">Zero to Hero</span>
              </span>
            </Link>

            <div className="hidden items-center gap-2 lg:flex">
              <div className="flex items-center rounded-full border border-[#ebf0f5] bg-[#f7fafc] p-1">
                {productNavItems.map((item) => renderTopNavItem(item))}
              </div>
            </div>

            <div className="hidden items-center gap-5 md:flex">
              <div className="hidden items-center gap-5 lg:flex">
                {secondaryNavItems.map((item) => renderTopNavItem(item))}
              </div>

              <div className="hidden h-5 w-px bg-[#e7edf3] lg:block" />

              <Link
                to="/login"
                className={`inline-flex items-center gap-2 text-[11px] font-medium transition-colors lg:text-[12px] ${
                  activeAuth === 'login' ? 'text-[#14213c]' : 'text-[#6f7d95] hover:text-[#14213c]'
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e7edf3] bg-white text-[#6f7b79] shadow-[0_8px_16px_rgba(18,33,60,0.05)]">
                  <SignInGlyph className="h-3.5 w-3.5" />
                </span>
                Sign In
              </Link>

              <Link
                to="/register"
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold shadow-[0_12px_24px_rgba(23,104,81,0.18)] transition-all lg:text-[12px] ${
                  activeAuth === 'register' || !activeAuth
                    ? 'bg-[#176851] text-white hover:bg-[#145a46]'
                    : 'bg-[#eff4f1] text-[#176851] hover:bg-[#e5eee8]'
                }`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${activeAuth === 'register' || !activeAuth ? 'bg-white/14 text-white' : 'bg-white text-[#176851]'}`}>
                  <GetStartedGlyph className="h-3.5 w-3.5" />
                </span>
                Get Started
              </Link>
            </div>

            <button type="button" onClick={() => setMenuOpen((value) => !value)} className="rounded-full p-2 text-[#4f5c74] md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {menuOpen ? (
            <div className="mt-3 rounded-[28px] border border-slate-100 bg-white p-4 shadow-lg md:hidden">
              <div className="flex flex-col gap-3">
                {productNavItems.map((item) => renderMobileNavItem(item))}

                <div className="my-1 border-t border-slate-100" />

                {secondaryNavItems.map((item) => renderMobileNavItem(item))}

                <div className="my-1 border-t border-slate-100" />

                <Link
                  to="/login"
                  className="inline-flex items-center gap-3 rounded-2xl border border-[#edf2f7] px-4 py-3 text-left text-[14px] font-medium text-[#14213c] sm:text-[15px]"
                  style={{ fontFamily: neoGrotesqueFont }}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#f8fbfd] text-[#6f7b79]">
                    <SignInGlyph className="h-3.5 w-3.5" />
                  </span>
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-3 rounded-2xl bg-[#176851] px-4 py-3 text-left text-[14px] font-medium text-white sm:text-[15px]"
                  style={{ fontFamily: neoGrotesqueFont }}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/14 text-white">
                    <GetStartedGlyph className="h-3.5 w-3.5" />
                  </span>
                  Get Started
                </Link>
              </div>
            </div>
          ) : null}
        </nav>
      </div>
    </>
  )
}

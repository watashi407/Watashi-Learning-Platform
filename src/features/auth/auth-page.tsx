import { startTransition, useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, BookOpenText, Eye, EyeOff, Loader2, Sparkles, Star } from 'lucide-react'
import { WatashiMark } from '../../app/ui/brand'
import { ROUTE_PATHS } from '../../shared/routing/paths'
import { signIn, signUp, startOAuth } from './auth.functions'
import type { AuthPayload, OAuthProvider } from '../../shared/contracts/auth'
import { getDisplayErrorMessage, getErrorRequestId, unwrapActionResult } from '../../shared/errors'

const DEVELOPER_QUOTES = [
  {
    quote: 'Programmer: A machine that turns coffee into code.',
    author: 'Anonymous',
  },
  {
    quote: 'Computers are fast; programmers keep it slow.',
    author: 'Anonymous',
  },
  {
    quote: 'When I wrote this code, only God and I understood what I did. Now only God knows.',
    author: 'Anonymous',
  },
  {
    quote: 'How many programmers does it take to change a light bulb? None, that is a hardware problem.',
    author: 'Anonymous',
  },
] as const

function GoogleMark() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.02 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function GitHubMark() {
  return (
    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function AuthProviderButton({
  provider,
  loading,
  disabled,
  onClick,
}: {
  provider: OAuthProvider
  loading: boolean
  disabled: boolean
  onClick: () => void
}) {
  const isGoogle = provider === 'google'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center gap-2.5 rounded-2xl border border-[#dfe4e7] bg-white px-4 py-3.5 text-[13px] font-bold text-[#191c1e] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-[#f5f7f8] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isGoogle ? <GoogleMark /> : <GitHubMark />}
      {isGoogle ? 'Google' : 'GitHub'}
    </button>
  )
}

function AuthInput({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  trailing,
}: {
  id: string
  label?: string
  type: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete?: string
  required?: boolean
  trailing?: ReactNode
}) {
  return (
    <div>
      {label ? (
        <label htmlFor={id} className="mb-2 block px-1 text-[11px] font-bold text-[#191c1e]">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full rounded-2xl border border-[#dfe4e7] bg-white px-5 py-3.5 text-[14px] font-medium text-[#191c1e] outline-none transition focus:border-[#408a71] focus:ring-4 focus:ring-[#408a71]/10 placeholder:text-[#a0a8ad]"
        />
        {trailing}
      </div>
    </div>
  )
}

function PlatformPanel() {
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveQuoteIndex((currentIndex) => (currentIndex + 1) % DEVELOPER_QUOTES.length)
    }, 4200)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <section className="relative hidden overflow-hidden bg-[#252f2c] p-16 text-white lg:flex lg:min-h-[calc(100vh-96px)] lg:flex-col lg:justify-between lg:pb-36">
      <div className="absolute inset-0">
        <div className="absolute right-[-10%] top-[-10%] h-[26rem] w-[26rem] rounded-full bg-[#408a71]/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-8%] h-[18rem] w-[18rem] rounded-full bg-white/6 blur-[100px]" />
      </div>

      <div className="relative z-10 flex items-center gap-3">
        <WatashiMark className="h-10 w-10 rounded-xl shadow-none" />
        <span className="font-display text-[22px] font-black tracking-[-0.04em] text-white">Watashi</span>
      </div>

      <div className="relative z-10 max-w-[31rem]">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#a7dbc7] backdrop-blur-xl">
          <BookOpenText className="h-3.5 w-3.5" />
          Learning Platform
        </div>

        <h1 className="font-display max-w-[9ch] text-[58px] font-black leading-[1.03] tracking-[-0.07em] text-white">
          Curated learning that turns focus into proof.
        </h1>

        <p className="mt-8 max-w-[32rem] text-[20px] font-medium leading-[1.6] text-[#d0d6d9]">
          Build momentum with guided paths, reflection prompts, flash cards, and portfolio-ready milestones designed for real learners.
        </p>
      </div>

      <div className="relative z-10 max-w-[24rem]">
        <div className="absolute -right-4 -top-12 hidden w-44 rotate-[7deg] rounded-[26px] border border-white/10 bg-white/7 p-5 shadow-2xl backdrop-blur-xl xl:block">
          <div className="flex items-center justify-between text-[#8bd5b9]">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#cfe6dd]">Flash Card</span>
          </div>
          <p className="mt-4 text-[14px] font-semibold leading-[1.55] text-white">
            &quot;One focused lesson a day is still a system.&quot;
          </p>
        </div>

        <div className="relative rounded-[30px] border border-white/8 bg-white/4 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex gap-1.5 text-[#8bd5b9]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#cfe6dd]">Developer Quotes</span>
          </div>

          <div className="relative min-h-[11.5rem] overflow-hidden">
            {DEVELOPER_QUOTES.map((entry, index) => (
              <article
                key={entry.quote}
                className="absolute inset-0 flex flex-col justify-between gap-6 transition-transform duration-700 ease-out motion-reduce:transition-none"
                style={{ transform: `translateX(${(index - activeQuoteIndex) * 100}%)` }}
              >
                <div>
                  <p className="text-[16px] font-medium italic leading-[1.6] text-white">&quot;{entry.quote}&quot;</p>
                </div>

                <div>
                  <p className="text-[14px] font-bold text-white">{entry.author}</p>
                  <p className="text-[12px] text-[#cdd4d7]">Featured in the Better Programming quote roundup</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/8 pt-4">
            <div className="flex gap-2">
              {DEVELOPER_QUOTES.map((entry, index) => (
                <button
                  key={entry.quote}
                  type="button"
                  aria-label={`Show quote ${index + 1}`}
                  onClick={() => setActiveQuoteIndex(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    activeQuoteIndex === index ? 'w-8 bg-[#8bd5b9]' : 'w-2.5 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#cfe6dd]">
              {String(activeQuoteIndex + 1).padStart(2, '0')} / {String(DEVELOPER_QUOTES.length).padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function toAuthErrorState(error: unknown) {
  return {
    message: getDisplayErrorMessage(error, 'We could not complete authentication right now. Please try again.'),
    requestId: getErrorRequestId(error),
  }
}

export function AuthPage({
  mode,
  initialError,
}: {
  mode: 'login' | 'register'
  initialError?: string | null
}) {
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [socialProvider, setSocialProvider] = useState<OAuthProvider | null>(null)
  const [submitError, setSubmitError] = useState<{ message: string; requestId?: string } | null>(
    initialError ? { message: initialError } : null,
  )
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    const payload: AuthPayload = {
      email,
      password,
      name: isLogin ? undefined : fullName,
    }

    try {
      const result = isLogin ? await signIn({ data: payload }) : await signUp({ data: payload })
      const data = unwrapActionResult(result)

      if (data.nextStep === 'signed-in') {
        startTransition(() => {
          void navigate({ to: ROUTE_PATHS.dashboard })
        })
        return
      }

      setSubmitSuccess(data.message)
    } catch (error) {
      setSubmitError(toAuthErrorState(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSocialSignIn = async (provider: OAuthProvider) => {
    setSocialProvider(provider)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const result = await startOAuth({
        data: {
          provider,
          next: ROUTE_PATHS.dashboard,
        },
      })
      const data = unwrapActionResult(result)
      window.location.assign(data.url)
    } catch (error) {
      setSubmitError(toAuthErrorState(error))
      setSocialProvider(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] selection:bg-[#8bd5b9]/40">
      <main className="grid min-h-screen grid-cols-1 lg:min-h-[calc(100vh-96px)] lg:grid-cols-2">
        <PlatformPanel />

        <section className="flex flex-col items-center justify-center bg-[#f7f9fb] px-6 py-12 lg:px-24 lg:pb-28">
          <div className="w-full max-w-md">
            <div className="mb-12 flex items-center justify-center gap-3 lg:hidden">
              <WatashiMark className="h-10 w-10 rounded-xl shadow-none" />
              <span className="font-display text-[30px] font-black tracking-[-0.05em] text-[#408a71]">Watashi</span>
            </div>

            <div className="mb-10 text-center">
              <h2 className="font-display text-[28px] font-black leading-[1.05] tracking-[-0.05em] text-[#191c1e] sm:text-[38px]">
                {isLogin ? 'Welcome Back' : 'Create Your Account'}
              </h2>
              <p className="mt-2 text-[13px] font-medium text-[#6f7974]">Return to your path and keep your learning streak moving.</p>
            </div>

            <div className="mb-10 flex justify-center">
              <div className="inline-flex rounded-full bg-[#eceef0] p-1">
                <Link
                  to={ROUTE_PATHS.login}
                  className={`rounded-full px-8 py-2.5 text-[13px] font-bold transition-all ${
                    isLogin ? 'bg-white text-[#408a71] shadow-sm' : 'text-[#6f7974] hover:text-[#191c1e]'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to={ROUTE_PATHS.register}
                  className={`rounded-full px-8 py-2.5 text-[13px] font-bold transition-all ${
                    !isLogin ? 'bg-white text-[#408a71] shadow-sm' : 'text-[#6f7974] hover:text-[#191c1e]'
                  }`}
                >
                  Sign Up
                </Link>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-4">
              <AuthProviderButton
                provider="google"
                loading={socialProvider === 'google'}
                disabled={submitting || socialProvider !== null}
                onClick={() => void handleSocialSignIn('google')}
              />
              <AuthProviderButton
                provider="github"
                loading={socialProvider === 'github'}
                disabled={submitting || socialProvider !== null}
                onClick={() => void handleSocialSignIn('github')}
              />
            </div>

            <div className="mb-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#bec9c3]/50" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6f7974]">or email login</span>
              <div className="h-px flex-1 bg-[#bec9c3]/50" />
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {!isLogin ? (
                <AuthInput
                  id="fullName"
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
              ) : null}

              <AuthInput
                id="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@watashi.learn"
                autoComplete="email"
              />

              <div>
                <div className="mb-2 flex items-center justify-between px-1">
                  <label htmlFor="password" className="text-[11px] font-bold text-[#191c1e]">
                    Password
                  </label>
                  {isLogin ? (
                    <button type="button" className="text-[11px] font-bold text-[#408a71] transition-colors hover:text-[#2f6c58]">
                      Forgot?
                    </button>
                  ) : null}
                </div>

                <AuthInput
                  id="password"
                  label=""
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  placeholder="........"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a0a8ad] transition-colors hover:text-[#408a71]"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  }
                />
              </div>

              <button
                type="submit"
                disabled={submitting || socialProvider !== null}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#408a71] px-6 py-4 font-display text-[17px] font-extrabold text-white shadow-[0_12px_24px_rgba(64,138,113,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#35735e] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : null}
                {isLogin ? 'Sign In to Watashi' : 'Sign Up for Watashi'}
                {!submitting ? <ArrowRight className="h-4.5 w-4.5" /> : null}
              </button>

              {submitSuccess ? (
                <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[13px] leading-[1.7] text-emerald-700">
                  {submitSuccess}
                </p>
              ) : null}

              {submitError ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] leading-[1.7] text-rose-700">
                  <p>{submitError.message}</p>
                  {submitError.requestId ? (
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-500">
                      Support code: {submitError.requestId}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </form>

            <div className="mt-12 text-center text-[12px] font-medium leading-[1.7] text-[#6f7974]">
              <p>
                By signing in, you agree to our{' '}
                <a href="/" className="font-bold text-[#191c1e] transition-colors hover:text-[#408a71]">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/" className="font-bold text-[#191c1e] transition-colors hover:text-[#408a71]">
                  Privacy Policy
                </a>
                .
              </p>

              {!isLogin ? (
                <p className="mt-4">
                  Already have an account?{' '}
                  <Link to={ROUTE_PATHS.login} className="font-bold text-[#408a71] transition-colors hover:text-[#2f6c58]">
                    Log in here
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </main>

    </div>
  )
}

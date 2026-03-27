import { BookOpen, Flame, Sparkles, Stars, Users } from 'lucide-react'
import type { ComponentType } from 'react'
import type { AuthSession } from '../../../shared/contracts/auth'
import { ROUTE_PATHS } from '../../../shared/routing/paths'

export type DashboardMetric = {
  label: string
  value: string
  detail: string
  tone: string
  icon: ComponentType<{ className?: string }>
}

export type DashboardActivity = {
  title: string
  subtitle: string
  progress: number
}

export type DashboardViewModel = {
  headline: string
  supporting: string
  studyPathTitle: string
  studyPathLength: string
  studyPathProgress: number
  primaryCtaLabel: string
  primaryCtaPath: string
  metrics: DashboardMetric[]
  activities: DashboardActivity[]
  railHeading: string
  railValue: string
  railLabel: string
  railBody: string
  railButtonLabel: string
  railButtonPath: string
}

export function getDashboardViewModel(user: AuthSession): DashboardViewModel {
  if (user.role === 'educator') {
    return {
      headline: 'Welcome back, Curator.',
      supporting:
        'Your creation pipeline is ready. Review your active draft, monitor learner reach, and move directly into the educator studio.',
      studyPathTitle: 'Creation Lab Sprint',
      studyPathLength: 'Estimated completion: 2 days',
      studyPathProgress: 74,
      primaryCtaLabel: 'Open Creation Lab',
      primaryCtaPath: ROUTE_PATHS.creationLab,
      metrics: [
        { label: 'Student Reach', value: '14.2k', detail: 'Across active cohorts', tone: 'bg-emerald-50 text-emerald-700', icon: Users },
        { label: 'Draft Lessons', value: '18', detail: 'Ready for production review', tone: 'bg-indigo-50 text-indigo-700', icon: Sparkles },
        { label: 'Certificates', value: '128', detail: 'Generated this month', tone: 'bg-amber-50 text-amber-700', icon: Stars },
      ],
      activities: [
        { title: 'Introduction to Quantum Architecture', subtitle: 'Course Builder', progress: 74 },
        { title: 'Lesson production pass for Module 4', subtitle: 'Video Creation', progress: 52 },
        { title: 'Certificate master template', subtitle: 'Certificate Builder', progress: 91 },
      ],
      railHeading: 'Launch Window',
      railValue: '3',
      railLabel: 'Active creation lab drafts',
      railBody: 'The latest educator build unifies video, audio, subtitles, and publishing inside one guided production workspace.',
      railButtonLabel: 'Manage Content',
      railButtonPath: ROUTE_PATHS.creationLabHub,
    }
  }

  return {
    headline: 'Welcome back, Curator.',
    supporting:
      'Your AI-curated curriculum for Advanced UI Systems is ready for today’s deep dive. Follow the path, track recent activity, and keep your study rhythm stable.',
    studyPathTitle: 'Mastering Tailwind 4.0',
    studyPathLength: 'Estimated completion: 4 days',
    studyPathProgress: 78,
    primaryCtaLabel: 'Start Learning',
    primaryCtaPath: ROUTE_PATHS.courses,
    metrics: [
      { label: 'Hours Learned', value: '124.5', detail: 'Deep-work sessions completed', tone: 'bg-emerald-50 text-emerald-700', icon: Flame },
      { label: 'Active Courses', value: '6', detail: 'High-signal paths in progress', tone: 'bg-indigo-50 text-indigo-700', icon: BookOpen },
      { label: 'Points Earned', value: '12,840', detail: 'Momentum gained this quarter', tone: 'bg-amber-50 text-amber-700', icon: Stars },
    ],
    activities: [
      { title: 'Mastering Tailwind CSS', subtitle: 'Advanced Typography & Layouts', progress: 78 },
      { title: 'Computational Aesthetics', subtitle: 'Module 4 • Generative systems', progress: 42 },
      { title: 'The Psychology of Color', subtitle: 'Human perception & response', progress: 12 },
    ],
    railHeading: 'Educator Hub',
    railValue: '14.2k',
    railLabel: 'Student reach',
    railBody: 'Creation lab tools, community publishing, and course authoring are now isolated into stable modules instead of page-local branches.',
    railButtonLabel: 'Explore Educator Mode',
    railButtonPath: ROUTE_PATHS.creationLab,
  }
}

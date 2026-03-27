export type CourseCard = {
  label: string
  title: string
  summary: string
  metricLabel: string
  metricValue: string
  accent: string
}

export const courseCards: CourseCard[] = [
  {
    label: 'Design principles',
    title: 'Mastering Fluid Visual Architectures',
    summary: 'Breaking the grid and embracing organic layouts for editorial-grade digital learning experiences.',
    metricLabel: 'Progress',
    metricValue: '74%',
    accent: 'from-[var(--color-watashi-emerald)]/14 to-white',
  },
  {
    label: 'Systematic motion',
    title: 'Advanced Kinetic Motion',
    summary: 'Animation systems for enterprise interfaces, onboarding flows, and attention-aware interactions.',
    metricLabel: 'Modules',
    metricValue: '12',
    accent: 'from-[var(--color-watashi-indigo)]/12 to-white',
  },
  {
    label: 'Cognitive science',
    title: 'Cognitive Load Theory',
    summary: 'Mastering the science of human attention, memory, and information pacing.',
    metricLabel: 'Completion',
    metricValue: '30%',
    accent: 'from-[var(--color-watashi-ember)]/12 to-white',
  },
  {
    label: 'Premium masterclass',
    title: 'Curriculum Monetization',
    summary: 'Strategic frameworks for packaging expertise into a sustainable learning business.',
    metricLabel: 'Price',
    metricValue: '$499',
    accent: 'from-[var(--color-watashi-indigo)] to-[#7066ff]',
  },
]

export const learningRail = [
  { label: 'Catalog items', value: '24', detail: 'Curated paths ready to launch' },
  { label: 'Average session', value: '34m', detail: 'Across active learners' },
  { label: 'Mentors', value: '18', detail: 'Domain specialists in rotation' },
]

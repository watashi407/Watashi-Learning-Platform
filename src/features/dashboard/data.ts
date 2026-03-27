import communityAlex from '../../assets/stitch/community-alex.jpg'
import communitySarah from '../../assets/stitch/community-sarah.jpg'
import curriculumImage from '../../assets/stitch/learning-curriculum.jpg'

export const dashboardCourseCards = [
  {
    title: 'Mastering Fluid Visual Architectures',
    subtitle: 'Design principles',
    summary: 'Editorial-grade layout systems, motion rhythm, and visual hierarchy for high-signal interfaces.',
    progress: '74%',
  },
  {
    title: 'Advanced Kinetic Motion',
    subtitle: 'Systematic motion design',
    summary: 'Animation systems for dashboards, onboarding sequences, and attention-aware interactions.',
    progress: '12 modules',
  },
  {
    title: 'Curriculum Monetization',
    subtitle: 'Premium masterclass',
    summary: 'Frameworks for packaging expertise into premium cohorts without losing clarity or craft.',
    progress: '$499',
  },
] as const

export const communityPosts = [
  {
    title: 'How are we feeling about the new mnemonic labs?',
    topic: 'Cognitive science',
    body: 'The spatial memory module seems to have improved retention by 40% in my pilot group. Has anyone else noticed the latency drop?',
    avatar: communityAlex,
    author: '@alex_curates',
    replies: 24,
    likes: 89,
  },
  {
    title: `The "Deep Work" ritual: a curator's guide`,
    topic: 'Study hacks',
    body: 'I paired low-frequency binaural beats with Watashi focus sessions. The cognitive load feels lower and the note quality is higher.',
    avatar: communitySarah,
    author: '@sarah_builds',
    replies: 12,
    likes: 45,
  },
] as const

export const focusLessons = [
  { title: 'Introduction to Utility-First', duration: 'Core - 12:40', complete: true },
  { title: 'Setting up your environment', duration: 'Core - 06:15', complete: true },
  { title: 'Core Fundamentals & The Grid', duration: 'In Progress - 34:20', active: true },
  { title: 'Responsive Design Patterns', duration: 'Unlock - 22:10' },
  { title: 'Complex Hover & State Logic', duration: 'Locked - 19:45' },
] as const

export const creationLabAssets = [
  { name: 'intro_sequence.mov', detail: 'Open asset library' },
  { name: 'reading_materials.pdf', detail: 'Shared with cohort 12A' },
  { name: 'community-sprint-notes.md', detail: 'Ready for review' },
] as const

export { curriculumImage }

import communityAlex from '../../assets/stitch/community-alex.jpg'
import communitySarah from '../../assets/stitch/community-sarah.jpg'
import learningAvatarOne from '../../assets/stitch/learning-avatar-1.jpg'
import learningAvatarTwo from '../../assets/stitch/learning-avatar-2.jpg'
import learningCurriculum from '../../assets/stitch/learning-curriculum.jpg'
import newsroomPattern from '../../assets/stitch/newsroom-pattern.jpg'

export const learningPathShowcase = {
  eyebrow: 'New Series',
  title: 'Mastering Fluid Visual Architectures',
  description: 'Deep dive into organic UI systems and spatial hierarchy with a guided editorial sprint.',
  action: 'Browse Catalog',
  participants: [learningAvatarOne, learningAvatarTwo],
  participantsLabel: '+12k learners',
} as const

export const learningPathCards = [
  {
    tone: 'indigo',
    title: 'Advanced Kinetic Motion',
    description: 'Bring life to static frames with motion systems that still feel precise.',
  },
  {
    tone: 'light',
    title: 'Cognitive Load Theory',
    description: 'Design with the way real learners absorb and retain information.',
  },
  {
    title: 'Curriculum Monetization',
    description: 'Turn your expertise into a sustainable global revenue engine without losing craft.',
    image: learningCurriculum,
    action: 'Start Module',
  },
] as const

export const fluidityFeatures = [
  {
    icon: 'adaptive',
    title: 'Adaptive Interfaces',
    description: 'The engine adjusts to your pace, focus, and retention in real time instead of forcing one path.',
  },
  {
    icon: 'sync',
    title: 'Universal Sync',
    description: 'Progress, notes, and node maps stay consistent across every device you move between.',
  },
  {
    icon: 'curation',
    title: 'AI Curation',
    description: 'Suggested next steps are tuned to mastery, not content volume, so momentum stays intact.',
  },
] as const

export const communityVoices = [
  {
    quote:
      "Watashi isn't just a platform; it's a curator of my professional potential. The fluid architecture helped me transition from a junior designer to a lead in months.",
    name: 'Alex Rivera',
    role: 'Lead UI Architect at Vanta',
    image: communityAlex,
  },
  {
    quote:
      "The node-based journey maps allowed my team to visualize their learning debt and clear it faster than any traditional course I've seen in academia.",
    name: 'Dr. Sarah Chen',
    role: 'Head of Learning, NexaLabs',
    image: communitySarah,
  },
] as const

export const communityStats = [
  { value: '98%', label: 'Success Rate' },
  { value: '12M+', label: 'Nodes Created' },
  { value: '142', label: 'Countries' },
  { value: '24/7', label: 'Global Support' },
] as const

export const newsroomCards = {
  spotlight: {
    category: 'Thought Leadership',
    title: 'The 2024 Kinetic Design Manifesto',
    description: 'Defining the future of interaction paradigms through asymmetry, rhythm, and motion.',
    image: newsroomPattern,
  },
  release: {
    version: 'V3.0',
    title: 'Engine Release',
    description: 'A complete rebuild focused on neural learning sync and clearer route intelligence.',
  },
  podcast: {
    category: 'Podcast',
    title: 'The Curator Podcast',
    description: 'Ep. 42: Why asymmetry feels more human than precision grids.',
  },
  event: {
    category: 'Event',
    title: 'Summer Workshop',
    description: 'Join 500 curators in Tokyo this July for live labs, critiques, and portfolio reviews.',
  },
} as const

export const footerLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Settings', 'Contact Support'] as const

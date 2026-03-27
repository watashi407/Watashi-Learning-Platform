import { CREATION_LAB_ROUTE_DEFINITIONS } from '../../../shared/routing/paths'

export const creationLabHighlights = [
  { label: 'Active draft', title: 'Introduction to Quantum Architecture', detail: '8 modules • 14 video lessons • 3 assignments', progress: 74 },
  { label: 'Recent video edits', title: 'Lesson 5: Space-Time Fabric', detail: 'Render queue at 42%', progress: 42 },
  { label: 'Resource vault', title: 'Manage 22 assets', detail: 'Templates, thumbnails, and learning captures', progress: 87 },
]

export const creationLabCards = [
  { title: 'Video Studio', detail: 'Unified timeline, audio, subtitles, and export', path: CREATION_LAB_ROUTE_DEFINITIONS.video.path },
  { title: 'Certificates', detail: 'Advanced Quantum Design', path: CREATION_LAB_ROUTE_DEFINITIONS.certificateBuilder.path },
  { title: 'Course Builder', detail: 'Module scaffolding and lesson flows', path: CREATION_LAB_ROUTE_DEFINITIONS.courseBuilder.path },
]

export const creationLabActivity = [
  'Video introduction published',
  'Sara commented on Module 2',
  'Certificate export approved',
]

export const courseBuilderModules = [
  {
    id: '01',
    title: 'Introduction to UI Design',
    items: ['Defining the Canvas', 'Reading: Visual Hierarchy', 'Quiz: Color Theory'],
  },
  { id: '02', title: 'Advanced Typography', items: [] },
  { id: '03', title: 'Motion & Interaction', items: [] },
]

export const multimediaTimeline = [
  { label: 'Video', name: 'Intro-v3.mp4', span: '00:04:12' },
  { label: 'Audio', name: 'Narration_v1.wav', span: '00:04:12' },
  { label: 'Text', name: 'Lower Third Titles', span: '00:04:12' },
]

export const multimediaAssets = [
  { label: 'Video assets', name: 'Nexus_Intro.mp4', preview: '/stitch-assets/asset-b104c946b7e6f99c.jpg' },
  { label: 'Audio clip', name: 'Mountain_FX-001.mp3', preview: '/stitch-assets/asset-e2df4093e82ab4f1.jpg' },
  { label: 'Upload', name: 'Upload new source', preview: '/stitch-assets/asset-4342d810cca39622.jpg' },
]

export type LessonStep = {
  title: string
  description: string
  tips?: string[]
}

export type Lesson = {
  id: string
  title: string
  category: string
  videoUrl: string
  thumbnailUrl?: string
  duration: string
  xpReward: number
  steps: LessonStep[]
}

export const LESSONS: Lesson[] = [
  {
    id: 'media-kit',
    title: 'How to Build Your Media Kit',
    category: 'Warzone / Apex',
    videoUrl: 'https://www.youtube.com/embed/8jLOx1hD3_o',
    thumbnailUrl: 'https://img.youtube.com/vi/8jLOx1hD3_o/mqdefault.jpg',
    duration: '50 min',
    xpReward: 50,
    steps: [
      {
        title: 'Gather your stats',
        description: 'Collect your key metrics: follower counts across platforms, average views, engagement rates, and audience demographics. These numbers help sponsors understand your reach.',
        tips: ['Use platform analytics (Twitch, YouTube, etc.)', 'Include last 30–90 day averages', 'Screenshot or export official stats'],
      },
      {
        title: 'Create a one-pager',
        description: 'Design a single-page PDF that showcases your brand. Include your logo, a short bio, your content niche, and your best-performing content examples.',
        tips: ['Keep it under 1 MB for easy sharing', 'Use Canva or Figma for quick design', 'Export as PDF for universal compatibility'],
      },
      {
        title: 'Add your rate card',
        description: 'List your sponsorship packages with clear pricing. Offer 2–3 tiers (e.g., shoutout, dedicated video, long-term partnership) so sponsors can choose what fits their budget.',
        tips: ['Don’t lock your rates—experiment with packages', 'Include deliverables (posts, videos, mentions)', 'Add a “Custom” option for flexibility'],
      },
      {
        title: 'Include contact info',
        description: 'Add a clear way for sponsors to reach you: email, business Instagram, or a contact form. Make it easy for them to take the next step.',
        tips: ['Use a professional email (not personal)', 'Respond within 24–48 hours', 'Consider a Calendly link for booking calls'],
      },
      {
        title: 'Update and share',
        description: 'Keep your media kit current. Update stats monthly and reshare it when pitching brands or when they ask for your kit.',
        tips: ['Store it in Google Drive or Dropbox', 'Use a short link (bit.ly) for easy sharing', 'Re-send after major milestones (new followers, big stream)'],
      },
    ],
  },
  {
    id: 'rate-card',
    title: 'Pricing Your Sponsorships',
    category: 'Gaming / Creator',
    videoUrl: 'https://www.youtube.com/embed/8jLOx1hD3_o',
    duration: '35 min',
    xpReward: 35,
    steps: [
      { title: 'Research market rates', description: 'Look at what similar creators charge for similar deliverables.' },
      { title: 'Calculate your CPM', description: 'Use your average views and engagement to estimate value per thousand impressions.' },
      { title: 'Set your base rates', description: 'Create starter packages and adjust based on demand and feedback.' },
    ],
  },
  {
    id: 'pitch-template',
    title: 'Sponsor Pitch Templates',
    category: 'Business',
    videoUrl: 'https://www.youtube.com/embed/8jLOx1hD3_o',
    duration: '25 min',
    xpReward: 25,
    steps: [
      { title: 'Write a short intro', description: 'Introduce yourself and why you’re a fit for their brand.' },
      { title: 'Attach your media kit', description: 'Include your one-pager and rate card.' },
      { title: 'Propose a next step', description: 'Suggest a call or meeting to discuss a partnership.' },
    ],
  },
]

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id)
}

export function getNextLesson(currentId: string): Lesson | undefined {
  const idx = LESSONS.findIndex((l) => l.id === currentId)
  return idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : undefined
}

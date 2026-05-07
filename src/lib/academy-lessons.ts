/**
 * Creator Academy lesson content — static data for the learning/XP system.
 * Add new lessons to the LESSONS array; no DB changes required.
 */

/** A single instructional step within a lesson. */
export type LessonStep = {
  title: string
  description: string
  /** Optional bullet-point tips rendered below the description. */
  tips?: string[]
}

/** A single Creator Academy lesson. */
export type Lesson = {
  /** URL-safe unique identifier (used as route param and XP key). */
  id: string
  title: string
  /** Broad topic label shown on the lesson card. */
  category: string
  /** YouTube embed URL for the lesson video. */
  videoUrl: string
  /** Optional thumbnail URL; falls back to YouTube's auto-thumbnail if omitted. */
  thumbnailUrl?: string
  /** Human-readable duration string (e.g. "50 min"). */
  duration: string
  /** XP awarded to the creator upon lesson completion. */
  xpReward: number
  /** Ordered list of instructional steps shown below the video. */
  steps: LessonStep[]
}

/** All available Creator Academy lessons, in display order. */
export const LESSONS: Lesson[] = [
  {
    id: 'build-your-brand',
    title: 'How to Build Your Brand',
    category: 'Branding',
    videoUrl: 'https://www.youtube.com/embed/CK6uYrvD8qc',
    thumbnailUrl: 'https://img.youtube.com/vi/CK6uYrvD8qc/mqdefault.jpg',
    duration: '20 min',
    xpReward: 30,
    steps: [
      {
        title: 'Define your niche',
        description: 'Pick a clear focus area you can own. The more specific your niche, the easier it is for the right audience to find you.',
        tips: ['Pick something you genuinely enjoy', 'Look for under-served niches', 'Be specific (not just "gaming")'],
      },
      {
        title: 'Develop a visual identity',
        description: 'Create a consistent look across all platforms — logo, colors, banner art, and stream overlays should feel like the same brand.',
        tips: ['Use 2–3 brand colors max', 'Keep your logo simple and recognizable', 'Apply the same style everywhere'],
      },
      {
        title: 'Find your voice',
        description: 'Decide how you want to come across — funny, chill, competitive, educational. Your tone should be consistent across content.',
      },
      {
        title: 'Stay consistent',
        description: 'Branding takes repetition. Stick with your style for months before changing it — viewers need time to recognize you.',
      },
    ],
  },
  {
    id: 'grow-gaming-channel',
    title: 'How to Grow a Gaming Channel',
    category: 'Growth',
    videoUrl: 'https://www.youtube.com/embed/BcQXNjtPrcM',
    thumbnailUrl: 'https://img.youtube.com/vi/BcQXNjtPrcM/mqdefault.jpg',
    duration: '25 min',
    xpReward: 35,
    steps: [
      {
        title: 'Pick the right games',
        description: 'Choose games with active audiences but not so saturated that you get buried. Trending games and underexposed indies both work.',
        tips: ['Check Twitch viewer-to-streamer ratios', 'Watch for new game launches', 'Mix popular titles with hidden gems'],
      },
      {
        title: 'Optimize your titles and thumbnails',
        description: 'Most growth comes from clicks. Spend real time on thumbnails and titles — they\'re your storefront.',
        tips: ['Use bold readable text', 'Show emotion / faces when possible', 'A/B test variations'],
      },
      {
        title: 'Post consistently',
        description: 'Pick a schedule you can actually maintain. Two solid videos a week beats five rushed ones.',
      },
      {
        title: 'Engage with your community',
        description: 'Reply to comments, hop into other creators\' chats, and build a network. Growth compounds when people know you.',
      },
    ],
  },
  {
    id: 'starting-youtube-channel',
    title: 'Starting a YouTube Channel',
    category: 'YouTube',
    videoUrl: 'https://www.youtube.com/embed/T2M9hSswlIs',
    thumbnailUrl: 'https://img.youtube.com/vi/T2M9hSswlIs/mqdefault.jpg',
    duration: '15 min',
    xpReward: 25,
    steps: [
      {
        title: 'Set up your channel properly',
        description: 'Pick a clear name, write a real "About" section, add channel art, and link your other socials. Don\'t skip these basics.',
      },
      {
        title: 'Plan your first 10 videos',
        description: 'Don\'t just upload one and wait. Have at least 10 videos planned so your channel feels alive when viewers arrive.',
        tips: ['Mix different formats', 'Research what\'s working in your niche', 'Outline before filming'],
      },
      {
        title: 'Focus on watch time',
        description: 'YouTube\'s algorithm rewards videos that keep viewers watching. Hook them in the first 30 seconds and earn the rest.',
      },
      {
        title: 'Don\'t obsess over equipment',
        description: 'A decent mic and your phone camera are enough to start. Upgrade gear once content quality is the bottleneck.',
      },
    ],
  },
  {
    id: 'creator-success-stories',
    title: 'How Creators Have Been Successful',
    category: 'Success Stories',
    videoUrl: 'https://www.youtube.com/embed/4O0avfn__dU',
    thumbnailUrl: 'https://img.youtube.com/vi/4O0avfn__dU/mqdefault.jpg',
    duration: '30 min',
    xpReward: 40,
    steps: [
      {
        title: 'Study what worked',
        description: 'Look at creators in your niche who broke through. What did their first viral moment look like? Patterns emerge.',
      },
      {
        title: 'Take consistent action',
        description: 'Almost every successful creator points to consistency, not luck. Most "overnight successes" took 2–3 years.',
      },
      {
        title: 'Be willing to evolve',
        description: 'Successful channels often pivoted multiple times before finding their format. Don\'t be afraid to change direction.',
      },
      {
        title: 'Build relationships, not just numbers',
        description: 'The biggest creators talk about their early supporters by name. Treat your first 100 fans like gold.',
      },
    ],
  },
  {
    id: 'youtube-scheduling',
    title: 'How to Schedule and Perform Well on YouTube',
    category: 'YouTube',
    videoUrl: 'https://www.youtube.com/embed/gC52K6xBQ4o',
    thumbnailUrl: 'https://img.youtube.com/vi/gC52K6xBQ4o/mqdefault.jpg',
    duration: '20 min',
    xpReward: 30,
    steps: [
      {
        title: 'Find your best upload time',
        description: 'Check your YouTube Analytics > Audience tab. Upload a few hours before your audience is most active so videos rank by then.',
      },
      {
        title: 'Use the schedule feature',
        description: 'Don\'t upload manually at midnight. Schedule videos for your optimal time so you can keep a regular posting rhythm.',
      },
      {
        title: 'Track your performance',
        description: 'Look at click-through rate (CTR) and average view duration after every video. Those two numbers tell you what to fix.',
        tips: ['Aim for CTR above 4–6%', 'Aim for view duration above 50%', 'Compare against your own past videos'],
      },
      {
        title: 'Iterate based on data',
        description: 'Keep what works, change what doesn\'t. If a thumbnail style underperforms, try something different next time.',
      },
    ],
  },
  {
    id: 'simple-youtube-videos',
    title: 'Simple Ways to Make YouTube Videos',
    category: 'YouTube',
    videoUrl: 'https://www.youtube.com/embed/JmpS8pqmAFs',
    thumbnailUrl: 'https://img.youtube.com/vi/JmpS8pqmAFs/mqdefault.jpg',
    duration: '15 min',
    xpReward: 25,
    steps: [
      {
        title: 'Start with a basic setup',
        description: 'Phone camera, natural light from a window, and a USB mic will get you 80% of the way there. Don\'t overthink it.',
      },
      {
        title: 'Use free editing tools',
        description: 'CapCut, DaVinci Resolve, and iMovie are all free and powerful enough for most content. No need to buy software early on.',
      },
      {
        title: 'Keep cuts and transitions simple',
        description: 'Most viral content uses straight cuts and zero fancy effects. Focus on tight pacing, not flashy editing.',
      },
      {
        title: 'Batch your work',
        description: 'Film multiple videos in one sitting, then edit in another. Context-switching kills productivity for solo creators.',
      },
    ],
  },
  {
    id: 'prepare-for-sponsors',
    title: 'How to Prepare for Sponsors',
    category: 'Sponsors',
    videoUrl: 'https://www.youtube.com/embed/JVwFt_o5etY',
    thumbnailUrl: 'https://img.youtube.com/vi/JVwFt_o5etY/mqdefault.jpg',
    duration: '25 min',
    xpReward: 40,
    steps: [
      {
        title: 'Build a media kit',
        description: 'A one-pager with your stats, audience info, content samples, and contact info. Sponsors expect this — have one ready.',
        tips: ['Include analytics screenshots', 'Show audience demographics', 'List past brand work if any'],
      },
      {
        title: 'Know your numbers',
        description: 'Memorize your followers, average views, engagement rate, and audience demographics. You\'ll be asked.',
      },
      {
        title: 'Decide your rates',
        description: 'Have a default rate per integration ready. CPM-based pricing (~$10–$30 per 1k views) is a common starting point.',
      },
      {
        title: 'Set up business basics',
        description: 'A business email, payment method (PayPal/Stripe), and basic invoice template. Sponsors won\'t wait while you scramble.',
      },
    ],
  },
  {
    id: 'better-streamer',
    title: 'How to Become a Better Streamer',
    category: 'Streaming',
    videoUrl: 'https://www.youtube.com/embed/hapCyO6K2ws',
    thumbnailUrl: 'https://img.youtube.com/vi/hapCyO6K2ws/mqdefault.jpg',
    duration: '25 min',
    xpReward: 35,
    steps: [
      {
        title: 'Talk through silence',
        description: 'Empty chat is normal at first. Narrate your gameplay anyway — viewers join streams that already feel alive.',
      },
      {
        title: 'Stream consistently',
        description: 'Same days, same times. Twitch viewers build habits — give them a schedule they can rely on.',
      },
      {
        title: 'Engage individuals by name',
        description: 'When chat does talk, address people directly. "Hey [username]" goes a long way toward building community.',
      },
      {
        title: 'Watch your own VODs',
        description: 'Painful but powerful. Watch back 10 minutes of your own stream and note moments that feel awkward or low-energy.',
      },
    ],
  },
  {
    id: 'first-stream-setup',
    title: 'How to Set Up Your First Stream',
    category: 'Streaming',
    videoUrl: 'https://www.youtube.com/embed/zYQ-tVHArFg',
    thumbnailUrl: 'https://img.youtube.com/vi/zYQ-tVHArFg/mqdefault.jpg',
    duration: '20 min',
    xpReward: 30,
    steps: [
      {
        title: 'Install OBS or Streamlabs',
        description: 'Both are free. OBS is more flexible; Streamlabs has nicer defaults. Either works for getting your first stream live.',
      },
      {
        title: 'Configure your scenes',
        description: 'Set up at least three: "Starting Soon", "Main" (with gameplay + webcam + chat), and "Be Right Back". Switch between them mid-stream.',
      },
      {
        title: 'Test your audio',
        description: 'Bad audio loses viewers faster than bad video. Check mic levels, eliminate background noise, and balance game vs voice.',
        tips: ['Voice should sit on top of game audio', 'Use noise suppression filters', 'Test in a private stream first'],
      },
      {
        title: 'Set your stream key and go live',
        description: 'Grab your stream key from Twitch/YouTube settings, paste it into OBS, hit "Start Streaming". You\'re live.',
      },
    ],
  },
]

/** Returns the lesson with the given ID, or undefined if not found. */
export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id)
}

/** Returns the lesson immediately after `currentId` in the LESSONS array, or undefined if at the end. */
export function getNextLesson(currentId: string): Lesson | undefined {
  const idx = LESSONS.findIndex((l) => l.id === currentId)
  return idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : undefined
}
import type { Post, PostVariant, SocialPlatform } from "@/types"
import { createSeededRandom } from "./random"

const AUTHOR = { id: "usr_maya_reyes", name: "Maya Reyes" }

function makeVariants(
  platforms: SocialPlatform[],
  baseCaption: string,
  baseHashtags: string,
  overrides: Partial<Record<SocialPlatform, Partial<PostVariant>>> = {}
): PostVariant[] {
  return platforms.map((platform) => ({
    platform,
    enabled: true,
    caption: baseCaption,
    hashtags: baseHashtags,
    ...overrides[platform],
  }))
}

let seq = 0
function nextId(prefix: string) {
  seq += 1
  return `${prefix}_${seq.toString().padStart(3, "0")}`
}

// ---------------------------------------------------------------------------
// Scheduled
// ---------------------------------------------------------------------------

interface ScheduledSeed {
  title: string
  caption: string
  hashtags: string
  platforms: SocialPlatform[]
  scheduledFor: string
  overrides?: Partial<Record<SocialPlatform, Partial<PostVariant>>>
}

const SCHEDULED_SEEDS: ScheduledSeed[] = [
  {
    title: "How AI Follows Up With Leads Automatically",
    caption: "Ever wonder what happens the second a lead messages you? Here's how EasyLife's AI qualifies and follows up — instantly. ✨",
    hashtags: "#AISalesAutomation #WhatsAppMarketing #LeadGeneration",
    platforms: ["instagram", "tiktok"],
    scheduledFor: "2026-08-09T18:30:00Z",
    overrides: { tiktok: { caption: "POV: your leads never wait for business hours again 🚀" } },
  },
  {
    title: "Inside the EasyLife AI CRM",
    caption: "A look inside the CRM that qualifies, scores, and routes your leads automatically.",
    hashtags: "#AICRM #SalesOS #DigitalMarketingPakistan",
    platforms: ["linkedin", "facebook"],
    scheduledFor: "2026-08-10T15:00:00Z",
    overrides: { facebook: { caption: "See exactly how leads move from first message to booked meeting — link in comments.", link: "https://easylife.co/product/crm" } },
  },
  {
    title: "EasyLife AI Sales OS — Complete Demo",
    caption: "A complete walkthrough of the EasyLife AI Sales OS — WhatsApp automation, lead scoring, AI calling, and CRM in one place.",
    hashtags: "#SalesOS #AIAutomation",
    platforms: ["youtube", "instagram"],
    scheduledFor: "2026-08-11T13:00:00Z",
    overrides: { youtube: { title: "EasyLife AI Sales OS — Complete Demo" } },
  },
  {
    title: "Product drop teaser",
    caption: "Something new is coming Thursday 👀",
    hashtags: "#comingsoon",
    platforms: ["x", "instagram"],
    scheduledFor: "2026-08-12T17:00:00Z",
  },
  {
    title: "Team culture — studio tour",
    caption: "Take a tour of the studio with us",
    hashtags: "#studiotour #culture",
    platforms: ["tiktok", "youtube"],
    scheduledFor: "2026-08-13T16:00:00Z",
    overrides: { youtube: { title: "Studio Tour 2026" } },
  },
  {
    title: "From Social Media Comment to Qualified Lead",
    caption: "A single Facebook comment, automatically turned into a scored, qualified lead — no manual work. Here's how.",
    hashtags: "#LeadGeneration #SmartCRM",
    platforms: ["linkedin", "instagram"],
    scheduledFor: "2026-08-14T14:00:00Z",
  },
  {
    title: "3 Ways AI Can Automate Your Sales Team",
    caption: "3 ways EasyLife's AI takes work off your sales team's plate — starting today.",
    hashtags: "#AISalesAutomation #SalesTeamTips",
    platforms: ["instagram", "tiktok", "youtube"],
    scheduledFor: "2026-08-15T17:30:00Z",
    overrides: { youtube: { title: "3 Ways AI Can Automate Your Sales Team" } },
  },
  {
    title: "Why Businesses Lose Leads Without Automation",
    caption: "Most businesses don't lose leads to competitors — they lose them to slow follow-up. Here's the fix.",
    hashtags: "#SalesOS #LeadGeneration",
    platforms: ["linkedin", "x"],
    scheduledFor: "2026-08-16T15:00:00Z",
  },
  {
    title: "New service announcement — UGC management",
    caption: "We're now offering full UGC sourcing and management. Details in the link.",
    hashtags: "#ugc #newservice",
    platforms: ["facebook", "linkedin", "instagram"],
    scheduledFor: "2026-08-17T16:00:00Z",
    overrides: { facebook: { link: "https://easylife.co/services/ugc" } },
  },
  {
    title: "New feature: AI Calling Agent",
    caption: "Now live: EasyLife's AI Calling Agent qualifies and books meetings with your leads over the phone 📞",
    hashtags: "#AICallingAgent #SalesAutomation",
    platforms: ["instagram", "tiktok", "x"],
    scheduledFor: "2026-08-18T18:00:00Z",
  },
  {
    title: "Founder AMA recap",
    caption: "Missed the AMA? Here's what our founder said about building an AI sales OS for Pakistani businesses.",
    hashtags: "#ama #founderstory",
    platforms: ["linkedin", "youtube"],
    scheduledFor: "2026-08-19T15:30:00Z",
    overrides: { youtube: { title: "Founder AMA — Building an AI Sales OS" } },
  },
  {
    title: "Fall campaign countdown — 3 days left",
    caption: "3 days until the fall campaign drops. Get ready.",
    hashtags: "#fallcampaign #countdown",
    platforms: ["instagram", "facebook", "x"],
    scheduledFor: "2026-08-20T17:00:00Z",
  },
]

export const SCHEDULED_POSTS: Post[] = SCHEDULED_SEEDS.map((seed) => {
  const createdAt = "2026-08-05T10:00:00Z"
  return {
    id: nextId("post_sch"),
    title: seed.title,
    status: "scheduled",
    baseCaption: seed.caption,
    baseHashtags: seed.hashtags,
    media: [],
    platforms: seed.platforms,
    variants: makeVariants(seed.platforms, seed.caption, seed.hashtags, seed.overrides),
    scheduledFor: seed.scheduledFor,
    createdAt,
    updatedAt: createdAt,
    author: AUTHOR,
  }
})

// ---------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------

const DRAFT_SEEDS: { title: string; caption: string; hashtags: string; platforms: SocialPlatform[] }[] = [
  {
    title: "Untitled — holiday campaign concepts",
    caption: "Draft: three concepts for the holiday campaign, need client sign-off before scheduling.",
    hashtags: "",
    platforms: ["instagram", "facebook"],
  },
  {
    title: "Year-in-review recap (draft)",
    caption: "Draft: pulling together our top moments from the year for a recap post.",
    hashtags: "#yearinreview",
    platforms: ["linkedin"],
  },
  {
    title: "New hire announcement (draft)",
    caption: "Draft: welcoming our new social strategist to the team — waiting on their headshot.",
    hashtags: "#welcometotheteam",
    platforms: ["linkedin", "instagram"],
  },
]

export const DRAFT_POSTS: Post[] = DRAFT_SEEDS.map((seed) => {
  const createdAt = "2026-08-07T09:00:00Z"
  return {
    id: nextId("post_draft"),
    title: seed.title,
    status: "draft",
    baseCaption: seed.caption,
    baseHashtags: seed.hashtags,
    media: [],
    platforms: seed.platforms,
    variants: makeVariants(seed.platforms, seed.caption, seed.hashtags),
    createdAt,
    updatedAt: createdAt,
    author: AUTHOR,
  }
})

// ---------------------------------------------------------------------------
// Published (with analytics)
// ---------------------------------------------------------------------------

interface PublishedSeed {
  title: string
  caption: string
  hashtags: string
  platforms: SocialPlatform[]
  publishedDaysAgo: number
  scale: number // relative performance multiplier
}

const PUBLISHED_SEEDS: PublishedSeed[] = [
  { title: "Instagram post published", caption: "Fall studio lookbook teaser ✨", hashtags: "#fallcollection", platforms: ["instagram"], publishedDaysAgo: 0, scale: 1.4 },
  { title: "Studio tour: 60 seconds", caption: "60 seconds inside the studio.", hashtags: "#studiotour", platforms: ["tiktok"], publishedDaysAgo: 1, scale: 2.1 },
  { title: "Client spotlight: Nova Properties", caption: "How Nova Properties automated their entire sales pipeline in 3 months.", hashtags: "#casestudy", platforms: ["linkedin"], publishedDaysAgo: 1, scale: 0.7 },
  { title: "Reel: our editing workflow", caption: "A peek at how we edit every reel.", hashtags: "#workflow #bts", platforms: ["instagram", "tiktok"], publishedDaysAgo: 2, scale: 1.1 },
  { title: "Weekly tip: hook writing", caption: "The 3-second rule for hooks that work.", hashtags: "#contenttips", platforms: ["x", "linkedin"], publishedDaysAgo: 3, scale: 0.6 },
  { title: "Before/after: brand refresh", caption: "Before and after of a full brand refresh we led.", hashtags: "#branding #beforeandafter", platforms: ["instagram", "facebook"], publishedDaysAgo: 4, scale: 1.6 },
  { title: "YouTube long-form: agency systems", caption: "The systems we use to run a lean 6-person studio.", hashtags: "#agencylife", platforms: ["youtube"], publishedDaysAgo: 5, scale: 0.9 },
  { title: "Community shoutout — thank you to our clients", caption: "Grateful for every business that trusted us with their sales pipeline this year 🙏", hashtags: "#communityfirst", platforms: ["instagram", "x"], publishedDaysAgo: 6, scale: 1.0 },
  { title: "Studio playlist drop", caption: "What we're listening to in the studio this month 🎧", hashtags: "#studioplaylist", platforms: ["tiktok", "instagram"], publishedDaysAgo: 7, scale: 1.3 },
  { title: "Case study: 1,000+ leads/month, automated", caption: "How one real estate developer went from manual follow-up to a fully automated pipeline — full breakdown.", hashtags: "#casestudy #results", platforms: ["linkedin", "facebook"], publishedDaysAgo: 8, scale: 0.8 },
  { title: "Meet the team: Mahnoor", caption: "Meet Mahnoor, who keeps our sales operations running smoothly.", hashtags: "#meettheteam", platforms: ["instagram", "linkedin"], publishedDaysAgo: 9, scale: 1.2 },
  { title: "Quick tip: caption length", caption: "Shorter captions outperformed longer ones for us this quarter — here's the data.", hashtags: "#contenttips", platforms: ["x"], publishedDaysAgo: 10, scale: 0.5 },
  { title: "Behind the shoot: golden hour setup", caption: "Our go-to golden hour lighting setup.", hashtags: "#photography #bts", platforms: ["instagram"], publishedDaysAgo: 12, scale: 1.5 },
  { title: "TikTok trend recap — what worked", caption: "Which trends actually drove results for our clients this month.", hashtags: "#tiktoktrends", platforms: ["tiktok"], publishedDaysAgo: 14, scale: 1.9 },
  { title: "LinkedIn article: retainer pricing", caption: "How we structure retainer pricing for boutique clients.", hashtags: "#agencylife", platforms: ["linkedin"], publishedDaysAgo: 16, scale: 0.6 },
  { title: "Client win: 2x engagement in 60 days", caption: "How we doubled engagement for a client in 60 days.", hashtags: "#casestudy", platforms: ["instagram", "facebook", "linkedin"], publishedDaysAgo: 18, scale: 1.1 },
  { title: "Studio Q&A — ask us anything", caption: "We answered your top questions about working with an agency.", hashtags: "#qanda", platforms: ["youtube", "instagram"], publishedDaysAgo: 21, scale: 0.85 },
  { title: "New year, new brand kit", caption: "Refreshed our own brand kit — here's a look.", hashtags: "#branding", platforms: ["instagram", "x"], publishedDaysAgo: 24, scale: 1.0 },
  { title: "Client testimonial round-up", caption: "A few kind words from clients we've worked with this year.", hashtags: "#testimonials", platforms: ["linkedin", "facebook"], publishedDaysAgo: 27, scale: 0.7 },
  { title: "Studio anniversary post", caption: "Two years of EasyLife 🎉 thank you for trusting us with your brands.", hashtags: "#anniversary #grateful", platforms: ["instagram", "tiktok", "facebook"], publishedDaysAgo: 29, scale: 1.7 },
]

const rand = createSeededRandom(2026)

function buildAnalytics(scale: number) {
  const reach = Math.round(18000 * scale * (0.8 + rand() * 0.5))
  const views = Math.round(reach * (1.3 + rand() * 0.6))
  const likes = Math.round(reach * (0.04 + rand() * 0.03))
  const comments = Math.round(likes * (0.05 + rand() * 0.05))
  const shares = Math.round(likes * (0.03 + rand() * 0.04))
  const engagementRate = Math.round(((likes + comments + shares) / reach) * 1000) / 10
  return { reach, views, likes, comments, shares, engagementRate }
}

function daysAgoIso(days: number) {
  const date = new Date("2026-08-09T16:10:00Z")
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString()
}

export const PUBLISHED_POSTS: Post[] = PUBLISHED_SEEDS.map((seed) => {
  const publishedAt = daysAgoIso(seed.publishedDaysAgo)
  return {
    id: nextId("post_pub"),
    title: seed.title,
    status: "published",
    baseCaption: seed.caption,
    baseHashtags: seed.hashtags,
    media: [],
    platforms: seed.platforms,
    variants: makeVariants(seed.platforms, seed.caption, seed.hashtags),
    publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    author: AUTHOR,
    analytics: buildAnalytics(seed.scale),
  }
})

// ---------------------------------------------------------------------------
// Failed
// ---------------------------------------------------------------------------

const FAILED_SEEDS: { title: string; caption: string; hashtags: string; platforms: SocialPlatform[]; failureReason: string; daysAgo: number }[] = [
  {
    title: "Product drop teaser",
    caption: "Something new is coming Thursday 👀",
    hashtags: "#comingsoon",
    platforms: ["x"],
    failureReason: "Account needs reauthorization — X connection expired.",
    daysAgo: 1,
  },
  {
    title: "Weekend flash sale",
    caption: "48 hours only — flash sale on select services.",
    hashtags: "#flashsale",
    platforms: ["youtube"],
    failureReason: "Video upload timed out — file exceeded platform size limit.",
    daysAgo: 3,
  },
]

export const FAILED_POSTS: Post[] = FAILED_SEEDS.map((seed) => {
  const createdAt = daysAgoIso(seed.daysAgo)
  return {
    id: nextId("post_fail"),
    title: seed.title,
    status: "failed",
    baseCaption: seed.caption,
    baseHashtags: seed.hashtags,
    media: [],
    platforms: seed.platforms,
    variants: makeVariants(seed.platforms, seed.caption, seed.hashtags),
    createdAt,
    updatedAt: createdAt,
    author: AUTHOR,
    failureReason: seed.failureReason,
  }
})

export const ALL_SEED_POSTS: Post[] = [...SCHEDULED_POSTS, ...DRAFT_POSTS, ...PUBLISHED_POSTS, ...FAILED_POSTS]

export const SCHEDULED_POSTS_TOTAL = SCHEDULED_POSTS.length
export const POSTS_PUBLISHED_30D = 86

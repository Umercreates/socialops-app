import type { AiCapability } from "@/types"

/**
 * Entirely local, template-based mock — there is no real model behind this.
 * Every response is generated from simple string rules so the UI has
 * something believable to render. Swapping in a real provider later means
 * replacing the body of `getMockAiResponse` with an actual API call; no
 * consuming component needs to change.
 */

function extractKeywords(text: string, limit = 4) {
  const stopwords = new Set(["the", "and", "for", "with", "this", "that", "your", "have", "from", "about"])
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopwords.has(w))
  return Array.from(new Set(words)).slice(0, limit)
}

function classifyIntent(text: string) {
  const lower = text.toLowerCase()
  if (/(price|cost|pricing|how much|rate)/.test(lower)) return "Pricing question"
  if (/(book|appointment|schedule|availability)/.test(lower)) return "Booking request"
  if (/(hate|worst|terrible|angry|refund|disappointed)/.test(lower)) return "Complaint"
  if (/(love|amazing|great|awesome|incredible|thank)/.test(lower)) return "Compliment"
  if (/\?/.test(lower)) return "General question"
  return "Uncategorized"
}

export async function getMockAiResponse(capability: AiCapability, input: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 500))

  const topic = input.trim() || "your brand"
  const keywords = extractKeywords(input)

  switch (capability) {
    case "caption":
      return `Here's a caption to try:\n\n"${
        topic.length > 4 ? topic[0].toUpperCase() + topic.slice(1) : "New drop"
      } is here — and it's everything we hoped for. Swipe to see the details, then tell us what you think. 👇"\n\nWant a shorter or more playful version? Just ask.`

    case "rewrite":
      return `Here's a punchier rewrite:\n\n"${topic.replace(/\.$/, "")} — and honestly, we can't stop talking about it."\n\nThat trims it down and leads with the hook instead of the setup.`

    case "hashtags": {
      const tags = keywords.length > 0 ? keywords.map((k) => `#${k}`) : ["#socialmedia", "#contentcreator"]
      return `Suggested hashtags:\n\n${[...tags, "#easyland", "#smallbusiness", "#behindthescenes"].join("  ")}\n\nMix 2–3 broad tags with 3–4 niche ones for the best reach.`
    }

    case "ideas":
      return `A few content ideas around "${topic}":\n\n1. Behind-the-scenes look at how it's made\n2. Before/after transformation post\n3. Quick tips carousel related to the topic\n4. Client or customer spotlight\n5. A myth vs. fact reel`

    case "dm-reply":
      return `Suggested reply:\n\n"Hey! Thanks so much for reaching out — happy to help with that. Could you share a bit more detail so I point you to the right info?"`

    case "comment-reply":
      return `Suggested reply:\n\n"Thank you so much, that means a lot to us! 🙏 Let us know if you ever want the full breakdown."`

    case "intent":
      return `Intent classification: **${classifyIntent(input)}**\n\n(This uses simple keyword matching for the demo — not a real NLU model.)`

    case "repurpose":
      return `Repurposed for other formats:\n\n**X / short-form:** "${topic.slice(0, 90)}"\n\n**LinkedIn:** A longer, more reflective take on "${topic}" — framed around the lesson learned, not just the result.\n\n**TikTok hook:** "You won't believe what happened when we tried ${topic}..."`

    default:
      return "Here's a suggestion based on what you shared — let me know if you'd like a different angle."
  }
}

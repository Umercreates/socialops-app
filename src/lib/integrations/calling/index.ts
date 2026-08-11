import { DEMO_MODE } from "@/lib/demo-mode"
import type { Call, CallTranscriptLine } from "@/types"

/**
 * AI calling / telephony integration seam. A real build behind this needs a
 * telephony provider (e.g. Twilio) plus STT/TTS and an LLM for the live
 * conversation — none of that is wired up. Every call in this app is a
 * scripted, timed simulation so the UI/UX can be validated before any of
 * that spend happens.
 */

export interface CallingIntegrationStatus {
  configured: boolean
  mode: "demo" | "live"
  provider: "none"
}

export function getCallingIntegrationStatus(): CallingIntegrationStatus {
  return { configured: !DEMO_MODE, mode: DEMO_MODE ? "demo" : "live", provider: "none" }
}

const SIMULATED_AGENT_LINES = [
  "Assalam-o-Alaikum! This is Aria calling from Easyland — aap ne humari services mein interest show ki thi, do you have a couple of minutes?",
  "Bohat khoob! Could you tell me a bit about what you're looking to get done?",
  "Theek hai, samajh gayi. And do you have a rough budget ya timeline in mind for this?",
  "Understood. Based on what you've shared, I think our business setup package would be a strong fit for you.",
  "Would you be open to a short call with our team this week to go over the details?",
]

const SIMULATED_LEAD_LINES = [
  "Ji haan, bilkul, I've got a few minutes.",
  "Actually hum apna business register karwana chahte hain, aur kuch licensing help bhi chahiye.",
  "Around $2,000 to $3,000, and we'd want to start within the next few weeks — jitni jaldi ho sake.",
  "That sounds reasonable, aap details bhej dein.",
  "Haan theek hai, that works for me — Thursday afternoon is good.",
]

/** Simulates a live call transcript arriving line-by-line, like a real
 * streaming STT/LLM pipeline would. Yields one line at a time. */
export async function* simulateCallTranscript(): AsyncGenerator<CallTranscriptLine> {
  for (let i = 0; i < SIMULATED_AGENT_LINES.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1100))
    yield {
      id: `line_${Date.now()}_a${i}`,
      speaker: "agent",
      text: SIMULATED_AGENT_LINES[i],
      timestamp: new Date().toISOString(),
    }
    await new Promise((resolve) => setTimeout(resolve, 1400))
    yield {
      id: `line_${Date.now()}_l${i}`,
      speaker: "lead",
      text: SIMULATED_LEAD_LINES[i],
      timestamp: new Date().toISOString(),
    }
  }
}

export function summarizeSimulatedCall(): NonNullable<Call["summary"]> {
  return {
    requirements: "Business registration and licensing support for a new venture.",
    painPoints: "Unsure which license category applies and worried about delays.",
    budget: "$2,000–$3,000",
    timeline: "Start within the next few weeks",
    interestedService: "Business setup & licensing package",
    objections: "None raised — asked for more detail in writing.",
    buyingIntent: "high",
    recommendedNextAction: "Send proposal and confirm Thursday afternoon meeting.",
    meetingStatus: "booked",
    followUpRequired: true,
  }
}

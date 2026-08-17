import type { Call, CallTranscriptLine } from "@/types"

/**
 * AI calling / telephony integration seam. This is the OLD, pre-Phase-5
 * simulation - the REAL OmniDimension backend (src/lib/integrations/
 * omnidimension/, src/lib/platform/calls.ts) is what actually dispatches
 * calls now. Everything in this file remains a scripted, timed
 * simulation, used only when the workspace has no live OmniDimension
 * connection - never presented as "live" based on a DEMO_MODE flag, which
 * has no way to know whether any real workspace has actually connected
 * anything (see useProviderStatus("omnidimension") for the real check).
 */

const SIMULATED_AGENT_LINES = [
  "Assalam-o-Alaikum! This is Aria calling from EasyLife — aap ne humari services mein interest show ki thi, do you have a couple of minutes?",
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

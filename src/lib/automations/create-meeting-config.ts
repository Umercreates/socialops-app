/**
 * Pure data/logic, no server-only imports - shared between the automation
 * builder UI (client) and the real create-meeting action handler
 * (server). The create-meeting action's `value` field holds this config
 * JSON-encoded, same "an action's value string means something specific
 * to that action type" convention every other action already follows -
 * no schema/type change needed to add structured configuration to one
 * action.
 */
export interface CreateMeetingConfig {
  delayHours: number
  durationMinutes: number
  /** May contain {name}, replaced with the lead's name at meeting-creation time. */
  titleTemplate: string
}

export const DEFAULT_CREATE_MEETING_CONFIG: CreateMeetingConfig = {
  delayHours: 24,
  durationMinutes: 30,
  titleTemplate: "Meeting with {name}",
}

export function parseCreateMeetingConfig(value: string | undefined): CreateMeetingConfig {
  if (!value) return DEFAULT_CREATE_MEETING_CONFIG
  try {
    const parsed = JSON.parse(value)
    return {
      delayHours: typeof parsed.delayHours === "number" && parsed.delayHours >= 0 ? parsed.delayHours : DEFAULT_CREATE_MEETING_CONFIG.delayHours,
      durationMinutes:
        typeof parsed.durationMinutes === "number" && parsed.durationMinutes > 0 ? parsed.durationMinutes : DEFAULT_CREATE_MEETING_CONFIG.durationMinutes,
      titleTemplate:
        typeof parsed.titleTemplate === "string" && parsed.titleTemplate.trim() ? parsed.titleTemplate : DEFAULT_CREATE_MEETING_CONFIG.titleTemplate,
    }
  } catch {
    return DEFAULT_CREATE_MEETING_CONFIG
  }
}

export function serializeCreateMeetingConfig(config: CreateMeetingConfig): string {
  return JSON.stringify(config)
}

export function renderMeetingTitle(template: string, leadName: string): string {
  return template.replace(/\{name\}/g, leadName)
}

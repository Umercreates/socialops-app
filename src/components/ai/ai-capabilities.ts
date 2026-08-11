import { PencilLine, Wand2, Hash, Lightbulb, MessageCircle, MessageSquare, ScanSearch, Repeat, type LucideIcon } from "lucide-react"
import type { AiCapability } from "@/types"

export const AI_CAPABILITIES: { value: AiCapability; label: string; icon: LucideIcon; prompt: string }[] = [
  { value: "caption", label: "Generate caption", icon: PencilLine, prompt: "Write a caption about our new fall collection launch" },
  { value: "rewrite", label: "Rewrite caption", icon: Wand2, prompt: "Rewrite this to be punchier: We are excited to share our new services." },
  { value: "hashtags", label: "Suggest hashtags", icon: Hash, prompt: "Suggest hashtags for a behind-the-scenes studio photoshoot post" },
  { value: "ideas", label: "Content ideas", icon: Lightbulb, prompt: "Give me content ideas for next week around client testimonials" },
  { value: "dm-reply", label: "Draft DM reply", icon: MessageCircle, prompt: "A prospect DMed asking about our pricing for a half-day shoot" },
  { value: "comment-reply", label: "Draft comment reply", icon: MessageSquare, prompt: "Someone commented: this lighting is unreal, what setup is this?" },
  { value: "intent", label: "Classify intent", icon: ScanSearch, prompt: "Do you have availability next week for a studio session?" },
  { value: "repurpose", label: "Repurpose content", icon: Repeat, prompt: "Repurpose our latest case study about Modern Trail Co. into other formats" },
]

import {
  BookOpen, Palette, Type, Eye, Image, Play, MessageSquare,
  Linkedin, Layout, BarChart2, MousePointer, Globe, FileText, Sparkles,
  Zap, PenLine, Paintbrush, Presentation, ShieldCheck,
  Volume2, Shield, Scale
} from "lucide-react";

export interface NavSection {
  group: string;
  items: { id: string; label: string; icon: React.ElementType; accent?: boolean }[];
}

export const navSections: NavSection[] = [
  {
    group: "Home",
    items: [
      { id: "quick-create", label: "Quick Create", icon: Zap, accent: true },
    ],
  },
  {
    group: "Identity",
    items: [
      { id: "brand-story", label: "Brand Story", icon: BookOpen },
      { id: "logo-guidelines", label: "Logo Guidelines", icon: Sparkles },
      { id: "color-system", label: "Color System", icon: Palette },
      { id: "typography", label: "Typography", icon: Type },
    ],
  },
  {
    group: "Visual Language",
    items: [
      { id: "visual-style", label: "Visual Style", icon: Eye },
      { id: "mood-board", label: "Mood Board", icon: Image },
      { id: "motion", label: "Motion & Animation", icon: Play },
    ],
  },
  {
    group: "Voice",
    items: [
      { id: "voice-tone", label: "Voice & Tone", icon: MessageSquare },
      { id: "linkedin", label: "LinkedIn Playbook", icon: Linkedin },
    ],
  },
  {
    group: "AI Prompt Vault",
    items: [
      { id: "prompts-image", label: "Image Generation", icon: Paintbrush, accent: true },
      { id: "prompts-copy", label: "Copy Templates", icon: PenLine, accent: true },
      { id: "prompts-design", label: "Design Generation", icon: Layout, accent: true },
      { id: "prompts-deck", label: "Deck Generation", icon: Presentation, accent: true },
      { id: "prompts-compliance", label: "Brand Compliance", icon: ShieldCheck, accent: true },
    ],
  },
  {
    group: "Governance",
    items: [
      { id: "sonic-identity", label: "Sonic Identity", icon: Volume2, accent: true },
      { id: "ai-compliance", label: "AI Compliance System", icon: Shield, accent: true },
      { id: "ethical-ai", label: "Ethical AI Use", icon: Scale, accent: true },
      { id: "changelog-ownership", label: "Changelog & Ownership", icon: Shield, accent: true },
    ],
  },
  {
    group: "Product",
    items: [
      { id: "ui-components", label: "UI Components", icon: Layout },
      { id: "data-viz", label: "Data Visualization", icon: BarChart2 },
      { id: "interaction", label: "Interaction States", icon: MousePointer },
    ],
  },
  {
    group: "Application",
    items: [
      { id: "sea-market", label: "SEA Adaptation", icon: Globe },
      { id: "ppt-templates", label: "PPT Templates", icon: FileText },
    ],
  },
];

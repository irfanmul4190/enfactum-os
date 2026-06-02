import { SectionWrapper, SectionHeader, Eyebrow } from "../SectionParts";
import { PromptCard } from "../PromptCard";

export function PromptsComplianceSection() {
  return (
    <SectionWrapper id="prompts-compliance">
      <SectionHeader
        title={<>Brand <span className="text-primary">Compliance</span> Prompts</>}
        subtitle="QA prompts that catch off-brand work before it ships. Run these checks on any copy, design spec, or presentation before publishing."
      />

      <Eyebrow className="mb-4">Copy Compliance</Eyebrow>
      <div className="space-y-4 mb-10">
        <PromptCard
          id="prompt-voice-audit"
          tool="Claude"
          title="Full Brand Voice Audit"
          whenToUse="Before publishing any external-facing copy — website, emails, decks, social."
          prompt={`Audit this copy against Enfactum's Market Grammar brand voice rules:

[PASTE COPY HERE]

Check for these violations and flag each one:

VOCABULARY VIOLATIONS:
- Banned words: seamless, streamlined, synergy, unlock, leverage, empower, innovative, cutting-edge, world-class, next-gen, holistic, robust
- Required replacements: "lead/contact" → "signal", "region/area" → "territory", "sales funnel" → "pipeline infrastructure", "APAC" → "Southeast Asia"

STRUCTURAL VIOLATIONS:
- Sentences starting with "We" (unless counter-claim)
- Passive voice constructions
- Em dashes (should be periods or commas)
- Exclamation marks (never allowed)
- Numbers written as words (should be digits)
- Questions as headlines (should be declarative)

TONE VIOLATIONS:
- Generic claims without data ("many companies", "significant improvement")
- Competitor attacks by name
- Self-congratulatory language ("We're proud", "Excited to announce")
- Hedging language ("might", "could potentially", "we believe")

For each violation found, output:
LINE: [quote the offending text]
VIOLATION: [which rule it breaks]
FIX: [suggested replacement]

End with a compliance score: X/10 where 10 = fully compliant.`}
        />
        <PromptCard
          id="prompt-color-audit"
          tool="Claude"
          title="Audit Copy for Color Reference Violations"
          whenToUse="Before publishing any written content that references Enfactum visuals."
          prompt={`Review this copy for any color references that violate Enfactum brand rules:

[PASTE COPY HERE]

Enfactum color rules:
- Only Brand Blue (#0057FF) and Electric Blue (#2979FF) are approved accent colors in copy
- Capability accents (Violet, Emerald, Amber) are never referenced in marketing copy — only in product UI descriptions
- Never describe the brand as "colorful", "vibrant", or "bold" — use "precise" or "structured"

Return: list of violations found + suggested replacement phrasing for each.`}
        />
      </div>

      <Eyebrow className="mb-4">Design Compliance</Eyebrow>
      <div className="space-y-4 mb-10">
        <PromptCard
          id="prompt-design-compliance"
          tool="Claude"
          title="Design Spec Compliance Check"
          whenToUse="Before handing off any design to engineering."
          prompt={`Audit this design specification against Enfactum's Market Grammar design system:

[PASTE DESIGN SPECS OR DESCRIBE THE DESIGN]

Check for these violations:

TYPOGRAPHY:
- Any font that isn't IBM Plex Sans, IBM Plex Mono, or IBM Plex Serif
- IBM Plex Serif used for anything other than pull quotes
- IBM Plex Mono used for non-data text
- Heading weights that aren't Bold (700) or SemiBold (600)
- Body text not at 16px Regular

COLOR:
- Any color not in the approved palette
- Gradients used as primary backgrounds
- Red used for negative data (should be Neutral-400 gray)
- Accent colors used for large surface areas
- Hardcoded hex values instead of CSS custom properties

MOTION:
- Spring physics or bounce animations
- Duration values not matching the token scale (0/100/200/300/500/800ms)
- Missing hover states on interactive elements
- Card hover not using translateY(-2px) + blue glow shadow

SPACING:
- Non-4px-grid spacing values
- Inconsistent padding within card groups
- Missing clear space around logo usage

For each issue, output the violation and the correct specification.`}
        />
      </div>

      <Eyebrow className="mb-4">Presentation Compliance</Eyebrow>
      <div className="space-y-4">
        <PromptCard
          id="prompt-deck-preflight"
          tool="Claude"
          title="Deck Pre-Flight Check"
          whenToUse="Before any external presentation. Run on slide-by-slide content."
          prompt={`Run a pre-flight compliance check on this Enfactum presentation:

[PASTE SLIDE CONTENT OR DESCRIBE EACH SLIDE]

Check each slide against these rules:

FORMAT:
- Aspect ratio must be 16:9
- Dark background (#0A0F1E) for external decks
- Max 6 lines of text per slide
- No 4:3 slides, no light backgrounds for external use

CONTENT:
- Every data claim has a source footnote
- No "Thank You" or "Questions?" ending slide — must have specific CTA
- No stock photography or generic clip art
- Headlines use selective word highlighting (1-2 words in Electric Blue)

TYPOGRAPHY:
- Headlines in IBM Plex Sans Bold
- All numbers in IBM Plex Mono
- Footnotes in 10px IBM Plex Sans Light

ANIMATION:
- Only fade-in at 300ms allowed
- No fly-in, bounce, spin, or slide transitions

Return: PASS/FAIL per slide + overall compliance score + list of required fixes.`}
        />
      </div>
    </SectionWrapper>
  );
}

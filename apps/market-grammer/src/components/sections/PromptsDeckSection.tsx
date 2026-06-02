import { SectionWrapper, SectionHeader, Eyebrow } from "../SectionParts";
import { PromptCard } from "../PromptCard";

export function PromptsDeckSection() {
  return (
    <SectionWrapper id="prompts-deck">
      <SectionHeader
        title={<>Deck <span className="text-primary">Generation</span> Prompts</>}
        subtitle="Prompts for generating on-brand presentation decks, pitch materials, and slide content using AI tools."
      />

      <Eyebrow className="mb-4">Slide Content</Eyebrow>
      <div className="space-y-4 mb-10">
        <PromptCard
          id="prompt-pitch-deck"
          tool="Gamma"
          title="Generate a Full Pitch Deck"
          whenToUse="Investor meetings, partnership pitches, enterprise sales."
          prompt={`Create a pitch deck for Enfactum, a B2B GTM intelligence platform for Southeast Asia.

Slide structure (10 slides):
1. Title: "enfactum" wordmark + "The operating system for SEA market intelligence"
2. Problem: US-built GTM tools fail in SEA (3 specific data points)
3. Solution: 14-market signal intelligence platform (mechanism, not benefits)
4. How it works: 3-step visual — Signal Capture → Territory Mapping → Pipeline Conversion
5. Market size: SEA B2B SaaS TAM with growth metrics
6. Traction: Key metrics (signals processed, markets covered, client outcomes)
7. Capability pillars: Signal Intelligence, Territory Architecture, Conversion Infrastructure, Market Grammar
8. Case study: Before/after metrics for one client
9. Team: Founder backgrounds (keep minimal)
10. CTA: "Schedule a Territory Mapping Session" + contact

Design rules:
- Dark backgrounds (#0A0F1E) for all slides
- IBM Plex Sans for all text, IBM Plex Mono for numbers
- Brand Blue (#0057FF) for accents only — never as background
- Max 6 lines of text per slide
- 16:9 aspect ratio
- Animations: fade-in only, 300ms`}
        />
        <PromptCard
          id="prompt-speaker-notes"
          tool="Claude"
          title="Write Slide-by-Slide Speaker Notes"
          whenToUse="Preparing for a presentation with a pre-built deck."
          prompt={`Write speaker notes for each slide in this Enfactum deck:

[PASTE SLIDE TITLES/CONTENT HERE]

For each slide, provide:
1. Opening statement (what you say first — max 15 words, said with confidence)
2. Key talking points (3 bullets, each with a data point or specific claim)
3. Transition to next slide (one sentence bridging to the next topic)

Rules:
- Conversational but authoritative — you're the expert, not the salesperson
- Every talking point must include a number or named mechanism
- Never say "As you can see on this slide" — describe, don't point
- Max 60 words per slide
- Close the deck with a specific CTA, not "any questions?"`}
        />
      </div>

      <Eyebrow className="mb-4">Presentation Visuals</Eyebrow>
      <div className="space-y-4">
        <PromptCard
          id="prompt-deck-title-bg"
          tool="Midjourney"
          title="Deck Title Slide Background"
          whenToUse="Opening slide of any Enfactum presentation."
          prompt={`/imagine prompt: abstract minimalist geometric composition, massive dark concrete planes intersecting at precise angles, deep midnight blue atmosphere #0A0F1E, single thin line of electric blue light #0057FF cutting through the composition, corporate architectural photography, 8k resolution, no text, no people, no warm colors, structural brutalism, suitable for text overlay --ar 16:9 --style raw --v 6.1

Negative: people, warm colors, gradients, organic shapes, bokeh, lens flare, watercolor, neon`}
        />
        <PromptCard
          id="prompt-deck-data-bg"
          tool="Midjourney"
          title="Data Slide Background"
          whenToUse="Behind charts and metrics — subtle, non-competing."
          prompt={`/imagine prompt: extremely subtle dark geometric texture, barely visible grid pattern on pure midnight navy #0A0F1E, ultra-minimal, almost solid dark color with faint mathematical precision lines at 5% opacity, suitable as background for data overlay, no focal point, no accent colors, pure dark ambient texture --ar 16:9 --style raw --v 6.1

Negative: bright colors, focal elements, people, contrast, patterns, organic, bokeh`}
        />
      </div>
    </SectionWrapper>
  );
}

import { SectionWrapper, SectionHeader, Eyebrow } from "../SectionParts";
import { PromptCard } from "../PromptCard";

export function PromptsCopySection() {
  return (
    <SectionWrapper id="prompts-copy">
      <SectionHeader
        title={<>Copy <span className="text-primary">Templates</span></>}
        subtitle="Production-ready prompts for every writing context. Each prompt encodes Enfactum's voice rules so the output is on-brand from the first generation."
      />

      <Eyebrow className="mb-4">Outbound & Sales</Eyebrow>
      <div className="space-y-4 mb-10">
        <PromptCard
          id="prompt-cold-email"
          tool="Claude"
          title="Write a Cold Outreach Email"
          whenToUse="SDR outbound, founder-led sales, LinkedIn InMail."
          prompt={`Write a cold outreach email for Enfactum targeting [ROLE: e.g. VP Sales] at [COMPANY TYPE: e.g. Series B SaaS] expanding into Southeast Asia.

Structure:
1. Opening line: Reference a specific signal about their company (funding round, job posting, market announcement). No "I hope this finds you well."
2. Problem statement: 1 sentence about why their current GTM approach fails in SEA. Be specific.
3. Mechanism: 1 sentence about how Enfactum's signal intelligence solves this. Include a number.
4. Social proof: 1 sentence referencing a comparable outcome. "Companies like [SIMILAR COMPANY] saw [METRIC]."
5. CTA: One specific ask. Not "happy to chat" — give a concrete next step.

Voice rules:
- Max 120 words total
- No: seamless, streamlined, leverage, unlock, empower, "I'd love to"
- Yes: signal, territory, pipeline, conversion, infrastructure
- Active voice only. No em dashes. No exclamation marks.
- Subject line: max 6 words, data-first, no clickbait`}
        />
        <PromptCard
          id="prompt-objection"
          tool="Claude"
          title="Draft an Objection Response"
          whenToUse="When a prospect pushes back during sales conversations."
          prompt={`Write an objection response for Enfactum addressing this pushback:

[OBJECTION: e.g. "We already use HubSpot for our APAC expansion"]

Response structure:
1. Acknowledge: Don't dismiss — validate the tool they're using (1 sentence)
2. Reframe: Show why the objection reveals the actual problem (1 sentence with data)
3. Differentiate: What Enfactum does that their current tool cannot (1 sentence, specific mechanism)
4. Evidence: One proof point — metric, case study reference, or market data
5. Bridge: Return to their goal, not your product

Rules:
- Never attack the competitor by name
- Max 80 words
- Tone: intelligence register — factual, evidence-backed
- Must include at least one number`}
        />
        <PromptCard
          id="prompt-linkedin-dm"
          tool="Claude"
          title="Write a Cold LinkedIn DM"
          whenToUse="Personal LinkedIn outreach to prospects."
          prompt={`Write a LinkedIn direct message from an Enfactum team member to [ROLE] at [COMPANY].

Rules:
- Max 60 words (LinkedIn DMs must be short)
- First line: Reference something specific about them (not generic flattery)
- Second line: One data point about SEA market challenge relevant to their role
- Third line: Specific, low-commitment CTA ("Worth a 15-min look?")
- No: "I came across your profile", "I'd love to connect", "Reaching out because"
- Tone: peer-to-peer, not vendor-to-buyer`}
        />
      </div>

      <Eyebrow className="mb-4">Marketing Content</Eyebrow>
      <div className="space-y-4 mb-10">
        <PromptCard
          id="prompt-linkedin-contrarian"
          tool="Claude"
          title="Write a LinkedIn Post — Contrarian Insight"
          whenToUse="Company page or founder personal LinkedIn."
          prompt={`Write a LinkedIn post for Enfactum about [TOPIC: e.g. why brand awareness fails in SEA B2B].

Structure (follow exactly):
Line 1: Data hook — start with a number or surprising stat. Max 10 words.
Lines 2-4: Context — the problem most people get wrong. 2-3 sentences.
Line 5: Bold insight — the contrarian take. Use Unicode bold: 𝗧𝗵𝗶𝘀 𝗳𝗼𝗿𝗺𝗮𝘁. One sentence.
Line 6: CTA — a genuine question to the audience. Not rhetorical.

After the post, add: 3 hashtags maximum. Always include #SEAmarket. No #innovation #leadership #growth.

Rules:
- Max 1,300 characters
- No emojis in body text (opening line stat emoji OK)
- No "Excited to share" or "Proud to announce"
- Must include at least 2 specific numbers
- End with a question that invites real answers`}
        />
        <PromptCard
          id="prompt-website-hero"
          tool="Claude"
          title="Write Website Hero Copy"
          whenToUse="Landing pages, product pages, campaign pages."
          prompt={`Write website hero section copy for Enfactum about [PAGE PURPOSE: e.g. main landing page / product capability / case study].

Output format:
1. HEADLINE: Max 7 words. Mark 1-2 words for Electric Blue highlight with **asterisks**. Verb-first or noun-first. Never a question.
2. SUBHEADLINE: Max 15 words. Expands the headline with a specific mechanism or data point.
3. CTA BUTTON: Max 4 words. Verb-first. Not "Learn More" or "Get Started" — be specific.
4. SUPPORTING STAT: One number + label (e.g. "14 Markets · 6 Languages · 200ms")

Rules:
- No: seamless, innovative, cutting-edge, world-class, next-gen, empower, unlock
- Yes: signal, precision, territory, pipeline, infrastructure, grammar
- The headline must work without the subheadline
- The CTA must describe what happens when you click it`}
        />
        <PromptCard
          id="prompt-proposal-intro"
          tool="Claude"
          title="Write a Proposal Introduction"
          whenToUse="Opening paragraph of sales proposals and SOWs."
          prompt={`Write a proposal introduction paragraph for Enfactum targeting [COMPANY NAME] in [INDUSTRY].

Structure:
1. Opening: State their business goal (not Enfactum's capabilities). Show you understand their world.
2. Challenge: Name the specific GTM challenge they face in SEA. Be precise — mention markets, languages, or deal cycle specifics.
3. Mechanism: How Enfactum's signal intelligence addresses this challenge. One sentence with a metric.
4. Outcome: What success looks like. Quantified.

Rules:
- Max 100 words
- Intelligence register: factual, evidence-backed
- Never start with "Enfactum is..." — start with their problem
- Include at least 2 specific numbers`}
        />
      </div>

      <Eyebrow className="mb-4">Brand & Product</Eyebrow>
      <div className="space-y-4">
        <PromptCard
          id="prompt-capability-pillar"
          tool="Claude"
          title="Describe a Capability Pillar"
          whenToUse="Product pages, sales decks, capability overview sections."
          prompt={`Write a capability description for Enfactum's [PILLAR: Signal Intelligence / Territory Architecture / Conversion Infrastructure / Market Grammar].

Output format:
1. PILLAR NAME in caps
2. One-sentence definition (what it is, technically)
3. Three bullet points: each starts with a verb, includes a metric or mechanism, max 15 words
4. One "In practice" example: a real scenario showing the pillar in action

Rules:
- Use the correct pillar accent color reference: Signal=Blue, Territory=Violet, Conversion=Emerald, Market=Amber
- Intelligence register: precise, data-backed
- No marketing fluff — describe what the system actually does
- Every bullet must include either a number or a named system component`}
        />
      </div>
    </SectionWrapper>
  );
}

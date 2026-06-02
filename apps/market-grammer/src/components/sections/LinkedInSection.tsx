import { ThumbsUp, MessageCircle, Share2, Check, X } from "lucide-react";
import { SectionWrapper, SectionHeader, Eyebrow } from "../SectionParts";

function LinkedInPostMockup() {
  return (
    <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden shadow-sm max-w-[480px]">
      <div className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-[#0057FF] flex items-center justify-center text-white text-[14px] font-bold shrink-0">
          EN
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-[#000000]">Enfactum</div>
          <div className="text-[12px] text-[#666666] leading-snug">Marketing & Growth Consultancy · Southeast Asia</div>
          <div className="text-[12px] text-[#666666]">2h · 🌐</div>
        </div>
      </div>
      <div className="px-4 pb-3">
        <p className="text-[14px] text-[#000000] leading-[1.5]">
          14 markets. 6 languages. 200ms processing.
          <br /><br />
          Here's what most GTM platforms get wrong about Southeast Asia →
          <br /><br />
          They apply US enterprise playbooks to a region where buyers do 90% of their research before talking to sales. Where deal cycles are compressed. Where a single "Asia-Pacific" strategy means you've already lost.
          <br /><br />
          <span className="font-semibold">Signal density beats brand awareness in SEA.</span>
          <br /><br />
          What's your biggest challenge scaling GTM in the region?
        </p>
        <div className="mt-2 text-[14px] text-[#0a66c2] font-medium">
          #SEAmarket #GTMstrategy #B2BSaaS
        </div>
      </div>
      <div className="px-4 py-2 border-t border-[#e0e0e0] flex items-center gap-1 text-[12px] text-[#666666]">
        <span>👍</span> <span>42 likes</span>
        <span className="mx-auto" />
        <span>8 comments</span>
        <span className="mx-2">·</span>
        <span>3 reposts</span>
      </div>
      <div className="px-2 py-1 border-t border-[#e0e0e0] flex">
        {[
          { icon: ThumbsUp, label: "Like" },
          { icon: MessageCircle, label: "Comment" },
          { icon: Share2, label: "Share" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-[#666666] hover:bg-[#f5f5f5] rounded-md transition-colors duration-150">
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LinkedInSection() {
  return (
    <SectionWrapper id="linkedin">
      <SectionHeader
        title={<>LinkedIn <span className="text-primary">Playbook</span></>}
        subtitle="LinkedIn is our primary channel for thought leadership and pipeline generation. This section provides post formulas, visual guidelines, content calendar rules, and complete templates ready to adapt."
      />

      {/* Strategy overview */}
      <div className="border-l-2 border-primary bg-surface rounded-r-xl p-6 mb-10">
        <p className="text-[14px] font-medium text-foreground mb-2">Content Strategy</p>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          Every LinkedIn post serves one of three goals: (1) establish authority through data-driven insight, (2) generate pipeline by demonstrating market knowledge, or (3) build community by asking intelligent questions. Generic "thought leadership" that could apply to any company is strictly off-limits.
        </p>
      </div>

      {/* Guidelines */}
      <Eyebrow className="mb-4">Post Guidelines</Eyebrow>
      <div className="grid grid-cols-2 gap-4 mb-10">
        {[
          { title: "Post Structure Formula", body: "Hook (1 line, data-led) → Context (2-3 lines, the problem) → Insight (1 line, bold, the contrarian take) → CTA (question or link). Max 1,300 characters.", example: "\"14 markets. 6 languages. 200ms. → [context about the problem] → Signal density beats brand awareness. → What's your biggest SEA GTM challenge?\"" },
          { title: "Visual Format", body: "Dark mode card graphics preferred. IBM Plex Sans Bold for headlines. Metric callouts in IBM Plex Mono. Brand Blue accents only. Never use stock photos or generic tech illustrations.", example: "A dark card showing: \"3.2x\" in Plex Mono 48px, with \"improvement in lead-to-close\" in Plex Sans 16px below." },
          { title: "Frequency & Cadence", body: "Company page: minimum 3x/week (Mon, Wed, Fri). Founder personal: 2x/week. Employee amplification encouraged with pre-approved hooks. Never post on weekends.", example: "Mon: Data insight post. Wed: Contrarian take. Fri: Community question or case study snippet." },
          { title: "Hashtag Strategy", body: "Max 3 hashtags per post. Always include #SEAmarket or #GTMstrategy. Add one topic-specific tag. Never use generic tags like #innovation, #leadership, or #futureofwork.", example: "✓ #SEAmarket #B2BSaaS #SignalIntelligence\n✗ #innovation #leadership #growth" },
        ].map((p) => (
          <div key={p.title} className="brand-card p-5">
            <div className="text-[13px] font-semibold text-foreground mb-2">{p.title}</div>
            <p className="text-[13px] text-text-secondary leading-relaxed mb-3">{p.body}</p>
            <div className="border-t border-border pt-2">
              <Eyebrow className="text-primary mb-1">Example</Eyebrow>
              <p className="text-[11px] text-muted font-mono-data whitespace-pre-wrap">{p.example}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Post Preview */}
      <Eyebrow className="mb-2">Post Preview — Annotated Example</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">This is what a correctly formatted Enfactum post looks like on LinkedIn. Study the structure: data hook → context → bold insight → CTA question.</p>
      <div className="mb-10 flex justify-center">
        <LinkedInPostMockup />
      </div>

      {/* Post templates */}
      <Eyebrow className="mb-2">Post Templates — Copy & Adapt</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Use these proven templates. Replace the bracketed sections with your specific data and insight. Every template follows the Hook → Context → Insight → CTA structure.</p>
      <div className="space-y-4 mb-10">
        {[
          { type: "Data Hook", formula: "[Stat] + [Stat] + [Stat]. Here's what [audience] gets wrong about [topic] →", example: "14 markets. 6 languages. 200ms processing.\n\nHere's what most GTM platforms get wrong about Southeast Asia →\n\nThey apply US enterprise playbooks to a region where buyers do 90% of their research before talking to sales.\n\n𝗦𝗶𝗴𝗻𝗮𝗹 𝗱𝗲𝗻𝘀𝗶𝘁𝘆 𝗯𝗲𝗮𝘁𝘀 𝗯𝗿𝗮𝗻𝗱 𝗮𝘄𝗮𝗿𝗲𝗻𝗲𝘀𝘀 𝗶𝗻 𝗦𝗘𝗔.\n\nWhat's your biggest challenge scaling GTM in the region?" },
          { type: "Contrarian Take", formula: "\"[Common belief]\" is wrong. Here's what [evidence] actually shows:", example: "\"Best practices\" in SEA GTM are usually worst practices imported from US playbooks.\n\nWe tracked 800 B2B campaigns across 6 ASEAN markets last quarter.\n\nThe campaigns that followed \"global best practices\" underperformed locally-adapted ones by 2.7x.\n\n𝗧𝗵𝗲 𝗽𝗹𝗮𝘆𝗯𝗼𝗼𝗸 𝘄𝗮𝘀𝗻'𝘁 𝘄𝗿𝗶𝘁𝘁𝗲𝗻 𝗳𝗼𝗿 𝘁𝗵𝗶𝘀 𝗿𝗲𝗴𝗶𝗼𝗻.\n\nHave you experienced this gap?" },
          { type: "Case Insight", formula: "We analyzed [N] [things] across [markets]. The #1 predictor of [outcome] wasn't [expected] — it was [surprising].", example: "We analyzed 2,400 deal cycles across ASEAN.\n\nThe #1 predictor of close rate wasn't price — it was signal density.\n\nCompanies with 40+ buying signals per prospect closed 3.2x faster than those with fewer than 10.\n\n𝗠𝗼𝗿𝗲 𝘀𝗶𝗴𝗻𝗮𝗹𝘀, 𝗳𝗮𝘀𝘁𝗲𝗿 𝗱𝗲𝗮𝗹𝘀.\n\nHow are you measuring signal density in your pipeline?" },
        ].map((t) => (
          <div key={t.type} className="brand-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary/15 text-primary">{t.type}</span>
              <span className="text-[11px] font-mono-data text-muted">{t.formula}</span>
            </div>
            <pre className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">{t.example}</pre>
          </div>
        ))}
      </div>

      {/* Do / Don't */}
      <Eyebrow className="mb-4">LinkedIn Do & Don't</Eyebrow>
      <div className="grid grid-cols-2 gap-4">
        <div className="brand-card p-5">
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-emerald mb-3 flex items-center gap-2"><Check size={14} /> Do</h4>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Start with a data point or surprising stat</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Bold the key insight line using Unicode bold</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> End with a genuine question (not rhetorical)</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Reference specific SEA markets by name</li>
          </ul>
        </div>
        <div className="brand-card p-5">
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-destructive mb-3 flex items-center gap-2"><X size={14} /> Don't</h4>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Use generic hooks ("Excited to announce...")</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Share posts without a clear insight or data point</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Use more than 3 hashtags or emojis in body text</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Post content that could come from any B2B company</li>
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}

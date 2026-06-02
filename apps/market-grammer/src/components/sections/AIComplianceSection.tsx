import { Shield, AlertTriangle, CheckCircle, XCircle, ClipboardList } from "lucide-react";
import { SectionWrapper, SectionHeader, Eyebrow } from "../SectionParts";
import { PromptCard } from "../PromptCard";

export function AIComplianceSection() {
  return (
    <SectionWrapper id="ai-compliance">
      <Eyebrow className="mb-4">Governance · AI Compliance</Eyebrow>
      <SectionHeader
        title={<>
          AI <span className="text-primary">Compliance</span> System
        </>}
        subtitle="One manual compliance check is a quality gate. A system is what prevents brand drift at scale. This section covers the full pipeline — from individual content review to volume audit to drift detection."
      />

      {/* Three tiers */}
      <Eyebrow className="mb-4">Three Tiers of Compliance</Eyebrow>
      <div className="space-y-4 mb-10">
        {/* Tier 1 */}
        <div className="brand-card p-5 border-l-[3px] border-l-primary">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-primary">Tier 1</span>
            <span className="text-[14px] font-semibold text-foreground">Spot Check</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-[13px]">
            <div><span className="text-muted">For:</span> <span className="text-text-secondary">Individual pieces before publishing</span></div>
            <div><span className="text-muted">Who:</span> <span className="text-text-secondary">Content creator</span></div>
            <div><span className="text-muted">Tool:</span> <span className="text-text-secondary">Brand Compliance prompt</span></div>
            <div><span className="text-muted">Frequency:</span> <span className="text-text-secondary">Every time</span></div>
            <div><span className="text-muted">Time:</span> <span className="font-mono-data text-text-secondary">2-3 min</span></div>
            <div><span className="text-muted">Pass:</span> <span className="text-text-secondary">0 violations</span></div>
          </div>
        </div>

        {/* Tier 2 */}
        <div className="brand-card p-5 border-l-[3px] border-l-brand-violet">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-brand-violet">Tier 2</span>
            <span className="text-[14px] font-semibold text-foreground">Batch Audit</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-[13px]">
            <div><span className="text-muted">For:</span> <span className="text-text-secondary">Weekly review of all AI-generated content</span></div>
            <div><span className="text-muted">Who:</span> <span className="text-text-secondary">Brand owner / senior marketer</span></div>
            <div><span className="text-muted">Tool:</span> <span className="text-text-secondary">Batch compliance prompt</span></div>
            <div><span className="text-muted">Frequency:</span> <span className="text-text-secondary">Weekly</span></div>
            <div><span className="text-muted">Time:</span> <span className="font-mono-data text-text-secondary">15-20 min</span></div>
            <div><span className="text-muted">Pass:</span> <span className="text-text-secondary">Drift score under 10%</span></div>
          </div>
        </div>

        {/* Tier 3 */}
        <div className="brand-card p-5 border-l-[3px] border-l-brand-emerald">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-brand-emerald">Tier 3</span>
            <span className="text-[14px] font-semibold text-foreground">System Drift Review</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-[13px]">
            <div><span className="text-muted">For:</span> <span className="text-text-secondary">Quarterly review of brand book accuracy</span></div>
            <div><span className="text-muted">Who:</span> <span className="text-text-secondary">Leadership + brand owner</span></div>
            <div><span className="text-muted">Tool:</span> <span className="text-text-secondary">Drift signal prompt</span></div>
            <div><span className="text-muted">Frequency:</span> <span className="text-text-secondary">Quarterly</span></div>
            <div><span className="text-muted">Time:</span> <span className="font-mono-data text-text-secondary">60 min</span></div>
            <div><span className="text-muted">Output:</span> <span className="text-text-secondary">Changelog + updated boundaries</span></div>
          </div>
        </div>
      </div>

      {/* Drift signals table */}
      <Eyebrow className="mb-4">Drift Signals — What to Watch For</Eyebrow>
      <div className="brand-card overflow-hidden mb-10">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-elevated">
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Signal</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Severity</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Action</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            {[
              { signal: "Warm/orange tones appearing", severity: "High", action: "Audit image prompts, add negative --no warm" },
              { signal: '"Solutions" in copy', severity: "High", action: "Re-run vocab training" },
              { signal: "Rounded cards > 24px", severity: "Medium", action: "Update v0/Lovable prompts" },
              { signal: "Gradients in backgrounds", severity: "High", action: "Tighten Midjourney --no gradient" },
              { signal: "Benefit-first (not signal)", severity: "Medium", action: "Retrain copywriters on register" },
              { signal: "IBM Plex replaced by Inter", severity: "High", action: "Explicit font lock in all dev prompts" },
            ].map((row) => (
              <tr key={row.signal} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{row.signal}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    row.severity === "High" ? "bg-destructive/15 text-destructive" : "bg-brand-amber/15 text-brand-amber"
                  }`}>{row.severity}</span>
                </td>
                <td className="px-4 py-3">{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review queue structure */}
      <Eyebrow className="mb-4">Review Queue Template</Eyebrow>
      <div className="brand-card p-5 mb-10">
        <pre className="font-mono-data text-[12px] text-text-secondary leading-[1.8] whitespace-pre-wrap">{`Week of [DATE]
─────────────────────
Items reviewed: [N]
Violations found: [N]
Drift score: [N]%

VIOLATIONS LOG:
[DATE] [CHANNEL] [RULE VIOLATED] [FIXED Y/N]

ACTIONS FOR NEXT WEEK:
□ [ACTION ITEM]`}</pre>
      </div>

      {/* Use with AI */}
      <Eyebrow className="mb-4 flex items-center gap-2">Use with AI</Eyebrow>
      <div className="space-y-4">
        <PromptCard
          id="prompt-batch-audit"
          tool="Claude"
          title="Run a Batch Compliance Audit"
          whenToUse="Weekly review of all AI-generated content published that week."
          prompt={`You are running a batch brand compliance audit for Enfactum's Market Grammar system.

Below are [N] pieces of AI-generated content published this week:

[PASTE ALL CONTENT — label each as ITEM 1, ITEM 2, etc.]

For each item, return:
ITEM [N]: PASS ✓ or FAIL ✗
If FAIL: list specific violations by rule

At the end, return:
BATCH SUMMARY:
- Total items: [N]
- Passed: [N]
- Failed: [N]
- Drift score: [%]
- Most common violation: [RULE]
- Recommended action: [ONE SENTENCE]

Reference rules:
- Voice: no banned words, verb-first, active voice, no em dashes, no exclamation marks
- Visual: no warm colors, no gradients, no people, IBM Plex fonts only
- Logo: correct wordmark, clear space respected, approved backgrounds only
- Tone: correct register (Command/Intelligence/Warmth) for context`}
        />
        <PromptCard
          id="prompt-drift-report"
          tool="Claude"
          title="Generate a Drift Signal Report"
          whenToUse="Quarterly review to check if AI tools are drifting from brand parameters."
          prompt={`Analyze the following sample of content produced by Enfactum's team using AI tools over the past quarter. Identify any systematic drift from Market Grammar brand standards.

[PASTE 10-15 REPRESENTATIVE CONTENT SAMPLES — mix of copy, image descriptions, and deck outlines]

Produce a DRIFT SIGNAL REPORT:

1. PATTERN VIOLATIONS (rules broken more than once across the sample)
2. SEVERITY RATING per pattern (High / Medium / Low)
3. ROOT CAUSE HYPOTHESIS (is the brand book unclear? is the prompt too loose? is the team skipping the compliance check?)
4. BRAND BOOK UPDATE RECOMMENDATIONS (specific wording additions or boundary tightening to prevent recurrence)
5. PROMPT UPDATES NEEDED (which specific prompts in the Vault need to be revised, and how)`}
        />
      </div>
    </SectionWrapper>
  );
}

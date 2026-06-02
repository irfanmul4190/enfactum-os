import { Volume2, Mic, Radio, Info, CheckCircle, XCircle } from "lucide-react";
import { SectionWrapper, SectionHeader, Eyebrow } from "../SectionParts";
import { PromptCard } from "../PromptCard";

export function SonicIdentitySection() {
  return (
    <SectionWrapper id="sonic-identity">
      <Eyebrow className="mb-4">Governance · Sonic Identity</Eyebrow>
      <SectionHeader
        title={<>
          <span className="text-primary">Sonic</span> Identity
        </>}
        subtitle="Enfactum's voice exists beyond screens. These rules govern how the brand sounds in voice interfaces, AI assistants, video content, and audio-first channels — before a full sonic logo is commissioned."
      />

      {/* Status card */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-amber/30 bg-brand-amber/5 p-5 mb-10">
        <Info size={18} className="text-brand-amber shrink-0 mt-0.5" />
        <p className="text-[13px] text-text-secondary leading-relaxed">
          Sonic Identity is in draft stage. A formal sonic logo has not yet been produced. These are working principles — apply them to video voiceovers, AI assistant scripts, and presentation narration until further notice.
        </p>
      </div>

      {/* Sonic principles */}
      <Eyebrow className="mb-4">Sonic Principles</Eyebrow>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="brand-card p-5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Volume2 size={18} className="text-primary" />
          </div>
          <h4 className="text-[14px] font-semibold text-foreground mb-2">Cadence over Warmth</h4>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            Enfactum's audio register is measured, not welcoming. Pace: 130–145 words per minute. No uptalk. Statements end with falling intonation. Pauses are used for emphasis, not to fill space.
          </p>
        </div>
        <div className="brand-card p-5">
          <div className="w-9 h-9 rounded-lg bg-brand-violet/10 flex items-center justify-center mb-3">
            <Mic size={18} className="text-brand-violet" />
          </div>
          <h4 className="text-[14px] font-semibold text-foreground mb-2">Precision over Performance</h4>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            Numbers are read as digits, not words ("fourteen" → "one-four" for data contexts). Product names are never abbreviated in audio. "Enfactum" is always 3 syllables: EN-fac-tum.
          </p>
        </div>
        <div className="brand-card p-5">
          <div className="w-9 h-9 rounded-lg bg-brand-emerald/10 flex items-center justify-center mb-3">
            <Radio size={18} className="text-brand-emerald" />
          </div>
          <h4 className="text-[14px] font-semibold text-foreground mb-2">Neutral over Enthusiastic</h4>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            No exclamation in tone. No rising energy at the end of value propositions. Confidence is communicated through stillness, not volume. The reference register: Bloomberg anchor, not TED Talk speaker.
          </p>
        </div>
      </div>

      {/* Voice assistant rules */}
      <Eyebrow className="mb-4">Voice Assistant Rules</Eyebrow>
      <div className="brand-card overflow-hidden mb-10">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-elevated">
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Context</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Tone</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Max Length</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Example</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            <tr className="border-t border-border">
              <td className="px-4 py-3 font-medium text-foreground">Alexa skill</td>
              <td className="px-4 py-3">Command</td>
              <td className="px-4 py-3 font-mono-data">15 words</td>
              <td className="px-4 py-3 italic">"Pipeline signal for [market] is ready."</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-3 font-medium text-foreground">Google Assistant</td>
              <td className="px-4 py-3">Intelligence</td>
              <td className="px-4 py-3 font-mono-data">25 words</td>
              <td className="px-4 py-3 italic">"3 accounts match your expansion criteria in Vietnam this week."</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-3 font-medium text-foreground">AI phone agent</td>
              <td className="px-4 py-3">Warmth</td>
              <td className="px-4 py-3 font-mono-data">40 words</td>
              <td className="px-4 py-3 italic">Opens with market context, closes with one clear action</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-3 font-medium text-foreground">Video narration</td>
              <td className="px-4 py-3">Intelligence</td>
              <td className="px-4 py-3 font-mono-data">130 wpm</td>
              <td className="px-4 py-3 italic">Data-led, no filler phrases</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Do / Don't */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="brand-card p-5">
          <Eyebrow className="text-brand-emerald mb-3">Do</Eyebrow>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><CheckCircle size={14} className="text-brand-emerald shrink-0 mt-0.5" /> "14 accounts entered high-intent territory this week."</li>
            <li className="flex items-start gap-2"><CheckCircle size={14} className="text-brand-emerald shrink-0 mt-0.5" /> "Signal confirmed. Pipeline qualified."</li>
            <li className="flex items-start gap-2"><CheckCircle size={14} className="text-brand-emerald shrink-0 mt-0.5" /> Pause 0.5s before and after a key metric</li>
          </ul>
        </div>
        <div className="brand-card p-5">
          <Eyebrow className="text-destructive mb-3">Don't</Eyebrow>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><XCircle size={14} className="text-destructive shrink-0 mt-0.5" /> "Exciting news — we've got some great insights!"</li>
            <li className="flex items-start gap-2"><XCircle size={14} className="text-destructive shrink-0 mt-0.5" /> "So basically what we're seeing is..."</li>
            <li className="flex items-start gap-2"><XCircle size={14} className="text-destructive shrink-0 mt-0.5" /> Reading out URLs or hex values in audio contexts</li>
          </ul>
        </div>
      </div>

      {/* Use with AI */}
      <Eyebrow className="mb-4 flex items-center gap-2">Use with AI</Eyebrow>
      <div className="space-y-4">
        <PromptCard
          id="prompt-voice-assistant-script"
          tool="Claude"
          title="Write a Voice Assistant Script"
          whenToUse="For Alexa skills, Google Assistant Actions, AI SDR phone scripts, or any audio-first Enfactum touchpoint."
          prompt={`Write a voice script for Enfactum's [CHANNEL: e.g. Alexa daily briefing / AI SDR opening line / video narration].

Sonic rules to enforce:
- Pace target: 130-145 words per minute
- No uptalk, no filler ('basically', 'so', 'you know', 'kind of')
- Numbers as digits in data contexts
- Sentences: max 12 words for voice-first, max 20 for narration
- Tone register: [REGISTER: Command / Intelligence / Warmth]
- No exclamation energy in delivery direction

Content to cover: [PASTE BRIEFING OR TOPIC]

Output format:
1. The script (marked up with [PAUSE] markers)
2. Estimated read time at 135wpm
3. Three words that describe the intended vocal delivery`}
        />
        <PromptCard
          id="prompt-adapt-audio"
          tool="Claude"
          title="Adapt Copy for Audio Reading"
          whenToUse="Converting written content (reports, case studies, emails) for podcast, video narration, or AI voice."
          prompt={`Rewrite this written copy for audio delivery by an AI voice assistant or human narrator following Enfactum's sonic identity rules:

[PASTE WRITTEN COPY]

Transformations to apply:
- Replace all em dashes with natural pauses ([PAUSE 0.3s])
- Spell out structural signals: 'First point:', 'The implication:', rather than relying on visual layout
- Break sentences over 20 words into two
- Remove all parenthetical asides — fold them into main sentences or cut them
- Flag any [HEX VALUE] or [URL] that appears — these must be removed or replaced with a description
- Replace bullet list structure with numbered verbal callouts: 'Three signals. First:...'

Return: audio-ready script with [PAUSE] markers and estimated read time.`}
        />
      </div>
    </SectionWrapper>
  );
}

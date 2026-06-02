import { Check, X } from "lucide-react";
import { SectionWrapper, SectionHeader, Eyebrow, CopyToken } from "../SectionParts";

export function SEAMarketSection() {
  return (
    <SectionWrapper id="sea-market">
      <SectionHeader
        title={<>SEA Market <span className="text-primary">Adaptation</span></>}
        subtitle="Southeast Asia isn't one market — it's 14. This section provides specific linguistic, cultural, and technical adaptation rules for each priority market, with implementation examples."
      />

      {/* Philosophy */}
      <div className="border-l-2 border-primary bg-surface rounded-r-xl p-6 mb-10">
        <p className="text-[14px] font-medium text-foreground mb-2">Localisation Philosophy</p>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          We never "translate" — we adapt. Translation implies a 1:1 word mapping. Adaptation means understanding that a "sales funnel" metaphor doesn't exist in Thai business vocabulary, that Indonesian number formatting uses periods instead of commas, and that Vietnamese diacritical marks aren't optional decorations — they change meaning entirely.
        </p>
      </div>

      {/* Market grid */}
      <Eyebrow className="mb-2">Priority Markets — Detailed Guide</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Each market has specific requirements. This is the minimum standard for any content entering these markets.</p>
      <div className="grid grid-cols-1 gap-4 mb-10">
        {[
          { market: "Singapore", lang: "English, Mandarin, Malay, Tamil", note: "Primary HQ market. English-first for all product UI and enterprise content.", howTo: "Default language: English. Mandarin for enterprise client decks when requested. Never auto-translate — always use professional adapters.", example: "UI copy: English only. Sales deck: English with Mandarin appendix. Email: English with option to switch.", formats: "Date: DD/MM/YYYY · Currency: SGD $1,234.56 · Phone: +65 XXXX XXXX" },
          { market: "Indonesia", lang: "Bahasa Indonesia", note: "Largest market by volume. Bahasa Indonesia is mandatory for SMB content.", howTo: "All public-facing content must have Bahasa version. Enterprise content can remain English. Never romanise — use full Bahasa with correct grammar.", example: "✓ 'Dasbor Intelijen Pasar' not 'Market Intelligence Dashboard' for SMB UI", formats: "Date: DD/MM/YYYY · Currency: IDR Rp1.234.567 (period separators) · Phone: +62 XXX-XXXX-XXXX" },
          { market: "Thailand", lang: "Thai", note: "Thai script is required. Thai has no spaces between words — line breaks must be handled carefully.", howTo: "Use IBM Plex Thai or equivalent weight. Implement proper Thai word segmentation for line breaks. Test all UI with Thai text — strings expand 20-40%.", example: "✓ 'ตลาดเอเชียตะวันออกเฉียงใต้' rendered at full fidelity, never romanised as 'Talat Asia Tawan-ok Chiang Tai'", formats: "Date: DD/MM/YYYY (Buddhist calendar +543) · Currency: THB ฿1,234.56 · Phone: +66 XX XXX XXXX" },
          { market: "Vietnam", lang: "Vietnamese", note: "Full diacritical fidelity is non-negotiable. Missing marks change word meaning.", howTo: "Test all tonal marks: á à ả ã ạ ă ắ ằ ẳ ẵ ặ â ấ ầ ẩ ẫ ậ. Ensure font renders all correctly. Never strip diacritics for 'simplicity'.", example: "✓ 'Thị trường Đông Nam Á' — all 4 diacritical marks present. ✗ 'Thi truong Dong Nam A' — stripped, unacceptable.", formats: "Date: DD/MM/YYYY · Currency: VND 1.234.567 ₫ (dong symbol suffix) · Phone: +84 XXX XXX XXXX" },
          { market: "Philippines", lang: "Filipino, English", note: "Bilingual market. English for enterprise, Filipino for SMB outreach.", howTo: "Product UI: English. Marketing materials: offer both. Never mix languages mid-sentence (code-switching is acceptable in social media only).", example: "Sales deck: English with Filipino executive summary. Social post: Filipino hook, English body acceptable.", formats: "Date: MM/DD/YYYY (US-style) · Currency: PHP ₱1,234.56 · Phone: +63 XXX XXX XXXX" },
          { market: "Malaysia", lang: "Malay, English, Mandarin", note: "Trilingual complexity. Bahasa Melayu is distinct from Bahasa Indonesia.", howTo: "Never use Indonesian Bahasa interchangeably with Malaysian Malay. Different vocabulary, spelling conventions, and cultural references.", example: "✓ 'Papan pemuka' (Malay for dashboard) ✗ 'Dasbor' (Indonesian for dashboard) — these are different languages.", formats: "Date: DD/MM/YYYY · Currency: MYR RM1,234.56 · Phone: +60 XX XXXX XXXX" },
        ].map((m) => (
          <div key={m.market} className="brand-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[16px] font-bold text-foreground">{m.market}</span>
              <span className="font-mono-data text-[11px] text-muted">{m.lang}</span>
            </div>
            <p className="text-[13px] text-text-secondary mb-3">{m.note}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Eyebrow className="text-primary mb-1.5">How to Adapt</Eyebrow>
                <p className="text-[12px] text-text-secondary leading-relaxed">{m.howTo}</p>
              </div>
              <div>
                <Eyebrow className="text-brand-emerald mb-1.5">Example</Eyebrow>
                <p className="text-[12px] text-text-secondary leading-relaxed">{m.example}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <Eyebrow className="mb-1">Formatting Conventions</Eyebrow>
              <p className="text-[11px] font-mono-data text-muted">{m.formats}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Adaptation rules */}
      <Eyebrow className="mb-4">Universal Localisation Rules</Eyebrow>
      <div className="grid grid-cols-2 gap-4">
        <div className="brand-card p-5">
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-emerald mb-3 flex items-center gap-2"><Check size={14} /> Do</h4>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Render all local scripts in native form — never romanise</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Follow local number formatting (period vs comma separators)</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Support text expansion up to 40% in UI layouts</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Use local currency symbols preceding amounts</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Test with real native speakers, not just translators</li>
          </ul>
        </div>
        <div className="brand-card p-5">
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-destructive mb-3 flex items-center gap-2"><X size={14} /> Don't</h4>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never strip diacritical marks or simplify scripts</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never treat Indonesian and Malaysian as the same language</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never use "Asia-Pacific" or "APAC" — name the specific market</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never auto-translate with machine tools without human review</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never assume English comprehension for SMB-tier audiences</li>
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}

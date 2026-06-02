import { SectionWrapper, SectionHeader, Eyebrow } from "../SectionParts";

const rows = [
  "Brand Identity",
  "Color System",
  "Typography",
  "Image Generation",
  "Mood Board",
  "Voice & Tone",
];

const owner = "Ajay Mohan — ajay.mohan@enfactum.com";

export function ChangelogOwnershipSection() {
  return (
    <SectionWrapper id="changelog-ownership">
      <SectionHeader
        title={<>
          Changelog &amp; <span className="text-primary">Ownership</span>
        </>}
        subtitle="Market Grammar is a living document. The owner listed is accountable for accuracy and quarterly review."
      />

      {/* Version badge */}
      <div className="mb-6">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary">
          v1.0
        </span>
      </div>

      {/* Ownership table */}
      <div className="brand-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-elevated">
              {["Section", "Owner", "Version", "Last Reviewed", "Next Review"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono-data text-text-secondary">
            {rows.map((section) => (
              <tr key={section} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{section}</td>
                <td className="px-4 py-3">{owner}</td>
                <td className="px-4 py-3">1.0</td>
                <td className="px-4 py-3">1 Apr 2026</td>
                <td className="px-4 py-3">1 Jul 2026</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}

import { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BrandSidebar } from "@/components/BrandSidebar";
import { SearchPalette } from "@/components/SearchPalette";
import { navSections } from "@/components/navData";
import { QuickCreateSection } from "@/components/sections/QuickCreateSection";
import { BrandStorySection } from "@/components/sections/BrandStorySection";
import { LogoGuidelinesSection } from "@/components/sections/LogoGuidelinesSection";
import { ColorSystemSection } from "@/components/sections/ColorSystemSection";
import { TypographySection } from "@/components/sections/TypographySection";
import { VisualStyleSection } from "@/components/sections/VisualStyleSection";
import { MoodBoardSection } from "@/components/sections/MoodBoardSection";
import { MotionSection } from "@/components/sections/MotionSection";
import { VoiceToneSection } from "@/components/sections/VoiceToneSection";
import { LinkedInSection } from "@/components/sections/LinkedInSection";
import { PromptsImageSection } from "@/components/sections/PromptsImageSection";
import { PromptsCopySection } from "@/components/sections/PromptsCopySection";
import { PromptsDesignSection } from "@/components/sections/PromptsDesignSection";
import { PromptsDeckSection } from "@/components/sections/PromptsDeckSection";
import { PromptsComplianceSection } from "@/components/sections/PromptsComplianceSection";
import { SonicIdentitySection } from "@/components/sections/SonicIdentitySection";
import { AIComplianceSection } from "@/components/sections/AIComplianceSection";
import { EthicalAISection } from "@/components/sections/EthicalAISection";
import { ChangelogOwnershipSection } from "@/components/sections/ChangelogOwnershipSection";
import { UIComponentsSection } from "@/components/sections/UIComponentsSection";
import { DataVizSection } from "@/components/sections/DataVizSection";
import { InteractionStatesSection } from "@/components/sections/InteractionStatesSection";
import { SEAMarketSection } from "@/components/sections/SEAMarketSection";
import { PPTTemplatesSection } from "@/components/sections/PPTTemplatesSection";

const allIds = navSections.flatMap((s) => s.items.map((i) => i.id));

function BrandBookContent() {
  const [activeSection, setActiveSection] = useState(allIds[0]);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleNavigate = useCallback((id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: 0.1 }
    );

    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300" style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}>
      <BrandSidebar activeSection={activeSection} onNavigate={handleNavigate} onOpenSearch={() => setSearchOpen(true)} />
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={handleNavigate} />
      <main className="md:ml-60">
        <div className="sections-container max-w-[900px] px-4 sm:px-8 md:px-[72px] pt-16 pb-24">
          <QuickCreateSection onNavigate={handleNavigate} />
          <BrandStorySection />
          <LogoGuidelinesSection />
          <ColorSystemSection />
          <TypographySection />
          <VisualStyleSection />
          <MoodBoardSection />
          <MotionSection />
          <VoiceToneSection />
          <LinkedInSection />
          <PromptsImageSection />
          <PromptsCopySection />
          <PromptsDesignSection />
          <PromptsDeckSection />
          <PromptsComplianceSection />
          <SonicIdentitySection />
          <AIComplianceSection />
          <EthicalAISection />
          <ChangelogOwnershipSection />
          <UIComponentsSection />
          <DataVizSection />
          <InteractionStatesSection />
          <SEAMarketSection />
          <PPTTemplatesSection />
        </div>
      </main>
    </div>
  );
}

export default function Index() {
  return (
    <ThemeProvider>
      <BrandBookContent />
    </ThemeProvider>
  );
}

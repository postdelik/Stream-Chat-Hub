import { CollapsibleSection } from "./common/CollapsibleSection";

type TestOverlaySectionProps = {
  t: (key: string) => string;
  mockOverlayEnabled: boolean;
  setMockOverlayTestEnabled: (enabled: boolean) => void;
};

export function TestOverlaySection({
  t,
  mockOverlayEnabled,
  setMockOverlayTestEnabled,
}: TestOverlaySectionProps) {
  return (
    <CollapsibleSection
      title={t("testOverlay")}
      badge={mockOverlayEnabled ? t("enabled") : t("disabled")}
    >
      <label className="bigToggleField">
        <input
          type="checkbox"
          checked={mockOverlayEnabled}
          onChange={(event) => setMockOverlayTestEnabled(event.target.checked)}
        />
        <span>
          <strong>{t("enableTestOverlay")}</strong>
          <small>{t("testOverlayHint")}</small>
        </span>
      </label>

      <p className="hint">{t("testOverlayHint2")}</p>
    </CollapsibleSection>
  );
}

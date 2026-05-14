import { CollapsibleSection } from "./common/CollapsibleSection";

type ObsLinkSectionProps = {
  t: (key: string) => string;
  overlayUrl: string;
  copyStatus: string;
  copyOverlayUrl: () => void;
};

export function ObsLinkSection({
  t,
  overlayUrl,
  copyStatus,
  copyOverlayUrl,
}: ObsLinkSectionProps) {
  return (
    <CollapsibleSection title={t("obsLinkTitle")}>
      <code>{overlayUrl}</code>

      <button className="button" type="button" onClick={copyOverlayUrl}>
        {t("copyLink")}
      </button>

      {copyStatus && <p className="copyStatus">{copyStatus}</p>}

      <p className="hint">{t("obsLinkHint")}</p>
    </CollapsibleSection>
  );
}
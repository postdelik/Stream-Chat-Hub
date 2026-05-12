import { CollapsibleSection } from "./common/CollapsibleSection";

type OverlayAppearanceSectionProps = {
  t: (key: string) => string;
  overlayShowPlatformIcon: boolean;
  overlayShowAuthorName: boolean;
  overlayShowChannelName: boolean;
  overlayBackgroundOpacity: number;
  overlayBorderRadius: number;
  overlayMessageGap: number;
  setOverlayShowPlatformIcon: (value: boolean) => void;
  setOverlayShowAuthorName: (value: boolean) => void;
  setOverlayShowChannelName: (value: boolean) => void;
  setOverlayBackgroundOpacity: (value: number) => void;
  setOverlayBorderRadius: (value: number) => void;
  setOverlayMessageGap: (value: number) => void;
};

export function OverlayAppearanceSection({
  t,
  overlayShowPlatformIcon,
  overlayShowAuthorName,
  overlayShowChannelName,
  overlayBackgroundOpacity,
  overlayBorderRadius,
  overlayMessageGap,
  setOverlayShowPlatformIcon,
  setOverlayShowAuthorName,
  setOverlayShowChannelName,
  setOverlayBackgroundOpacity,
  setOverlayBorderRadius,
  setOverlayMessageGap,
}: OverlayAppearanceSectionProps) {
  return (
    <CollapsibleSection title={t("messageAppearance")}>
      <div className="toggleGroup">
        <label className="toggleField">
          <input
            type="checkbox"
            checked={overlayShowPlatformIcon}
            onChange={(event) => setOverlayShowPlatformIcon(event.target.checked)}
          />
          <span>{t("showPlatformIcon")}</span>
        </label>

        <label className="toggleField">
          <input
            type="checkbox"
            checked={overlayShowAuthorName}
            onChange={(event) => setOverlayShowAuthorName(event.target.checked)}
          />
          <span>{t("showAuthorName")}</span>
        </label>

        <label className="toggleField">
          <input
            type="checkbox"
            checked={overlayShowChannelName}
            onChange={(event) => setOverlayShowChannelName(event.target.checked)}
          />
          <span>{t("showChannelName")}</span>
        </label>
      </div>

      <div className="fieldGroup">
        <label className="field">
          <span>
            {t("backgroundOpacity")}: {overlayBackgroundOpacity}%
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={overlayBackgroundOpacity}
            onChange={(event) =>
              setOverlayBackgroundOpacity(Number(event.target.value))
            }
          />
        </label>

        <label className="field">
          <span>
            {t("borderRadius")}: {overlayBorderRadius}px
          </span>
          <input
            type="range"
            min="0"
            max="60"
            value={overlayBorderRadius}
            onChange={(event) => setOverlayBorderRadius(Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>
            {t("messageGap")}: {overlayMessageGap}px
          </span>
          <input
            type="range"
            min="0"
            max="40"
            value={overlayMessageGap}
            onChange={(event) => setOverlayMessageGap(Number(event.target.value))}
          />
        </label>
      </div>
    </CollapsibleSection>
  );
}

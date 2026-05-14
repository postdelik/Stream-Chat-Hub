import type { OverlayPosition } from "../../shared/types";
import { CollapsibleSection } from "./common/CollapsibleSection";

type OverlayPreset = "compact" | "standard" | "large" | "textOnly";

type OverlaySettingsSectionProps = {
  t: (key: string) => string;
  overlayWidth: number;
  overlayHeight: number;
  overlayFontSize: number;
  overlayChatWidth: number;
  overlayMaxMessages: number;
  overlayPosition: OverlayPosition;
  setOverlayWidth: (value: number) => void;
  setOverlayHeight: (value: number) => void;
  setOverlayFontSize: (value: number) => void;
  setOverlayChatWidth: (value: number) => void;
  setOverlayMaxMessages: (value: number) => void;
  setOverlayPosition: (value: OverlayPosition) => void;
  applyOverlayPreset: (preset: OverlayPreset) => void;
};

export function OverlaySettingsSection({
  t,
  overlayWidth,
  overlayHeight,
  overlayFontSize,
  overlayChatWidth,
  overlayMaxMessages,
  overlayPosition,
  setOverlayWidth,
  setOverlayHeight,
  setOverlayFontSize,
  setOverlayChatWidth,
  setOverlayMaxMessages,
  setOverlayPosition,
  applyOverlayPreset,
}: OverlaySettingsSectionProps) {
  return (
    <CollapsibleSection
      title={t("obsOverlay")}
      badge={`${overlayWidth}×${overlayHeight}`}
    >
      <p className="hint">{t("quickPresetsHint")}</p>

      <div className="buttonRow">
        <button
          className="button ghostButton"
          type="button"
          onClick={() => applyOverlayPreset("compact")}
        >
          {t("compact")}
        </button>

        <button
          className="button ghostButton"
          type="button"
          onClick={() => applyOverlayPreset("standard")}
        >
          {t("standard")}
        </button>
      </div>

      <div className="buttonRow">
        <button
          className="button ghostButton"
          type="button"
          onClick={() => applyOverlayPreset("large")}
        >
          {t("large")}
        </button>

        <button
          className="button ghostButton"
          type="button"
          onClick={() => applyOverlayPreset("textOnly")}
        >
          {t("textOnly")}
        </button>
      </div>

      <div className="fieldGroup">
        <label className="field">
          <span>{t("obsWidth")}</span>
          <input
            type="number"
            min="100"
            value={overlayWidth}
            onChange={(event) => setOverlayWidth(Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>{t("obsHeight")}</span>
          <input
            type="number"
            min="100"
            value={overlayHeight}
            onChange={(event) => setOverlayHeight(Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>{t("fontSize")}</span>
          <input
            type="number"
            min="10"
            max="120"
            value={overlayFontSize}
            onChange={(event) => setOverlayFontSize(Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>{t("chatBlockWidth")}</span>
          <input
            type="number"
            min="200"
            max="3000"
            value={overlayChatWidth}
            onChange={(event) => setOverlayChatWidth(Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>{t("messagesOnScreen")}</span>
          <input
            type="number"
            min="1"
            max="100"
            value={overlayMaxMessages}
            onChange={(event) => setOverlayMaxMessages(Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>{t("position")}</span>
          <select
            value={overlayPosition}
            onChange={(event) =>
              setOverlayPosition(event.target.value as OverlayPosition)
            }
          >
            <option value="left">{t("leftBottom")}</option>
            <option value="center">{t("centerBottom")}</option>
            <option value="right">{t("rightBottom")}</option>
          </select>
        </label>
      </div>
    </CollapsibleSection>
    
  );
  
}
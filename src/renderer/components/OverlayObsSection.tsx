import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type {
  OverlayBubbleMediaType,
  OverlayPosition,
  OverlayStyleMode,
  UploadedOverlayAsset,
} from "../../shared/types";
import { CollapsibleSection } from "./common/CollapsibleSection";
import { SystemFontPickerModal } from "./SystemFontPickerModal";

export type OverlayPreset = "compact" | "standard" | "textOnly" | "custom";

type OverlayObsSectionProps = {
  t: (key: string) => string;
  activePreset: OverlayPreset;

  overlayWidth: number;
  overlayHeight: number;
  overlayFontSize: number;
  overlayFontFamily: string;
  overlayChatWidth: number;
  overlayMaxMessages: number;
  overlayPosition: OverlayPosition;

  overlayShowPlatformIcon: boolean;
  overlayShowAuthorName: boolean;
  overlayShowChannelName: boolean;

  overlayBackgroundOpacity: number;
  overlayBackgroundColor: string;
  overlayBorderRadius: number;
  overlayMessageGap: number;

  overlayStyleMode: OverlayStyleMode;
  overlayBubbleMediaUrl: string;
  overlayBubbleMediaType: OverlayBubbleMediaType;
  overlayAssetUploadStatus: string;

  availableFonts: string[];

  overlayUrl: string;
  copyStatus: string;
  mockOverlayEnabled: boolean;

  setOverlayWidth: Dispatch<SetStateAction<number>>;
  setOverlayHeight: Dispatch<SetStateAction<number>>;
  setOverlayFontSize: Dispatch<SetStateAction<number>>;
  setOverlayFontFamily: Dispatch<SetStateAction<string>>;
  setOverlayChatWidth: Dispatch<SetStateAction<number>>;
  setOverlayMaxMessages: Dispatch<SetStateAction<number>>;
  setOverlayPosition: Dispatch<SetStateAction<OverlayPosition>>;

  setOverlayShowPlatformIcon: Dispatch<SetStateAction<boolean>>;
  setOverlayShowAuthorName: Dispatch<SetStateAction<boolean>>;
  setOverlayShowChannelName: Dispatch<SetStateAction<boolean>>;

  setOverlayBackgroundOpacity: Dispatch<SetStateAction<number>>;
  setOverlayBackgroundColor: Dispatch<SetStateAction<string>>;
  setOverlayBorderRadius: Dispatch<SetStateAction<number>>;
  setOverlayMessageGap: Dispatch<SetStateAction<number>>;

  setOverlayStyleMode: Dispatch<SetStateAction<OverlayStyleMode>>;
  setOverlayBubbleMediaUrl: Dispatch<SetStateAction<string>>;
  setOverlayBubbleMediaType: Dispatch<SetStateAction<OverlayBubbleMediaType>>;
  setOverlayAssetUploadStatus: Dispatch<SetStateAction<string>>;

  applyOverlayPreset: (preset: Exclude<OverlayPreset, "custom">) => void;
  markOverlayCustom: () => void;
  copyOverlayUrl: () => void;
  setMockOverlayTestEnabled: (enabled: boolean) => void;
};

const fallbackFonts = [
  "Inter, Arial, sans-serif",
  "Arial, sans-serif",
  "Segoe UI, sans-serif",
  "Verdana, sans-serif",
  "Tahoma, sans-serif",
  "Georgia, serif",
  "Times New Roman, serif",
  "Courier New, monospace",
];

function getDisplayFontName(fontFamily: string) {
  return fontFamily
    .replace(/,\s*sans-serif$/i, "")
    .replace(/,\s*serif$/i, "")
    .replace(/,\s*monospace$/i, "")
    .replace(/^["']|["']$/g, "");
}

export function OverlayObsSection({
  t,
  activePreset,
  overlayWidth,
  overlayHeight,
  overlayFontSize,
  overlayFontFamily,
  overlayChatWidth,
  overlayMaxMessages,
  overlayPosition,
  overlayShowPlatformIcon,
  overlayShowAuthorName,
  overlayShowChannelName,
  overlayBackgroundOpacity,
  overlayBackgroundColor,
  overlayBorderRadius,
  overlayMessageGap,
  overlayStyleMode,
  overlayBubbleMediaUrl,
  overlayBubbleMediaType,
  overlayAssetUploadStatus,
  availableFonts,
  overlayUrl,
  copyStatus,
  mockOverlayEnabled,
  setOverlayWidth,
  setOverlayHeight,
  setOverlayFontSize,
  setOverlayFontFamily,
  setOverlayChatWidth,
  setOverlayMaxMessages,
  setOverlayPosition,
  setOverlayShowPlatformIcon,
  setOverlayShowAuthorName,
  setOverlayShowChannelName,
  setOverlayBackgroundOpacity,
  setOverlayBackgroundColor,
  setOverlayBorderRadius,
  setOverlayMessageGap,
  setOverlayStyleMode,
  setOverlayBubbleMediaUrl,
  setOverlayBubbleMediaType,
  setOverlayAssetUploadStatus,
  applyOverlayPreset,
  markOverlayCustom,
  copyOverlayUrl,
  setMockOverlayTestEnabled,
}: OverlayObsSectionProps) {
  const [fontPickerOpen, setFontPickerOpen] = useState(false);

  const fonts = useMemo(
    () => (availableFonts.length > 0 ? availableFonts : fallbackFonts),
    [availableFonts]
  );

  const showColorSettings = overlayStyleMode === "color";
  const showBubbleUpload =
    overlayStyleMode === "containerBubble" ||
    overlayStyleMode === "messageBubble";

  function updateNumber(
    setter: Dispatch<SetStateAction<number>>,
    value: number
  ) {
    setter(value);
    markOverlayCustom();
  }

  function updateBoolean(
    setter: Dispatch<SetStateAction<boolean>>,
    value: boolean
  ) {
    setter(value);
    markOverlayCustom();
  }

  async function uploadOverlayAsset(file: File) {
    try {
      setOverlayAssetUploadStatus(t("uploadingStyle"));

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:3877/overlay-assets/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as UploadedOverlayAsset;

      if (!response.ok || !data.ok) {
        setOverlayAssetUploadStatus(data.error || t("styleUploadFailed"));
        return;
      }

      setOverlayBubbleMediaUrl(data.url);
      setOverlayBubbleMediaType(data.mediaType);
      markOverlayCustom();
      setOverlayAssetUploadStatus(t("styleUploaded"));
    } catch {
      setOverlayAssetUploadStatus(t("styleUploadFailed"));
    }
  }

  function clearOverlayAsset() {
    setOverlayBubbleMediaUrl("");
    setOverlayBubbleMediaType("none");
    markOverlayCustom();
    setOverlayAssetUploadStatus(t("styleCleared"));
  }

  const presetButtons: Array<{
    id: OverlayPreset;
    label: string;
  }> = [
    { id: "compact", label: t("compact") },
    { id: "standard", label: t("standard") },
    { id: "textOnly", label: t("textOnly") },
    { id: "custom", label: t("customPreset") },
  ];

  return (
    <>
      <CollapsibleSection
        title={t("overlayObsTitle")}
        badge={`${overlayWidth}×${overlayHeight}`}
        tourId="tour-overlay-obs"
      >
        <div className="presetGrid">
          {presetButtons.map((preset) => (
            <button
              className={
                activePreset === preset.id
                  ? "presetButton active"
                  : "presetButton"
              }
              type="button"
              key={preset.id}
              disabled={preset.id === "custom"}
              onClick={() => {
                if (preset.id !== "custom") {
                  applyOverlayPreset(preset.id);
                }
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="fieldGroup overlayControlGroup">
          <div className="twoColumnFields">
            <label className="field">
              <span>{t("obsWidth")}</span>
              <input
                type="number"
                min={100}
                max={5000}
                value={overlayWidth}
                onChange={(event) =>
                  updateNumber(setOverlayWidth, Number(event.target.value))
                }
              />
            </label>

            <label className="field">
              <span>{t("obsHeight")}</span>
              <input
                type="number"
                min={100}
                max={5000}
                value={overlayHeight}
                onChange={(event) =>
                  updateNumber(setOverlayHeight, Number(event.target.value))
                }
              />
            </label>
          </div>

          <label className="rangeField">
            <div className="rangeFieldHeader">
              <span>{t("fontSize")}</span>
              <strong>{overlayFontSize} px</strong>
            </div>
            <input
              className="themedRange"
              type="range"
              min={10}
              max={120}
              step={1}
              value={overlayFontSize}
              onChange={(event) =>
                updateNumber(setOverlayFontSize, Number(event.target.value))
              }
            />
            <div className="rangeFieldScale">
              <span>10 px</span>
              <span>120 px</span>
            </div>
          </label>

          <label className="rangeField">
            <div className="rangeFieldHeader">
              <span>{t("chatBlockWidth")}</span>
              <strong>{overlayChatWidth} px</strong>
            </div>
            <input
              className="themedRange"
              type="range"
              min={200}
              max={3000}
              step={10}
              value={overlayChatWidth}
              onChange={(event) =>
                updateNumber(setOverlayChatWidth, Number(event.target.value))
              }
            />
            <div className="rangeFieldScale">
              <span>200 px</span>
              <span>3000 px</span>
            </div>
          </label>

          <label className="rangeField">
            <div className="rangeFieldHeader">
              <span>{t("messagesOnScreen")}</span>
              <strong>{overlayMaxMessages}</strong>
            </div>
            <input
              className="themedRange"
              type="range"
              min={1}
              max={100}
              step={1}
              value={overlayMaxMessages}
              onChange={(event) =>
                updateNumber(setOverlayMaxMessages, Number(event.target.value))
              }
            />
            <div className="rangeFieldScale">
              <span>1</span>
              <span>100</span>
            </div>
          </label>

          <label className="field">
            <span>{t("position")}</span>
            <select
              value={overlayPosition}
              onChange={(event) => {
                setOverlayPosition(event.target.value as OverlayPosition);
                markOverlayCustom();
              }}
            >
              <option value="left">{t("leftBottom")}</option>
              <option value="center">{t("centerBottom")}</option>
              <option value="right">{t("rightBottom")}</option>
            </select>
          </label>
        </div>

        <div className="sectionDivider" />

        <div className="segmentedArrowTabs" aria-label={t("styleMode")}>
          {(
            [
              ["color", t("styleModeColor")],
              ["containerBubble", t("styleModeContainerBubble")],
              ["messageBubble", t("styleModeMessageBubble")],
            ] as const
          ).map(([mode, label]) => (
            <button
              className={overlayStyleMode === mode ? "arrowTab active" : "arrowTab"}
              type="button"
              key={mode}
              onClick={() => {
                setOverlayStyleMode(mode);
                markOverlayCustom();
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="toggleGroup">
          <label className="toggleField">
            <input
              type="checkbox"
              checked={overlayShowPlatformIcon}
              onChange={(event) =>
                updateBoolean(setOverlayShowPlatformIcon, event.target.checked)
              }
            />
            <span>{t("showPlatformIcon")}</span>
          </label>

          <label className="toggleField">
            <input
              type="checkbox"
              checked={overlayShowChannelName}
              onChange={(event) =>
                updateBoolean(setOverlayShowChannelName, event.target.checked)
              }
            />
            <span>{t("showChannelName")}</span>
          </label>

          <label className="toggleField">
            <input
              type="checkbox"
              checked={overlayShowAuthorName}
              onChange={(event) =>
                updateBoolean(setOverlayShowAuthorName, event.target.checked)
              }
            />
            <span>{t("showAuthorName")}</span>
          </label>
        </div>

        <div className="fieldGroup">
          <div className="fontSelectorField">
            <span className="fontSelectorLabel">{t("messageFont")}</span>
            <button
              className="fontSelectorButton"
              type="button"
              onClick={() => setFontPickerOpen(true)}
            >
              <span
                className="fontSelectorPreview"
                style={{ fontFamily: overlayFontFamily }}
              >
                {getDisplayFontName(overlayFontFamily)}
              </span>
              <strong>{t("chooseSystemFont")}</strong>
            </button>
          </div>

          {showColorSettings && (
            <label className="field">
              <span>{t("backgroundColor")}</span>
              <div className="colorPickerRow">
                <input
                  type="text"
                  value={overlayBackgroundColor}
                  onChange={(event) => {
                    setOverlayBackgroundColor(event.target.value);
                    markOverlayCustom();
                  }}
                />
                <label
                  className="colorDot"
                  style={{ backgroundColor: overlayBackgroundColor }}
                >
                  <input
                    type="color"
                    value={overlayBackgroundColor}
                    onChange={(event) => {
                      setOverlayBackgroundColor(event.target.value);
                      markOverlayCustom();
                    }}
                  />
                </label>
              </div>
            </label>
          )}

          <label className="rangeField">
            <div className="rangeFieldHeader">
              <span>{t("backgroundOpacity")}</span>
              <strong>{overlayBackgroundOpacity}%</strong>
            </div>
            <input
              className="themedRange"
              type="range"
              min={0}
              max={100}
              step={1}
              value={overlayBackgroundOpacity}
              onChange={(event) =>
                updateNumber(
                  setOverlayBackgroundOpacity,
                  Number(event.target.value)
                )
              }
            />
            <div className="rangeFieldScale">
              <span>0%</span>
              <span>100%</span>
            </div>
          </label>

          <label className="rangeField">
            <div className="rangeFieldHeader">
              <span>{t("borderRadius")}</span>
              <strong>{overlayBorderRadius} px</strong>
            </div>
            <input
              className="themedRange"
              type="range"
              min={0}
              max={60}
              step={1}
              value={overlayBorderRadius}
              onChange={(event) =>
                updateNumber(setOverlayBorderRadius, Number(event.target.value))
              }
            />
            <div className="rangeFieldScale">
              <span>0 px</span>
              <span>60 px</span>
            </div>
          </label>

          <label className="rangeField">
            <div className="rangeFieldHeader">
              <span>{t("messageGap")}</span>
              <strong>{overlayMessageGap} px</strong>
            </div>
            <input
              className="themedRange"
              type="range"
              min={0}
              max={40}
              step={1}
              value={overlayMessageGap}
              onChange={(event) =>
                updateNumber(setOverlayMessageGap, Number(event.target.value))
              }
            />
            <div className="rangeFieldScale">
              <span>0 px</span>
              <span>40 px</span>
            </div>
          </label>

          {showBubbleUpload && (
            <div className="styleUploadBox">
              <div className="tabIntro">
                <strong>{t("styleFileTitle")}</strong>
                <small>
                  {overlayStyleMode === "containerBubble"
                    ? t("styleSizeHintContainer")
                    : t("styleSizeHintMessage")}
                </small>
              </div>

              <label className="fileUploadButton">
                <input
                  type="file"
                  accept=".png,.webp,.gif,.mp4,.webm,.mov,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadOverlayAsset(file);
                    event.currentTarget.value = "";
                  }}
                />
                <span>{t("chooseStyleFile")}</span>
              </label>

              {overlayBubbleMediaUrl && (
                <div className="stylePreviewBox">
                  <div className="stylePreview">
                    {overlayBubbleMediaType === "video" ? (
                      <video
                        src={overlayBubbleMediaUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img src={overlayBubbleMediaUrl} alt="" />
                    )}
                  </div>

                  <button
                    className="smallButton secondaryButton"
                    type="button"
                    onClick={clearOverlayAsset}
                  >
                    {t("clearStyleFile")}
                  </button>
                </div>
              )}

              {overlayAssetUploadStatus && (
                <p className="copyStatus">{overlayAssetUploadStatus}</p>
              )}
            </div>
          )}
        </div>

        <div className="sectionDivider" />

        <div className="tourObsLinkTestBlock" data-tour-id="tour-obs-link-test">
        <div className="obsLinkInline">
          <span>{t("obsLink")}</span>
          <code>{overlayUrl}</code>
          <button className="button" type="button" onClick={copyOverlayUrl}>
            {t("copyLink")}
          </button>
          {copyStatus && <p className="copyStatus">{copyStatus}</p>}
        </div>

        <label className="switchField testLayoutSwitch">
          <span>{t("testOverlay")}</span>
          <input
            type="checkbox"
            checked={mockOverlayEnabled}
            onChange={(event) =>
              setMockOverlayTestEnabled(event.target.checked)
            }
          />
          <span className="switchSlider" />
        </label>
        </div>
      </CollapsibleSection>

      <SystemFontPickerModal
        open={fontPickerOpen}
        t={t}
        currentFont={overlayFontFamily}
        fallbackFonts={fonts}
        onSelect={(font) => {
          setOverlayFontFamily(font);
          markOverlayCustom();
        }}
        onClose={() => setFontPickerOpen(false)}
      />
    </>
  );
}

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type {
  OverlayBubbleMediaType,
  OverlayStyleMode,
  UploadedOverlayAsset,
} from "../../shared/types";
import { CollapsibleSection } from "./common/CollapsibleSection";
import { SystemFontPickerModal } from "./SystemFontPickerModal";

type OverlayAppearanceSectionProps = {
  t: (key: string) => string;

  overlayShowPlatformIcon: boolean;
  overlayShowAuthorName: boolean;
  overlayShowChannelName: boolean;
  overlayShowStyleInApp: boolean;

  overlayBackgroundOpacity: number;
  overlayBackgroundColor: string;
  overlayBorderRadius: number;
  overlayMessageGap: number;

  overlayStyleMode: OverlayStyleMode;
  overlayBubbleMediaUrl: string;
  overlayBubbleMediaType: OverlayBubbleMediaType;

  overlayFontFamily: string;
  availableFonts: string[];

  overlayAssetUploadStatus: string;

  setOverlayShowPlatformIcon: Dispatch<SetStateAction<boolean>>;
  setOverlayShowAuthorName: Dispatch<SetStateAction<boolean>>;
  setOverlayShowChannelName: Dispatch<SetStateAction<boolean>>;
  setOverlayShowStyleInApp: Dispatch<SetStateAction<boolean>>;

  setOverlayBackgroundOpacity: Dispatch<SetStateAction<number>>;
  setOverlayBackgroundColor: Dispatch<SetStateAction<string>>;
  setOverlayBorderRadius: Dispatch<SetStateAction<number>>;
  setOverlayMessageGap: Dispatch<SetStateAction<number>>;

  setOverlayStyleMode: Dispatch<SetStateAction<OverlayStyleMode>>;
  setOverlayBubbleMediaUrl: Dispatch<SetStateAction<string>>;
  setOverlayBubbleMediaType: Dispatch<SetStateAction<OverlayBubbleMediaType>>;

  setOverlayFontFamily: Dispatch<SetStateAction<string>>;
  setOverlayAssetUploadStatus: Dispatch<SetStateAction<string>>;
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

export function OverlayAppearanceSection({
  t,

  overlayShowPlatformIcon,
  overlayShowAuthorName,
  overlayShowChannelName,
  overlayShowStyleInApp,

  overlayBackgroundOpacity,
  overlayBackgroundColor,
  overlayBorderRadius,
  overlayMessageGap,

  overlayStyleMode,
  overlayBubbleMediaUrl,
  overlayBubbleMediaType,

  overlayFontFamily,
  availableFonts,

  overlayAssetUploadStatus,

  setOverlayShowPlatformIcon,
  setOverlayShowAuthorName,
  setOverlayShowChannelName,
  setOverlayShowStyleInApp,

  setOverlayBackgroundOpacity,
  setOverlayBackgroundColor,
  setOverlayBorderRadius,
  setOverlayMessageGap,

  setOverlayStyleMode,
  setOverlayBubbleMediaUrl,
  setOverlayBubbleMediaType,

  setOverlayFontFamily,
  setOverlayAssetUploadStatus,
}: OverlayAppearanceSectionProps) {
  const [fontPickerOpen, setFontPickerOpen] = useState(false);

  const fonts = useMemo(
    () => (availableFonts.length > 0 ? availableFonts : fallbackFonts),
    [availableFonts]
  );

  const showColorSettings = overlayStyleMode === "color";

  const showBubbleUpload =
    overlayStyleMode === "containerBubble" ||
    overlayStyleMode === "messageBubble";

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
      setOverlayAssetUploadStatus(t("styleUploaded"));
    } catch {
      setOverlayAssetUploadStatus(t("styleUploadFailed"));
    }
  }

  function clearOverlayAsset() {
    setOverlayBubbleMediaUrl("");
    setOverlayBubbleMediaType("none");
    setOverlayAssetUploadStatus(t("styleCleared"));
  }

  return (
    <>
      <CollapsibleSection title={t("overlayAppearanceTitle")}>
        <div className="segmentedArrowTabs" aria-label={t("styleMode")}>
          <button
            className={overlayStyleMode === "color" ? "arrowTab active" : "arrowTab"}
            type="button"
            onClick={() => setOverlayStyleMode("color")}
          >
            {t("styleModeColor")}
          </button>

          <button
            className={
              overlayStyleMode === "containerBubble"
                ? "arrowTab active"
                : "arrowTab"
            }
            type="button"
            onClick={() => setOverlayStyleMode("containerBubble")}
          >
            {t("styleModeContainerBubble")}
          </button>

          <button
            className={
              overlayStyleMode === "messageBubble"
                ? "arrowTab active"
                : "arrowTab"
            }
            type="button"
            onClick={() => setOverlayStyleMode("messageBubble")}
          >
            {t("styleModeMessageBubble")}
          </button>
        </div>

        <div className="toggleGroup">
          <label className="toggleField">
            <input
              type="checkbox"
              checked={overlayShowPlatformIcon}
              onChange={(event) =>
                setOverlayShowPlatformIcon(event.target.checked)
              }
            />
            <span>{t("showPlatformIcon")}</span>
          </label>

          <label className="toggleField">
            <input
              type="checkbox"
              checked={overlayShowChannelName}
              onChange={(event) =>
                setOverlayShowChannelName(event.target.checked)
              }
            />
            <span>{t("showChannelName")}</span>
          </label>

          <label className="toggleField">
            <input
              type="checkbox"
              checked={overlayShowAuthorName}
              onChange={(event) =>
                setOverlayShowAuthorName(event.target.checked)
              }
            />
            <span>{t("showAuthorName")}</span>
          </label>

          <label className="toggleField">
            <input
              type="checkbox"
              checked={overlayShowStyleInApp}
              onChange={(event) =>
                setOverlayShowStyleInApp(event.target.checked)
              }
            />
            <span>{t("showStyleInApp")}</span>
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
                  placeholder="#000000"
                  onChange={(event) =>
                    setOverlayBackgroundColor(event.target.value)
                  }
                />

                <label
                  className="colorDot"
                  style={{ backgroundColor: overlayBackgroundColor }}
                  title={t("backgroundColor")}
                >
                  <input
                    type="color"
                    value={overlayBackgroundColor}
                    onChange={(event) =>
                      setOverlayBackgroundColor(event.target.value)
                    }
                  />
                </label>
              </div>
            </label>
          )}

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

                    if (file) {
                      void uploadOverlayAsset(file);
                    }

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

          <label className="field">
            <span>{t("backgroundOpacity")}</span>
            <input
              type="number"
              min={0}
              max={100}
              value={overlayBackgroundOpacity}
              onChange={(event) =>
                setOverlayBackgroundOpacity(Number(event.target.value))
              }
            />
          </label>

          <label className="field">
            <span>{t("borderRadius")}</span>
            <input
              type="number"
              min={0}
              max={60}
              value={overlayBorderRadius}
              onChange={(event) =>
                setOverlayBorderRadius(Number(event.target.value))
              }
            />
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
                setOverlayMessageGap(Number(event.target.value))
              }
            />

            <div className="rangeFieldScale">
              <span>0 px</span>
              <span>40 px</span>
            </div>
          </label>
        </div>
      </CollapsibleSection>

      <SystemFontPickerModal
        open={fontPickerOpen}
        t={t}
        currentFont={overlayFontFamily}
        fallbackFonts={fonts}
        onSelect={setOverlayFontFamily}
        onClose={() => setFontPickerOpen(false)}
      />
    </>
  );
}

import { useMemo, useState } from "react";
import type {
  AppChatAppearanceSettings,
  OverlaySettings,
} from "../../shared/types";
import { CollapsibleSection } from "./common/CollapsibleSection";
import { SystemFontPickerModal } from "./SystemFontPickerModal";

type AppAppearanceSectionProps = {
  t: (key: string) => string;
  settings: AppChatAppearanceSettings;
  overlaySettings: OverlaySettings;
  availableFonts: string[];
  onChange: (settings: AppChatAppearanceSettings) => void;
};

function getDisplayFontName(fontFamily: string) {
  return fontFamily
    .replace(/,\s*sans-serif$/i, "")
    .replace(/,\s*serif$/i, "")
    .replace(/,\s*monospace$/i, "")
    .replace(/^["']|["']$/g, "");
}

export function AppAppearanceSection({
  t,
  settings,
  overlaySettings,
  availableFonts,
  onChange,
}: AppAppearanceSectionProps) {
  const [fontPickerOpen, setFontPickerOpen] = useState(false);

  const effectiveSettings = useMemo<AppChatAppearanceSettings>(() => {
    if (!settings.useOverlaySettings) {
      return settings;
    }

    return {
      useOverlaySettings: true,
      fontSize: overlaySettings.fontSize,
      fontFamily: overlaySettings.fontFamily,
      messageGap: overlaySettings.messageGap,
      backgroundOpacity: overlaySettings.backgroundOpacity,
      backgroundColor: overlaySettings.backgroundColor,
      borderRadius: overlaySettings.borderRadius,
      showPlatformIcon: overlaySettings.showPlatformIcon,
      showChannelName: overlaySettings.showChannelName,
      showAuthorName: overlaySettings.showAuthorName,
    };
  }, [settings, overlaySettings]);

  function patch(value: Partial<AppChatAppearanceSettings>) {
    onChange({
      ...settings,
      ...value,
    });
  }

  return (
    <>
      <CollapsibleSection title={t("appAppearanceTitle")} tourId="tour-app-appearance">
        <label className="switchField">
          <span>{t("useOverlaySettingsInApp")}</span>
          <input
            type="checkbox"
            checked={settings.useOverlaySettings}
            onChange={(event) =>
              patch({ useOverlaySettings: event.target.checked })
            }
          />
          <span className="switchSlider" />
        </label>

        <p className="hint">{t("useOverlaySettingsInAppHint")}</p>

        {!settings.useOverlaySettings && (
          <div className="fieldGroup appAppearanceCustomFields">
            <div className="fontSelectorField">
              <span className="fontSelectorLabel">{t("messageFont")}</span>
              <button
                className="fontSelectorButton"
                type="button"
                onClick={() => setFontPickerOpen(true)}
              >
                <span
                  className="fontSelectorPreview"
                  style={{ fontFamily: settings.fontFamily }}
                >
                  {getDisplayFontName(settings.fontFamily)}
                </span>
                <strong>{t("chooseSystemFont")}</strong>
              </button>
            </div>

            <label className="rangeField">
              <div className="rangeFieldHeader">
                <span>{t("fontSize")}</span>
                <strong>{settings.fontSize} px</strong>
              </div>
              <input
                className="themedRange"
                type="range"
                min={10}
                max={120}
                step={1}
                value={settings.fontSize}
                onChange={(event) =>
                  patch({ fontSize: Number(event.target.value) })
                }
              />
            </label>

            <label className="rangeField">
              <div className="rangeFieldHeader">
                <span>{t("messageGap")}</span>
                <strong>{settings.messageGap} px</strong>
              </div>
              <input
                className="themedRange"
                type="range"
                min={0}
                max={40}
                step={1}
                value={settings.messageGap}
                onChange={(event) =>
                  patch({ messageGap: Number(event.target.value) })
                }
              />
            </label>

            <label className="field">
              <span>{t("backgroundColor")}</span>
              <div className="colorPickerRow">
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(event) =>
                    patch({ backgroundColor: event.target.value })
                  }
                />
                <label
                  className="colorDot"
                  style={{ backgroundColor: settings.backgroundColor }}
                >
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(event) =>
                      patch({ backgroundColor: event.target.value })
                    }
                  />
                </label>
              </div>
            </label>

            <label className="rangeField">
              <div className="rangeFieldHeader">
                <span>{t("backgroundOpacity")}</span>
                <strong>{settings.backgroundOpacity}%</strong>
              </div>
              <input
                className="themedRange"
                type="range"
                min={0}
                max={100}
                step={1}
                value={settings.backgroundOpacity}
                onChange={(event) =>
                  patch({ backgroundOpacity: Number(event.target.value) })
                }
              />
            </label>

            <label className="rangeField">
              <div className="rangeFieldHeader">
                <span>{t("borderRadius")}</span>
                <strong>{settings.borderRadius} px</strong>
              </div>
              <input
                className="themedRange"
                type="range"
                min={0}
                max={60}
                step={1}
                value={settings.borderRadius}
                onChange={(event) =>
                  patch({ borderRadius: Number(event.target.value) })
                }
              />
            </label>

            <div className="toggleGroup">
              <label className="toggleField">
                <input
                  type="checkbox"
                  checked={settings.showPlatformIcon}
                  onChange={(event) =>
                    patch({ showPlatformIcon: event.target.checked })
                  }
                />
                <span>{t("showPlatformIcon")}</span>
              </label>

              <label className="toggleField">
                <input
                  type="checkbox"
                  checked={settings.showChannelName}
                  onChange={(event) =>
                    patch({ showChannelName: event.target.checked })
                  }
                />
                <span>{t("showChannelName")}</span>
              </label>

              <label className="toggleField">
                <input
                  type="checkbox"
                  checked={settings.showAuthorName}
                  onChange={(event) =>
                    patch({ showAuthorName: event.target.checked })
                  }
                />
                <span>{t("showAuthorName")}</span>
              </label>
            </div>
          </div>
        )}

        {settings.useOverlaySettings && (
          <div className="inheritedSettingsSummary">
            <span>{t("messageFont")}</span>
            <strong>{getDisplayFontName(effectiveSettings.fontFamily)}</strong>
            <span>{t("fontSize")}</span>
            <strong>{effectiveSettings.fontSize} px</strong>
            <span>{t("messageGap")}</span>
            <strong>{effectiveSettings.messageGap} px</strong>
          </div>
        )}
      </CollapsibleSection>

      <SystemFontPickerModal
        open={fontPickerOpen}
        t={t}
        currentFont={settings.fontFamily}
        fallbackFonts={availableFonts}
        onSelect={(fontFamily) => patch({ fontFamily })}
        onClose={() => setFontPickerOpen(false)}
      />
    </>
  );
}

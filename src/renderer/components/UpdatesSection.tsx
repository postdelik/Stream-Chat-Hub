import type { UpdateCheckResult, UpdateSettings } from "../../shared/types";
import { CollapsibleSection } from "./common/CollapsibleSection";

type UpdatesSectionProps = {
  t: (key: string) => string;
  updateStatus: UpdateCheckResult | null;
  updateSettings: UpdateSettings;
  checkingUpdates: boolean;
  installingUpdate: boolean;
  checkUpdates: (force?: boolean) => void;
  setAutoCheckUpdates: (enabled: boolean) => void;
};

export function UpdatesSection({
  t,
  updateStatus,
  updateSettings,
  checkingUpdates,
  installingUpdate,
  checkUpdates,
  setAutoCheckUpdates,
}: UpdatesSectionProps) {
  const badge = updateSettings.autoCheckEnabled
    ? t("updatesEnabledBadge")
    : t("updatesDisabledBadge");

  return (
    <CollapsibleSection title={t("updatesTitle")} badge={badge}>
      <div className="updatesBox">
        <label className="switchField">
  <span>{t("autoCheckUpdates")}</span>

  <input
    type="checkbox"
    checked={updateSettings.autoCheckEnabled}
    onChange={(event) => setAutoCheckUpdates(event.target.checked)}
    disabled={installingUpdate}
  />

  <span className="switchSlider" />
</label>

        {!updateSettings.autoCheckEnabled && (
          <p className="hint">{t("autoUpdatesDisabledHint")}</p>
        )}

        {updateStatus && (
          <div className="updateVersionGrid">
            <span>{t("currentVersion")}</span>
            <strong>{updateStatus.currentVersion}</strong>

            <span>{t("latestVersion")}</span>
            <strong>{updateStatus.latestVersion || "—"}</strong>
          </div>
        )}

        {!updateStatus && (
          <p className="hint">
            {checkingUpdates ? t("checkingUpdates") : t("updatesNotChecked")}
          </p>
        )}

        {updateStatus?.updateAvailable && (
          <p className="updateGood">{t("newVersionAvailable")}</p>
        )}

        {updateStatus && !updateStatus.updateAvailable && !updateStatus.error && (
          <p className="hint">{t("appIsUpToDate")}</p>
        )}

        {updateStatus?.error && (
          <p className="copyStatus">{updateStatus.error}</p>
        )}

        <div className="buttonRow">
          <button
            className="button secondaryButton"
            type="button"
            onClick={() => checkUpdates(true)}
            disabled={checkingUpdates || installingUpdate}
          >
            {checkingUpdates ? t("checkingUpdates") : t("checkUpdates")}
          </button>

          {updateStatus?.releaseUrl && (
            <button
              className="button"
              type="button"
              onClick={() => window.open(updateStatus.releaseUrl || "", "_blank")}
              disabled={installingUpdate}
            >
              {t("openRelease")}
            </button>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}
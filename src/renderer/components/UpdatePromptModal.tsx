import type { Dispatch, SetStateAction } from "react";
import type { UpdateCheckResult } from "../../shared/types";

type UpdatePromptModalProps = {
  t: (key: string) => string;
  updateStatus: UpdateCheckResult | null;
  installingUpdate: boolean;
  disableUpdateCheckOnDecline: boolean;
  setDisableUpdateCheckOnDecline: Dispatch<SetStateAction<boolean>>;
  onInstallUpdate: () => void;
  onDeclineUpdate: () => void;
  onCloseUpdatePrompt: () => void;
};

export function UpdatePromptModal({
  t,
  updateStatus,
  installingUpdate,
  disableUpdateCheckOnDecline,
  setDisableUpdateCheckOnDecline,
  onInstallUpdate,
  onDeclineUpdate,
  onCloseUpdatePrompt,
}: UpdatePromptModalProps) {
  if (!updateStatus?.updateAvailable) {
    return null;
  }

  return (
    <div className="modalBackdrop">
      <section className="updateModal">
        <button
          className="modalCloseButton"
          type="button"
          onClick={onCloseUpdatePrompt}
          aria-label={t("close")}
          disabled={installingUpdate}
        >
          ×
        </button>

        <div className="updateModalIcon">⬆</div>

        <h2>{t("updatePromptTitle")}</h2>

        <p className="updateModalText">{t("updatePromptText")}</p>

        <div className="updateVersionGrid">
          <span>{t("currentVersion")}</span>
          <strong>{updateStatus.currentVersion}</strong>

          <span>{t("latestVersion")}</span>
          <strong>{updateStatus.latestVersion || "—"}</strong>
        </div>

        {updateStatus.releaseNotes && (
          <details className="updateNotes">
            <summary>{t("releaseNotes")}</summary>
            <pre>{updateStatus.releaseNotes}</pre>
          </details>
        )}

        {updateStatus.error && <p className="copyStatus">{updateStatus.error}</p>}

        {!updateStatus.downloadUrl && (
          <p className="copyStatus">{t("updateDownloadUnavailable")}</p>
        )}

        <div className="updateModalActions">
          <button
            className="button"
            type="button"
            onClick={onInstallUpdate}
            disabled={installingUpdate || !updateStatus.downloadUrl}
          >
            {installingUpdate ? t("installingUpdate") : t("updateNow")}
          </button>

          <button
            className="button secondaryButton"
            type="button"
            onClick={onDeclineUpdate}
            disabled={installingUpdate}
          >
            {t("notNow")}
          </button>
        </div>

        <label className="toggleField updateDisableCheck">
          <input
            type="checkbox"
            checked={disableUpdateCheckOnDecline}
            onChange={(event) =>
              setDisableUpdateCheckOnDecline(event.target.checked)
            }
            disabled={installingUpdate}
          />
          <span>{t("disableUpdateCheck")}</span>
        </label>

        {disableUpdateCheckOnDecline && (
          <p className="hint">{t("enableUpdatesAgainHint")}</p>
        )}
      </section>
    </div>
  );
}
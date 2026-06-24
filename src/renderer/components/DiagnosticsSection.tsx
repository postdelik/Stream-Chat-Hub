import { useEffect, useState } from "react";
import type {
  DiagnosticsArchiveResult,
  DiagnosticsClearResult,
  DiagnosticsInfo,
} from "../../shared/types";
import { CollapsibleSection } from "./common/CollapsibleSection";

type DiagnosticsSectionProps = {
  t: (key: string) => string;
};

export function DiagnosticsSection({ t }: DiagnosticsSectionProps) {
  const [diagnosticsInfo, setDiagnosticsInfo] =
    useState<DiagnosticsInfo | null>(null);

  const [diagnosticsStatus, setDiagnosticsStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function loadDiagnosticsInfo() {
    try {
      const response = await fetch("http://localhost:3877/diagnostics/info");
      const data = (await response.json()) as DiagnosticsInfo;
      setDiagnosticsInfo(data);
    } catch {
      setDiagnosticsStatus(t("diagnosticsInfoFailed"));
    }
  }

  async function createArchive() {
    try {
      setIsBusy(true);
      setDiagnosticsStatus(t("diagnosticsCreatingArchive"));

      const response = await fetch("http://localhost:3877/diagnostics/archive", {
        method: "POST",
      });

      const data = (await response.json()) as DiagnosticsArchiveResult;

      if (!data.ok || !data.archivePath) {
        setDiagnosticsStatus(data.error || t("diagnosticsArchiveFailed"));
        return;
      }

      setDiagnosticsStatus(`${t("diagnosticsArchiveCreated")}: ${data.archivePath}`);
      await loadDiagnosticsInfo();
    } catch {
      setDiagnosticsStatus(t("diagnosticsArchiveFailed"));
    } finally {
      setIsBusy(false);
    }
  }

  async function clearLogs() {
    try {
      setIsBusy(true);

      const response = await fetch("http://localhost:3877/diagnostics/clear-logs", {
        method: "POST",
      });

      const data = (await response.json()) as DiagnosticsClearResult;

      if (!data.ok) {
        setDiagnosticsStatus(data.error || t("diagnosticsClearFailed"));
        return;
      }

      setDiagnosticsStatus(t("diagnosticsCleared"));
      await loadDiagnosticsInfo();
    } catch {
      setDiagnosticsStatus(t("diagnosticsClearFailed"));
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    void loadDiagnosticsInfo();
  }, []);

  const existingLogsCount = diagnosticsInfo
    ? Object.values(diagnosticsInfo.logFiles).filter(Boolean).length
    : 0;

return (
  <CollapsibleSection title={t("diagnosticsTitle")} tourId="tour-diagnostics">
      <div className="diagnosticsBox">
        <p className="hint">{t("diagnosticsHint")}</p>

        {diagnosticsInfo && (
          <div className="diagnosticsGrid">
            <span>{t("diagnosticsAppVersion")}</span>
            <strong>{diagnosticsInfo.appVersion}</strong>

            <span>{t("diagnosticsPlatform")}</span>
            <strong>
              {diagnosticsInfo.platform} / {diagnosticsInfo.arch}
            </strong>

            <span>{t("diagnosticsNode")}</span>
            <strong>{diagnosticsInfo.nodeVersion}</strong>
          </div>
        )}

<div className="diagnosticsActions">
  <button
    className="button diagnosticsDownloadButton"
    type="button"
    onClick={createArchive}
    disabled={isBusy}
  >
    {t("downloadLogs")}
  </button>

  <button
    className="button secondaryButton diagnosticsSmallButton"
    type="button"
    onClick={clearLogs}
    disabled={isBusy}
  >
    {t("clearLogs")}
  </button>
</div>


        {diagnosticsStatus && (
          <p className="copyStatus">{diagnosticsStatus}</p>
        )}
      </div>
    </CollapsibleSection>
  );
}
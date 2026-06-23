import type { Dispatch, SetStateAction } from "react";
import type {
  ChatSource,
  SafeTwitchAuthState,
  SafeYouTubeAuthState,
  TwitchConnectionStatus,
  YouTubeConnectionStatus,
} from "../../shared/types";
import { getSourcePlatformLabel } from "../utils/chat";
import {
  CollapsibleSection,
  MiniCollapsibleSection,
} from "./common/CollapsibleSection";

export type AddSourceTab = "anonymousTwitch" | "twitchLogin" | "youtube";

type SourcesSectionProps = {
  t: (key: string) => string;

  enabledSourcesCount: number;
  twitchSourcesCount: number;
  youtubeSourcesCount: number;
  connectedYoutubeSourcesCount: number;

  sources: ChatSource[];

  twitchStatus: TwitchConnectionStatus;
  twitchAuthStatus: SafeTwitchAuthState;
  youtubeStatus: YouTubeConnectionStatus;
  youtubeAuthStatus: SafeYouTubeAuthState;

  activeAddSourceTab: AddSourceTab;
  setActiveAddSourceTab: Dispatch<SetStateAction<AddSourceTab>>;

  anonymousTwitchChannelName: string;
  setAnonymousTwitchChannelName: Dispatch<SetStateAction<string>>;

  authTwitchChannelName: string;
  setAuthTwitchChannelName: Dispatch<SetStateAction<string>>;

  youtubeInput: string;
  setYoutubeInput: Dispatch<SetStateAction<string>>;

  chatActionStatus: string;

  toggleSource: (sourceId: string) => void;
  removeSource: (sourceId: string) => void;

  addAnonymousTwitchSource: () => void;
  addAuthTwitchSource: () => void;
  addYouTubeSource: () => void;

  startTwitchLogin: () => void;
  logoutTwitch: () => void;

  startYouTubeLogin: () => void;
  logoutYouTube: () => void;
};

export function SourcesSection({
  t,

  enabledSourcesCount,
  twitchSourcesCount,

  sources,

  twitchStatus,
  twitchAuthStatus,

  activeAddSourceTab,
  setActiveAddSourceTab,

  anonymousTwitchChannelName,
  setAnonymousTwitchChannelName,

  chatActionStatus,

  toggleSource,
  removeSource,

  addAnonymousTwitchSource,

  startTwitchLogin,
  logoutTwitch,
}: SourcesSectionProps) {
  return (
    <CollapsibleSection
      title={t("sourcesTitle")}
      badge={`${enabledSourcesCount} ${t("activeShort")}`}
    >
      <div className="connectionStatus">
        <p>
          {t("activeSources")}: {enabledSourcesCount}
        </p>
        <p>🟣 Twitch: {twitchSourcesCount}</p>

        <p>
          {t("twitchConnection")}:{" "}
          {twitchStatus.connected
            ? `${t("connectedToChannels")} ${twitchStatus.channelNames.length}`
            : t("notConnected")}
        </p>

        <p>
          {t("twitchLogin")}:{" "}
          {twitchAuthStatus.enabled && twitchAuthStatus.username
            ? `${t("loggedInAs")} ${twitchAuthStatus.username}`
            : t("notLoggedIn")}
        </p>

        {twitchStatus.error && (
          <p className="errorText">{twitchStatus.error}</p>
        )}
      </div>

      <div className="sourceList">
        {sources.length === 0 && <p className="emptyText">{t("noSources")}</p>}

        {sources.map((source) => (
          <div className="sourceRow" key={source.id}>
            <button
              className={source.enabled ? "sourceToggle enabled" : "sourceToggle"}
              type="button"
              onClick={() => toggleSource(source.id)}
              title={source.enabled ? t("sourceEnabled") : t("sourceDisabled")}
            >
              {source.enabled ? "✓" : "○"}
            </button>

            <span className="sourceIcon">
              {source.platform === "twitch" ? "🟣" : "🔴"}
            </span>

            <div className="sourceInfo">
              <strong>{getSourcePlatformLabel(source.platform)}</strong>
              <span>
                {source.platform === "twitch"
                  ? `#${source.channelName}`
                  : source.channelName}
              </span>
            </div>

            <button
              className="removeSourceButton"
              type="button"
              onClick={() => removeSource(source.id)}
              title={t("removeSource")}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="addSourceTabs twoTabs">
        <button
          className={
            activeAddSourceTab === "anonymousTwitch"
              ? "tabButton active"
              : "tabButton"
          }
          type="button"
          onClick={() => setActiveAddSourceTab("anonymousTwitch")}
        >
          {t("anonymousTab")}
        </button>

        <button
          className={
            activeAddSourceTab === "twitchLogin"
              ? "tabButton active"
              : "tabButton"
          }
          type="button"
          onClick={() => setActiveAddSourceTab("twitchLogin")}
        >
          {t("twitchLoginTab")}
        </button>
      </div>

      {activeAddSourceTab === "anonymousTwitch" && (
        <div className="addSourceBox tabPanel">
          <MiniCollapsibleSection title={t("publicTwitchRead")} defaultOpen>
            <div className="tabIntro">
              <strong>{t("publicTwitchRead")}</strong>
              <small>{t("publicTwitchReadHint")}</small>
            </div>

            <label className="field">
              <span>{t("twitchChannel")}</span>
              <input
                type="text"
                placeholder={t("twitchChannelPlaceholder")}
                value={anonymousTwitchChannelName}
                onChange={(event) =>
                  setAnonymousTwitchChannelName(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addAnonymousTwitchSource();
                  }
                }}
              />
            </label>

            <button
              className="button"
              type="button"
              onClick={addAnonymousTwitchSource}
            >
              {t("addTwitchChannel")}
            </button>
          </MiniCollapsibleSection>
        </div>
      )}

      {activeAddSourceTab === "twitchLogin" && (
        <div className="addSourceBox tabPanel">
          <MiniCollapsibleSection title={t("twitchAccountWork")} defaultOpen>
            <div className="tabIntro">
              <strong>{t("twitchAccountWork")}</strong>
              <small>{t("twitchAccountWorkHint")}</small>
            </div>

            <div className="authCard">
              <div>
                <span className="authLabel">{t("status")}</span>
                <strong>
                  {twitchAuthStatus.enabled && twitchAuthStatus.username
                    ? `${t("loginDone")}: ${twitchAuthStatus.username}`
                    : t("loginNotDone")}
                </strong>
              </div>

              {twitchAuthStatus.enabled && twitchAuthStatus.hasToken ? (
                <button
                  className="button secondaryButton"
                  type="button"
                  onClick={logoutTwitch}
                >
                  {t("logoutTwitch")}
                </button>
              ) : (
                <button
                  className="button"
                  type="button"
                  onClick={startTwitchLogin}
                >
                  {t("loginWithTwitch")}
                </button>
              )}
            </div>

            <p className="hint">{t("reconnectAfterLogin")}</p>
          </MiniCollapsibleSection>
        </div>
      )}

      {chatActionStatus && <p className="copyStatus">{chatActionStatus}</p>}
    </CollapsibleSection>
  );
}

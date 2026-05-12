import type {
  ChatSource,
  SafeTwitchAuthState,
  TwitchConnectionStatus,
  YouTubeConnectionStatus,
} from "../../shared/types";
import {
  CollapsibleSection,
  MiniCollapsibleSection,
} from "./common/CollapsibleSection";
import { getSourcePlatformLabel } from "../utils/chat";

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

  activeAddSourceTab: AddSourceTab;
  setActiveAddSourceTab: (tab: AddSourceTab) => void;

  anonymousTwitchChannelName: string;
  setAnonymousTwitchChannelName: (value: string) => void;

  authTwitchChannelName: string;
  setAuthTwitchChannelName: (value: string) => void;

  youtubeInput: string;
  setYoutubeInput: (value: string) => void;

  youtubeApiKey: string;
  setYoutubeApiKey: (value: string) => void;

  chatActionStatus: string;

  toggleSource: (sourceId: string) => void;
  removeSource: (sourceId: string) => void;
  addAnonymousTwitchSource: () => void;
  addAuthTwitchSource: () => void;
  addYouTubeSource: () => void;
  startTwitchLogin: () => void;
  logoutTwitch: () => void;
  connectChat: () => void;
  disconnectChat: () => void;
};

export function SourcesSection({
  t,
  enabledSourcesCount,
  twitchSourcesCount,
  youtubeSourcesCount,
  connectedYoutubeSourcesCount,
  sources,
  twitchStatus,
  twitchAuthStatus,
  youtubeStatus,
  activeAddSourceTab,
  setActiveAddSourceTab,
  anonymousTwitchChannelName,
  setAnonymousTwitchChannelName,
  authTwitchChannelName,
  setAuthTwitchChannelName,
  youtubeInput,
  setYoutubeInput,
  youtubeApiKey,
  setYoutubeApiKey,
  chatActionStatus,
  toggleSource,
  removeSource,
  addAnonymousTwitchSource,
  addAuthTwitchSource,
  addYouTubeSource,
  startTwitchLogin,
  logoutTwitch,
  connectChat,
  disconnectChat,
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
        <p>🔴 YouTube: {youtubeSourcesCount}</p>

        <p>
          {t("twitchConnection")}: {" "}
          {twitchStatus.connected
            ? `${t("connectedToChannels")} ${twitchStatus.channelNames.length}`
            : t("notConnected")}
        </p>

        <p>
          {t("twitchLogin")}: {" "}
          {twitchAuthStatus.enabled && twitchAuthStatus.username
            ? `${t("loggedInAs")} ${twitchAuthStatus.username}`
            : t("notLoggedIn")}
        </p>

        {twitchStatus.error && <p className="errorText">{twitchStatus.error}</p>}

        <p>
          {t("youtubeConnection")}: {" "}
          {youtubeStatus.connected
            ? `${t("connectedSources")}: ${connectedYoutubeSourcesCount}`
            : t("notConnected")}
        </p>

        {youtubeStatus.error && <p className="errorText">{youtubeStatus.error}</p>}
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

      <div className="addSourceTabs">
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
            activeAddSourceTab === "twitchLogin" ? "tabButton active" : "tabButton"
          }
          type="button"
          onClick={() => setActiveAddSourceTab("twitchLogin")}
        >
          {t("twitchLoginTab")}
        </button>

        <button
          className={
            activeAddSourceTab === "youtube" ? "tabButton active" : "tabButton"
          }
          type="button"
          onClick={() => setActiveAddSourceTab("youtube")}
        >
          {t("youtubeLaterTab")}
        </button>
      </div>

      {activeAddSourceTab === "anonymousTwitch" && (
        <div className="addSourceBox tabPanel">
          <MiniCollapsibleSection title={t("publicTwitchRead")}>
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
                onChange={(event) => setAnonymousTwitchChannelName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addAnonymousTwitchSource();
                  }
                }}
              />
            </label>

            <button className="button" type="button" onClick={addAnonymousTwitchSource}>
              {t("addTwitchChannel")}
            </button>
          </MiniCollapsibleSection>
        </div>
      )}

      {activeAddSourceTab === "twitchLogin" && (
        <div className="addSourceBox tabPanel">
          <MiniCollapsibleSection title={t("twitchAccountWork")}>
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
                <button className="button" type="button" onClick={startTwitchLogin}>
                  {t("loginWithTwitch")}
                </button>
              )}
            </div>
          </MiniCollapsibleSection>

          <MiniCollapsibleSection title={t("twitchChannelForReading")}>
            <label className="field">
              <span>{t("twitchChannelForReading")}</span>
              <input
                type="text"
                placeholder={t("twitchChannelPlaceholder")}
                value={authTwitchChannelName}
                onChange={(event) => setAuthTwitchChannelName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addAuthTwitchSource();
                  }
                }}
              />
            </label>

            <button className="button" type="button" onClick={addAuthTwitchSource}>
              {t("addChannelViaLogin")}
            </button>

            <p className="hint">{t("reconnectAfterLogin")}</p>
          </MiniCollapsibleSection>
        </div>
      )}

      {activeAddSourceTab === "youtube" && (
        <div className="addSourceBox tabPanel">
          <MiniCollapsibleSection title={t("youtubeWillBeLater")}>
            <div className="tabIntro">
              <strong>{t("youtubeWillBeLater")}</strong>
              <small>{t("youtubeWillBeLaterHint")}</small>
            </div>

            <label className="field">
              <span>{t("youtubeLinkOrVideoId")}</span>
              <input
                type="text"
                placeholder={t("youtubeDisabledPlaceholder")}
                value={youtubeInput}
                onChange={(event) => setYoutubeInput(event.target.value)}
                disabled
              />
            </label>

            <label className="field youtubeApiKeyField">
              <span>{t("youtubeApiKey")}</span>
              <input
                type="password"
                placeholder={t("youtubeApiKeyPlaceholder")}
                value={youtubeApiKey}
                onChange={(event) => setYoutubeApiKey(event.target.value)}
                disabled
              />
            </label>

            <button className="button secondaryButton" type="button" onClick={addYouTubeSource}>
              {t("youtubeDisabled")}
            </button>
          </MiniCollapsibleSection>
        </div>
      )}

      <div className="buttonRow">
        <button className="button" type="button" onClick={connectChat}>
          {t("connectSources")}
        </button>

        <button className="button secondaryButton" type="button" onClick={disconnectChat}>
          {t("disconnectSources")}
        </button>
      </div>

      {chatActionStatus && <p className="copyStatus">{chatActionStatus}</p>}
    </CollapsibleSection>
  );
}

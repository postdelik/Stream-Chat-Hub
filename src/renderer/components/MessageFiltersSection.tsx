import type { TwitchEmoteSettings } from "../../shared/types";
import {
  CollapsibleSection,
  MiniCollapsibleSection,
} from "./common/CollapsibleSection";

type MessageFiltersSectionProps = {
  t: (key: string) => string;
  filterHideCommands: boolean;
  filterHideLinks: boolean;
  filterOnlyWords: string;
  filterHighlightWords: string;
  setFilterHideCommands: (value: boolean) => void;
  setFilterHideLinks: (value: boolean) => void;
  setFilterOnlyWords: (value: string) => void;
  setFilterHighlightWords: (value: string) => void;

  twitchEmotes: TwitchEmoteSettings;
  setTwitchEmoteProviderEnabled: (
    provider: keyof TwitchEmoteSettings,
    enabled: boolean
  ) => void;
};

export function MessageFiltersSection({
  t,
  filterHideCommands,
  filterHideLinks,
  filterOnlyWords,
  filterHighlightWords,
  setFilterHideCommands,
  setFilterHideLinks,
  setFilterOnlyWords,
  setFilterHighlightWords,
  twitchEmotes,
  setTwitchEmoteProviderEnabled,
}: MessageFiltersSectionProps) {
  return (
    <CollapsibleSection title={t("messageFilters")} tourId="tour-message-filters">
      <div className="toggleGroup">
        <label className="toggleField">
          <input
            type="checkbox"
            checked={filterHideCommands}
            onChange={(event) => setFilterHideCommands(event.target.checked)}
          />
          <span>{t("hideCommands")}</span>
        </label>

        <label className="toggleField">
          <input
            type="checkbox"
            checked={filterHideLinks}
            onChange={(event) => setFilterHideLinks(event.target.checked)}
          />
          <span>{t("hideLinks")}</span>
        </label>
      </div>

      <label className="field filterField">
        <span>{t("onlyWords")}</span>

        <input
          type="text"
          value={filterOnlyWords}
          onChange={(event) => setFilterOnlyWords(event.target.value)}
        />
      </label>

      <label className="field filterField">
        <span>{t("highlightWords")}</span>

        <input
          type="text"
          value={filterHighlightWords}
          onChange={(event) => setFilterHighlightWords(event.target.value)}
        />
      </label>

      <p className="hint">{t("commaSeparatedWordsHint")}</p>

      <MiniCollapsibleSection title={t("thirdPartyEmotesTitle")} defaultOpen>
        <div className="tabIntro">
          <strong>{t("thirdPartyEmotesTitle")}</strong>
          <small>{t("thirdPartyEmotesHint")}</small>
        </div>

        <div className="fieldGroup">
          <label className="switchField">
            <span>{t("sevenTvEmotes")}</span>
            <input
              type="checkbox"
              checked={twitchEmotes.sevenTvEnabled}
              onChange={(event) =>
                setTwitchEmoteProviderEnabled(
                  "sevenTvEnabled",
                  event.target.checked
                )
              }
            />
            <span className="switchSlider" />
          </label>

          <label className="switchField">
            <span>{t("betterTtvEmotes")}</span>
            <input
              type="checkbox"
              checked={twitchEmotes.betterTtvEnabled}
              onChange={(event) =>
                setTwitchEmoteProviderEnabled(
                  "betterTtvEnabled",
                  event.target.checked
                )
              }
            />
            <span className="switchSlider" />
          </label>

          <label className="switchField">
            <span>{t("frankerFaceZEmotes")}</span>
            <input
              type="checkbox"
              checked={twitchEmotes.frankerFaceZEnabled}
              onChange={(event) =>
                setTwitchEmoteProviderEnabled(
                  "frankerFaceZEnabled",
                  event.target.checked
                )
              }
            />
            <span className="switchSlider" />
          </label>
        </div>
      </MiniCollapsibleSection>
    </CollapsibleSection>
  );
}

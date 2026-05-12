import { CollapsibleSection } from "./common/CollapsibleSection";

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
}: MessageFiltersSectionProps) {
  return (
    <CollapsibleSection title={t("messageFilters")}>
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
          placeholder={t("onlyWordsPlaceholder")}
          value={filterOnlyWords}
          onChange={(event) => setFilterOnlyWords(event.target.value)}
        />
      </label>

      <label className="field filterField">
        <span>{t("highlightWords")}</span>
        <input
          type="text"
          placeholder={t("highlightWordsPlaceholder")}
          value={filterHighlightWords}
          onChange={(event) => setFilterHighlightWords(event.target.value)}
        />
      </label>

      <p className="hint">{t("filtersHint")}</p>
    </CollapsibleSection>
  );
}

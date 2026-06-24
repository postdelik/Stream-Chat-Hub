import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type LocalFontData = {
  family: string;
};

type WindowWithLocalFonts = Window & {
  queryLocalFonts?: () => Promise<LocalFontData[]>;
};

type SystemFontPickerModalProps = {
  open: boolean;
  t: (key: string) => string;
  currentFont: string;
  fallbackFonts: string[];
  onSelect: (fontFamily: string) => void;
  onClose: () => void;
};

function getDisplayFontName(fontFamily: string) {
  return fontFamily
    .replace(/,\s*sans-serif$/i, "")
    .replace(/,\s*serif$/i, "")
    .replace(/,\s*monospace$/i, "")
    .replace(/^["']|["']$/g, "");
}

function normalizeFontFamily(fontFamily: string) {
  const cleaned = fontFamily.trim().replace(/^["']|["']$/g, "");
  return cleaned.includes(",") ? cleaned : `"${cleaned}", sans-serif`;
}

export function SystemFontPickerModal({
  open,
  t,
  currentFont,
  fallbackFonts,
  onSelect,
  onClose,
}: SystemFontPickerModalProps) {
  const [query, setQuery] = useState("");
  const [fonts, setFonts] = useState<string[]>(fallbackFonts);
  const [selectedFont, setSelectedFont] = useState(currentFont);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery("");
    setSelectedFont(currentFont);
    setFonts(fallbackFonts);
    setStatus("");
  }, [open, currentFont, fallbackFonts]);

  async function loadSystemFonts() {
    const queryLocalFonts = (window as WindowWithLocalFonts).queryLocalFonts;

    if (!queryLocalFonts) {
      setStatus(t("systemFontsNotSupported"));
      return;
    }

    try {
      setLoading(true);
      setStatus(t("loadingSystemFonts"));

      const localFonts = await queryLocalFonts.call(window);

      const uniqueFamilies = Array.from(
        new Set(
          localFonts
            .map((font) => font.family?.trim())
            .filter((family): family is string => Boolean(family))
        )
      ).sort((left, right) => left.localeCompare(right));

      if (uniqueFamilies.length === 0) {
        setStatus(t("systemFontsEmpty"));
        return;
      }

      setFonts(
        uniqueFamilies.map((family) => normalizeFontFamily(family))
      );
      setStatus(t("systemFontsLoaded"));
    } catch (error) {
      const message =
        error instanceof Error && error.name === "NotAllowedError"
          ? t("systemFontsPermissionDenied")
          : t("systemFontsLoadFailed");

      setStatus(message);
    } finally {
      setLoading(false);
    }
  }

  const filteredFonts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return fonts;
    }

    return fonts.filter((font) =>
      getDisplayFontName(font).toLocaleLowerCase().includes(normalizedQuery)
    );
  }, [fonts, query]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="modalBackdrop fontPickerBackdrop" role="presentation">
      <section
        className="updateModal fontPickerModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="font-picker-title"
      >
        <button
          className="modalCloseButton"
          type="button"
          onClick={onClose}
          aria-label={t("close")}
        >
          ×
        </button>

        <div className="fontPickerHeader">
          <div className="fontPickerHeading">
            <h2 id="font-picker-title">{t("systemFontPickerTitle")}</h2>
            <p className="updateModalText">{t("systemFontPickerHint")}</p>
          </div>

          <button
            className="button secondaryButton fontPickerLoadButton"
            type="button"
            onClick={() => void loadSystemFonts()}
            disabled={loading}
          >
            {loading ? t("loadingSystemFonts") : t("loadSystemFonts")}
          </button>
        </div>

        <label className="field">
          <span>{t("fontSearch")}</span>
          <input
            type="search"
            value={query}
            placeholder={t("fontSearchPlaceholder")}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
        </label>

        <div
          className="fontPreviewCard"
          style={{ fontFamily: selectedFont }}
        >
          <small>{t("fontPreview")}</small>
          <strong>{t("fontPreviewText")}</strong>
        </div>

        {status && <p className="copyStatus fontPickerStatus">{status}</p>}

        <div className="fontList" role="listbox" aria-label={t("messageFont")}>
          {filteredFonts.length > 0 ? (
            filteredFonts.map((font) => {
              const selected = font === selectedFont;

              return (
                <button
                  className={selected ? "fontListItem selected" : "fontListItem"}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  key={font}
                  style={{ fontFamily: font }}
                  onClick={() => setSelectedFont(font)}
                  onDoubleClick={() => {
                    onSelect(font);
                    onClose();
                  }}
                >
                  <span>{getDisplayFontName(font)}</span>
                  {selected && <strong>✓</strong>}
                </button>
              );
            })
          ) : (
            <p className="emptyText">{t("fontsNotFound")}</p>
          )}
        </div>

        <div className="updateModalActions fontPickerActions">
          <button
            className="button secondaryButton"
            type="button"
            onClick={onClose}
          >
            {t("cancel")}
          </button>

          <button
            className="button"
            type="button"
            onClick={() => {
              onSelect(selectedFont);
              onClose();
            }}
          >
            {t("selectFont")}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

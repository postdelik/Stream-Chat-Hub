import { CollapsibleSection } from "./common/CollapsibleSection";
import type { AppLanguage } from "../i18n/translations";
import { WYRMO_SITE_URL } from "../../shared/links";

type AboutSectionProps = {
  language: AppLanguage;
  t: (key: string) => string;
  chooseLanguage: (language: AppLanguage) => void;
  startOnboarding: () => void;
};

export function AboutSection({
  language,
  t,
  chooseLanguage,
  startOnboarding,
}: AboutSectionProps) {
  return (
    <CollapsibleSection title={t("aboutTitle")} badge="v0.6.1" tourId="tour-about">
      <div className="aboutBox">
        <p>
          <strong>Stream Chat Hub</strong> beta v0.6.1
        </p>

        <div className="aboutTutorialRow">
          <div>
            <strong>{t("startOnboardingAgain")}</strong>
            <p className="hint">{t("startOnboardingAgainHint")}</p>
          </div>

          <button
            className="smallButton secondaryButton aboutTutorialButton"
            type="button"
            onClick={startOnboarding}
          >
            {t("startOnboardingButton")}
          </button>
        </div>

        <div className="linkList">
          <a href={WYRMO_SITE_URL} target="_blank" rel="noreferrer">
            {t("officialWebsite")}
          </a>

          <a
            href="https://boosty.to/postdelik"
            target="_blank"
            rel="noreferrer"
          >
            {t("supportProject")}
          </a>
        </div>

        <div className="languageSwitcher">
          <span>{t("language")}</span>

          <div className="languageSwitcherButtons">
            <button
              className={
                language === "ru" ? "smallButton activeLanguage" : "smallButton"
              }
              type="button"
              onClick={() => chooseLanguage("ru")}
            >
              RU
            </button>

            <button
              className={
                language === "en" ? "smallButton activeLanguage" : "smallButton"
              }
              type="button"
              onClick={() => chooseLanguage("en")}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

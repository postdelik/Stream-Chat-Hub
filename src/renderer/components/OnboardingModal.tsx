type OnboardingModalProps = {
  open: boolean;
  t: (key: string) => string;
  onStart: () => void;
  onDecline: () => void;
};

export function OnboardingModal({
  open,
  t,
  onStart,
  onDecline,
}: OnboardingModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modalBackdrop">
      <section className="updateModal onboardingModal">
        <div className="onboardingIcon">SCH</div>

        <h2>{t("onboardingChoiceTitle")}</h2>
        <p>{t("onboardingChoiceText")}</p>

        <div className="modalActions">
          <button className="button" type="button" onClick={onStart}>
            {t("startOnboarding")}
          </button>

          <button
            className="button secondaryButton"
            type="button"
            onClick={onDecline}
          >
            {t("declineOnboarding")}
          </button>
        </div>
      </section>
    </div>
  );
}

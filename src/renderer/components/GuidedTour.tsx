import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

type GuidedTourProps = {
  open: boolean;
  t: (key: string) => string;
  onClose: () => void;
};

type TourStep = {
  titleKey: string;
  textKey: string;
  targetId?: string;
  sectionId?: string;
  action?: string;
  fullSection?: boolean;
};

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type PreviewState = {
  html: string;
  contentWidth: number;
  contentHeight: number;
};

const TOUR_OPEN_EVENT = "stream-chat-hub:tour-open";
const TOUR_ACTION_EVENT = "stream-chat-hub:tour-action";

const steps: TourStep[] = [
  {
    titleKey: "tourStep1Title",
    textKey: "tourStep1Text",
  },
  {
    titleKey: "tourStep2Title",
    textKey: "tourStep2Text",
    targetId: "tour-sources",
    sectionId: "tour-sources",
    fullSection: true,
  },
  {
    titleKey: "tourStep3Title",
    textKey: "tourStep3Text",
    targetId: "tour-twitch-connect",
    sectionId: "tour-sources",
    action: "show-twitch-login",
  },
  {
    titleKey: "tourStep4Title",
    textKey: "tourStep4Text",
    targetId: "tour-overlay-obs",
    sectionId: "tour-overlay-obs",
    fullSection: true,
  },
  {
    titleKey: "tourStep5Title",
    textKey: "tourStep5Text",
    targetId: "tour-obs-link-test",
    sectionId: "tour-overlay-obs",
  },
  {
    titleKey: "tourStep6Title",
    textKey: "tourStep6Text",
    targetId: "tour-message-filters",
    sectionId: "tour-message-filters",
    fullSection: true,
  },
  {
    titleKey: "tourStep7Title",
    textKey: "tourStep7Text",
    targetId: "tour-app-appearance",
    sectionId: "tour-app-appearance",
    fullSection: true,
  },
  {
    titleKey: "tourStep8Title",
    textKey: "tourStep8Text",
    targetId: "tour-chat",
  },
  {
    titleKey: "tourStep9Title",
    textKey: "tourStep9Text",
    targetId: "tour-chat-buttons",
  },
  {
    titleKey: "tourStep10Title",
    textKey: "tourStep10Text",
    targetId: "tour-updates",
    sectionId: "tour-updates",
    fullSection: true,
  },
  {
    titleKey: "tourStep11Title",
    textKey: "tourStep11Text",
    targetId: "tour-diagnostics",
    sectionId: "tour-diagnostics",
    fullSection: true,
  },
];

function viewportSize() {
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

function queryTourElement(step: TourStep): HTMLElement | null {
  if (!step.targetId) {
    return null;
  }

  const targetSelector = step.fullSection
    ? `[data-tour-section-id="${step.targetId}"]`
    : `[data-tour-id="${step.targetId}"]`;

  const sectionSelector = step.sectionId
    ? `[data-tour-section-id="${step.sectionId}"]`
    : "";

  return (
    document.querySelector<HTMLElement>(targetSelector) ??
    (sectionSelector
      ? document.querySelector<HTMLElement>(sectionSelector)
      : null)
  );
}

function rectForElement(element: HTMLElement): TargetRect {
  const rect = element.getBoundingClientRect();
  const viewport = viewportSize();
  const padding = 8;

  const top = Math.max(8, rect.top - padding);
  const left = Math.max(8, rect.left - padding);
  const right = Math.min(viewport.width - 8, rect.right + padding);
  const bottom = Math.min(viewport.height - 8, rect.bottom + padding);

  return {
    top,
    left,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

export function GuidedTour({
  open,
  t,
  onClose,
}: GuidedTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setTargetRect(null);
      setPreview(null);
      setShowCompletion(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    document.body.classList.add("guidedTourActive");

    return () => {
      document.body.classList.remove("guidedTourActive");
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || showCompletion) {
      return;
    }

    setTargetRect(null);
    setPreview(null);

    if (!step.targetId) {
      return;
    }

    if (step.sectionId) {
      window.dispatchEvent(
        new CustomEvent(TOUR_OPEN_EVENT, {
          detail: { tourId: step.sectionId },
        })
      );
    }

    if (step.action) {
      window.dispatchEvent(
        new CustomEvent(TOUR_ACTION_EVENT, {
          detail: { action: step.action },
        })
      );
    }

    let cancelled = false;
    let attempts = 0;
    let timer = 0;

    const locate = () => {
      if (cancelled) {
        return;
      }

      const element = queryTourElement(step);

      if (!element) {
        attempts += 1;

        if (attempts < 24) {
          timer = window.setTimeout(locate, 80);
        }

        return;
      }

      element.scrollIntoView({
        behavior: "auto",
        block: "center",
        inline: "nearest",
      });

      timer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        const freshElement = queryTourElement(step);

        if (!freshElement) {
          return;
        }

        const elementRect = freshElement.getBoundingClientRect();
        const viewport = viewportSize();

        const needsPreview =
          Boolean(step.fullSection) &&
          (elementRect.height > viewport.height * 0.72 ||
            elementRect.width > viewport.width * 0.56);

        if (needsPreview) {
          setTargetRect(null);
          setPreview({
            html: freshElement.outerHTML,
            contentWidth: Math.max(1, elementRect.width),
            contentHeight: Math.max(1, elementRect.height),
          });
          return;
        }

        setPreview(null);
        setTargetRect(rectForElement(freshElement));
      }, 120);
    };

    timer = window.setTimeout(locate, 40);

    const handleResize = () => {
      const element = queryTourElement(step);

      if (element && !preview) {
        setTargetRect(rectForElement(element));
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    open,
    showCompletion,
    step.targetId,
    step.sectionId,
    step.action,
    step.fullSection,
  ]);

  const regularCardStyle = useMemo<CSSProperties | undefined>(() => {
    if (!targetRect) {
      return undefined;
    }

    const viewport = viewportSize();
    const gap = 18;
    const margin = 12;
    const spaceLeft = targetRect.left;
    const spaceRight =
      viewport.width - (targetRect.left + targetRect.width);
    const placeRight = spaceRight >= spaceLeft;
    const availableSide = placeRight ? spaceRight : spaceLeft;
    const width = Math.min(
      390,
      Math.max(250, availableSide - gap - margin)
    );

    let left = placeRight
      ? targetRect.left + targetRect.width + gap
      : targetRect.left - width - gap;

    left = Math.max(
      margin,
      Math.min(left, viewport.width - width - margin)
    );

    const estimatedHeight = 290;
    const top = Math.max(
      margin,
      Math.min(
        targetRect.top,
        viewport.height - estimatedHeight - margin
      )
    );

    return {
      width,
      left,
      top,
      "--tour-arrow-left": placeRight
        ? "-34px"
        : "calc(100% + 8px)",
      "--tour-arrow-top": "34px",
      "--tour-arrow-rotation": placeRight ? "180deg" : "0deg",
    } as CSSProperties;
  }, [targetRect]);

  const previewLayout = useMemo(() => {
    if (!preview) {
      return null;
    }

    const viewport = viewportSize();
    const margin = 12;
    const gap = 14;
    const cardWidth = Math.min(
      380,
      Math.max(260, viewport.width * 0.34)
    );

    const maxPreviewWidth = Math.max(
      180,
      viewport.width - cardWidth - gap - margin * 2
    );
    const maxPreviewHeight = viewport.height - margin * 2;

    const scale = Math.min(
      1,
      maxPreviewWidth / preview.contentWidth
    );

    const previewWidth = Math.min(
      maxPreviewWidth,
      preview.contentWidth * scale
    );
    const previewHeight = Math.min(
      maxPreviewHeight,
      preview.contentHeight * scale
    );

    return {
      viewport,
      margin,
      gap,
      cardWidth,
      previewWidth,
      previewHeight,
      scale,
    };
  }, [preview]);

  const previewFrameStyle = useMemo<CSSProperties | undefined>(() => {
    if (!preview || !previewLayout) {
      return undefined;
    }

    return {
      left: previewLayout.margin,
      top: previewLayout.margin,
      width: previewLayout.previewWidth,
      height: previewLayout.previewHeight,
    };
  }, [preview, previewLayout]);

  const previewContentStyle = useMemo<CSSProperties | undefined>(() => {
    if (!preview || !previewLayout) {
      return undefined;
    }

    return {
      width: preview.contentWidth,
      minHeight: preview.contentHeight,
      zoom: previewLayout.scale,
    } as CSSProperties;
  }, [preview, previewLayout]);

  const previewCardStyle = useMemo<CSSProperties | undefined>(() => {
    if (!previewLayout) {
      return undefined;
    }

    const left =
      previewLayout.margin +
      previewLayout.previewWidth +
      previewLayout.gap;

    return {
      left,
      top: "50%",
      width: Math.min(
        previewLayout.cardWidth,
        previewLayout.viewport.width - left - previewLayout.margin
      ),
      maxHeight: previewLayout.viewport.height - 24,
      transform: "translateY(-50%)",
    };
  }, [previewLayout]);

  if (!open) {
    return null;
  }

  if (showCompletion) {
    return createPortal(
      <div
        className="guidedTourRoot"
        role="dialog"
        aria-modal="true"
      >
        <div className="guidedTourFullShade" />

        <section className="guidedTourCard guidedTourCardCentered guidedTourCompletionCard">
          <div className="guidedTourCompletionIcon">✓</div>

          <h2>{t("tourCompletedTitle")}</h2>
          <p>{t("tourCompletedText")}</p>

          <div className="guidedTourCompletionPath">
            {t("tourCompletedPath")}
          </div>

          <button
            className="button guidedTourCompactFinish"
            type="button"
            onClick={onClose}
          >
            {t("gotIt")}
          </button>
        </section>
      </div>,
      document.body
    );
  }

  const hasTarget = Boolean(targetRect);
  const hasPreview = Boolean(preview && previewLayout);

  return createPortal(
    <div
      className={
        hasPreview
          ? "guidedTourRoot guidedTourPreviewActive"
          : "guidedTourRoot"
      }
      role="dialog"
      aria-modal="true"
    >
      {!hasTarget && !hasPreview && (
        <div className="guidedTourFullShade" />
      )}

      {hasTarget && targetRect && (
        <>
          <div
            className="guidedTourShade guidedTourShadeTop"
            style={{ height: targetRect.top }}
          />
          <div
            className="guidedTourShade guidedTourShadeLeft"
            style={{
              top: targetRect.top,
              width: targetRect.left,
              height: targetRect.height,
            }}
          />
          <div
            className="guidedTourShade guidedTourShadeRight"
            style={{
              top: targetRect.top,
              left: targetRect.left + targetRect.width,
              right: 0,
              height: targetRect.height,
            }}
          />
          <div
            className="guidedTourShade guidedTourShadeBottom"
            style={{
              top: targetRect.top + targetRect.height,
              bottom: 0,
            }}
          />

          <div
            className="guidedTourSpotlight"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
          />
        </>
      )}

      {hasPreview && preview && (
        <>
          <div className="guidedTourPreviewShade" />

          <div
            className="guidedTourPreview"
            style={previewFrameStyle}
            aria-label={t(step.titleKey)}
          >
            <div
              className="guidedTourPreviewContent"
              style={previewContentStyle}
              dangerouslySetInnerHTML={{ __html: preview.html }}
            />
          </div>
        </>
      )}

      <section
        className={[
          "guidedTourCard",
          hasTarget || hasPreview
            ? "guidedTourCardTargeted"
            : "guidedTourCardCentered",
          hasPreview ? "guidedTourCardPreviewMode" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          hasPreview
            ? previewCardStyle
            : hasTarget
              ? regularCardStyle
              : undefined
        }
      >
        <div className="guidedTourStepLabel">
          {t("tourStepLabel")} {stepIndex + 1} {t("tourStepOf")}{" "}
          {steps.length}
        </div>

        <h2>{t(step.titleKey)}</h2>
        <p>{t(step.textKey)}</p>

        {hasTarget && <div className="guidedTourArrow">➜</div>}

        <div className="guidedTourActions">
          <button
            className="smallButton secondaryButton guidedTourSkipButton"
            type="button"
            onClick={() => setShowCompletion(true)}
          >
            {t("finishOnboarding")}
          </button>

          <div className="guidedTourNav">
            {!isFirst && (
              <button
                className="button secondaryButton"
                type="button"
                onClick={() => setStepIndex((current) => current - 1)}
              >
                {t("back")}
              </button>
            )}

            {!isLast ? (
              <button
                className="button"
                type="button"
                onClick={() => setStepIndex((current) => current + 1)}
              >
                {t("next")}
              </button>
            ) : (
              <button
                className="button guidedTourCompactFinish"
                type="button"
                onClick={() => setShowCompletion(true)}
              >
                {t("finishOnboarding")}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}

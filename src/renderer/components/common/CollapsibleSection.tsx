import { ReactNode, useEffect, useState } from "react";

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  tourId?: string;
};

const TOUR_OPEN_EVENT = "stream-chat-hub:tour-open";

function useTourControlledOpen(
  tourId: string | undefined,
  defaultOpen: boolean
) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    function handleTourOpen(event: Event) {
      const customEvent = event as CustomEvent<{ tourId?: string }>;

      if (tourId && customEvent.detail?.tourId === tourId) {
        setIsOpen(true);
      }
    }

    window.addEventListener(TOUR_OPEN_EVENT, handleTourOpen);
    return () => window.removeEventListener(TOUR_OPEN_EVENT, handleTourOpen);
  }, [tourId]);

  return [isOpen, setIsOpen] as const;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
  tourId,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useTourControlledOpen(tourId, defaultOpen);

  return (
    <section
      className={isOpen ? "card collapsible open" : "card collapsible"}
      data-tour-section-id={tourId}
    >
      <button
        className="collapsibleHeader"
        data-tour-id={tourId}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="collapseIcon">{isOpen ? "▾" : "▸"}</span>
        <span className="collapsibleTitle">{title}</span>
        {badge && <span className="sectionBadge">{badge}</span>}
      </button>

      {isOpen && <div className="collapsibleBody">{children}</div>}
    </section>
  );
}

export function MiniCollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
  tourId,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useTourControlledOpen(tourId, defaultOpen);

  return (
    <section
      className={isOpen ? "card collapsible open" : "card collapsible"}
      data-tour-section-id={tourId}
    >
      <button
        className="collapsibleHeader"
        data-tour-id={tourId}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="collapseIcon">{isOpen ? "▾" : "▸"}</span>
        <span className="collapsibleTitle">{title}</span>
        {badge && <span className="sectionBadge">{badge}</span>}
      </button>

      {isOpen && <div className="collapsibleBody">{children}</div>}
    </section>
  );
}

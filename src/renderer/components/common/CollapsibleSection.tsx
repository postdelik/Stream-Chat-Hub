import { ReactNode, useState } from "react";

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string;
};

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={isOpen ? "card collapsible open" : "card collapsible"}>
      <button
        className="collapsibleHeader"
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
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={isOpen ? "card collapsible open" : "card collapsible"}>
      <button
        className="collapsibleHeader"
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

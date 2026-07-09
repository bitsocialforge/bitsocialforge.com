import type { ReactNode } from "react";

type MobileMenuProps = {
  isOpen: boolean;
  children: ReactNode;
  onTransitionEnd?: () => void;
};

export function MobileMenu({ isOpen, children, onTransitionEnd }: MobileMenuProps) {
  return (
    <div
      className={`mobile-menu${isOpen ? " is-open" : ""}`}
      onTransitionEnd={(event) => {
        if (event.propertyName !== "grid-template-rows" || isOpen) {
          return;
        }

        onTransitionEnd?.();
      }}
    >
      <div className="mobile-menu-inner">
        <nav className="mobile-menu-nav" aria-label="Mobile">
          {children}
        </nav>
      </div>
    </div>
  );
}

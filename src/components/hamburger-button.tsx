import { useRef } from "react";

type HamburgerButtonProps = {
  isOpen: boolean;
  onClick: () => void;
};

export function HamburgerButton({ isOpen, onClick }: HamburgerButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    onClick();
    requestAnimationFrame(() => {
      buttonRef.current?.blur();
    });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`topbar-hamburger${isOpen ? " is-open" : ""}`}
      onClick={handleClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      <span className="topbar-hamburger-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}

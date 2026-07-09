import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { ForgeMark } from "./forge-mark";
import { HamburgerButton } from "./hamburger-button";
import { MobileMenu } from "./mobile-menu";

const compactNavigationTriggerBufferPx = 160;

type TopbarLink = {
  label: string;
  href: string;
  external?: boolean;
};

const TOPBAR_LINKS: TopbarLink[] = [
  { label: "Forge RPC", href: "#forge-rpc" },
  { label: "Master Plan", href: "#master-plan" },
  { label: "Bitsocial", href: "https://bitsocial.net", external: true },
  { label: "X", href: "https://x.com/bitsocialforge", external: true },
];

function TopbarNavLink({
  link,
  onClick,
  className,
}: {
  link: TopbarLink;
  onClick?: () => void;
  className?: string;
}) {
  const linkClassName = className ? `topbar-link ${className}` : "topbar-link";

  if (link.external) {
    return (
      <a
        href={link.href}
        className={linkClassName}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {link.label}
      </a>
    );
  }

  return (
    <a href={link.href} className={linkClassName} onClick={onClick}>
      {link.label}
    </a>
  );
}

function TopbarLinks({ links, onNavClick }: { links: TopbarLink[]; onNavClick: () => void }) {
  return (
    <div className="topbar-links">
      {links.map((link) => (
        <TopbarNavLink key={link.href} link={link} onClick={onNavClick} />
      ))}
    </div>
  );
}

function DesktopNavigation({ links, onNavClick }: { links: TopbarLink[]; onNavClick: () => void }) {
  return (
    <div className="topbar-desktop-nav">
      <TopbarLinks links={links} onNavClick={onNavClick} />
    </div>
  );
}

function NoJsMobileMenu({ links }: { links: TopbarLink[] }) {
  return (
    <details className="nojs-mobile-menu">
      <summary className="nojs-mobile-summary">
        <span className="sr-only">Menu</span>
        <span className="nojs-mobile-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </summary>

      <div className="nojs-mobile-panel">
        <nav className="mobile-menu-nav" aria-label="Mobile">
          {links.map((link) => (
            <TopbarNavLink key={link.href} link={link} className="mobile-menu-link" />
          ))}
        </nav>
      </div>
    </details>
  );
}

export function TopbarSpacer() {
  return <div className="topbar-spacer" aria-hidden="true" />;
}

export function Topbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [usesCompactNavigation, setUsesCompactNavigation] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );
  const menuContainerRef = useRef<HTMLElement>(null);
  const topbarContentRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const desktopNavMeasureRef = useRef<HTMLDivElement>(null);
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const updateNavigationMode = useCallback(() => {
    const availableWidth = topbarContentRef.current?.getBoundingClientRect().width ?? 0;
    const logoWidth = logoRef.current?.getBoundingClientRect().width ?? 0;
    const desktopNavWidth = desktopNavMeasureRef.current?.getBoundingClientRect().width ?? 0;

    if (!availableWidth || !logoWidth || !desktopNavWidth) {
      return;
    }

    const nextUsesCompactNavigation =
      logoWidth + desktopNavWidth + compactNavigationTriggerBufferPx > availableWidth;
    setUsesCompactNavigation((current) =>
      current === nextUsesCompactNavigation ? current : nextUsesCompactNavigation,
    );
  }, []);

  useLayoutEffect(() => {
    updateNavigationMode();

    const resizeObserver = new ResizeObserver(() => {
      updateNavigationMode();
    });

    if (topbarContentRef.current) {
      resizeObserver.observe(topbarContentRef.current);
    }

    if (logoRef.current) {
      resizeObserver.observe(logoRef.current);
    }

    if (desktopNavMeasureRef.current) {
      resizeObserver.observe(desktopNavMeasureRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [updateNavigationMode]);

  useEffect(() => {
    if (!usesCompactNavigation) {
      setIsMobileMenuOpen(false);
      setIsMenuExpanded(false);
    }
  }, [usesCompactNavigation]);

  useEffect(() => {
    if (!usesCompactNavigation || !isMobileMenuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (menuContainerRef.current?.contains(event.target as Node)) {
        return;
      }

      event.preventDefault();
      closeMobileMenu();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [closeMobileMenu, usesCompactNavigation, isMobileMenuOpen]);

  const handleNavClick = () => {
    closeMobileMenu();
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen((isOpen) => {
      const nextIsOpen = !isOpen;
      if (nextIsOpen) {
        setIsMenuExpanded(true);
      }
      return nextIsOpen;
    });
  };

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    handleNavClick();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav
      ref={menuContainerRef}
      className="topbar-shell"
      aria-label="Bitsocial Forge site navigation"
    >
      <div className={`topbar-frosted${isMenuExpanded ? " is-expanded" : ""}`}>
        <div className="topbar-inner">
          <div ref={desktopNavMeasureRef} className="topbar-measure" aria-hidden="true">
            <DesktopNavigation links={TOPBAR_LINKS} onNavClick={handleNavClick} />
          </div>

          <div ref={topbarContentRef} className="topbar-content">
            <a
              ref={logoRef}
              href="/"
              className="topbar-brand"
              aria-label="Bitsocial Forge home"
              onClick={handleLogoClick}
            >
              <span className="topbar-brand-mark" aria-hidden="true">
                <ForgeMark />
              </span>
              <span className="topbar-brand-name">
                Bitsocial <em>Forge</em>
              </span>
            </a>

            {usesCompactNavigation ? (
              <div className="topbar-compact-controls">
                <HamburgerButton isOpen={isMobileMenuOpen} onClick={handleMenuToggle} />
              </div>
            ) : (
              <DesktopNavigation links={TOPBAR_LINKS} onNavClick={handleNavClick} />
            )}

            <noscript>
              <NoJsMobileMenu links={TOPBAR_LINKS} />
            </noscript>
          </div>
        </div>

        <MobileMenu
          isOpen={usesCompactNavigation && isMobileMenuOpen}
          onTransitionEnd={() => setIsMenuExpanded(false)}
        >
          {TOPBAR_LINKS.map((link) => (
            <TopbarNavLink
              key={link.href}
              link={link}
              onClick={handleNavClick}
              className="mobile-menu-link"
            />
          ))}
        </MobileMenu>
      </div>
    </nav>
  );
}

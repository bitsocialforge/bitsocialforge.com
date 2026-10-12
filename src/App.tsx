import { Analytics } from "@vercel/analytics/react";
import type { CSSProperties, ReactNode } from "react";
import { ForgeMark } from "./components/forge-mark";
import { Topbar, TopbarSpacer } from "./components/topbar";

type CustomProperties = CSSProperties & Record<`--${string}`, string>;

type Ember = {
  x: string;
  s: string;
  dur: string;
  delay: string;
  drift: string;
};

const embers: Ember[] = [
  { x: "6%", s: "3px", dur: "11s", delay: "0s", drift: "18px" },
  { x: "14%", s: "2px", dur: "14s", delay: "-3s", drift: "-24px" },
  { x: "23%", s: "4px", dur: "9s", delay: "-6s", drift: "30px" },
  { x: "31%", s: "2px", dur: "16s", delay: "-1s", drift: "-14px" },
  { x: "40%", s: "3px", dur: "12s", delay: "-8s", drift: "22px" },
  { x: "48%", s: "2px", dur: "15s", delay: "-4s", drift: "-30px" },
  { x: "56%", s: "3px", dur: "10s", delay: "-9s", drift: "12px" },
  { x: "63%", s: "2px", dur: "17s", delay: "-2s", drift: "-18px" },
  { x: "71%", s: "4px", dur: "11s", delay: "-7s", drift: "26px" },
  { x: "79%", s: "2px", dur: "13s", delay: "-5s", drift: "-22px" },
  { x: "87%", s: "3px", dur: "12s", delay: "-10s", drift: "16px" },
  { x: "94%", s: "2px", dur: "15s", delay: "-1.5s", drift: "-12px" },
];

const terminalLines: Array<{ delay: string; children: ReactNode }> = [
  {
    delay: ".3s",
    children: (
      <>
        <span className="p">$</span> forge create community
      </>
    ),
  },
  {
    delay: ".9s",
    children: (
      <>
        <span className="c">&gt;</span> generating anchor keypair{" "}
        <span className="ok">... done</span>
      </>
    ),
  },
  {
    delay: "1.5s",
    children: (
      <>
        <span className="c">&gt;</span> anchor key returned to owner{" "}
        <span className="c">(never stored by forge)</span>
      </>
    ),
  },
  {
    delay: "2.1s",
    children: (
      <>
        <span className="c">&gt;</span> community online:{" "}
        <span className="ok">unstoppable · p2p · yours</span>
      </>
    ),
  },
  {
    delay: "2.7s",
    children: (
      <>
        <span className="p">$</span> <span className="term-caret" />
      </>
    ),
  },
];

type CustodyStep = {
  holder: string;
  title: string;
  body: string;
};

const custodySteps: CustodyStep[] = [
  {
    holder: "held by you · offline",
    title: "Anchor key",
    body: "Your community's identity. Handed to you once at creation and never stored by Forge.",
  },
  {
    holder: "held by Forge · online",
    title: "Minter key",
    body: "Signs routine updates on your behalf. It only counts while your anchor points to it.",
  },
  {
    holder: "served peer-to-peer",
    title: "Your community",
    body: "Its address derives from your anchor key, so it outlives any single host.",
  },
];

type SheetRow = {
  key: string;
  lead: string;
  body: string;
};

const imagesSheet: SheetRow[] = [
  {
    key: "price",
    lead: "Free.",
    body: "No paid tiers, subscriptions, or per-upload fees. Voluntary support never changes access, limits, retention, moderation, or availability.",
  },
  {
    key: "access",
    lead: "Anonymous uploads.",
    body: "Abuse controls, not a pricing ladder, and free credentials for client integrations. Paying for Forge RPC unlocks nothing here.",
  },
  {
    key: "links",
    lead: "Content-addressed, no expiry.",
    body: "Stable URLs that do not lapse from age or inactivity. Legal and abuse removals still apply.",
  },
  {
    key: "privacy",
    lead: "Metadata handling.",
    body: "Metadata is removed from supported images and videos where possible. GIFs, SWFs, and files that cannot be processed safely stay unchanged. Remove sensitive metadata before uploading.",
  },
  {
    key: "review",
    lead: "Moderated before serving.",
    body: "New uploads stay private until review clears. Automated checks and human review are backed by reports, takedowns, and hash blocking.",
  },
  {
    key: "scope",
    lead: "One provider, not a filter.",
    body: "Forge Images moderates what it hosts. Clients keep their own list of upload providers, so no single host decides what the network can see.",
  },
];

const services = [
  {
    id: "images",
    name: "Forge Images",
    domain: "images.bitsocialforge.com",
    description:
      "Free image and video hosting. Upload anonymously and get a link to share anywhere, with no expiry.",
  },
  {
    id: "5archive",
    name: "5archive",
    domain: "5archive.org",
    description:
      "Search and browse archived 5chan threads. A read-only home for discussions after they leave the live boards.",
  },
  {
    id: "seeditarchive",
    name: "Seedit Archive",
    domain: "seeditarchive.org",
    description:
      "Search and revisit posts from public Seedit communities, preserved beyond the live community pages.",
  },
];

function emberStyle(ember: Ember): CustomProperties {
  return {
    "--x": ember.x,
    "--s": ember.s,
    "--dur": ember.dur,
    "--delay": ember.delay,
    "--drift": ember.drift,
  };
}

function delayStyle(delay: string): CSSProperties {
  return {
    animationDelay: delay,
  };
}

function Atmosphere() {
  return (
    <>
      <div className="furnace-glow" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
      <div className="embers" aria-hidden="true">
        {embers.map((ember) => (
          <span key={`${ember.x}-${ember.delay}`} style={emberStyle(ember)} />
        ))}
      </div>
    </>
  );
}

function TerminalDemo() {
  return (
    <div
      className="terminal"
      role="img"
      aria-label="Illustration: creating a community with Forge RPC returns its anchor key to the owner, and Forge never stores it."
    >
      <div className="term-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>forge — rpc</span>
      </div>
      <div className="term-body" aria-hidden="true">
        {terminalLines.map((line) => (
          <span className="term-line" key={line.delay} style={delayStyle(line.delay)}>
            {line.children}
          </span>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" aria-label="Intro">
      <p className="eyebrow">Bitsocial Forge Inc.</p>
      <h1>
        Accelerate
        <br />
        peer-to-peer
        <br />
        <span className="hot">social media</span>
      </h1>
      <p className="lede">
        Bitsocial Forge builds infrastructure for <strong>Bitsocial</strong>: the open-source
        peer-to-peer network for social apps. <strong>No servers. No global bans.</strong> Users and
        communities are cryptographic property.
      </p>
      <div className="cta">
        <a className="btn primary" href="#services">
          Explore our services
        </a>
        <a className="btn ghost" href="https://x.com/bitsocialforge" rel="noopener">
          Follow @bitsocialforge
        </a>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" aria-labelledby="services-heading">
      <hr className="heat-rule" />
      <div className="sec-head">
        <h2 id="services-heading">Our services</h2>
      </div>
      <p className="sec-intro">
        Media hosting, search, and archives. Built and operated by Bitsocial Forge for the open
        network.
      </p>
      <ul className="service-list" role="list">
        {services.map((service) => (
          <li key={service.id}>
            <a
              className="service-link"
              href={`https://${service.domain}`}
              aria-labelledby={`${service.id}-name`}
              aria-describedby={`${service.id}-summary`}
            >
              <div className="service-identity">
                <h3 id={`${service.id}-name`}>{service.name}</h3>
                <span className="service-domain">{service.domain}</span>
              </div>
              <p id={`${service.id}-summary`}>{service.description}</p>
              <span className="service-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="service-next">
        In development: <a href="#forge-rpc">Forge RPC</a>, hosted nodes for your communities.
      </p>
    </section>
  );
}

function CustodyChain() {
  return (
    <div className="custody">
      <ol className="custody-steps">
        {custodySteps.map((step) => (
          <li key={step.title}>
            <span className="custody-node" aria-hidden="true" />
            <h3>{step.title}</h3>
            <p className="custody-holder">{step.holder}</p>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
      <p className="custody-exit">
        <span className="k">exit</span>
        <span>
          Sign a new anchor record pointing at your own node or a rival RPC, and Forge&apos;s minter
          key stops counting. Settings, content, signed moderation logs, and ownership history
          export at any time.
        </span>
      </p>
    </div>
  );
}

function ForgeRpc() {
  return (
    <section id="forge-rpc" aria-label="Forge RPC">
      <hr className="heat-rule" />
      <div className="sec-head">
        <h2>Forge RPC</h2>
        <span className="badge">In development</span>
      </div>
      <p className="sec-intro">
        <strong>The first public Bitsocial RPC.</strong> Forge RPC is for Bitsocial what Infura is
        for Ethereum: hosted nodes that keep your communities online, so you can create and run them
        from a browser or a phone with nothing more than a credential and a websocket.
      </p>
      <p className="sec-intro">
        Bitsocial nodes are light enough for a Raspberry Pi, so hosting is a convenience you can
        leave, not a dependency. Forge RPC is{" "}
        <strong>convenience infrastructure, not the owner of the protocol</strong>.
      </p>

      <CustodyChain />

      <p className="earned">
        Reasons to stay are <strong>earned, not enforced</strong>: uptime, moderation tooling,
        challenge editing with rollback, backups, analytics, and ad-free paid tiers.
      </p>

      <p className="rpc-note">
        Dashboard launching at <code>rpc.bitsocialforge.com</code>. Follow{" "}
        <a href="https://x.com/bitsocialforge" rel="noopener">
          @bitsocialforge
        </a>{" "}
        for updates.
      </p>
      <TerminalDemo />
    </section>
  );
}

function ForgeImages() {
  return (
    <section id="forge-images" aria-label="Forge Images">
      <hr className="heat-rule" />
      <div className="sec-head">
        <h2>Forge Images</h2>
      </div>
      <p className="sec-intro">
        <strong>Free media hosting for the open social web.</strong> Upload images, GIFs, and video
        directly on Forge Images, or from the upload button in 5chan. Get a link you can post
        anywhere, with no account required.
      </p>
      <p className="images-action">
        <a className="btn primary" href="https://images.bitsocialforge.com">
          Open Forge Images <span aria-hidden="true">↗</span>
        </a>
      </p>

      <dl className="sheet">
        {imagesSheet.map((row) => (
          <div className="sheet-row" key={row.key}>
            <dt>{row.key}</dt>
            <dd>
              <strong>{row.lead}</strong> {row.body}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ForgeRole() {
  return (
    <section id="forge-role" aria-label="Forge's role">
      <hr className="heat-rule" />
      <div className="sec-head">
        <h2>Forge&apos;s Role</h2>
      </div>
      <p className="sec-intro">
        <strong>A company inside a protocol it does not own.</strong> Bitsocial Forge executes{" "}
        <a href="https://bitsocial.net" rel="noopener">
          the Bitsocial master plan
        </a>{" "}
        from Phase 1: build the infrastructure the network needs before a market for it exists, then
        work to make that market exist.
      </p>

      <div className="split">
        <div className="split-side">
          <h3>Bitsocial</h3>
          <p>
            The protocol. Open source and owned by nobody, home to 5chan, Seedit, and the shared
            client libraries.
          </p>
          <a href="https://github.com/bitsocialnet" rel="noopener">
            github.com/bitsocialnet
          </a>
        </div>
        <div className="split-side">
          <h3>Bitsocial Forge Inc.</h3>
          <p>
            The company. It builds and runs services on the protocol: Forge Images, 5archive, Seedit
            Archive, and the upcoming Forge RPC.
          </p>
          <a href="https://github.com/bitsocialforge" rel="noopener">
            github.com/bitsocialforge
          </a>
        </div>
      </div>

      <ul className="tenets">
        <li>
          <strong>First, not only.</strong> A peer-to-peer network still needs someone to run the
          unglamorous parts on day one. Being first is a starting position, not a claim on the
          category.
        </li>
        <li>
          <strong>Tooling for our own competition.</strong> The wire-protocol client package and
          reference operator dashboard are built to be published, so rival RPCs stay wire-compatible
          without any Forge code.
        </li>
        <li>
          <strong>Revenue routed back out.</strong> A profitable Forge should fund the ecosystem it
          competes in: independent clients, competing RPCs, media hosts, moderation and indexing
          tools. Intent, not a live program.
        </li>
      </ul>

      <blockquote className="quote">
        <p>
          &quot;The end state is not one app. It is a market of clients, nodes, services, and
          communities that can replace platform ownership with{" "}
          <span className="hot">protocol competition</span>.&quot;
        </p>
        <footer>the Bitsocial master plan</footer>
      </blockquote>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-brand">
          <ForgeMark />
          <span>© 2026 Bitsocial Forge Inc.</span>
        </div>
        <nav className="foot-links" aria-label="Footer">
          <a href="#services">Our services</a>
          <a href="https://bitsocial.net" rel="noopener">
            bitsocial.net
          </a>
          <a href="https://docs.bitsocial.net" rel="noopener">
            docs
          </a>
          <a href="https://github.com/bitsocialforge" rel="noopener">
            github
          </a>
          <a href="https://x.com/bitsocialforge" rel="noopener">
            x / twitter
          </a>
        </nav>
        <p className="colophon">
          Forged on the open <b>Bitsocial</b> protocol · no servers · no global bans · keys over
          custody
        </p>
      </div>
    </footer>
  );
}

export function App() {
  return (
    <>
      <Atmosphere />
      <Topbar />
      <TopbarSpacer />
      <div className="wrap">
        <main>
          <Hero />
          <Services />
          <ForgeImages />
          <ForgeRpc />
          <ForgeRole />
        </main>
      </div>
      <SiteFooter />
      <Analytics />
    </>
  );
}

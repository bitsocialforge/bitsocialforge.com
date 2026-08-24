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
    <div className="terminal" aria-label="Terminal demo">
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
        <span className="cursor" aria-hidden="true" />
      </h1>
      <p className="lede">
        Bitsocial Forge builds infrastructure for <strong>Bitsocial</strong>: the open-source
        peer-to-peer network for social apps. <strong>No servers. No global bans.</strong> Users and
        communities are cryptographic property.
      </p>
      <div className="cta">
        <a className="btn primary" href="#forge-rpc">
          Forge RPC ↓
        </a>
        <a className="btn ghost" href="https://x.com/bitsocialforge" rel="noopener">
          Follow @bitsocialforge
        </a>
      </div>
      <TerminalDemo />
    </section>
  );
}

function ForgeRpc() {
  return (
    <section id="forge-rpc" aria-label="Forge RPC">
      <hr className="heat-rule" />
      <div className="sec-head">
        <span className="sec-num">01</span>
        <h2>Forge RPC</h2>
        <span className="badge">In development</span>
      </div>
      <p className="sec-intro">
        <strong>The first public Bitsocial RPC service.</strong> Forge RPC is for Bitsocial what
        Infura is for Ethereum: hosted infrastructure that lets anyone create and manage always-on
        p2p communities, including from mobile, without running their own node on day one.
      </p>
      <p className="sec-intro">
        Unlike blockchain infrastructure, Bitsocial nodes are light: they run on a Raspberry Pi and
        serve text-first content that users themselves can seed. The public RPC is{" "}
        <strong>convenience infrastructure, not the owner of the protocol</strong>.
      </p>

      <div className="spec">
        <div className="spec-row">
          <span className="k">custody</span>
          <div>
            <h3>Non-custodial by design</h3>
            <p>
              Your community&apos;s anchor key is returned to you once, at creation, and never
              stored. Forge publishes on your behalf with a rotatable delegate key, so identity
              stays tied to your keys, not our database.
            </p>
          </div>
        </div>
        <div className="spec-row">
          <span className="k">exit</span>
          <div>
            <h3>Exit, preserved</h3>
            <p>
              Export settings, content, signed moderation logs, and ownership history at any time.
              Re-point your community to a competing RPC or a self-hosted node. Identity survives
              without Forge&apos;s cooperation.
            </p>
          </div>
        </div>
        <div className="spec-row">
          <span className="k">mobile</span>
          <div>
            <h3>Unstoppable, from a phone</h3>
            <p>
              Create and manage p2p communities from mobile. All it takes is a durable credential
              and a websocket. No local node required, self-hosting always optional.
            </p>
          </div>
        </div>
        <div className="spec-row">
          <span className="k">retention</span>
          <div>
            <h3>Earned, not enforced</h3>
            <p>
              Reasons to stay are earned: uptime, moderation tooling, challenge editing with
              rollback, backups, analytics, and ad-free paid tiers. Never lock-in.
            </p>
          </div>
        </div>
      </div>

      <p className="rpc-note">
        Dashboard launching at <code>rpc.bitsocialforge.com</code>. Follow{" "}
        <a href="https://x.com/bitsocialforge" rel="noopener">
          @bitsocialforge
        </a>{" "}
        for updates.
      </p>
    </section>
  );
}

function ForgeImages() {
  return (
    <section id="forge-images" aria-label="Forge Images">
      <hr className="heat-rule" />
      <div className="sec-head">
        <span className="sec-num">02</span>
        <h2>Forge Images</h2>
        <span className="badge">Coming soon</span>
      </div>
      <p className="sec-intro">
        <strong>Free media hosting for the open social web.</strong> Forge Images is a Catbox-like
        utility for uploading images, GIFs, and video from Bitsocial clients. Its first integration
        will make the upload button in 5chan&apos;s web post form work directly in the browser.
      </p>
      <p className="sec-intro">
        Forge Images is <strong>free by design</strong>: no paid hosting tiers, subscriptions, or
        per-upload fees. Voluntary support may help fund the service, but it will never change
        access, limits, retention, moderation, or availability.
      </p>

      <div className="spec">
        <div className="spec-row">
          <span className="k">free</span>
          <div>
            <h3>No hosting paywall</h3>
            <p>
              Anonymous uploads and free integration credentials use abuse controls, not a pricing
              ladder. Paying for Forge RPC will never unlock Forge Images privileges.
            </p>
          </div>
        </div>
        <div className="spec-row">
          <span className="k">direct</span>
          <div>
            <h3>Built into the post form</h3>
            <p>
              Browser users choose a file, Forge Images uploads it, and the resulting media URL is
              inserted into the post. No separate uploader tab or webview automation.
            </p>
          </div>
        </div>
        <div className="spec-row">
          <span className="k">durable</span>
          <div>
            <h3>Content-addressed, with no expiry</h3>
            <p>
              Files use stable, content-addressed URLs and do not expire because of age or
              inactivity. Legal and abuse removals still apply.
            </p>
          </div>
        </div>
        <div className="spec-row">
          <span className="k">safety</span>
          <div>
            <h3>Moderated before serving</h3>
            <p>
              New uploads stay private until required automated checks complete. Reports, takedowns,
              hash blocking, and human review are part of the service design.
            </p>
          </div>
        </div>
      </div>

      <p className="rpc-note">
        Coming soon. Public uploads will open only after legal, abuse-response, moderation,
        security, and infrastructure launch gates are complete.
      </p>
    </section>
  );
}

function MasterPlan() {
  return (
    <section id="master-plan" aria-label="Master plan">
      <hr className="heat-rule" />
      <div className="sec-head">
        <span className="sec-num">03</span>
        <h2>Master Plan</h2>
      </div>
      <p className="sec-intro">
        Bitsocial Forge executes the{" "}
        <a href="https://bitsocial.net" rel="noopener">
          Bitsocial master plan
        </a>
        : replace platform ownership with protocol competition, one phase at a time.
      </p>

      <ol className="phases">
        <li className="ongoing">
          <span className="phase-tag">
            Phase 01 <span className="badge live">Ongoing</span>
          </span>
          <h3>Decentralize imageboards &amp; forums</h3>
          <p>
            <a href="https://5chan.app" rel="noopener">
              5chan
            </a>{" "}
            and{" "}
            <a href="https://seedit.app" rel="noopener">
              Seedit
            </a>{" "}
            prove Bitsocial can replace centralized boards without global admins. Forge RPC makes
            always-on p2p communities practical from anywhere.
          </p>
        </li>
        <li>
          <span className="phase-tag">Phase 02</span>
          <h3>Launch Bitsocial Chain</h3>
          <p>
            The proposed Ethereum L2 appchain economic layer: decentralized <code>.bso</code>{" "}
            domains, awards and tipping, common liquidity, and practical monetization for Bitsocial
            apps.
          </p>
        </li>
        <li>
          <span className="phase-tag">Phase 03</span>
          <h3>Launch the flagship Bitsocial app</h3>
          <p>
            The first profile-based client: posts, follows, real-time public conversation. As
            familiar as a modern For-You app, while letting users switch RPCs, feeds, algorithms, or
            remove ranking entirely.
          </p>
        </li>
        <li>
          <span className="phase-tag">Phase 04</span>
          <h3>Scale Bitsocial economies</h3>
          <p>
            Infrastructure pluralism: many competing RPCs, hosting, discovery, and moderation
            services. Forge&apos;s RPC should not be the only successful RPC. That is the point.
          </p>
        </li>
        <li>
          <span className="phase-tag">Phase 05</span>
          <h3>Decentralize all social media</h3>
          <p>
            Fund and build the long tail of social clients: blogging, crowdfunding, creator video,
            and every format too early for the first four phases.
          </p>
        </li>
      </ol>

      <blockquote className="quote">
        <p>
          &quot;The end state is not one app. It is a market of clients, nodes, services, and
          communities that replaces platform ownership with{" "}
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
          <a href="https://5chan.app" rel="noopener">
            5chan
          </a>
          <a href="https://seedit.app" rel="noopener">
            seedit
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
          <ForgeRpc />
          <ForgeImages />
          <MasterPlan />
        </main>
      </div>
      <SiteFooter />
      <Analytics />
    </>
  );
}

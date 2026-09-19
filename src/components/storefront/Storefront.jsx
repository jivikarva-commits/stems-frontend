import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowUpRight,
  ArrowRight,
  Layers,
  Database,
  Globe2,
  FolderOpen,
  Download,
  ShieldCheck,
  Check,
  Menu,
  X,
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  Users,
  Clock3,
  Zap,
  LockKeyhole,
} from "lucide-react";
import { product, priceLabel, faqs } from "../../config/product";
import { track } from "../../lib/tracking";
import { CheckoutProvider, PaymentButton } from "./Checkout";
import "./storefront.css";
export function Brand() {
  return (
    <Link to="/" className="st-brand" aria-label="Stems home">
      <span>
        <Layers size={22} />
      </span>
      stems<span className="brand-dot">.</span>
      <small>DATABASE</small>
    </Link>
  );
}
export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="st-nav">
      <div className="st-wrap nav-inner">
        <Brand />
        <nav className={open ? "is-open" : ""} aria-label="Main navigation">
          <a href="/#included" onClick={() => setOpen(false)}>
            What's included
          </a>
          <a href="/#categories" onClick={() => setOpen(false)}>
            Categories
          </a>
          <a href="/#preview" onClick={() => setOpen(false)}>
            Preview
          </a>
          <a href="/#faq" onClick={() => setOpen(false)}>
            FAQ
          </a>
        </nav>
        <PaymentButton className="nav-cta">
          Get access {priceLabel}
        </PaymentButton>
        <button
          className="mobile-menu"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="st-footer st-wrap">
      <div>
        <Brand />
        <p>A better starting point for your next business conversation.</p>
      </div>
      <nav aria-label="Legal">
        <Link to="/privacy">Privacy policy</Link>
        <Link to="/terms">Terms & conditions</Link>
        <Link to="/refund">Refund policy</Link>
        <Link to="/contact">Contact</Link>
      </nav>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Stems. All rights reserved.</span>
        <span>Research responsibly. Reach out thoughtfully.</span>
      </div>
    </footer>
  );
}
export function StoreShell({ children }) {
  return (
    <div className="st-store">
      <CheckoutProvider>
        <a className="st-skip" href="#main">
          Skip to content
        </a>
        <Navbar />
        {children}
        <Footer />
      </CheckoutProvider>
    </div>
  );
}
export function StoreSEO({
  title = "USA Client Data — Business Leads Database | Stems",
  path = "/",
  noIndex = false,
}) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={product.description} />
      <meta
        name="robots"
        content={noIndex ? "noindex,nofollow" : "index,follow"}
      />
      <link rel="canonical" href={`https://stemscsai.in${path}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={product.description} />
      <meta property="og:url" content={`https://stemscsai.in${path}`} />
      <meta property="og:type" content="website" />
      <meta
        property="og:image"
        content="https://stemscsai.in/og-database.svg"
      />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={product.description} />
    </Helmet>
  );
}
const samples = [
  [
    "Northstar Studio",
    "Consultants · Austin",
    "Austin, TX",
    "northstar.example",
  ],
  ["Cedar & Co.", "Consultants · Chicago", "Chicago, IL", "cedar.example"],
  ["Orbit Cafe", "Cafes · Seattle", "Seattle, WA", "orbit.example"],
  ["Bluepeak Labs", "IT · Boston", "Boston, MA", "bluepeak.example"],
  ["Atlas Auto", "Auto repair · Denver", "Denver, CO", "atlas.example"],
];
export function DatabasePreview({ compact = false }) {
  return (
    <div className={`database-window ${compact ? "compact" : ""}`}>
      <div className="db-toolbar">
        <span className="window-dots">
          <i />
          <i />
          <i />
        </span>
        <span>stems / business database</span>
        <LockKeyhole size={13} />
      </div>
      <div className="db-body">
        <div className="db-heading">
          <div>
            <span className="eyebrow">YOUR NEXT OPPORTUNITY STARTS HERE</span>
            <h3>USA business directory</h3>
          </div>
          <span className="sample-pill">SAMPLE</span>
        </div>
        <div className="db-stats">
          <div>
            <Database size={16} />
            <strong>USA</strong>
            <span>business data</span>
          </div>
          <div>
            <Globe2 size={16} />
            <strong>CSV files</strong>
            <span>spreadsheet format</span>
          </div>
          <div>
            <FolderOpen size={16} />
            <strong>Organised</strong>
            <span>by category</span>
          </div>
        </div>
        <div className="db-controls">
          <span>
            <Search size={14} /> Explore your next prospect
          </span>
          <span>
            <SlidersHorizontal size={14} /> Categories
          </span>
        </div>
        <div
          className="sample-scroll"
          tabIndex="0"
          role="region"
          aria-label="Fictional database sample"
        >
          <table>
            <thead>
              <tr>
                <th aria-label="Row number">#</th>
                <th>Name</th>
                <th>Query</th>
                <th>Address</th>
                {!compact && <th>Website</th>}
              </tr>
            </thead>
            <tbody>
              {samples.map((row, i) => (
                <tr key={row[0]}>
                  <td>0{i + 1}</td>
                  <td>
                    <span className={`company-avatar avatar-${i}`}>
                      {row[0][0]}
                    </span>
                    {row[0]}
                  </td>
                  <td>
                    <span className="industry-pill">{row[1]}</span>
                  </td>
                  <td>{row[2]}</td>
                  {!compact && <td>{row[3]}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="db-foot">
          <span>
            <span className="status-dot" /> Fictional preview · Not actual paid
            records
          </span>
          <FileSpreadsheet size={15} />
        </div>
      </div>
    </div>
  );
}
export function Hero() {
  return (
    <section className="hero st-wrap">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="status-dot" /> THE STARTING POINT FOR BETTER
          PROSPECTING
        </p>
        <h1>
          500K+ USA
          <br />
          <span>CLIENT DATA</span>
        </h1>
        <p className="hero-description">
          Less searching. More possibilities. An organised business prospecting
          database for agencies, freelancers, and teams ready to find their next
          opportunity.
        </p>
        <div className="hero-actions">
          <PaymentButton />
          <a className="st-button secondary" href="#included">
            See what's included <ArrowRight size={17} />
          </a>
        </div>
        <p className="micro">
          One-time payment <span>·</span> Digital download <span>·</span> No
          subscription
        </p>
      </div>
      <div className="hero-visual">
        <div className="visual-top">
          <span>THE USA PROSPECTING COLLECTION</span>
          <span>VOL. 01 / B2B</span>
        </div>
        <div className="product-hero-frame">
          <img
            className="product-hero-image"
            src="/usa-client-data-product.webp"
            width="1672"
            height="941"
            alt="Stems USA Client Data digital collection with business categories, city-wise CSV files, and contact fields"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="visual-caption">
          <span>
            <ShieldCheck size={16} /> Secure checkout with Razorpay
          </span>
          <span>
            {priceLabel} <small>/ once</small>
          </span>
        </div>
      </div>
    </section>
  );
}
export function StatCards() {
  return (
    <div className="st-wrap stat-strip">
      {[
        [Database, "USA", "Business prospecting"],
        [Globe2, "City-wise", "Location-based files"],
        [FolderOpen, "Category-wise", "Organised for research"],
        [Download, "Digital access", "After verified payment"],
      ].map(([Icon, title, text]) => (
        <div key={title}>
          <Icon />
          <div>
            <strong>{title}</strong>
            <span>{text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
function SectionHeading({ label, title, text }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{label}</p>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}
export function ProblemSection() {
  return (
    <section className="st-section st-wrap">
      <div className="split-heading">
        <SectionHeading
          label="A BETTER WAY TO BEGIN"
          title={
            <>
              Finding prospects shouldn't
              <br />
              take your whole day.
            </>
          }
        />
        <p>
          Searching directories. Switching tabs. Copying details.
          <br />
          Start with an organised dataset and put your time into understanding
          the right businesses.
        </p>
      </div>
      <div className="three-grid">
        {[
          [
            Search,
            "Manual research",
            "Hours spent finding businesses, one search at a time.",
          ],
          [
            Layers,
            "Scattered information",
            "Useful details spread across websites and directories.",
          ],
          [
            Clock3,
            "Slow outreach",
            "More list building leaves less time for conversations.",
          ],
        ].map(([Icon, title, text]) => (
          <article className="st-card problem-card" key={title}>
            <Icon />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="process-line">
        <span>Manual search</span>
        <ArrowRight />
        <strong>
          <Database size={17} /> Organised database
        </strong>
        <ArrowRight />
        <span>Thoughtful outreach</span>
      </div>
    </section>
  );
}
export function Features() {
  return (
    <section id="included" className="st-section st-wrap">
      <div className="split-heading">
        <SectionHeading
          label="WHAT'S IN THE DATABASE"
          title={
            <>
              One purchase.
              <br />A stronger starting point.
            </>
          }
        />
        <p>
          A downloadable foundation for your own research.
          <br />
          Find a category, qualify the businesses, and make the next step yours.
        </p>
      </div>
      <div className="feature-grid">
        <article className="st-card feature-main">
          <span className="card-index">01 / THE COLLECTION</span>
          <div className="collection-art" aria-hidden="true">
            <div className="collection-sheet back" />
            <div className="collection-sheet">
              <Layers />
              <span>stems.</span>
              <strong>
                USA CLIENT
                <br />
                <em>DATA</em>
              </strong>
              <div className="sheet-lines" />
              <small>BUSINESS PROSPECTING COLLECTION</small>
            </div>
            <span className="art-tag">
              <Database size={17} /> USA · CSV collection
            </span>
          </div>
          <h3>Your next US business opportunity.</h3>
          <p>
            An organised USA business prospecting collection. A useful place to
            start, with your expertise guiding what happens next.
          </p>
        </article>
        <div className="feature-stack">
          {[
            [
              FolderOpen,
              "02 / ORGANISATION",
              "Find your focus.",
              "Category-wise organisation helps you approach business research with a clearer direction.",
            ],
            [
              FileSpreadsheet,
              "03 / SIMPLE TO USE",
              "Built for your workflow.",
              "CSV files organised by category and US city. Download individual spreadsheets from the supplied Google Drive folder.",
            ],
            [
              Zap,
              "04 / DIGITAL DELIVERY",
              "From payment to prospecting.",
              "After payment verification, open your protected access page and continue to the USA data folder.",
            ],
          ].map(([Icon, label, title, text]) => (
            <article className="st-card feature-small" key={label}>
              <Icon />
              <div>
                <span className="card-index">{label}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <p className="section-note">
        {product.fieldNote} Validate records before use.
      </p>
      <p className="section-note">
        Observed fields: {product.fields.join(" · ")}
      </p>
    </section>
  );
}
export function CategoryGrid() {
  const categories = product.categories;
  return (
    <section id="categories" className="st-section st-wrap">
      <SectionHeading
        label="FIND YOUR NICHE"
        title="Different industries. New possibilities."
        text="A selection of the actual business-category folders in the supplied USA collection."
      />
      <div className="category-grid">
        {categories.map((name, i) => (
          <div className="category-card" key={name}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <h3>{name}</h3>
            <ArrowUpRight size={17} />
          </div>
        ))}
      </div>
    </section>
  );
}
export function AudienceCards() {
  return (
    <section className="st-section st-wrap">
      <SectionHeading
        label="MADE FOR YOUR NEXT MOVE"
        title="For people building business."
        text="Whether you work independently or with a team, start your prospect research with structure."
      />
      <div className="audience-grid">
        {product.audiences.map(([title, text]) => (
          <article key={title}>
            <Users size={20} />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export function HowItWorks() {
  return (
    <section className="st-section st-wrap">
      <SectionHeading
        label="A SIMPLE PROCESS"
        title="Three steps. Then it's yours."
      />
      <div className="three-grid steps">
        {[
          [
            "01",
            "Purchase access",
            `Complete your secure ${priceLabel} one-time payment with Razorpay.`,
          ],
          [
            "02",
            "Payment confirmation",
            "Your payment is verified securely on our server.",
          ],
          [
            "03",
            "Open your data folder",
            "Access the Google Drive collection and download the files you need.",
          ],
        ].map(([num, title, text]) => (
          <article key={num}>
            <span className="step-number">{num}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export function PricingCard() {
  return (
    <section id="pricing" className="st-section st-wrap pricing-section">
      <div>
        <SectionHeading
          label="ONE CLEAR PRICE"
          title={
            <>
              More room to research.
              <br />
              Less time starting over.
            </>
          }
          text="Get the business prospecting collection with a single payment. No recurring fees. No complicated plans."
        />
        <div className="trust-list">
          <span>
            <ShieldCheck /> Secure Razorpay payment
          </span>
          <span>
            <Download /> Protected digital delivery
          </span>
          <span>
            <Check /> One-time purchase
          </span>
        </div>
      </div>
      <article className="pricing-card">
        <div className="price-top">
          <span className="eyebrow">THE COMPLETE COLLECTION</span>
          <span className="sample-pill">ONE-TIME</span>
        </div>
        <h3>{product.name}</h3>
        <div className="price">
          {priceLabel}
          <span>/ once</span>
        </div>
        <p>Your next prospecting project starts here.</p>
        <ul>
          {[
            "USA business prospecting data",
            "Category-wise folders",
            "City-specific CSV spreadsheets",
            "Google Drive delivery",
            "No subscription or recurring billing",
          ].map((text) => (
            <li key={text}>
              <Check size={17} />
              {text}
            </li>
          ))}
        </ul>
        <PaymentButton>
          Get instant access <span>{priceLabel}</span>
        </PaymentButton>
        <p className="price-secure">
          <LockKeyhole size={13} /> Secure payment powered by Razorpay
        </p>
      </article>
    </section>
  );
}
export function FAQ() {
  return (
    <section id="faq" className="st-section st-wrap faq-section">
      <SectionHeading
        label="BEFORE YOU GET STARTED"
        title={
          <>
            Good questions.
            <br />
            Straight answers.
          </>
        }
        text="Know exactly what you're getting and how it works."
      />
      <div>
        {faqs.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <span>+</span>
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
export function FinalCTA() {
  return (
    <section className="final-cta st-wrap">
      <span className="eyebrow">YOUR NEXT OPPORTUNITY IS OUT THERE</span>
      <h2>
        Stop starting your
        <br />
        prospect research from zero.
      </h2>
      <p>Start with structure. Bring your judgment. Make the connection.</p>
      <PaymentButton>Get USA client data — {priceLabel}</PaymentButton>
      <p className="micro">One-time payment · No subscription</p>
    </section>
  );
}
export default function Storefront() {
  useEffect(() => {
    track("PageView");
    track("ViewContent", {
      content_name: product.name,
      value: product.price,
      currency: "INR",
    });
  }, []);
  return (
    <StoreShell>
      <StoreSEO />
      <main id="main">
        <Hero />
        <StatCards />
        <ProblemSection />
        <Features />
        <CategoryGrid />
        <section id="preview" className="st-section st-wrap">
          <div className="split-heading">
            <SectionHeading
              label="A LOOK INSIDE"
              title={
                <>
                  Organised data.
                  <br />A clearer view of what's next.
                </>
              }
            />
            <p>
              Preview the experience with fictional sample records.
              <br />
              Based on the inspected CSV structure; fields vary by file.
            </p>
          </div>
          <DatabasePreview />
          <div className="preview-bottom">
            <p>
              Illustrative layout only. No private or paid records are shown.
            </p>
            <PaymentButton>Unlock full database — {priceLabel}</PaymentButton>
          </div>
        </section>
        <AudienceCards />
        <HowItWorks />
        <section className="st-section st-wrap">
          <SectionHeading
            label="SKIP THE BLANK SPREADSHEET"
            title="Give your research a head start."
          />
          <div className="comparison">
            <div>
              <span>STARTING FROM SCRATCH</span>
              <p>Multiple tools and scattered sources</p>
              <p>Hours of manual searching</p>
              <p>Build every list from zero</p>
            </div>
            <div>
              <span>
                <Layers size={17} /> STARTING WITH STEMS
              </span>
              <p>
                <Check /> An organised research foundation
              </p>
              <p>
                <Check /> Category-wise business data
              </p>
              <p>
                <Check /> {priceLabel} once. Access after verification.
              </p>
            </div>
          </div>
        </section>
        <PricingCard />
        <FAQ />
        <FinalCTA />
      </main>
    </StoreShell>
  );
}

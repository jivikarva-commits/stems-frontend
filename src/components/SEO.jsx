import { Helmet } from "react-helmet-async";

const SITE_URL = "https://stemscsai.in";
const SITE_NAME = "StemCSAI";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Drop-in SEO head manager for every page.
 *
 * Props:
 *   title          – page <title> (SEO component appends "| StemCSAI")
 *   description    – meta description (150-160 chars)
 *   keywords       – comma-separated keyword string (optional)
 *   canonical      – full canonical URL, e.g. "https://stemscsai.in/courses/ai"
 *   ogImage        – absolute OG image URL (falls back to og-image.png)
 *   noIndex        – set true for auth/private pages
 *   structuredData – JSON-LD object or array injected as <script type="application/ld+json">
 */
export default function SEO({
  title,
  description,
  keywords,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
  structuredData,
}) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — AI-Powered CS & STEM Education India`;

  const metaDesc =
    description ||
    "India's #1 AI-powered Company Secretary & CS education platform. Master ICSI CSEET, Executive & Professional with AI mentoring, mock tests, and adaptive study plans.";

  const canonicalUrl = canonical || SITE_URL;

  const schemas = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];

  return (
    <Helmet>
      {/* Core */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="STEMS AI" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

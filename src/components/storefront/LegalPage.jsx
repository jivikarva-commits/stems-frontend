import { StoreShell, StoreSEO } from "./Storefront";
import { product } from "../../config/product";
const pages = {
  privacy: {
    title: "Privacy policy",
    sections: [
      [
        "Purchase data",
        "We store the Razorpay order ID, payment ID, payment status, purchase timestamp, and a hashed purchase token to verify payments and provide downloads. Payment credentials are handled by Razorpay and are not stored by this website.",
      ],
      [
        "Browser storage",
        "Your browser stores a purchase token and any pending verification details in session storage. These are necessary for checkout and delivery. Closing the browser session may remove access; keep your payment ID for support.",
      ],
      [
        "Analytics",
        "Optional analytics events are prepared but disabled by default. If analytics are enabled later, they must respect your consent choices.",
      ],
      [
        "Contact and requests",
        "Use the contact page for privacy questions and requests concerning your purchase information.",
      ],
    ],
  },
  terms: {
    title: "Terms & conditions",
    sections: [
      [
        "Digital product",
        "This is a one-time purchase of access to a USA business prospecting collection, not a subscription, hosted software, or a done-for-you outreach service. Delivery is access to the supplied USA Leads Database Google Drive folder. The inspected business files are CSV spreadsheets; fields, coverage and completeness vary.",
      ],
      [
        "Responsible use",
        "You are responsible for complying with applicable privacy, data protection, marketing laws, and platform policies. Possessing contact information does not establish consent to contact a person. Verify your lawful basis, honour opt-out requests, and validate records before use.",
      ],
      [
        "Scope and limitations",
        "No clients, sales, revenue, response rates, record accuracy, or universal contactability are guaranteed. The public preview uses fictional records. No permission to resell or publicly redistribute the dataset is granted.",
      ],
      [
        "Delivery",
        "Downloads require captured payment, server verification, and a valid purchase session. The browser session expires after seven days; retain your payment ID for support.",
      ],
    ],
  },
  refund: {
    title: "Refund policy",
    sections: [
      [
        "Digital purchases",
        "Please review the product description before purchasing. For a duplicate charge, non-delivery, or a material mismatch with the description, contact support with your Razorpay payment ID and a description of the issue.",
      ],
      [
        "Review and resolution",
        "Purchase issues will be reviewed against payment and delivery records. Any approved refund is returned through the original payment provider. Processing time depends on your bank and payment method.",
      ],
      [
        "Your rights",
        "This policy does not limit any rights available under applicable consumer law.",
      ],
    ],
  },
  contact: {
    title: "Contact Stems",
    sections: [
      [
        "Purchase and download support",
        "Include your Razorpay payment ID, the date of purchase, and a short description of the issue. Never send card details, passwords, OTPs, or other payment credentials.",
      ],
    ],
  },
};
export default function LegalPage({ type }) {
  const page = pages[type];
  return (
    <StoreShell>
      <StoreSEO title={`${page.title} | Stems`} path={`/${type}`} />
      <main id="main" className="legal-page st-wrap">
        <p className="eyebrow">STEMS / CUSTOMER INFORMATION</p>
        <h1>{page.title}</h1>
        {page.sections.map(([heading, text]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            <p>{text}</p>
          </section>
        ))}
        {type === "contact" &&
          (product.supportEmail ? (
            <a href={`mailto:${product.supportEmail}`}>
              {product.supportEmail}
            </a>
          ) : (
            <p>
              Support contact details are being finalised. Checkout will remain
              closed until customer support are ready.
            </p>
          ))}
      </main>
    </StoreShell>
  );
}

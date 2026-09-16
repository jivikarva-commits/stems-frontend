export const product = {
  name: "USA Client Data",
  subtitle: "Business Leads Database",
  price: 199,
  description:
    "Explore USA business prospecting data organised by industry and city. Category-wise CSV files, delivered through Google Drive after a ₹199 one-time payment.",
  detailsConfirmed: true,
  format: "CSV files organised in Google Drive folders",
  fields: [
    "Business name",
    "Google Maps URL",
    "Search category / location",
    "Rating",
    "Review count",
    "Phone",
    "Address",
    "Website",
  ],
  fieldNote:
    "Fields confirmed in the inspected business-consultant CSV. Available columns and completeness can vary by file. No email coverage or total record count is claimed.",
  categories: [
    "Business Consultants",
    "Auto repair",
    "Car Dealerships",
    "Cafes",
    "Dentists",
    "Educational Services",
    "Event Planners",
    "Financial Planners",
    "Hotels",
    "IT Consultants",
    "Law Firms",
    "Plumbers",
  ],
  supportEmail: process.env.REACT_APP_SUPPORT_EMAIL || "noreplysam@gmail.com",
  audiences: [
    [
      "Freelancers",
      "Find a starting point for researching your next US business prospect.",
    ],
    [
      "Marketing agencies",
      "Build focused prospect lists for your agency’s services.",
    ],
    [
      "Web development agencies",
      "Research US businesses that fit your development offering.",
    ],
    [
      "B2B sales teams",
      "Spend more time qualifying prospects and planning conversations.",
    ],
    [
      "Export businesses",
      "Explore potential business prospects in the United States.",
    ],
    [
      "Startup founders",
      "Start your market research with an organised dataset.",
    ],
    [
      "Recruiters",
      "Research potential business clients for recruitment services.",
    ],
    [
      "Lead generation agencies",
      "Create a foundation for your own research and validation.",
    ],
  ],
};
export const priceLabel = `₹${product.price}`;
export const faqs = [
  [
    "What will I receive?",
    "Access to the USA Leads Database Google Drive folder, containing category-wise subfolders and city-specific business CSV files. The purchase is for access to this existing collection. No audited total record count is promised.",
  ],
  [
    "Is the product a PDF or a spreadsheet?",
    "The supplied product is a Google Drive folder. The business files inspected are CSV spreadsheets, not a single PDF. You can download individual files from Drive and open them in compatible spreadsheet software.",
  ],
  [
    "How will I receive the database?",
    "After Razorpay payment and server verification, your browser opens a protected access page. Select Open USA data folder to access the supplied Drive collection. Keep your payment ID for support.",
  ],
  [
    "Is this a subscription?",
    `No. This is a ${priceLabel} one-time purchase, with no recurring billing.`,
  ],
  [
    "Which fields are included?",
    "The inspected business-consultant CSV contains Name, URL, Query, Rating, Reviews, Phone, Address, and Website. Fields and completeness can vary across files. Email coverage is not promised.",
  ],
  [
    "Can I use it for my business?",
    "Use it as a starting point for business research. Validate records before use and follow applicable privacy, marketing, and platform rules. A purchase does not establish consent to contact anyone or grant resale rights.",
  ],
  [
    "Is the information recently verified?",
    "No freshness or verification guarantee is made. The inspected business-consultant files show October 2024 modification dates. Check each business’s current details before relying on a record.",
  ],
  [
    "How soon will I receive access?",
    "Access opens after your payment is captured and verified. If confirmation is delayed, use Retry verification instead of paying again. Your protected purchase session lasts up to seven days in the purchasing browser.",
  ],
  [
    "What payment methods are supported?",
    "Razorpay displays the methods available for your transaction, such as UPI, cards, and net banking.",
  ],
  [
    "Can I preview the database before purchasing?",
    "The table demonstrates the inspected file structure using entirely fictional businesses. No actual product records are shown publicly on this website.",
  ],
];

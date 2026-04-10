import { authenticate } from "../shopify.server";

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html) {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildTrovaprezziCategory(fullName, productType) {
  if (fullName && typeof fullName === "string") {
    return fullName
      .split(" > ")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(";");
  }

  if (productType && typeof productType === "string" && productType.trim()) {
    return productType.trim();
  }

  return "Altro";
}

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query {
      shop {
        name
        primaryDomain {
          url
        }
      }
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            descriptionHtml
            vendor
            productType
            category {
              fullName
            }
            featuredImage {
              url
            }
            variants(first: 1) {
              edges {
                node {
                  sku
                  barcode
                  price
                }
              }
            }
          }
        }
      }
    }
  `);

  const responseJson = await response.json();

  const shop = responseJson?.data?.shop || {};
  const primaryDomainUrl = shop?.primaryDomain?.url || "";

  const products = (responseJson?.data?.products?.edges || []).map(({ node }) => {
    const variant = node?.variants?.edges?.[0]?.node || {};
    const shopifyCategory = node?.category?.fullName || "";
    const trovaprezziCategory = buildTrovaprezziCategory(
      shopifyCategory,
      node?.productType || ""
    );

    const productUrl = primaryDomainUrl
      ? `${primaryDomainUrl.replace(/\/$/, "")}/products/${node.handle}`
      : "";

    return {
      id: node?.id || "",
      sku: variant?.sku || "",
      title: node?.title || "",
      description: stripHtml(node?.descriptionHtml || ""),
      link: productUrl,
      image: node?.featuredImage?.url || "",
      price: variant?.price || "",
      brand: node?.vendor || "",
      barcode: variant?.barcode || "",
      category: trovaprezziCategory,
      availability: "Disponibile",
    };
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<products>
${products
  .map(
    (product) => `  <product>
    <id>${escapeXml(product.sku || product.id)}</id>
    <sku>${escapeXml(product.sku)}</sku>
    <name>${escapeXml(product.title)}</name>
    <description>${escapeXml(product.description)}</description>
    <url>${escapeXml(product.link)}</url>
    <image>${escapeXml(product.image)}</image>
    <price>${escapeXml(product.price)}</price>
    <brand>${escapeXml(product.brand)}</brand>
    <barcode>${escapeXml(product.barcode)}</barcode>
    <category>${escapeXml(product.category)}</category>
    <availability>${escapeXml(product.availability)}</availability>
  </product>`
  )
  .join("\n")}
</products>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default function FeedTrovaprezziPage() {
  return (
    <div style={{ padding: "24px", fontFamily: "Inter, Arial, sans-serif" }}>
      <h1>Feed XML Trovaprezzi</h1>
      <p>
        Questa route restituisce XML. Aprila direttamente nel browser per vedere
        il feed.
      </p>
      <p>
        URL interno app: <strong>/app/feed-trovaprezzi</strong>
      </p>
    </div>
  );
}
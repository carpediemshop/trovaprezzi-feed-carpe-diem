import { unauthenticated } from "../shopify.server";

const SHOP_DOMAIN = "e9d9c4-38.myshopify.com";
const FEED_BRAND_FALLBACK = "Carpe Diem Shop";
const FEED_CATEGORY_FALLBACK = "Altro";

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
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeUrl(value) {
  const url = String(value ?? "").trim();
  if (!url) return "";

  try {
    return new URL(url).toString();
  } catch {
    return "";
  }
}

function normalizePrice(value) {
  const raw = String(value ?? "").replace(",", ".").trim();
  if (!raw) return "";

  const numeric = Number(raw);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "";
  }

  return numeric.toFixed(2);
}

function normalizeBarcode(value) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .trim();
}

function normalizeCategoryPath(value) {
  return String(value ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(";");
}

function buildTrovaprezziCategory(customCategory, shopifyCategoryFullName, productType) {
  const customValue = normalizeCategoryPath(customCategory);
  if (customValue) return customValue;

  const fullName = normalizeText(shopifyCategoryFullName);
  if (fullName) {
    return fullName
      .split(" > ")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(";");
  }

  const typeValue = normalizeText(productType);
  if (typeValue) return typeValue;

  return FEED_CATEGORY_FALLBACK;
}

function buildAvailability(product) {
  if (!product.price) return "Non disponibile";
  return "Disponibile";
}

function hasValidIdentity(product) {
  return Boolean(product.sku || product.id);
}

function isValidFeedProduct(product) {
  if (!product) return false;
  if (product.status !== "ACTIVE") return false;
  if (!hasValidIdentity(product)) return false;
  if (!product.title) return false;
  if (!product.link) return false;
  if (!product.image) return false;
  if (!product.price) return false;
  if (!product.category) return false;

  return true;
}

async function runShopifyGraphQL(admin, query, variables = {}) {
  const response = await admin.graphql(query, { variables });
  const json = await response.json();

  if (json?.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json?.data;
}

async function fetchShopInfo(admin) {
  const data = await runShopifyGraphQL(
    admin,
    `
      query FeedShopInfo {
        shop {
          name
          primaryDomain {
            url
          }
        }
      }
    `
  );

  return data?.shop || null;
}

async function fetchAllActiveProducts(admin) {
  const allProducts = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const data = await runShopifyGraphQL(
      admin,
      `
        query FeedProducts($cursor: String) {
          products(first: 250, after: $cursor, query: "status:active") {
            edges {
              cursor
              node {
                id
                title
                handle
                descriptionHtml
                vendor
                productType
                status
                category {
                  fullName
                }
                featuredImage {
                  url
                }
                metafield(namespace: "custom", key: "categoria_trovaprezzi") {
                  value
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
            pageInfo {
              hasNextPage
            }
          }
        }
      `,
      { cursor }
    );

    const connection = data?.products;
    const edges = connection?.edges || [];

    for (const edge of edges) {
      if (edge?.node) {
        allProducts.push(edge.node);
      }
    }

    hasNextPage = Boolean(connection?.pageInfo?.hasNextPage);
    cursor = edges.length ? edges[edges.length - 1].cursor : null;

    if (!cursor) {
      hasNextPage = false;
    }
  }

  return allProducts;
}

function buildProductRecord(node, primaryDomainUrl) {
  const variant = node?.variants?.edges?.[0]?.node || {};
  const handle = normalizeText(node?.handle);

  const productUrl =
    primaryDomainUrl && handle
      ? `${primaryDomainUrl.replace(/\/$/, "")}/products/${handle}`
      : "";

  const brand = normalizeText(node?.vendor) || FEED_BRAND_FALLBACK;
  const description = normalizeText(stripHtml(node?.descriptionHtml));

  return {
    id: normalizeText(node?.id),
    status: normalizeText(node?.status),
    sku: normalizeText(variant?.sku),
    title: normalizeText(node?.title),
    description,
    link: normalizeUrl(productUrl),
    image: normalizeUrl(node?.featuredImage?.url),
    price: normalizePrice(variant?.price),
    brand,
    barcode: normalizeBarcode(variant?.barcode),
    category: buildTrovaprezziCategory(
      node?.metafield?.value,
      node?.category?.fullName,
      node?.productType
    ),
  };
}

function buildXml({ shopName, shopDomain, generatedAt, products }) {
  const rows = products.map((product) => {
    const availability = buildAvailability(product);

    return `  <product>
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
    <availability>${escapeXml(availability)}</availability>
  </product>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<products>
  <generated_at>${escapeXml(generatedAt)}</generated_at>
  <shop>${escapeXml(shopName)}</shop>
  <shop_domain>${escapeXml(shopDomain)}</shop_domain>
${rows.join("\n")}
</products>`;
}

export async function loader() {
  const { admin } = await unauthenticated.admin(SHOP_DOMAIN);

  const shop = await fetchShopInfo(admin);
  const shopName = normalizeText(shop?.name) || SHOP_DOMAIN;
  const primaryDomainUrl = normalizeUrl(shop?.primaryDomain?.url);

  if (!primaryDomainUrl) {
    throw new Error("Dominio primario Shopify non disponibile.");
  }

  const rawProducts = await fetchAllActiveProducts(admin);

  const products = rawProducts
    .map((node) => buildProductRecord(node, primaryDomainUrl))
    .filter(isValidFeedProduct);

  const xml = buildXml({
    shopName,
    shopDomain: primaryDomainUrl,
    generatedAt: new Date().toISOString(),
    products,
  });

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
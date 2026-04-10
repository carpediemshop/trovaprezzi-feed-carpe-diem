export async function loader() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<products>
  <product>
    <name>TEST PRODOTTO</name>
    <price>10.00</price>
  </product>
</products>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
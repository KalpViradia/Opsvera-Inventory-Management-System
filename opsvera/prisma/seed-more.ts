import { PrismaClient, QuotationStatus, ShipmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding more data for Acme Corporation...\n");

  const companyId = "0c540f9a-01a6-496d-b277-b0a17df1b0fe";
  
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });
  
  if (!company) {
    throw new Error("Company not found.");
  }

  const adminUserId = "XHuu7GZTEGl3pwGDy8EoHG75T8u6BYGn";
  const managerUserId = "ZIOYqWEIg9W0Rzb4EH12jJkcVDoBuTBp";

  // Fetch some products
  const products = await prisma.product.findMany({ where: { companyId }, take: 3 });
  if (products.length < 3) throw new Error("Not enough products seeded.");

  // Fetch some customers
  const customers = await prisma.customer.findMany({ where: { companyId }, take: 2 });
  if (customers.length < 2) throw new Error("Not enough customers seeded.");

  // Fetch some sales orders
  const salesOrders = await prisma.salesOrder.findMany({ where: { companyId }, take: 2 });

  // 1. PRICE LIST
  const priceList = await prisma.priceList.upsert({
    where: { id: `pl-wholesale-${companyId}` },
    update: {},
    create: {
      id: `pl-wholesale-${companyId}`,
      companyId,
      name: "Wholesale Tier 1",
      description: "Discounted pricing for bulk buyers",
      isActive: true,
      items: {
        create: [
          { productId: products[0].id, price: Number(products[0].averageCost || 10) * 1.2, minQuantity: 10 },
          { productId: products[1].id, price: Number(products[1].averageCost || 20) * 1.15, minQuantity: 50 },
          { productId: products[2].id, price: Number(products[2].averageCost || 5) * 1.25, minQuantity: 100 },
        ]
      }
    }
  });
  console.log("✅ PriceList created");

  // 2. QUOTATION
  const qtNum1 = `QT-2606-0001`;
  const qt1 = await prisma.quotation.upsert({
    where: { companyId_qtNumber: { companyId, qtNumber: qtNum1 } },
    update: {},
    create: {
      companyId,
      customerId: customers[0].id,
      qtNumber: qtNum1,
      status: QuotationStatus.DRAFT,
      totalAmount: 1500.50,
      taxAmount: 150.05,
      discount: 50.00,
      currency: "USD",
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      notes: "Draft quotation for wholesale inquiry",
      createdBy: managerUserId,
      items: {
        create: [
          { productId: products[0].id, quantity: 10, unitPrice: 100, taxRate: 10, total: 1000 },
          { productId: products[1].id, quantity: 5, unitPrice: 100, taxRate: 10, total: 500 },
        ]
      }
    }
  });

  const qtNum2 = `QT-2606-0002`;
  const qt2 = await prisma.quotation.upsert({
    where: { companyId_qtNumber: { companyId, qtNumber: qtNum2 } },
    update: {},
    create: {
      companyId,
      customerId: customers[1].id,
      qtNumber: qtNum2,
      status: QuotationStatus.ACCEPTED,
      totalAmount: 3200.00,
      taxAmount: 320.00,
      discount: 0,
      currency: "USD",
      validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: "Accepted quotation",
      createdBy: adminUserId,
      items: {
        create: [
          { productId: products[2].id, quantity: 20, unitPrice: 160, taxRate: 10, total: 3200 },
        ]
      }
    }
  });
  console.log("✅ Quotations created");

  // 3. SHIPMENT
  if (salesOrders.length > 0) {
    const sh1 = await prisma.shipment.create({
      data: {
        companyId,
        salesOrderId: salesOrders[0].id,
        shipmentNumber: `SHP-2606-0001`,
        status: ShipmentStatus.PENDING,
        carrier: "FedEx",
        shippingNotes: "Standard delivery",
        items: {
          create: [
            { productId: products[0].id, quantity: 2 }
          ]
        }
      }
    });

    if (salesOrders.length > 1) {
      const sh2 = await prisma.shipment.create({
        data: {
          companyId,
          salesOrderId: salesOrders[1].id,
          shipmentNumber: `SHP-2606-0002`,
          status: ShipmentStatus.SHIPPED,
          carrier: "UPS",
          trackingNumber: "1Z9999999999999999",
          shippingNotes: "Express delivery",
          shippedAt: new Date(),
          items: {
            create: [
              { productId: products[1].id, quantity: 5 }
            ]
          }
        }
      });
    }
    console.log("✅ Shipments created");
  }

  console.log("\n🎉 Extra seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

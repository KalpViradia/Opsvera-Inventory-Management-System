import { PrismaClient, POStatus, SOStatus, InvoiceStatus, StockEntryType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database for your custom Acme Corporation...\n");

  const companyId = "0c540f9a-01a6-496d-b277-b0a17df1b0fe";
  
  // Verify company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });
  
  if (!company) {
    throw new Error("Company not found. Please check the company ID.");
  }

  console.log(`✅ Company: ${company.name} (${company.id})`);

  // ============================================
  // 2. ROLES & PERMISSIONS
  // ============================================
  const roles = [
    { name: "owner", label: "Owner", level: 100 },
    { name: "admin", label: "Admin", level: 90 },
    { name: "manager", label: "Manager", level: 50 },
    { name: "staff", label: "Staff", level: 20 },
    { name: "viewer", label: "Viewer", level: 10 },
  ];

  const createdRoles: Record<string, string> = {};
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { companyId_name: { companyId: company.id, name: roleData.name } },
      update: {},
      create: {
        name: roleData.name,
        label: roleData.label,
        level: roleData.level,
        companyId: company.id,
        isSystem: true,
      },
    });
    createdRoles[roleData.name] = role.id;
  }
  console.log(`✅ Roles: ${Object.keys(createdRoles).length} ensured`);

  const allModules = ["dashboard", "products", "inventory", "purchases", "suppliers", "sales", "customers", "accounting", "reports", "settings", "users", "custom_fields", "audit"];
  for (const mod of allModules) {
    await prisma.rolePermission.upsert({
      where: { roleId_module: { roleId: createdRoles["admin"], module: mod } },
      update: { canRead: true, canWrite: true, canDelete: true, canApprove: true },
      create: {
        roleId: createdRoles["admin"],
        module: mod,
        companyId: company.id,
        canRead: true, canWrite: true, canDelete: true, canApprove: true,
      },
    });
    
    await prisma.rolePermission.upsert({
      where: { roleId_module: { roleId: createdRoles["owner"], module: mod } },
      update: { canRead: true, canWrite: true, canDelete: true, canApprove: true },
      create: {
        roleId: createdRoles["owner"],
        module: mod,
        companyId: company.id,
        canRead: true, canWrite: true, canDelete: true, canApprove: true,
      },
    });
  }

  const viewerModules = ["dashboard", "products", "inventory", "purchases", "suppliers", "sales", "customers"];
  for (const mod of viewerModules) {
    await prisma.rolePermission.upsert({
      where: { roleId_module: { roleId: createdRoles["viewer"], module: mod } },
      update: { canRead: true },
      create: {
        roleId: createdRoles["viewer"],
        module: mod,
        companyId: company.id,
        canRead: true,
      },
    });
  }
  console.log(`✅ Permissions configured`);

  const adminUserId = "XHuu7GZTEGl3pwGDy8EoHG75T8u6BYGn";
  const managerUserId = "ZIOYqWEIg9W0Rzb4EH12jJkcVDoBuTBp";

  // ============================================
  // 4. PRODUCT CATEGORIES
  // ============================================
  const categories = [
    { name: "Electronics", description: "Servers, networking gear, and cabling" },
    { name: "Furniture", description: "Office and warehouse furniture" },
    { name: "Raw Materials", description: "Steel, plastics, and manufacturing inputs" },
  ];

  const categoryIds: Record<string, string> = {};
  for (const cat of categories) {
    const c = await prisma.productCategory.upsert({
      where: { companyId_name: { companyId: company.id, name: cat.name } },
      update: {},
      create: { name: cat.name, description: cat.description, companyId: company.id },
    });
    categoryIds[cat.name] = c.id;
  }
  console.log(`✅ Categories: ${Object.keys(categoryIds).length} created`);

  // ============================================
  // 5. PRODUCT UNITS
  // ============================================
  const units = [
    { name: "Pieces", code: "pcs" },
    { name: "Meters", code: "m" },
    { name: "Kilograms", code: "kg" },
    { name: "Boxes", code: "box" },
  ];

  const unitIds: Record<string, string> = {};
  for (const u of units) {
    const unit = await prisma.productUnit.upsert({
      where: { companyId_code: { companyId: company.id, code: u.code } },
      update: {},
      create: { name: u.name, code: u.code, companyId: company.id },
    });
    unitIds[u.code] = unit.id;
  }
  console.log(`✅ Units: ${Object.keys(unitIds).length} created`);

  // ============================================
  // 6. PRODUCTS
  // ============================================
  const products = [
    { sku: "ELEC-001", name: "Pro Server Rack 42U", category: "Electronics", unit: "pcs", price: 2499.99, cost: 1800.00, status: "ACTIVE" },
    { sku: "ELEC-002", name: "Network Switch 24-Port PoE+", category: "Electronics", unit: "pcs", price: 349.99, cost: 220.00, status: "ACTIVE" },
    { sku: "ELEC-003", name: "Fiber Optic Cable 50m", category: "Electronics", unit: "pcs", price: 89.99, cost: 45.00, status: "ACTIVE" },
    { sku: "ELEC-004", name: "UPS Battery Backup 3000VA", category: "Electronics", unit: "pcs", price: 899.99, cost: 620.00, status: "ACTIVE" },
    { sku: "ELEC-005", name: "Cat6 Patch Panel 48-Port", category: "Electronics", unit: "pcs", price: 129.99, cost: 72.00, status: "DRAFT" },
    { sku: "FURN-001", name: "Ergonomic Desk Chair Pro", category: "Furniture", unit: "pcs", price: 599.99, cost: 350.00, status: "ACTIVE" },
    { sku: "FURN-002", name: "Standing Desk 60x30", category: "Furniture", unit: "pcs", price: 749.99, cost: 420.00, status: "ACTIVE" },
    { sku: "FURN-003", name: "Heavy-Duty Shelving Unit", category: "Furniture", unit: "pcs", price: 199.99, cost: 110.00, status: "ACTIVE" },
    { sku: "FURN-004", name: "Conference Table 8-Seat", category: "Furniture", unit: "pcs", price: 1299.99, cost: 780.00, status: "ARCHIVED" },
    { sku: "RAW-001", name: "Steel Sheet 4x8 ft 16ga", category: "Raw Materials", unit: "pcs", price: 85.00, cost: 55.00, status: "ACTIVE" },
    { sku: "RAW-002", name: "Industrial Copper Wire 12AWG", category: "Raw Materials", unit: "m", price: 3.50, cost: 2.10, status: "ACTIVE" },
    { sku: "RAW-003", name: "ABS Plastic Pellets", category: "Raw Materials", unit: "kg", price: 4.25, cost: 2.80, status: "ACTIVE" },
  ];

  const productIds: Record<string, string> = {};
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { companyId_sku: { companyId: company.id, sku: p.sku } },
      update: { name: p.name, status: p.status as "ACTIVE" | "DRAFT" | "ARCHIVED" },
      create: {
        sku: p.sku,
        name: p.name,
        categoryId: categoryIds[p.category],
        unitId: unitIds[p.unit],
        status: p.status as "ACTIVE" | "DRAFT" | "ARCHIVED",
        companyId: company.id,
        variants: {
          create: [{ name: "Standard", price: p.price, cost: p.cost }],
        },
      },
    });
    productIds[p.sku] = product.id;
  }
  console.log(`✅ Products: ${Object.keys(productIds).length} created`);

  // ============================================
  // 7. SUPPLIERS
  // ============================================
  const suppliers = [
    { name: "Alpha Components", email: "orders@alphacomp.com", phone: "+1-555-0101", address: "100 Industrial Blvd, Detroit, MI 48201", paymentTerms: 30, rating: 5 },
    { name: "Beta Materials Co.", email: "sales@betamaterials.com", phone: "+1-555-0202", address: "250 Supply Chain Dr, Chicago, IL 60601", paymentTerms: 45, rating: 4 },
    { name: "Gamma Furniture Supply", email: "wholesale@gammafurn.com", phone: "+1-555-0303", address: "75 Warehouse Ave, Grand Rapids, MI 49503", paymentTerms: 30, rating: 4 },
    { name: "Delta Electronics Dist.", email: "b2b@deltaelec.com", phone: "+1-555-0404", address: "500 Tech Park Dr, San Jose, CA 95110", paymentTerms: 60, rating: 3 },
    { name: "Epsilon Steel Works", email: "orders@epsilonsteel.com", phone: "+1-555-0505", address: "1200 Forge Rd, Pittsburgh, PA 15201", paymentTerms: 30, rating: 5 },
  ];

  const supplierIds: Record<string, string> = {};
  for (const s of suppliers) {
    const supplier = await prisma.supplier.upsert({
      where: { companyId_name: { companyId: company.id, name: s.name } },
      update: { email: s.email, phone: s.phone, address: s.address, paymentTerms: s.paymentTerms, rating: s.rating },
      create: { ...s, companyId: company.id },
    });
    supplierIds[s.name] = supplier.id;
  }
  console.log(`✅ Suppliers: ${Object.keys(supplierIds).length} created`);

  // ============================================
  // 8. CUSTOMERS
  // ============================================
  const customers = [
    { name: "Global Tech Solutions", email: "procurement@globaltech.com", phone: "+1-555-1001", address: "800 Innovation Way, Austin, TX 78701", creditLimit: 50000, paymentTerms: 30 },
    { name: "Pinnacle Industries", email: "buying@pinnacleindustries.com", phone: "+1-555-1002", address: "320 Enterprise Blvd, Charlotte, NC 28202", creditLimit: 75000, paymentTerms: 45 },
    { name: "Metro Retail Group", email: "orders@metroretail.com", phone: "+1-555-1003", address: "150 Commerce St, Nashville, TN 37201", creditLimit: 30000, paymentTerms: 30 },
  ];

  const customerIds: Record<string, string> = {};
  for (const c of customers) {
    const customer = await prisma.customer.upsert({
      where: { companyId_name: { companyId: company.id, name: c.name } },
      update: { email: c.email, phone: c.phone, address: c.address, creditLimit: c.creditLimit, paymentTerms: c.paymentTerms },
      create: { ...c, companyId: company.id },
    });
    customerIds[c.name] = customer.id;
  }
  console.log(`✅ Customers: ${Object.keys(customerIds).length} created`);

  // ============================================
  // 9. WAREHOUSES & LOCATIONS
  // ============================================
  const wh1 = await prisma.warehouse.upsert({
    where: { companyId_name: { companyId: company.id, name: "Main Distribution Center" } },
    update: { address: "123 Logistics Way, Columbus, OH 43215", contactPerson: "Frank Warehouse Mgr", phone: "+1-555-2001" },
    create: { name: "Main Distribution Center", companyId: company.id, address: "123 Logistics Way, Columbus, OH 43215", contactPerson: "Frank Warehouse Mgr", phone: "+1-555-2001" },
  });

  const wh2 = await prisma.warehouse.upsert({
    where: { companyId_name: { companyId: company.id, name: "East Coast Depot" } },
    update: { address: "450 Harbor Rd, Newark, NJ 07102", contactPerson: "Grace Depot Lead", phone: "+1-555-2002" },
    create: { name: "East Coast Depot", companyId: company.id, address: "450 Harbor Rd, Newark, NJ 07102", contactPerson: "Grace Depot Lead", phone: "+1-555-2002" },
  });

  const loc1 = await prisma.location.upsert({
    where: { id: `loc-zone-a-${company.id}` },
    update: {},
    create: { id: `loc-zone-a-${company.id}`, name: "Zone A - Electronics", warehouseId: wh1.id, companyId: company.id, description: "Temperature-controlled area for electronics" },
  });

  const loc2 = await prisma.location.upsert({
    where: { id: `loc-zone-b-${company.id}` },
    update: {},
    create: { id: `loc-zone-b-${company.id}`, name: "Zone B - General", warehouseId: wh1.id, companyId: company.id, description: "General storage for furniture and materials" },
  });

  const loc3 = await prisma.location.upsert({
    where: { id: `loc-receiving-${company.id}` },
    update: {},
    create: { id: `loc-receiving-${company.id}`, name: "Receiving Bay", warehouseId: wh2.id, companyId: company.id, description: "Inbound receiving and inspection area" },
  });

  console.log(`✅ Warehouses: 2 created with 3 locations`);

  // ============================================
  // 10. STOCK LEVELS
  // ============================================
  const stockData = [
    { sku: "ELEC-001", locationId: loc1.id, quantity: 25 },
    { sku: "ELEC-002", locationId: loc1.id, quantity: 80 },
    { sku: "ELEC-003", locationId: loc1.id, quantity: 200 },
    { sku: "ELEC-004", locationId: loc1.id, quantity: 15 },
    { sku: "ELEC-005", locationId: loc1.id, quantity: 0 },
    { sku: "FURN-001", locationId: loc2.id, quantity: 45 },
    { sku: "FURN-002", locationId: loc2.id, quantity: 30 },
    { sku: "FURN-003", locationId: loc2.id, quantity: 120 },
    { sku: "RAW-001", locationId: loc2.id, quantity: 500 },
    { sku: "RAW-002", locationId: loc2.id, quantity: 2500 },
    { sku: "RAW-003", locationId: loc2.id, quantity: 1000 },
    { sku: "ELEC-001", locationId: loc3.id, quantity: 10 },
    { sku: "ELEC-002", locationId: loc3.id, quantity: 20 },
    { sku: "FURN-001", locationId: loc3.id, quantity: 12 },
  ];

  for (const sl of stockData) {
    if (!productIds[sl.sku]) continue;
    await prisma.stockLevel.upsert({
      where: { productId_locationId: { productId: productIds[sl.sku], locationId: sl.locationId } },
      update: { quantity: sl.quantity },
      create: { productId: productIds[sl.sku], locationId: sl.locationId, quantity: sl.quantity },
    });
  }
  console.log(`✅ Stock levels: ${stockData.length} entries configured`);

  // ============================================
  // 11. PURCHASE ORDERS
  // ============================================
  const po1 = await prisma.purchaseOrder.upsert({
    where: { companyId_poNumber: { companyId: company.id, poNumber: "PO-2601-0001" } },
    update: {},
    create: {
      companyId: company.id,
      supplierId: supplierIds["Alpha Components"],
      poNumber: "PO-2601-0001",
      status: POStatus.DRAFT,
      totalAmount: 4599.90,
      taxAmount: 414.00,
      notes: "Quarterly server rack replenishment",
      createdBy: adminUserId,
    },
  });
  await prisma.purchaseOrderItem.deleteMany({ where: { poId: po1.id } });
  await prisma.purchaseOrderItem.createMany({
    data: [
      { poId: po1.id, productId: productIds["ELEC-001"], quantity: 5, unitPrice: 1800.00, taxRate: 9, total: 9810.00 },
      { poId: po1.id, productId: productIds["ELEC-004"], quantity: 10, unitPrice: 620.00, taxRate: 9, total: 6758.00 },
    ],
  });

  const po2 = await prisma.purchaseOrder.upsert({
    where: { companyId_poNumber: { companyId: company.id, poNumber: "PO-2601-0002" } },
    update: {},
    create: {
      companyId: company.id,
      supplierId: supplierIds["Beta Materials Co."],
      poNumber: "PO-2601-0002",
      status: POStatus.APPROVED,
      totalAmount: 5775.00,
      taxAmount: 525.00,
      notes: "Raw materials for Q1 production run",
      createdBy: managerUserId,
      approvedBy: adminUserId,
      approvedAt: new Date("2026-05-20T14:30:00Z"),
    },
  });
  await prisma.purchaseOrderItem.deleteMany({ where: { poId: po2.id } });
  await prisma.purchaseOrderItem.createMany({
    data: [
      { poId: po2.id, productId: productIds["RAW-001"], quantity: 50, unitPrice: 55.00, taxRate: 10, total: 3025.00 },
      { poId: po2.id, productId: productIds["RAW-003"], quantity: 200, unitPrice: 2.80, taxRate: 10, total: 616.00 },
    ],
  });

  const po3 = await prisma.purchaseOrder.upsert({
    where: { companyId_poNumber: { companyId: company.id, poNumber: "PO-2601-0003" } },
    update: {},
    create: {
      companyId: company.id,
      supplierId: supplierIds["Gamma Furniture Supply"],
      poNumber: "PO-2601-0003",
      status: POStatus.RECEIVED,
      totalAmount: 8745.00,
      taxAmount: 795.00,
      notes: "Office furniture order for new wing",
      createdBy: adminUserId,
      approvedBy: adminUserId,
      approvedAt: new Date("2026-05-15T10:00:00Z"),
    },
  });
  await prisma.purchaseOrderItem.deleteMany({ where: { poId: po3.id } });
  await prisma.purchaseOrderItem.createMany({
    data: [
      { poId: po3.id, productId: productIds["FURN-001"], quantity: 10, unitPrice: 350.00, taxRate: 10, total: 3850.00 },
      { poId: po3.id, productId: productIds["FURN-002"], quantity: 5, unitPrice: 420.00, taxRate: 10, total: 2310.00 },
      { poId: po3.id, productId: productIds["FURN-003"], quantity: 20, unitPrice: 110.00, taxRate: 10, total: 2420.00 },
    ],
  });

  await prisma.purchaseInvoice.upsert({
    where: { companyId_invoiceNumber: { companyId: company.id, invoiceNumber: "PINV-2601-0001" } },
    update: {},
    create: {
      companyId: company.id,
      poId: po3.id,
      supplierId: supplierIds["Gamma Furniture Supply"],
      invoiceNumber: "PINV-2601-0001",
      amount: 8745.00,
      taxAmount: 795.00,
      status: InvoiceStatus.PAID,
      dueDate: new Date("2026-06-15T00:00:00Z"),
      paidAmount: 8745.00,
    },
  });

  console.log(`✅ Purchase Orders: 3 created with invoices`);

  // ============================================
  // 12. SALES ORDERS
  // ============================================
  const so1 = await prisma.salesOrder.upsert({
    where: { companyId_soNumber: { companyId: company.id, soNumber: "SO-2601-0001" } },
    update: {},
    create: {
      companyId: company.id,
      customerId: customerIds["Global Tech Solutions"],
      soNumber: "SO-2601-0001",
      status: SOStatus.DRAFT,
      totalAmount: 5249.85,
      taxAmount: 472.49,
      discount: 0,
      notes: "Server infrastructure quote",
      createdBy: adminUserId,
    },
  });
  await prisma.salesOrderItem.deleteMany({ where: { soId: so1.id } });
  await prisma.salesOrderItem.createMany({
    data: [
      { soId: so1.id, productId: productIds["ELEC-001"], quantity: 2, unitPrice: 2499.99, taxRate: 9, total: 5449.98 },
      { soId: so1.id, productId: productIds["ELEC-003"], quantity: 10, unitPrice: 89.99, taxRate: 9, total: 980.89 },
    ],
  });

  const so2 = await prisma.salesOrder.upsert({
    where: { companyId_soNumber: { companyId: company.id, soNumber: "SO-2601-0002" } },
    update: {},
    create: {
      companyId: company.id,
      customerId: customerIds["Pinnacle Industries"],
      soNumber: "SO-2601-0002",
      status: SOStatus.CONFIRMED,
      totalAmount: 15399.60,
      taxAmount: 1399.96,
      discount: 500.00,
      notes: "Bulk furniture order for new office",
      createdBy: managerUserId,
    },
  });
  await prisma.salesOrderItem.deleteMany({ where: { soId: so2.id } });
  await prisma.salesOrderItem.createMany({
    data: [
      { soId: so2.id, productId: productIds["FURN-001"], quantity: 20, unitPrice: 599.99, taxRate: 8, total: 12959.78 },
      { soId: so2.id, productId: productIds["FURN-002"], quantity: 5, unitPrice: 749.99, taxRate: 8, total: 4049.95 },
    ],
  });

  const so3 = await prisma.salesOrder.upsert({
    where: { companyId_soNumber: { companyId: company.id, soNumber: "SO-2601-0003" } },
    update: {},
    create: {
      companyId: company.id,
      customerId: customerIds["Metro Retail Group"],
      soNumber: "SO-2601-0003",
      status: SOStatus.SHIPPED,
      totalAmount: 4159.50,
      taxAmount: 378.14,
      discount: 0,
      notes: "Networking equipment - express shipping",
      createdBy: adminUserId,
    },
  });
  await prisma.salesOrderItem.deleteMany({ where: { soId: so3.id } });
  await prisma.salesOrderItem.createMany({
    data: [
      { soId: so3.id, productId: productIds["ELEC-002"], quantity: 10, unitPrice: 349.99, taxRate: 9, total: 3814.89 },
      { soId: so3.id, productId: productIds["ELEC-003"], quantity: 5, unitPrice: 89.99, taxRate: 9, total: 490.45 },
    ],
  });

  await prisma.salesInvoice.upsert({
    where: { companyId_invoiceNumber: { companyId: company.id, invoiceNumber: "SINV-2601-0001" } },
    update: {},
    create: {
      companyId: company.id,
      soId: so3.id,
      customerId: customerIds["Metro Retail Group"],
      invoiceNumber: "SINV-2601-0001",
      amount: 4159.50,
      taxAmount: 378.14,
      status: InvoiceStatus.UNPAID,
      dueDate: new Date("2026-06-28T00:00:00Z"),
      paidAmount: 0,
    },
  });

  console.log(`✅ Sales Orders: 3 created with invoices`);

  // ============================================
  // 14. ACTIVITIES
  // ============================================
  await prisma.activity.deleteMany({ where: { companyId: company.id } });

  const activities = [
    { userId: adminUserId, action: "CREATED", entityType: "Product", entityId: productIds["ELEC-001"], details: "Added product: Pro Server Rack 42U", createdAt: new Date("2026-05-01T08:30:00Z") },
    { userId: managerUserId, action: "CREATED", entityType: "Product", entityId: productIds["FURN-001"], details: "Added product: Ergonomic Desk Chair Pro", createdAt: new Date("2026-05-02T09:15:00Z") },
    { userId: adminUserId, action: "CREATED", entityType: "PurchaseOrder", entityId: po3.id, details: "Created PO-2601-0003 for Gamma Furniture Supply", createdAt: new Date("2026-05-12T11:00:00Z") },
    { userId: adminUserId, action: "APPROVED", entityType: "PurchaseOrder", entityId: po3.id, details: "Approved PO-2601-0003 ($8,745.00)", createdAt: new Date("2026-05-15T10:00:00Z") },
  ];

  for (const activity of activities) {
    await prisma.activity.create({
      data: { companyId: company.id, ...activity },
    });
  }
  console.log(`✅ Activities: ${activities.length} log entries`);

  console.log("\n🎉 Seeding completed successfully for Acme Corporation!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

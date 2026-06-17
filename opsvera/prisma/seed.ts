import { PrismaClient, POStatus, SOStatus, InvoiceStatus, StockEntryType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with rich enterprise data...\n");

  // ============================================
  // 1. COMPANY
  // ============================================
  const company = await prisma.company.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corporation",
      slug: "acme-corp",
      industry: "Manufacturing",
      currency: "USD",
      timezone: "America/New_York",
      onboardingCompleted: true,
    },
  });
  console.log(`✅ Company: ${company.name}`);

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
  console.log(`✅ Roles: ${Object.keys(createdRoles).length} created`);

  // Admin permissions (all modules, full access)
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
  }

  // Viewer permissions (read-only on operational modules)
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

  // ============================================
  // 3. USERS (credentials created separately via seed-credentials.ts)
  // ============================================
  const usersToCreate = [
    { id: "user-1", name: "Alice Admin", email: "alice@acme.com", role: "admin" },
    { id: "user-2", name: "Bob Manager", email: "bob@acme.com", role: "manager" },
    { id: "user-3", name: "Charlie Staff", email: "charlie@acme.com", role: "staff" },
    { id: "user-4", name: "Diana Viewer", email: "diana@acme.com", role: "viewer" },
  ];

  const userIds: Record<string, string> = {};
  for (const u of usersToCreate) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: { role: u.role, companyId: company.id },
      });
      userIds[u.role] = existing.id;
    } else {
      const created = await prisma.user.create({
        data: {
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: true,
          role: u.role,
          companyId: company.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      userIds[u.role] = created.id;
    }
  }
  console.log(`✅ Users: ${Object.keys(userIds).length} configured`);

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
  // 6. PRODUCTS (12 products across 3 categories)
  // ============================================
  const products = [
    // Electronics
    { sku: "ELEC-001", name: "Pro Server Rack 42U", category: "Electronics", unit: "pcs", price: 2499.99, cost: 1800.00, status: "ACTIVE" },
    { sku: "ELEC-002", name: "Network Switch 24-Port PoE+", category: "Electronics", unit: "pcs", price: 349.99, cost: 220.00, status: "ACTIVE" },
    { sku: "ELEC-003", name: "Fiber Optic Cable 50m", category: "Electronics", unit: "pcs", price: 89.99, cost: 45.00, status: "ACTIVE" },
    { sku: "ELEC-004", name: "UPS Battery Backup 3000VA", category: "Electronics", unit: "pcs", price: 899.99, cost: 620.00, status: "ACTIVE" },
    { sku: "ELEC-005", name: "Cat6 Patch Panel 48-Port", category: "Electronics", unit: "pcs", price: 129.99, cost: 72.00, status: "DRAFT" },
    // Furniture
    { sku: "FURN-001", name: "Ergonomic Desk Chair Pro", category: "Furniture", unit: "pcs", price: 599.99, cost: 350.00, status: "ACTIVE" },
    { sku: "FURN-002", name: "Standing Desk 60x30", category: "Furniture", unit: "pcs", price: 749.99, cost: 420.00, status: "ACTIVE" },
    { sku: "FURN-003", name: "Heavy-Duty Shelving Unit", category: "Furniture", unit: "pcs", price: 199.99, cost: 110.00, status: "ACTIVE" },
    { sku: "FURN-004", name: "Conference Table 8-Seat", category: "Furniture", unit: "pcs", price: 1299.99, cost: 780.00, status: "ARCHIVED" },
    // Raw Materials
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

  // Locations
  const loc1 = await prisma.location.upsert({
    where: { id: "loc-zone-a" },
    update: {},
    create: { id: "loc-zone-a", name: "Zone A - Electronics", warehouseId: wh1.id, companyId: company.id, description: "Temperature-controlled area for electronics" },
  });

  const loc2 = await prisma.location.upsert({
    where: { id: "loc-zone-b" },
    update: {},
    create: { id: "loc-zone-b", name: "Zone B - General", warehouseId: wh1.id, companyId: company.id, description: "General storage for furniture and materials" },
  });

  const loc3 = await prisma.location.upsert({
    where: { id: "loc-receiving" },
    update: {},
    create: { id: "loc-receiving", name: "Receiving Bay", warehouseId: wh2.id, companyId: company.id, description: "Inbound receiving and inspection area" },
  });

  // Delete old loc-1 if it exists
  await prisma.stockLevel.deleteMany({ where: { locationId: "loc-1" } });
  await prisma.location.deleteMany({ where: { id: "loc-1" } });

  console.log(`✅ Warehouses: 2 created with 3 locations`);

  // ============================================
  // 10. STOCK LEVELS (varied quantities)
  // ============================================
  const stockData: { sku: string; locationId: string; quantity: number }[] = [
    // Zone A (Electronics)
    { sku: "ELEC-001", locationId: loc1.id, quantity: 25 },
    { sku: "ELEC-002", locationId: loc1.id, quantity: 80 },
    { sku: "ELEC-003", locationId: loc1.id, quantity: 200 },
    { sku: "ELEC-004", locationId: loc1.id, quantity: 15 },
    { sku: "ELEC-005", locationId: loc1.id, quantity: 0 },
    // Zone B (Furniture + Raw Materials)
    { sku: "FURN-001", locationId: loc2.id, quantity: 45 },
    { sku: "FURN-002", locationId: loc2.id, quantity: 30 },
    { sku: "FURN-003", locationId: loc2.id, quantity: 120 },
    { sku: "RAW-001", locationId: loc2.id, quantity: 500 },
    { sku: "RAW-002", locationId: loc2.id, quantity: 2500 },
    { sku: "RAW-003", locationId: loc2.id, quantity: 1000 },
    // Receiving Bay (East Coast)
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
  const adminUserId = userIds["admin"] || "user-1";
  const managerUserId = userIds["manager"] || "user-2";

  // PO-1: DRAFT
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
  // PO-1 items
  await prisma.purchaseOrderItem.deleteMany({ where: { poId: po1.id } });
  await prisma.purchaseOrderItem.createMany({
    data: [
      { poId: po1.id, productId: productIds["ELEC-001"], quantity: 5, unitPrice: 1800.00, taxRate: 9, total: 9810.00 },
      { poId: po1.id, productId: productIds["ELEC-004"], quantity: 10, unitPrice: 620.00, taxRate: 9, total: 6758.00 },
    ],
  });

  // PO-2: APPROVED (awaiting receipt)
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

  // PO-3: RECEIVED (fully received with invoice)
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

  // Purchase Invoice for PO-3
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

  // Additional unpaid purchase invoice
  await prisma.purchaseInvoice.upsert({
    where: { companyId_invoiceNumber: { companyId: company.id, invoiceNumber: "PINV-2601-0002" } },
    update: {},
    create: {
      companyId: company.id,
      poId: po3.id,
      supplierId: supplierIds["Alpha Components"],
      invoiceNumber: "PINV-2601-0002",
      amount: 3200.00,
      taxAmount: 288.00,
      status: InvoiceStatus.UNPAID,
      dueDate: new Date("2026-06-30T00:00:00Z"),
      paidAmount: 0,
    },
  });

  console.log(`✅ Purchase Orders: 3 created with invoices`);

  // ============================================
  // 12. SALES ORDERS
  // ============================================

  // SO-1: DRAFT
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

  // SO-2: CONFIRMED
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

  // SO-3: SHIPPED (with sales invoice)
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

  // Sales Invoice for SO-3
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

  // Partially paid sales invoice for SO-2
  await prisma.salesInvoice.upsert({
    where: { companyId_invoiceNumber: { companyId: company.id, invoiceNumber: "SINV-2601-0002" } },
    update: {},
    create: {
      companyId: company.id,
      soId: so2.id,
      customerId: customerIds["Pinnacle Industries"],
      invoiceNumber: "SINV-2601-0002",
      amount: 15399.60,
      taxAmount: 1399.96,
      status: InvoiceStatus.PARTIAL,
      dueDate: new Date("2026-07-15T00:00:00Z"),
      paidAmount: 7500.00,
    },
  });

  console.log(`✅ Sales Orders: 3 created with invoices`);

  // ============================================
  // 13. STOCK ENTRIES (movement history)
  // ============================================
  const stockEntries = [
    { productId: productIds["ELEC-001"], toLocationId: loc1.id, quantity: 25, type: StockEntryType.RECEIPT, refType: "INITIAL_STOCK", notes: "Initial inventory count", createdBy: adminUserId, createdAt: new Date("2026-05-01T08:00:00Z") },
    { productId: productIds["ELEC-002"], toLocationId: loc1.id, quantity: 100, type: StockEntryType.RECEIPT, refType: "PURCHASE_ORDER", notes: "Received from Alpha Components", createdBy: managerUserId, createdAt: new Date("2026-05-05T10:30:00Z") },
    { productId: productIds["FURN-001"], toLocationId: loc2.id, quantity: 50, type: StockEntryType.RECEIPT, refType: "PURCHASE_ORDER", refId: po3.id, notes: "Received furniture from Gamma Supply", createdBy: adminUserId, createdAt: new Date("2026-05-18T14:00:00Z") },
    { productId: productIds["ELEC-002"], fromLocationId: loc1.id, toLocationId: loc3.id, quantity: 20, type: StockEntryType.TRANSFER, notes: "Transfer to East Coast Depot", createdBy: managerUserId, createdAt: new Date("2026-05-20T09:00:00Z") },
    { productId: productIds["RAW-001"], toLocationId: loc2.id, quantity: 500, type: StockEntryType.RECEIPT, refType: "INITIAL_STOCK", notes: "Bulk steel sheet intake", createdBy: adminUserId, createdAt: new Date("2026-05-02T08:00:00Z") },
    { productId: productIds["RAW-003"], toLocationId: loc2.id, quantity: 1000, type: StockEntryType.RECEIPT, refType: "INITIAL_STOCK", notes: "Plastic pellets intake", createdBy: adminUserId, createdAt: new Date("2026-05-02T09:00:00Z") },
  ];

  for (const entry of stockEntries) {
    await prisma.stockEntry.create({
      data: {
        companyId: company.id,
        ...entry,
      },
    });
  }
  console.log(`✅ Stock entries: ${stockEntries.length} movement records`);

  // ============================================
  // 14. ACTIVITIES (realistic operation log)
  // ============================================
  // Clear old activities for this company
  await prisma.activity.deleteMany({ where: { companyId: company.id } });

  const activities = [
    { userId: adminUserId, action: "CREATED", entityType: "Company", entityId: company.id, details: "Acme Corporation account created", createdAt: new Date("2026-05-01T07:00:00Z") },
    { userId: adminUserId, action: "CREATED", entityType: "Product", entityId: productIds["ELEC-001"], details: "Added product: Pro Server Rack 42U", createdAt: new Date("2026-05-01T08:30:00Z") },
    { userId: managerUserId, action: "CREATED", entityType: "Product", entityId: productIds["FURN-001"], details: "Added product: Ergonomic Desk Chair Pro", createdAt: new Date("2026-05-02T09:15:00Z") },
    { userId: adminUserId, action: "CREATED", entityType: "PurchaseOrder", entityId: po3.id, details: "Created PO-2601-0003 for Gamma Furniture Supply", createdAt: new Date("2026-05-12T11:00:00Z") },
    { userId: adminUserId, action: "APPROVED", entityType: "PurchaseOrder", entityId: po3.id, details: "Approved PO-2601-0003 ($8,745.00)", createdAt: new Date("2026-05-15T10:00:00Z") },
    { userId: adminUserId, action: "RECEIVED", entityType: "PurchaseOrder", entityId: po3.id, details: "Received goods for PO-2601-0003", createdAt: new Date("2026-05-18T14:00:00Z") },
    { userId: managerUserId, action: "CREATED", entityType: "PurchaseOrder", entityId: po2.id, details: "Created PO-2601-0002 for Beta Materials Co.", createdAt: new Date("2026-05-19T09:30:00Z") },
    { userId: adminUserId, action: "APPROVED", entityType: "PurchaseOrder", entityId: po2.id, details: "Approved PO-2601-0002 ($5,775.00)", createdAt: new Date("2026-05-20T14:30:00Z") },
    { userId: adminUserId, action: "CREATED", entityType: "SalesOrder", entityId: so3.id, details: "Created SO-2601-0003 for Metro Retail Group", createdAt: new Date("2026-05-22T10:00:00Z") },
    { userId: adminUserId, action: "SHIPPED", entityType: "SalesOrder", entityId: so3.id, details: "Shipped SO-2601-0003 - networking equipment", createdAt: new Date("2026-05-25T15:30:00Z") },
    { userId: managerUserId, action: "CREATED", entityType: "SalesOrder", entityId: so2.id, details: "Created SO-2601-0002 for Pinnacle Industries", createdAt: new Date("2026-05-26T11:00:00Z") },
    { userId: adminUserId, action: "TRANSFER", entityType: "StockEntry", entityId: "transfer-001", details: "Transferred 20x Network Switch to East Coast Depot", createdAt: new Date("2026-05-20T09:00:00Z") },
  ];

  for (const activity of activities) {
    await prisma.activity.create({
      data: { companyId: company.id, ...activity },
    });
  }
  console.log(`✅ Activities: ${activities.length} log entries`);

  // ============================================
  // 15. NOTIFICATIONS
  // ============================================
  await prisma.notification.deleteMany({ where: { companyId: company.id } });

  const notifications = [
    { userId: adminUserId, title: "Welcome to Opsvera", message: "Your enterprise dashboard is ready. Start by adding products and setting up warehouses.", type: "success", isRead: true, createdAt: new Date("2026-05-01T07:00:00Z") },
    { userId: adminUserId, title: "PO-2601-0003 Approved", message: "Purchase order for Gamma Furniture Supply ($8,745.00) has been approved.", type: "info", isRead: true, link: "/purchases", createdAt: new Date("2026-05-15T10:00:00Z") },
    { userId: adminUserId, title: "Goods Received", message: "All items for PO-2601-0003 have been received and stocked at Zone B.", type: "success", isRead: false, link: "/inventory", createdAt: new Date("2026-05-18T14:00:00Z") },
    { userId: adminUserId, title: "Low Stock Alert", message: "Cat6 Patch Panel 48-Port (ELEC-005) has 0 units remaining. Consider reordering.", type: "warning", isRead: false, link: "/products", createdAt: new Date("2026-05-27T08:00:00Z") },
    { userId: adminUserId, title: "Invoice Overdue Soon", message: "Purchase invoice PINV-2601-0002 ($3,200.00) is due on June 30.", type: "warning", isRead: false, link: "/accounting", createdAt: new Date("2026-05-28T06:00:00Z") },
    { userId: managerUserId, title: "Welcome to Opsvera", message: "You have been assigned the Manager role. You can create and manage orders.", type: "success", isRead: true, createdAt: new Date("2026-05-01T07:00:00Z") },
    { userId: managerUserId, title: "SO-2601-0002 Created", message: "Sales order for Pinnacle Industries has been created and is pending confirmation.", type: "info", isRead: false, link: "/sales", createdAt: new Date("2026-05-26T11:00:00Z") },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({
      data: { companyId: company.id, ...notif },
    });
  }
  console.log(`✅ Notifications: ${notifications.length} created`);

  console.log("\n🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

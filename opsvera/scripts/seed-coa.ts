import { PrismaClient } from "@prisma/client";
import { seedCompanyAccounts } from "../src/lib/default-coa";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Chart of Accounts for all companies...");
  
  const companies = await prisma.company.findMany();
  
  for (const company of companies) {
    const existingAccountsCount = await prisma.ledgerAccount.count({
      where: { companyId: company.id }
    });
    
    if (existingAccountsCount === 0) {
      console.log(`Seeding COA for company: ${company.name} (${company.id})`);
      await seedCompanyAccounts(company.id);
      console.log(`Successfully seeded COA for ${company.name}`);
    } else {
      console.log(`Company ${company.name} already has ${existingAccountsCount} accounts. Skipping...`);
    }
  }
  
  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

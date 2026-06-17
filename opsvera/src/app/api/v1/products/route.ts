import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-auth";
import { ProductStatus } from "@prisma/client";

export async function GET(request: Request) {
  // Validate API Key with "read" scope
  const auth = await validateApiKey("read");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const page = parseInt(searchParams.get("page") || "1");
  const status = searchParams.get("status") as ProductStatus | undefined;
  
  const skip = (page - 1) * limit;

  try {
    const products = await prisma.product.findMany({
      where: {
        companyId: auth.companyId,
        status: status ? status : undefined,
      },
      include: {
        variants: true,
        category: { select: { id: true, name: true } },
        unit: { select: { id: true, code: true, name: true } },
      },
      skip,
      take: limit > 100 ? 100 : limit, // Max limit 100
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.product.count({
      where: {
        companyId: auth.companyId,
        status: status ? status : undefined,
      },
    });

    return NextResponse.json({
      data: products,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("API Error fetching products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

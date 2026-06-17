"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface OrderStatusChartProps {
  poStatusCounts: { status: string; _count: number }[];
  soStatusCounts: { status: string; _count: number }[];
}

// Rich palette with subtle gradients
const COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  SUBMITTED: "#fb923c",
  PENDING: "#fbbf24",
  APPROVED: "#3b82f6",
  CONFIRMED: "#6366f1",
  PACKED: "#a78bfa",
  SHIPPED: "#8b5cf6",
  INVOICED: "#14b8a6",
  DELIVERED: "#22c55e",
  RECEIVED: "#10b981",
  CLOSED: "#64748b",
  CANCELLED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PENDING: "Pending",
  APPROVED: "Approved",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  INVOICED: "Invoiced",
  DELIVERED: "Delivered",
  RECEIVED: "Received",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export function OrderStatusChart({ poStatusCounts, soStatusCounts }: OrderStatusChartProps) {
  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};

    poStatusCounts.forEach((po) => {
      dataMap[po.status] = (dataMap[po.status] || 0) + po._count;
    });

    soStatusCounts.forEach((so) => {
      dataMap[so.status] = (dataMap[so.status] || 0) + so._count;
    });

    return Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [poStatusCounts, soStatusCounts]);

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg mt-4">
        No orders to display
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={2}
            stroke="hsl(var(--background))"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name] || "#64748b"} 
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              padding: "10px 14px",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [value, STATUS_LABELS[String(name)] || name]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => (
              <span className="text-xs text-muted-foreground ml-1">
                {STATUS_LABELS[String(value)] || value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

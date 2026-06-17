/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

interface SalesTrendChartProps {
  salesData: {
    createdAt: Date;
    totalAmount: number;
  }[];
}

export function SalesTrendChart({ salesData }: SalesTrendChartProps) {
  const chartData = useMemo(() => {
    // Generate last 30 days
    const today = startOfDay(new Date());
    const days = Array.from({ length: 30 }).map((_, i) => {
      const date = subDays(today, 29 - i);
      return {
        date,
        dateStr: format(date, "MMM dd"),
        sales: 0,
      };
    });

    // Populate data
    salesData.forEach((order) => {
      const orderDate = startOfDay(new Date(order.createdAt));
      const dayData = days.find((d) => isSameDay(d.date, orderDate));
      if (dayData) {
        dayData.sales += Number(order.totalAmount);
      }
    });

    return days;
  }, [salesData]);

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSalesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis 
            dataKey="dateStr" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
            minTickGap={30}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => `$${value}`}
            width={60}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              padding: "12px 16px",
            }}
            formatter={(value: any) => [`$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "Sales"]}
            labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
          />
          <Area 
            type="monotone" 
            dataKey="sales" 
            stroke="#8B5CF6" 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill="url(#colorSalesGradient)" 
            dot={false}
            activeDot={{ r: 5, fill: "#8B5CF6", strokeWidth: 2, stroke: "hsl(var(--background))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

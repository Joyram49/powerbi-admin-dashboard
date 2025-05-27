import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

interface ChartDataPoint {
  date: string;
  amount: number;
}

interface SalesOverviewChartProps {
  data: ChartDataPoint[];
  children?: React.ReactNode;
}

export function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  return (
    <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-300 dark:stroke-gray-700 dark:hover:!bg-gray-800"
                horizontalFill={["rgba(75, 85, 99, 0.1) ", "transparent"]}
              />
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                className="text-gray-500 dark:text-gray-400"
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
                className="text-gray-500 dark:text-gray-400"
              />
              <Legend />
              <Bar
                dataKey="amount"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

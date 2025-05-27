import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
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

interface MonthlyEarningsProps {
  data: ChartDataPoint[];
  percentageChange: number;
}

export function MonthlyEarnings({
  data,
  percentageChange,
}: MonthlyEarningsProps) {
  return (
    <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly Earnings</CardTitle>
        <span
          className={percentageChange >= 0 ? "text-green-500" : "text-red-500"}
        >
          {percentageChange >= 0 ? "+" : ""}
          {percentageChange}%
        </span>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-700"
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
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0 && payload[0]) {
                    const data = payload[0].payload as ChartDataPoint;
                    return (
                      <div className="rounded-lg border bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-gray-500 dark:text-gray-400">
                              Date
                            </span>
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                              {data.date}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-gray-500 dark:text-gray-400">
                              Amount
                            </span>
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                              ${data.amount}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

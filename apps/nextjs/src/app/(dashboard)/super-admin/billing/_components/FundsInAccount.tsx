import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";

interface FundsInAccountProps {
  amount: number;
  percentage: number;
}

export function FundsInAccount({ amount, percentage }: FundsInAccountProps) {
  return (
    <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <CardHeader>
        <CardTitle>Funds in Account</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} />
        <div className="mt-2 text-lg font-bold">${amount.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

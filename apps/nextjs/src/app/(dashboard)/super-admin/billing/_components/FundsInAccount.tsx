import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";

interface FundsInAccountProps {
  amount: number;
  percentage: number;
}

export function FundsInAccount({ amount, percentage }: FundsInAccountProps) {
  return (
    <Card>
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

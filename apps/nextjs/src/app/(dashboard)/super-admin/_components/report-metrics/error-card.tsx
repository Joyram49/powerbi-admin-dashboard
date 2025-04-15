import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

export default function ErrorCard({
  message,
  desc,
}: {
  message: string;
  desc?: string;
}) {
  return (
    <Card className="@container/card dark:bg-slate-900">
      <CardHeader className="relative">
        <CardDescription>{desc}</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold">
          --
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="text-muted-foreground">{message}</div>
      </CardFooter>
    </Card>
  );
}

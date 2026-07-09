import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  className,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-oboya-green/10 p-2">
          <Icon className="size-4 text-oboya-green" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-oboya-blue-dark">{value}</p>
        {change && (
          <p className="mt-1 text-xs text-muted-foreground">{change}</p>
        )}
      </CardContent>
    </Card>
  );
}

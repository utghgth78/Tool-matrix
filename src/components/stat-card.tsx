import type { LucideIcon } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
          </div>
          <div className="rounded-lg bg-accent p-3 text-accent-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

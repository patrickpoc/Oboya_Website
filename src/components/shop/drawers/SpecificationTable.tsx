"use client";

interface SpecificationTableProps {
  specs: { label: string; value: string }[];
}

export function SpecificationTable({ specs }: SpecificationTableProps) {
  if (specs.length === 0) return null;

  return (
    <table className="w-full text-sm">
      <tbody>
        {specs.map((spec) => (
          <tr key={spec.label} className="border-b border-border/50 last:border-0">
            <th className="py-2 pr-4 text-left font-medium text-oboya-blue-dark">
              {spec.label}
            </th>
            <td className="py-2 text-muted-foreground">{spec.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

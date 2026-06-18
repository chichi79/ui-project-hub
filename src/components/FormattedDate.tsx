"use client";

import { formatDate } from "@/lib/utils";

interface FormattedDateProps {
  value: string;
  className?: string;
}

export default function FormattedDate({ value, className }: FormattedDateProps) {
  return <span className={className}>{formatDate(value)}</span>;
}

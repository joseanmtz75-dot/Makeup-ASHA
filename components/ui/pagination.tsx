"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  total: number;
  pageSize: number;
  currentPage: number;
};

export function Pagination({ total, pageSize, currentPage }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  }

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? "resultado" : "resultados"} — página{" "}
        {currentPage} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        {hasPrev ? (
          <Link
            href={buildHref(currentPage - 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Link>
        ) : (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50"
            )}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </span>
        )}
        {hasNext ? (
          <Link
            href={buildHref(currentPage + 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        ) : (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50"
            )}
          >
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}

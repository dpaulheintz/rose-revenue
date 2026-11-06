"use client";

import { useState, type ReactNode } from "react";
import Dialog from "@demos/kit/ui/Dialog";
import { EmptyState } from "@demos/kit/ui/EmptyState";
import { SearchBar } from "@demos/kit/ui/SearchBar";
import { Button, ChipRow, FilterChip } from "@demos/kit/ui/ui";
import { ResponsiveTable, type Column } from "./ResponsiveTable";

export type ListFilter<T> = { id: string; label: string; test: (r: T) => boolean };

/**
 * Search + filter chips + responsive table + a record drawer. The usual CRM
 * screen: pass rows, columns and what the drawer shows for one record.
 */
export function ListWithDetail<T>({
  rows, columns, getKey, searchText, searchLabel = "Search", searchPlaceholder, filters = [], title, subtitle, detail, footer, card, pageSize = 30, minWidth, toolbar,
}: {
  rows: T[];
  columns: Column<T>[];
  getKey: (r: T) => string;
  searchText: (r: T) => string;
  searchLabel?: string;
  searchPlaceholder?: string;
  filters?: ListFilter<T>[];
  title: (r: T) => ReactNode;
  subtitle?: (r: T) => ReactNode;
  detail: (r: T) => ReactNode;
  footer?: (r: T) => ReactNode;
  card?: (r: T) => ReactNode;
  pageSize?: number;
  minWidth?: number;
  toolbar?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [limit, setLimit] = useState(pageSize);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const active = filters.find((f) => f.id === filter);
  const needle = q.trim().toLowerCase();
  const shown = rows.filter((r) => (!active || active.test(r)) && (!needle || searchText(r).toLowerCase().includes(needle)));
  const open = openKey ? rows.find((r) => getKey(r) === openKey) : null;
  return (
    <div className="space-y-3">
      {filters.length ? (
        <ChipRow>
          <FilterChip on={!filter} onClick={() => { setFilter(null); setLimit(pageSize); }} count={rows.length}>All</FilterChip>
          {filters.map((f) => <FilterChip key={f.id} on={filter === f.id} onClick={() => { setFilter(f.id); setLimit(pageSize); }} count={rows.filter(f.test).length}>{f.label}</FilterChip>)}
        </ChipRow>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <SearchBar className="min-w-0 flex-1 basis-60" label={searchLabel} placeholder={searchPlaceholder ?? searchLabel} value={q} onChange={(v) => { setQ(v); setLimit(pageSize); }} />
        {toolbar}
      </div>
      {shown.length ? (
        <ResponsiveTable columns={columns} rows={shown.slice(0, limit)} getKey={getKey} onRow={(r) => setOpenKey(getKey(r))} card={card} minWidth={minWidth} />
      ) : (
        <EmptyState title="Nothing matches" hint="Try a shorter search or clear the filter." />
      )}
      {shown.length > limit ? <div className="flex justify-center"><Button onClick={() => setLimit((l) => l + pageSize)}>Show {pageSize} more</Button></div> : null}
      {open ? (
        <Dialog open drawer onClose={() => setOpenKey(null)} title={title(open)} subtitle={subtitle?.(open)} footer={footer?.(open)}>
          {detail(open)}
        </Dialog>
      ) : null}
    </div>
  );
}

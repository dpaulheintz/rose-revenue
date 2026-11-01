"use client";

import { useId } from "react";
import Icon from "./Icon";

/** Search input with a leading icon and a screen-reader label. */
export function SearchBar({ label, placeholder, value, onChange, className = "" }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; className?: string }) {
  const id = useId();
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-(--d-muted)" />
      <input id={id} className="demo-input pl-10" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

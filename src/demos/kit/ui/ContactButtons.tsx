"use client";

import Icon from "@demos/kit/ui/Icon";

/**
 * Call / Text / Email for a contact. In a demo nothing dials or sends:
 * each button calls onTap (show the demo-mode toast).
 */
export function ContactButtons({ name, phone, email, onTap }: { name: string; phone: string; email: string; onTap: (what: string) => void }) {
  const items = [
    { key: "call", label: "Call", icon: "phone" as const, what: `Calling ${name} at ${phone}` },
    { key: "text", label: "Text", icon: "chat" as const, what: `Texting ${name} at ${phone}` },
    { key: "email", label: "Email", icon: "mail" as const, what: `Emailing ${name} at ${email}` },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((i) => (
        <button key={i.key} type="button" onClick={() => onTap(i.what)} className="flex min-h-12 items-center justify-center gap-1.5 rounded-[10px] border border-(--d-line) bg-(--d-panel) text-[15px] font-semibold text-(--d-accent)">
          <Icon name={i.icon} size={18} />{i.label}
        </button>
      ))}
    </div>
  );
}

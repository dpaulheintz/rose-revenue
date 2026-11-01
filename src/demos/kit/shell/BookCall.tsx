import { CAL_BOOKING_URL } from "@/lib/booking";
import Icon from "@demos/kit/ui/Icon";

/** The "Book a free 15-min call" button (always the site's Cal.com link). */
export function BookCall() {
  return (
    <a
      href={CAL_BOOKING_URL}
      target="_blank"
      rel="noopener"
      className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-(--d-accent) px-4 whitespace-nowrap text-[14px] font-semibold text-(--d-on-accent) hover:brightness-110 sm:px-5"
    >
      <Icon name="calendar" size={18} className="hidden sm:block" />
      <span className="sm:hidden">Book a call</span>
      <span className="hidden sm:inline">Book a free 15-min call</span>
      <span className="sr-only"> (opens Cal.com in a new tab)</span>
    </a>
  );
}

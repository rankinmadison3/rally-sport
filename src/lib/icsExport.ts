// Generates a standards-compatible .ics calendar file (RFC 5545)

export interface IcsEvent {
  id: string;
  label: string;
  event_type: string;
  event_date: string; // YYYY-MM-DD
  event_time: string | null; // HH:MM or HH:MM:SS
  location: string | null;
  game_result?: string | null;
  is_regular_season?: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

const formatDateLocal = (date: string) => date.replace(/-/g, "");

const formatDateTimeLocal = (date: string, time: string) => {
  // Build a floating local datetime: YYYYMMDDTHHMMSS
  const [h, m, s] = time.split(":");
  return `${formatDateLocal(date)}T${pad(Number(h))}${pad(Number(m))}${pad(Number(s ?? 0))}`;
};

const stamp = () => {
  const d = new Date();
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
};

const escapeText = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const fold = (line: string) => {
  // RFC 5545 line folding at 75 octets
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let i = 0;
  while (i < line.length) {
    chunks.push((i === 0 ? "" : " ") + line.slice(i, i + 73));
    i += 73;
  }
  return chunks.join("\r\n");
};

export const buildIcs = (events: IcsEvent[], calendarName = "Team Calendar") => {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rally Sport//Team Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];

  const dtstamp = stamp();

  for (const e of events) {
    const uid = `${e.id}@rallysport`;
    const summary = `[${e.event_type.toUpperCase()}] ${e.label}${
      e.game_result ? ` (${e.game_result.toUpperCase()})` : ""
    }`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);

    if (e.event_time) {
      const dtstart = formatDateTimeLocal(e.event_date, e.event_time);
      // 1-hour default duration
      const [h, m] = e.event_time.split(":").map(Number);
      const endH = (h + 1) % 24;
      const endTime = `${pad(endH)}:${pad(m)}:00`;
      const dtend = formatDateTimeLocal(e.event_date, endTime);
      lines.push(`DTSTART:${dtstart}`);
      lines.push(`DTEND:${dtend}`);
    } else {
      // All-day event
      const d = new Date(e.event_date);
      d.setDate(d.getDate() + 1);
      const endDate = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
      lines.push(`DTSTART;VALUE=DATE:${formatDateLocal(e.event_date)}`);
      lines.push(`DTEND;VALUE=DATE:${endDate}`);
    }

    lines.push(fold(`SUMMARY:${escapeText(summary)}`));
    if (e.location) lines.push(fold(`LOCATION:${escapeText(e.location)}`));
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
};

export const downloadIcs = (events: IcsEvent[], filename = "team-calendar.ics") => {
  const ics = buildIcs(events);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

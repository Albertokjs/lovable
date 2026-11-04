import { readWidgetData, workspaceWidgets, type WidgetData } from "./widget-data";
export type Link = { id: string; name: string; url: string; color: string };
export type Tab = { id: string; title: string; url: string };
export type CustomWidget = { id: string; title: string; url: string };
export type Profile = {
  id: string;
  name: string;
  icon: string;
  theme: string;
  accent: string;
  motion: boolean;
  notes: string;
  links: Link[];
  tabs: Tab[];
  activeTab: string;
  history: Tab[];
  widgets: string[];
  customWidgets: CustomWidget[];
  widgetData: WidgetData;
  widgetVersion: number;
  snapshots: { id: string; name: string; tabs: Tab[] }[];
};
export const uid = () => crypto.randomUUID();
export const presets = [
  { name: "Deep Space", color: "#a78bfa" },
  { name: "Nebula", color: "#e18abb" },
  { name: "Aurora", color: "#6cdbbf" },
  { name: "Cyberpunk", color: "#f2bf65" },
  { name: "Midnight", color: "#82acff" },
  { name: "Minimal", color: "#b9bbc9" },
];
const sites = [
  ["YouTube", "https://youtube.com", "#f05663"],
  ["GitHub", "https://github.com", "#c2c0cf"],
  ["Notion", "https://notion.so", "#eeeeee"],
  ["Spotify", "https://open.spotify.com", "#62d79b"],
  ["Discord", "https://discord.com", "#9294ff"],
  ["Figma", "https://figma.com", "#ffae8f"],
];
export function makeProfile(name: string, icon = "planet"): Profile {
  const tab = { id: uid(), title: "New tab", url: "orbital://newtab" };
  return {
    id: uid(),
    name,
    icon,
    theme: "Deep Space",
    accent: "#a78bfa",
    motion: true,
    notes: "",
    links: sites.map(([name, url, color]) => ({ id: uid(), name, url, color })),
    tabs: [tab],
    activeTab: tab.id,
    history: [],
    widgets: [...workspaceWidgets(name, icon), "focus", "notes", "activity"],
    widgetData: readWidgetData(null),
    widgetVersion: 1,
    customWidgets: [],
    snapshots: [],
  };
}
export function initialProfiles() {
  return ["Personal", "Study", "Gaming"].map((name, i) => {
    const p = makeProfile(name, ["planet", "study", "gaming"][i]);
    if (i === 1) {
      p.accent = "#6cdbbf";
      p.theme = "Aurora";
      p.links = [
        {
          id: uid(),
          name: "Wikipedia",
          url: "https://wikipedia.org",
          color: "#eeeeee",
        },
        {
          id: uid(),
          name: "Khan Academy",
          url: "https://khanacademy.org",
          color: "#6cdbbf",
        },
        ...p.links.slice(1, 4),
      ];
    }
    if (i === 2) {
      p.accent = "#e18abb";
      p.theme = "Nebula";
    }
    return p;
  });
}
export function readProfiles(): Profile[] {
  try {
    const raw = JSON.parse(localStorage.getItem("orbital-profiles") || "null");
    if (
      Array.isArray(raw) &&
      raw.length &&
      raw.every(
        (p) =>
          typeof p.name === "string" &&
          Array.isArray(p.tabs) &&
          p.tabs.length &&
          Array.isArray(p.links) &&
          Array.isArray(p.widgets) &&
          Array.isArray(p.history) &&
          Array.isArray(p.snapshots),
      )
    )
      return raw.map((p) => ({
        ...p,
        widgets: p.widgetVersion === 1 ? p.widgets : [...new Set([...workspaceWidgets(p.name, p.icon), ...p.widgets])],
        widgetVersion: 1,
        widgetData: readWidgetData(p.widgetData),
        customWidgets: Array.isArray(p.customWidgets)
          ? p.customWidgets.filter(
              (widget: unknown) =>
                widget &&
                typeof widget === "object" &&
                "id" in widget &&
                "title" in widget &&
                "url" in widget &&
                typeof widget.id === "string" &&
                typeof widget.title === "string" &&
                typeof widget.url === "string" &&
                resolveAddress(widget.url)?.startsWith("http"),
            )
          : [],
      }));
  } catch {}
  return initialProfiles();
}
export function resolveAddress(value: string) {
  const input = value.trim();
  if (!input) return null;
  if (input === "orbital://newtab") return input;
  if (/^[a-z][a-z\d+.-]*:/i.test(input)) {
    try {
      const u = new URL(input);
      return ["https:", "http:"].includes(u.protocol) ? u.href : null;
    } catch {
      return null;
    }
  }
  if (/^[\w-]+(\.[\w-]+)+([/:?#].*)?$/.test(input)) return "https://" + input;
  return "https://www.google.com/search?q=" + encodeURIComponent(input);
}

export function embeddedAddress(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (
      host === "youtu.be" ||
      host === "youtube.com" ||
      host === "m.youtube.com"
    ) {
      const id =
        host === "youtu.be"
          ? url.pathname.split("/").filter(Boolean)[0]
          : url.searchParams.get("v") ||
            url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
      if (id && /^[\w-]+$/.test(id)) {
        return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
      }
    }
  } catch {}
  return value;
}

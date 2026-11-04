import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Plus,
  X,
  Search,
  ShieldCheck,
  Star,
  MoreHorizontal,
  Settings,
  PanelLeft,
  Home,
  Bookmark,
  Clock,
  Download,
  Layers,
  Sparkles,
  Command,
  SlidersHorizontal,
  ArrowUpRight,
  Globe,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Check,
  Maximize2,
  ExternalLink,
  Trash2,
  Save,
  Palette,
  BookOpen,
  Gamepad2,
  Orbit,
  Send,
  LayoutGrid,
  Pin,
  GripVertical,
  Pencil,
  Monitor,
  Eye,
  Upload,
  Copy,
  CheckCheck,
  Timer,
  Music,
  Code,
  StickyNote,
  Volume2,
} from "lucide-react";
import {
  embeddedAddress,
  initialProfiles,
  makeProfile,
  presets,
  readProfiles,
  resolveAddress,
  uid,
  type Profile,
  type Tab,
} from "./store";
import "./styles.css";
function safeRead(key: string) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}
function App() {
  type AiStatus = "checking" | "ready" | "needs-key" | "offline";
  const [profiles, setProfiles] = useState(readProfiles);
  const [active, setActive] = useState(() => safeRead("orbital-active"));
  const p = profiles.find((p) => p.id === active) || profiles[0];
  const [panel, setPanel] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const [ai, setAi] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus>("checking");
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [focus, setFocus] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [seconds, setSeconds] = useState(25 * 60);
  const [timerMode, setTimerMode] = useState("focus");
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  const [chat, setChat] = useState("");
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState(false);
  const [filter, setFilter] = useState("");
  const [closed, setClosed] = useState<Tab[]>([]);
  const [dragged, setDragged] = useState("");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newWidgetName, setNewWidgetName] = useState("");
  const [newWidgetUrl, setNewWidgetUrl] = useState("");
  const [editingWidgetId, setEditingWidgetId] = useState("");
  const [frameVersion, setFrameVersion] = useState(0);
  const [background, setBackground] = useState(() =>
    safeRead("orbital-background"),
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const tab = p.tabs.find((t) => t.id === p.activeTab) || p.tabs[0];
  useEffect(() => {
    if (!panel) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const elements = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([hidden]),a[href],textarea,[tabindex="0"]',
        ) || [],
      ).filter((el) => el.offsetParent !== null);
    requestAnimationFrame(() => {
      (
        dialog?.querySelector<HTMLElement>("input:not([type=color])") ||
        elements()[0]
      )?.focus();
    });
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const list = elements();
      const first = list[0],
        last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [panel]);
  function update(change: Partial<Profile>) {
    setProfiles((all) =>
      all.map((item) => (item.id === p.id ? { ...item, ...change } : item)),
    );
  }
  function notify(text: string) {
    setToast(text);
  }
  async function checkAiConnection() {
    setAiStatus("checking");
    try {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error("API health check failed");
      const data = await response.json();
      setAiStatus(data.aiConfigured ? "ready" : "needs-key");
    } catch {
      setAiStatus("offline");
    }
  }
  useEffect(() => {
    void checkAiConnection();
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("orbital-profiles", JSON.stringify(profiles));
      localStorage.setItem("orbital-active", p.id);
    } catch {
      setToast("Storage is full. Export your workspace to keep a backup.");
    }
  }, [profiles, p.id]);
  useEffect(() => {
    setAddress(tab.url === "orbital://newtab" ? "" : tab.url);
  }, [tab.id, tab.url]);
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () =>
        setSeconds((s) => {
          if (s <= 1) {
            setRunning(false);
            setToast("Focus session complete. Time for a well-earned break.");
            return 0;
          }
          return s - 1;
        }),
      1000,
    );
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPanel((v) => (v === "commands" ? "" : "commands"));
      }
      if (e.key === "Escape") {
        setPanel("");
        setAi(false);
        setFocus(false);
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "f"
      ) {
        e.preventDefault();
        setFocus((v) => !v);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function newTab(url = "orbital://newtab", title = "New tab") {
    const t = { id: uid(), url, title };
    update({ tabs: [...p.tabs, t], activeTab: t.id });
  }
  function navigate(input: string) {
    const url = resolveAddress(input);
    if (!url) {
      notify("Enter a search or a valid HTTP or HTTPS address.");
      return;
    }
    const title =
      url === "orbital://newtab"
        ? "New tab"
        : new URL(url).hostname.replace("www.", "");
    const next = { ...tab, url, title };
    update({
      tabs: p.tabs.map((t) => (t.id === tab.id ? next : t)),
      history: url.startsWith("http")
        ? [next, ...p.history].slice(0, 100)
        : p.history,
    });
    setQuery("");
  }
  function closeTab(id: string) {
    if (p.tabs.length === 1) {
      navigate("orbital://newtab");
      return;
    }
    const removed = p.tabs.find((t) => t.id === id)!;
    setClosed([...closed, removed]);
    const tabs = p.tabs.filter((t) => t.id !== id);
    update({ tabs, activeTab: p.activeTab === id ? tabs[0].id : p.activeTab });
  }
  function openPanel(name: string) {
    setPanel(name);
    setFilter("");
  }
  function exportData() {
    const blob = new Blob([JSON.stringify({ version: 1, profiles }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orbital-workspaces.json";
    a.click();
    URL.revokeObjectURL(url);
    notify("Workspace backup downloaded");
  }
  async function sendMessage(text = chat) {
    if (!text.trim() || busy || aiStatus !== "ready") return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setChat("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.slice(-12),
          context: context
            ? {
                profile: p.name,
                tabs: p.tabs.map((t) => ({ title: t.title, url: t.url })),
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assistant unavailable");
      setMessages([...next, { role: "assistant", content: data.message }]);
    } catch (err) {
      const message =
        err instanceof TypeError && /fetch/i.test(err.message)
          ? "The Orbital API server could not be reached. Restart the app with npm run dev and try again."
          : err instanceof Error
            ? err.message
            : "Unable to reach the assistant. Restart the app with npm run dev and try again.";
      setMessages([
        ...next,
        {
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }
  const profileIcon = (icon: string, size = 18) =>
    icon === "study" ? (
      <BookOpen size={size} />
    ) : icon === "gaming" ? (
      <Gamepad2 size={size} />
    ) : (
      <Orbit size={size} />
    );
  const button = (
    Icon: React.ElementType,
    label: string,
    onClick: () => void,
    cls = "",
  ) => (
    <button
      className={"icon-button " + cls}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      <Icon size={17} />
    </button>
  );
  const shortcutIcon = (name: string) =>
    name === "YouTube" ? (
      <Play fill="currentColor" />
    ) : name === "GitHub" ? (
      <Code />
    ) : name === "Spotify" ? (
      <Music />
    ) : name === "Discord" ? (
      <Gamepad2 />
    ) : name === "Notion" ? (
      <span className="notion">N</span>
    ) : name === "Figma" ? (
      <span className="figma-mark">⠿</span>
    ) : (
      <Globe />
    );
  return (
    <div
      className={`app ${!p.motion ? "no-motion" : ""} ${focus ? "focus-mode" : ""}`}
      style={{ "--accent": p.accent } as React.CSSProperties}
    >
      <header className="browser-chrome">
        <div className="tab-strip">
          <div className="brand">
            <Orbit size={25} />
            <span>
              orbital<span className="brand-dot">.</span>
            </span>
          </div>
          <div className="tabs">
            {p.tabs.map((t) => (
              <div
                className={"tab " + (t.id === tab.id ? "selected" : "")}
                key={t.id}
              >
                <button onClick={() => update({ activeTab: t.id })}>
                  {t.url === "orbital://newtab" ? (
                    <Orbit size={15} />
                  ) : (
                    <Globe size={15} />
                  )}
                  <span>{t.title}</span>
                </button>
                <button
                  aria-label={"Close " + t.title}
                  onClick={() => closeTab(t.id)}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {button(Plus, "New tab", () => newTab())}
          </div>
          <div className="chrome-right">
            <span className="tiny-orbit">✦</span>
            {button(PanelLeft, "Toggle focus mode", () => setFocus(!focus))}
          </div>
        </div>
        <div className="navigation">
          <div className="nav-arrows">
            {button(ArrowLeft, "Previous visited page", () => {
              const previous = p.history[1];
              previous
                ? navigate(previous.url)
                : notify("No earlier page in this workspace");
            })}
            {button(
              RotateCw,
              tab.url.startsWith("http") ? "Reload page" : "Refresh dashboard",
              () => {
                if (tab.url.startsWith("http"))
                  setFrameVersion((version) => version + 1);
                else setClock(new Date());
              },
            )}
            {button(Home, "Go to dashboard", () =>
              navigate("orbital://newtab"),
            )}
          </div>
          <form
            className="address"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(address);
            }}
          >
            <ShieldCheck size={15} />
            <input
              aria-label="Address bar"
              value={address}
              placeholder="Search or enter a URL"
              onChange={(e) => setAddress(e.target.value)}
            />
            <span className="address-hint">orbital://newtab</span>
            <button
              type="button"
              aria-label="Bookmark current tab"
              onClick={() => {
                if (tab.url.startsWith("http")) {
                  update({
                    links: [
                      ...p.links,
                      {
                        id: uid(),
                        name: tab.title,
                        url: tab.url,
                        color: p.accent,
                      },
                    ],
                  });
                  notify("Added to your bookmarks");
                } else openPanel("bookmarks");
              }}
            >
              <Star size={16} />
            </button>
          </form>
          <div className="nav-actions">
            {button(ShieldCheck, "Privacy dashboard", () =>
              openPanel("privacy"),
            )}
            {button(Sparkles, "Open Orbital AI", () => setAi(!ai))}
            <div className="divider" />
            <button
              className="avatar"
              onClick={() => openPanel("profiles")}
              aria-label="Manage profiles"
            >
              J
            </button>
            {button(MoreHorizontal, "Open command menu", () =>
              openPanel("commands"),
            )}
          </div>
        </div>
      </header>
      <aside className="sidebar">
        <div className="workspace-label">
          YOUR SPACE{" "}
          <button
            aria-label="Manage workspaces"
            onClick={() => openPanel("profiles")}
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="profile-list">
          {profiles.map((item) => (
            <button
              key={item.id}
              className={"profile " + (p.id === item.id ? "active" : "")}
              onClick={() => {
                setActive(item.id);
                setRunning(false);
              }}
            >
              {profileIcon(item.icon)}
              <span>{item.name}</span>
              {p.id === item.id && <span className="active-dot" />}
            </button>
          ))}
        </div>
        <button className="new-space" onClick={() => openPanel("profiles")}>
          <Plus size={15} /> New workspace
        </button>
        <div className="side-rule" />
        <nav>
          {[
            ["Home", Home, ""],
            ["Bookmarks", Bookmark, "bookmarks"],
            ["History", Clock, "history"],
            ["Downloads", Download, "downloads"],
            ["Saved sessions", Layers, "sessions"],
          ].map(([label, Icon, name]) => (
            <button
              key={String(label)}
              className={
                "side-link " + (label === "Home" && !panel ? "current" : "")
              }
              onClick={() =>
                name ? openPanel(String(name)) : navigate("orbital://newtab")
              }
            >
              {React.createElement(Icon as React.ElementType, { size: 18 })}
              <span>{String(label)}</span>
              {label === "Bookmarks" && <small>{p.links.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="ai-launch" onClick={() => setAi(true)}>
            <span className="ai-spark">
              <Sparkles size={19} />
            </span>
            <div>
              Orbital AI<small>A little cosmic intelligence</small>
            </div>
            <ChevronRight size={14} />
          </button>
          <button className="side-link" onClick={() => openPanel("settings")}>
            <Settings size={18} /> Settings{" "}
            <span className="shortcut">⌘ ,</span>
          </button>
          <button className="side-link" onClick={() => openPanel("commands")}>
            <Command size={17} /> Command palette{" "}
            <span className="shortcut">⌘ K</span>
          </button>
          <div className="local-status">
            <span /> Local workspace <small>v0.1</small>
          </div>
        </div>
      </aside>
      <main className="main">
        <div
          className="cosmos"
          style={
            background
              ? {
                  backgroundImage: `linear-gradient(180deg,rgba(15,12,29,.12),#101019 96%),url(${background})`,
                }
              : undefined
          }
        />
        <div className="stars">
          {Array.from({ length: 55 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 37.17) % 100}%`,
                top: `${(i * 19.3) % 100}%`,
                animationDelay: `${i % 7}s`,
                opacity: 0.2 + (i % 5) * 0.13,
              }}
            />
          ))}
        </div>
        <div className="dashboard-top">
          <button
            className="workspace-pill"
            onClick={() => openPanel("profiles")}
          >
            {profileIcon(p.icon, 13)} {p.name} workspace{" "}
            <ChevronDown size={12} />
          </button>
          <button
            className="subtle-button"
            onClick={() => {
              setFocus(!focus);
              notify(
                focus
                  ? "Full workspace restored"
                  : "Focus mode on · press Escape to exit",
              );
            }}
          >
            <Maximize2 size={14} />
            {focus ? "Exit focus" : "Focus mode"}
          </button>
        </div>
        {tab.url === "orbital://newtab" ? (
          <div className="dashboard">
            <section className="hero">
              <div className="date">
                {clock
                  .toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                  .toUpperCase()}{" "}
                <span /> YOUR UNIVERSE AWAITS
              </div>
              <h1>
                A little space. <span>Endless possibilities.</span>
              </h1>
              <p>Welcome back, explorer. Where will your curiosity take you?</p>
              <form
                className="hero-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate(query);
                }}
              >
                <Search size={21} />
                <input
                  aria-label="Search the web"
                  placeholder="Search the web or enter a URL"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <kbd>⌘ K</kbd>
                <span className="search-divider" />
                <button
                  type="button"
                  title="Ask Orbital AI"
                  onClick={() => {
                    setAi(true);
                    if (query) setChat(query);
                  }}
                >
                  <Sparkles size={21} />
                </button>
              </form>
              <div className="search-foot">
                <span>
                  <ShieldCheck size={12} /> Your space. Your privacy.
                </span>
                <button onClick={() => setAi(true)}>
                  Or, ask Orbital AI <ArrowUpRight size={13} />
                </button>
              </div>
            </section>
            <section className="quick-section">
              <div className="section-heading">
                <h2>
                  Quick launch <span>YOUR EVERYDAY ORBITS</span>
                </h2>
                <button onClick={() => openPanel("shortcuts")}>
                  <Plus size={14} /> Add shortcut
                </button>
              </div>
              <div className="quick-grid">
                {p.links.slice(0, 7).map((link) => (
                  <button
                    className="quick-card"
                    key={link.id}
                    onClick={() => navigate(link.url)}
                  >
                    <span className="site-icon" style={{ color: link.color }}>
                      {shortcutIcon(link.name)}
                    </span>
                    <span>{link.name}</span>
                    <ArrowUpRight className="quick-arrow" size={12} />
                  </button>
                ))}
                <button
                  className="quick-card add-card"
                  onClick={() => openPanel("shortcuts")}
                >
                  <span className="site-icon">
                    <Plus size={23} />
                  </span>
                  <span>Add new</span>
                </button>
              </div>
            </section>
            <section className="widgets-section">
              <div className="section-heading">
                <h2>
                  Your dashboard <span>A HOME FOR YOUR HEADSPACE</span>
                </h2>
                <button onClick={() => openPanel("widgets")}>
                  <SlidersHorizontal size={14} /> Edit widgets
                </button>
              </div>
              <div className="widget-grid">
                {p.widgets.map((id) => (
                  <article
                    key={id}
                    className={"widget " + id}
                    draggable
                    onDragStart={() => setDragged(id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      const order = [...p.widgets];
                      const a = order.indexOf(dragged),
                        b = order.indexOf(id);
                      if (a >= 0) {
                        [order[a], order[b]] = [order[b], order[a]];
                        update({ widgets: order });
                      }
                    }}
                  >
                    {id === "focus" ? (
                      <>
                        <div className="widget-heading">
                          <span>
                            <Timer size={16} /> Focus flow
                          </span>
                          <button
                            aria-label="Reset focus timer"
                            onClick={() => {
                              setSeconds(1500);
                              setRunning(false);
                            }}
                          >
                            <RotateCw size={14} />
                          </button>
                        </div>
                        <div className="timer-tabs">
                          <button
                            className={timerMode === "focus" ? "chosen" : ""}
                            onClick={() => {
                              setTimerMode("focus");
                              setSeconds(1500);
                              setRunning(false);
                            }}
                          >
                            Pomodoro
                          </button>
                          <button
                            className={timerMode === "break" ? "chosen" : ""}
                            onClick={() => {
                              setTimerMode("break");
                              setSeconds(300);
                              setRunning(false);
                            }}
                          >
                            Short break
                          </button>
                        </div>
                        <div className="timer-value">
                          {String(Math.floor(seconds / 60)).padStart(2, "0")}
                          <span>:</span>
                          {String(seconds % 60).padStart(2, "0")}
                        </div>
                        <p>One thing at a time. You've got this.</p>
                        <button
                          className="start-focus"
                          onClick={() => {
                            if (seconds === 0) setSeconds(1500);
                            setRunning(!running);
                          }}
                        >
                          {running ? (
                            <Pause size={14} />
                          ) : (
                            <Play size={14} fill="currentColor" />
                          )}
                          {running ? "Pause session" : "Start focus"}
                          <span>↵</span>
                        </button>
                      </>
                    ) : id === "notes" ? (
                      <>
                        <div className="widget-heading">
                          <span>
                            <StickyNote size={16} /> Quick notes
                          </span>
                          <span className="saved">
                            <span /> Saved locally
                          </span>
                        </div>
                        <textarea
                          aria-label="Quick notes"
                          placeholder={
                            "A thought, an idea, a small reminder…\n\nMake room for what’s on your mind."
                          }
                          value={p.notes}
                          onChange={(e) => update({ notes: e.target.value })}
                        />
                        <div className="note-footer">
                          <span>{p.notes.length} characters</span>
                          <span>
                            Just for you <span>✧</span>
                          </span>
                        </div>
                      </>
                    ) : id === "activity" ? (
                      <>
                        <div className="widget-heading">
                          <span>
                            <Clock size={16} /> Recently explored
                          </span>
                          <button
                            aria-label="View all history"
                            onClick={() => openPanel("history")}
                          >
                            <ArrowUpRight size={16} />
                          </button>
                        </div>
                        <div className="activity-list">
                          {p.history.length ? (
                            p.history.slice(0, 3).map((h, i) => (
                              <button key={i} onClick={() => navigate(h.url)}>
                                <span className="history-icon">
                                  <Globe size={16} />
                                </span>
                                <div>
                                  {h.title}
                                  <small>{new URL(h.url).hostname}</small>
                                </div>
                                <ArrowUpRight size={13} />
                              </button>
                            ))
                          ) : (
                            <>
                              <div className="empty-orbit">
                                <Orbit size={30} />
                              </div>
                              <p>Your next discovery starts here.</p>
                              <small>
                                Pages you explore will appear in your orbit.
                              </small>
                            </>
                          )}
                        </div>
                        <button
                          className="view-history"
                          onClick={() => openPanel("history")}
                        >
                          View browsing history <ArrowRight size={13} />
                        </button>
                      </>
                    ) : (
                      (() => {
                        const custom = p.customWidgets.find(
                          (widget) => widget.id === id,
                        );
                        if (!custom) return null;
                        return (
                          <>
                            <div className="widget-heading">
                              <span>
                                <Globe size={16} /> {custom.title}
                              </span>
                              <button
                                aria-label={`Edit ${custom.title}`}
                                onClick={() => {
                                  setEditingWidgetId(custom.id);
                                  setNewWidgetName(custom.title);
                                  setNewWidgetUrl(custom.url);
                                  openPanel("widgets");
                                }}
                              >
                                <SlidersHorizontal size={14} />
                              </button>
                            </div>
                            <p className="custom-widget-url">
                              {new URL(custom.url).hostname}
                            </p>
                            <button
                              className="custom-widget-open"
                              onClick={() => navigate(custom.url)}
                            >
                              Open website <ArrowUpRight size={14} />
                            </button>
                          </>
                        );
                      })()
                    )}
                  </article>
                ))}
              </div>
            </section>
            <section className="discovery">
              <div className="discovery-art">
                <Orbit size={43} />
                <span className="orbit-ring" />
              </div>
              <div>
                <span className="eyebrow">BUILT AROUND YOU</span>
                <h3>A universe that feels like yours.</h3>
                <p>New colors. New atmospheres. Same infinite possibilities.</p>
              </div>
              <button onClick={() => openPanel("customize")}>
                Make it yours <ArrowUpRight size={15} />
              </button>
            </section>
            <footer className="dashboard-footer">
              <span>
                <span className="status-dot" /> All systems peaceful{" "}
                <span className="footer-separator">·</span> Local-first by
                design
              </span>
              <span>
                {clock.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                <span className="footer-separator">·</span> A little closer to
                the cosmos <Sparkles size={12} />
              </span>
            </footer>
          </div>
        ) : (
          <section className="web-viewer">
            <div className="web-viewer-bar">
              <span>
                <Globe size={14} /> {new URL(tab.url).hostname}
              </span>
              <a href={tab.url} target="_blank" rel="noopener noreferrer">
                Open in browser <ExternalLink size={14} />
              </a>
            </div>
            <iframe
              key={`${tab.id}:${tab.url}:${frameVersion}`}
              title={`Website: ${tab.title}`}
              src={embeddedAddress(tab.url)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div className="web-viewer-note">
              If the page is blank, the website may block embedding. Use “Open
              in browser” to visit it directly.
            </div>
          </section>
        )}
        <button
          className="customize-float"
          onClick={() => openPanel("customize")}
        >
          <SlidersHorizontal size={15} /> Customize
        </button>
      </main>
      {panel && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPanel("");
          }}
        >
          <section
            ref={dialogRef}
            className={"modal " + (panel === "commands" ? "command-modal" : "")}
            role="dialog"
            aria-modal="true"
            aria-label={panel}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">YOUR ORBITAL</span>
                <h2>
                  {
                    {
                      customize: "Make space for your style",
                      settings: "Settings",
                      profiles: "Your workspaces",
                      bookmarks: "Your bookmarks",
                      shortcuts: "Add a quick launch",
                      history: "Your discoveries",
                      sessions: "Workspace snapshots",
                      privacy: "Privacy & protection",
                      downloads: "Downloads",
                      widgets: "Your dashboard, your way",
                      commands: "Where would you like to go?",
                    }[panel]
                  }
                </h2>
              </div>
              {button(X, "Close dialog", () => setPanel(""))}
            </div>
            {["customize", "settings"].includes(panel) && (
              <>
                <p className="muted">
                  Changes preview instantly and save to your{" "}
                  {p.name.toLowerCase()} workspace.
                </p>
                {panel === "settings" && (
                  <label className="field search-field">
                    <Search size={17} />
                    <input
                      aria-label="Search settings"
                      placeholder="Find a setting…"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </label>
                )}
                {(!filter || /theme|appearance|color/i.test(filter)) && (
                  <>
                    <h4>CHOOSE YOUR ATMOSPHERE</h4>
                    <div className="theme-grid">
                      {presets.map((theme, i) => (
                        <button
                          aria-label={theme.name}
                          className={
                            "theme-card " +
                            (p.theme === theme.name ? "chosen" : "")
                          }
                          key={theme.name}
                          onClick={() =>
                            update({ theme: theme.name, accent: theme.color })
                          }
                        >
                          <span
                            className={"theme-preview theme-" + i}
                            style={
                              { "--theme": theme.color } as React.CSSProperties
                            }
                          >
                            {p.theme === theme.name && <Check size={18} />}
                          </span>
                          <span>{theme.name}</span>
                        </button>
                      ))}
                    </div>
                    <div className="setting-row">
                      <div>
                        Accent color
                        <small>A little glow that’s uniquely you</small>
                      </div>
                      <input
                        aria-label="Accent color"
                        type="color"
                        value={p.accent}
                        onChange={(e) => update({ accent: e.target.value })}
                      />
                    </div>
                  </>
                )}
                {(!filter ||
                  /motion|animation|performance|accessibility/i.test(
                    filter,
                  )) && (
                  <div className="setting-row">
                    <div>
                      Ambient animations
                      <small>Turn off for a calmer, lighter experience</small>
                    </div>
                    <button
                      role="switch"
                      aria-checked={p.motion}
                      className={"toggle " + (p.motion ? "on" : "")}
                      onClick={() => update({ motion: !p.motion })}
                    >
                      <span />
                    </button>
                  </div>
                )}
                {(!filter || /background|image/i.test(filter)) && (
                  <div className="setting-row">
                    <div>
                      Personal wallpaper
                      <small>
                        Upload an image, up to 2 MB · shared on this device
                      </small>
                    </div>
                    <label className="small-button">
                      <Upload size={14} /> Upload
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2e6) {
                            notify("Please choose an image smaller than 2 MB");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            try {
                              localStorage.setItem(
                                "orbital-background",
                                String(reader.result),
                              );
                              setBackground(String(reader.result));
                            } catch {
                              notify("Not enough storage for this image");
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {background &&
                      button(X, "Remove wallpaper", () => {
                        setBackground("");
                        localStorage.removeItem("orbital-background");
                      })}
                  </div>
                )}
                {(!filter || /backup|export|import|data/i.test(filter)) && (
                  <div className="setting-row">
                    <div>
                      Workspace backup
                      <small>
                        Export profiles, bookmarks, notes and themes
                      </small>
                    </div>
                    <button className="small-button" onClick={exportData}>
                      <Download size={14} /> Export
                    </button>
                    <button
                      className="small-button"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload size={14} /> Import
                    </button>
                  </div>
                )}
                <div className="capability-note">
                  <ShieldCheck size={18} />
                  <span>
                    Preferences live on this device. Account sync and
                    browser-engine settings are planned for the desktop edition.
                  </span>
                </div>
                <button
                  className="subtle-button"
                  onClick={() =>
                    update({
                      theme: "Deep Space",
                      accent: "#a78bfa",
                      motion: true,
                    })
                  }
                >
                  Reset appearance
                </button>
              </>
            )}
            {panel === "profiles" && (
              <>
                <p className="muted">
                  Different worlds. A little space for each side of you.
                </p>
                <div className="list">
                  {profiles.map((item) => (
                    <div className="list-row" key={item.id}>
                      <span className="list-icon">
                        {profileIcon(item.icon)}
                      </span>
                      <div>
                        <strong>{item.name}</strong>
                        <small>
                          {item.tabs.length} tabs · {item.links.length}{" "}
                          bookmarks
                        </small>
                      </div>
                      <button
                        className="small-button"
                        onClick={() => {
                          setActive(item.id);
                          setPanel("");
                          setRunning(false);
                        }}
                      >
                        {p.id === item.id ? "Active" : "Switch"}
                        {p.id === item.id && <Check size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
                <form
                  className="inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newName.trim()) return;
                    const next = makeProfile(newName.trim());
                    setProfiles([...profiles, next]);
                    setActive(next.id);
                    setNewName("");
                    setPanel("");
                  }}
                >
                  <input
                    autoFocus
                    placeholder="Name your new workspace"
                    aria-label="Workspace name"
                    maxLength={40}
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <button className="primary">
                    Create <Plus size={15} />
                  </button>
                </form>
              </>
            )}
            {panel === "shortcuts" && (
              <form
                className="stack-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const url = resolveAddress(newUrl);
                  if (!url || !newName.trim()) {
                    notify("Add a name and valid website address");
                    return;
                  }
                  update({
                    links: [
                      ...p.links,
                      { id: uid(), name: newName.trim(), url, color: p.accent },
                    ],
                  });
                  setNewName("");
                  setNewUrl("");
                  setPanel("");
                  notify("Shortcut added to your orbit");
                }}
              >
                <label>
                  Name
                  <input
                    autoFocus
                    required
                    placeholder="My favorite corner of the internet"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </label>
                <label>
                  Website address
                  <input
                    required
                    placeholder="https://example.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </label>
                <button className="primary">
                  Add shortcut <Plus size={15} />
                </button>
              </form>
            )}
            {["bookmarks", "history"].includes(panel) && (
              <>
                <label className="field search-field">
                  <Search size={17} />
                  <input
                    autoFocus
                    aria-label="Filter items"
                    placeholder="Search your orbit…"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </label>
                <div className="list">
                  {(panel === "bookmarks"
                    ? p.links.map((l) => ({ ...l, title: l.name }))
                    : p.history
                  )
                    .filter((l) =>
                      (l.title + l.url)
                        .toLowerCase()
                        .includes(filter.toLowerCase()),
                    )
                    .map((l, i) => (
                      <div className="list-row" key={l.id + i}>
                        <Globe size={20} />
                        <button
                          className="list-content"
                          onClick={() => {
                            navigate(l.url);
                            setPanel("");
                          }}
                        >
                          <strong>{l.title}</strong>
                          <small>{l.url}</small>
                        </button>
                        {panel === "bookmarks" &&
                          button(Trash2, "Delete bookmark", () =>
                            update({
                              links: p.links.filter((item) => item.id !== l.id),
                            }),
                          )}
                      </div>
                    ))}
                </div>
                {panel === "history" && !p.history.length && (
                  <div className="empty-state">
                    <Orbit size={36} />
                    <h3>A whole universe to explore.</h3>
                    <p>Your visited pages will find a home here.</p>
                  </div>
                )}
                {panel === "history" && p.history.length > 0 && (
                  <button
                    className="small-button"
                    onClick={() => {
                      update({ history: [] });
                      notify("Workspace history cleared");
                    }}
                  >
                    <Trash2 size={14} /> Clear history
                  </button>
                )}
                {panel === "bookmarks" && (
                  <button
                    className="primary"
                    onClick={() => setPanel("shortcuts")}
                  >
                    <Plus size={15} /> Add bookmark
                  </button>
                )}
              </>
            )}
            {panel === "sessions" && (
              <>
                <p className="muted">
                  Save your open tabs and come back to the same constellation.
                </p>
                <button
                  className="primary"
                  onClick={() => {
                    update({
                      snapshots: [
                        ...p.snapshots,
                        {
                          id: uid(),
                          name: `${p.name} · ${new Date().toLocaleString()}`,
                          tabs: p.tabs,
                        },
                      ],
                    });
                    notify("Workspace snapshot saved");
                  }}
                >
                  <Save size={16} /> Save current session
                </button>
                <div className="list">
                  {p.snapshots.map((s) => (
                    <div className="list-row" key={s.id}>
                      <Layers size={20} />
                      <div>
                        <strong>{s.name}</strong>
                        <small>{s.tabs.length} tabs</small>
                      </div>
                      <button
                        className="small-button"
                        onClick={() => {
                          update({ tabs: s.tabs, activeTab: s.tabs[0].id });
                          setPanel("");
                          notify("Session restored");
                        }}
                      >
                        Restore
                      </button>
                      {button(Trash2, "Delete snapshot", () =>
                        update({
                          snapshots: p.snapshots.filter((x) => x.id !== s.id),
                        }),
                      )}
                    </div>
                  ))}
                </div>
                {closed.length > 0 && (
                  <>
                    <h4>RECENTLY CLOSED</h4>
                    {closed.map((t) => (
                      <button
                        className="command-item"
                        key={t.id}
                        onClick={() => {
                          newTab(t.url, t.title);
                          setClosed(closed.filter((c) => c.id !== t.id));
                          setPanel("");
                        }}
                      >
                        <Globe size={17} />
                        {t.title}
                        <RotateCw size={15} />
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
            {panel === "widgets" && (
              <>
                <p className="muted">
                  Add website cards, choose what belongs on your dashboard, and
                  drag cards to rearrange them.
                </p>
                <form
                  className="custom-widget-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const url = resolveAddress(newWidgetUrl);
                    if (!newWidgetName.trim() || !url?.startsWith("http")) {
                      notify("Enter a widget name and a valid website address.");
                      return;
                    }
                    const widget = {
                      id: editingWidgetId || `custom-${uid()}`,
                      title: newWidgetName.trim(),
                      url,
                    };
                    update({
                      customWidgets: editingWidgetId
                        ? p.customWidgets.map((saved) =>
                            saved.id === editingWidgetId ? widget : saved,
                          )
                        : [...p.customWidgets, widget],
                      widgets: editingWidgetId
                        ? p.widgets
                        : [...p.widgets, widget.id],
                    });
                    setNewWidgetName("");
                    setNewWidgetUrl("");
                    setEditingWidgetId("");
                    notify(
                      editingWidgetId
                        ? "Website widget updated"
                        : "Website widget added to your dashboard",
                    );
                  }}
                >
                  <input
                    aria-label="Widget name"
                    placeholder="Widget name, e.g. YouTube"
                    value={newWidgetName}
                    onChange={(event) => setNewWidgetName(event.target.value)}
                    maxLength={32}
                  />
                  <input
                    aria-label="Widget website address"
                    placeholder="Website address, e.g. youtube.com"
                    value={newWidgetUrl}
                    onChange={(event) => setNewWidgetUrl(event.target.value)}
                  />
                  <button className="primary" type="submit">
                    {editingWidgetId ? <Check size={14} /> : <Plus size={14} />}
                    {editingWidgetId ? "Save website widget" : "Add website widget"}
                  </button>
                  {editingWidgetId && (
                    <button
                      className="small-button"
                      type="button"
                      onClick={() => {
                        setEditingWidgetId("");
                        setNewWidgetName("");
                        setNewWidgetUrl("");
                      }}
                    >
                      Cancel edit
                    </button>
                  )}
                </form>
                {[
                  {
                    id: "focus",
                    name: "Focus flow",
                    desc: "A quiet space to do your best work.",
                    custom: false,
                  },
                  {
                    id: "notes",
                    name: "Quick notes",
                    desc: "Keep your ideas within reach.",
                    custom: false,
                  },
                  {
                    id: "activity",
                    name: "Recently explored",
                    desc: "Find your way back to a discovery.",
                    custom: false,
                  },
                  ...p.customWidgets.map((widget) => ({
                    id: widget.id,
                    name: widget.title,
                    desc: widget.url,
                    custom: true,
                  })),
                ].map(({ id, name, desc, custom }) => (
                  <div className="setting-row" key={id}>
                    <div>
                      {name}
                      <small>{desc}</small>
                    </div>
                    <button
                      className={
                        "toggle " + (p.widgets.includes(id) ? "on" : "")
                      }
                      role="switch"
                      aria-label={name}
                      aria-checked={p.widgets.includes(id)}
                      onClick={() =>
                        update({
                          widgets: p.widgets.includes(id)
                            ? p.widgets.filter((w) => w !== id)
                            : [...p.widgets, id],
                        })
                      }
                    >
                      <span />
                    </button>
                    {p.widgets.includes(id) &&
                      button(ArrowLeft, "Move " + name + " earlier", () => {
                        const order = [...p.widgets],
                          index = order.indexOf(id);
                        if (index > 0) {
                          [order[index - 1], order[index]] = [
                            order[index],
                            order[index - 1],
                          ];
                          update({ widgets: order });
                        }
                      })}
                    {custom &&
                      button(Pencil, "Edit " + name, () => {
                        const widget = p.customWidgets.find(
                          (saved) => saved.id === id,
                        );
                        if (!widget) return;
                        setEditingWidgetId(widget.id);
                        setNewWidgetName(widget.title);
                        setNewWidgetUrl(widget.url);
                      })}
                    {custom &&
                      button(Trash2, "Remove " + name, () => {
                        update({
                          widgets: p.widgets.filter(
                            (widgetId) => widgetId !== id,
                          ),
                          customWidgets: p.customWidgets.filter(
                            (widget) => widget.id !== id,
                          ),
                        });
                      })}
                  </div>
                ))}
              </>
            )}
            {panel === "privacy" && (
              <>
                <div className="privacy-hero">
                  <ShieldCheck size={38} />
                  <h3>Your data stays in your orbit.</h3>
                  <p>
                    No analytics. No account required. Preferences stored on
                    your device.
                  </p>
                </div>
                <div className="setting-row">
                  <div>
                    Workspace storage
                    <small>Profiles, notes, tabs and bookmarks</small>
                  </div>
                  <span className="green-label">Local only</span>
                </div>
                <div className="setting-row">
                  <div>
                    AI context sharing
                    <small>
                      Share only when you enable it in the assistant
                    </small>
                  </div>
                  <span>{context ? "Allowed" : "Off"}</span>
                </div>
                <div className="capability-note">
                  <Monitor size={22} />
                  <span>
                    <strong>Browser protection needs a browser engine.</strong>
                    <br />
                    This web app cannot block ads, trackers or pop-ups on other
                    websites. No blocking counts are simulated. See the desktop
                    roadmap in the project README.
                  </span>
                </div>
                <button
                  className="small-button"
                  onClick={() => {
                    update({ history: [] });
                    notify("History cleared for this workspace");
                  }}
                >
                  <Trash2 size={14} /> Clear workspace history
                </button>
              </>
            )}
            {panel === "downloads" && (
              <div className="empty-state">
                <Download size={38} />
                <h3>Your downloads live in your browser.</h3>
                <p>
                  Use your browser’s download manager to see files from external
                  websites. Orbital can export your workspace as a portable JSON
                  file.
                </p>
                <button className="primary" onClick={exportData}>
                  Export workspace <Download size={16} />
                </button>
              </div>
            )}
            {panel === "commands" && (
              <>
                <label className="field search-field">
                  <Search size={18} />
                  <input
                    autoFocus
                    placeholder="Search actions or open tabs…"
                    aria-label="Search commands"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <kbd>ESC</kbd>
                </label>
                {[
                  {
                    name: "Open a new tab",
                    icon: Plus,
                    action: () => newTab(),
                  },
                  {
                    name: "Customize your universe",
                    icon: Palette,
                    action: () => openPanel("customize"),
                  },
                  {
                    name: "Ask Orbital AI",
                    icon: Sparkles,
                    action: () => setAi(true),
                  },
                  {
                    name: "Toggle focus mode",
                    icon: Maximize2,
                    action: () => setFocus(!focus),
                  },
                  {
                    name: "Save a workspace snapshot",
                    icon: Save,
                    action: () => openPanel("sessions"),
                  },
                  ...p.tabs.map((t) => ({
                    name: t.title,
                    icon: Globe,
                    action: () => update({ activeTab: t.id }),
                  })),
                ]
                  .filter((c) =>
                    c.name.toLowerCase().includes(filter.toLowerCase()),
                  )
                  .map((c, i) => (
                    <button
                      className="command-item"
                      key={i}
                      onClick={() => {
                        setPanel("");
                        c.action();
                      }}
                    >
                      <c.icon size={18} />
                      {c.name}
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
              </>
            )}
          </section>
        </div>
      )}
      {ai && (
        <aside className="ai-panel">
          <div className="modal-heading">
            <div className="ai-title">
              <Sparkles size={23} />
              <div>
                Orbital AI<small>Your cosmic copilot</small>
              </div>
            </div>
            {button(X, "Close assistant", () => setAi(false))}
          </div>
          {aiStatus !== "ready" && (
            <div className={`ai-setup-notice ${aiStatus}`} role="status">
              <div>
                <strong>
                  {aiStatus === "checking"
                    ? "Checking AI connection…"
                    : aiStatus === "needs-key"
                      ? "Orbital AI needs setup"
                      : "Orbital’s API server isn’t reachable"}
                </strong>
                <p>
                  {aiStatus === "checking"
                    ? "Connecting to the local AI server."
                    : aiStatus === "needs-key"
                      ? "Add OPENAI_API_KEY to .env and restart npm run dev. Chat stays disabled until setup is complete."
                      : "Run npm run dev to start the app and API server together."}
                </p>
              </div>
              <button
                className="small-button"
                disabled={aiStatus === "checking"}
                onClick={() => void checkAiConnection()}
              >
                {aiStatus === "checking" ? "Checking…" : "Check connection"}
              </button>
            </div>
          )}
          <div className="chat-messages">
            {!messages.length && (
              <div className="ai-welcome">
                <div className="ai-orb">
                  <Sparkles size={35} />
                </div>
                <span className="eyebrow">A LITTLE COSMIC INTELLIGENCE</span>
                <h2>
                  Big ideas start
                  <br />
                  with a little curiosity.
                </h2>
                <p>
                  Explore a question, untangle an idea,
                  <br />
                  or find your next direction.
                </p>
                {[
                  "Help me plan a focused study session",
                  "Explain black holes simply",
                  "Suggest creative research resources",
                ].map((s) => (
                  <button
                    key={s}
                    disabled={aiStatus !== "ready"}
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={"message " + m.role}>
                <small>{m.role === "user" ? "YOU" : "ORBITAL AI"}</small>
                <p>{m.content}</p>
              </div>
            ))}
            {busy && <p className="thinking">Exploring the possibilities…</p>}
          </div>
          <label className="context-check">
            <input
              type="checkbox"
              checked={context}
              onChange={(e) => setContext(e.target.checked)}
              disabled={aiStatus !== "ready"}
            />{" "}
            Share workspace name and open tab URLs
          </label>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <input
              aria-label="Message Orbital AI"
              placeholder="A question, a thought, anything…"
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              disabled={aiStatus !== "ready"}
            />
            <button
              disabled={busy || !chat.trim() || aiStatus !== "ready"}
              aria-label="Send message"
            >
              <ArrowRight size={18} />
            </button>
          </form>
          <small className="ai-disclaimer">
            AI requires a configured server. No page content is read.
          </small>
        </aside>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            if (file.size > 3e6) throw Error();
            const data = JSON.parse(await file.text());
            if (
              data.version !== 1 ||
              !Array.isArray(data.profiles) ||
              !data.profiles.length
            )
              throw Error();
            const imported: Profile[] = data.profiles.map((item: Profile) => {
              if (
                typeof item.name !== "string" ||
                !Array.isArray(item.links) ||
                !Array.isArray(item.tabs) ||
                !item.tabs.length ||
                item.tabs.some(
                  (t) => typeof t.url !== "string" || !resolveAddress(t.url),
                ) ||
                item.links.some(
                  (l) => typeof l.name !== "string" || !resolveAddress(l.url),
                )
              )
                throw Error();
              const base = makeProfile(item.name);
              const widgetIds = new Map<string, string>();
              const customWidgets = Array.isArray(item.customWidgets)
                ? item.customWidgets
                    .flatMap((widget) => {
                      const url =
                        widget && typeof widget.url === "string"
                          ? resolveAddress(widget.url)
                          : null;
                      if (
                        !widget ||
                        typeof widget.id !== "string" ||
                        typeof widget.title !== "string" ||
                        !url?.startsWith("http")
                      )
                        return [];
                      const id = uid();
                      widgetIds.set(widget.id, id);
                      return [{ ...widget, id, url }];
                    })
                : [];
              const widgets = Array.isArray(item.widgets)
                ? item.widgets
                    .map((id) => widgetIds.get(id) || id)
                    .filter((id) =>
                      [
                        "focus",
                        "notes",
                        "activity",
                        ...customWidgets.map((widget) => widget.id),
                      ].includes(id),
                    )
                : base.widgets;
              return {
                ...base,
                notes: typeof item.notes === "string" ? item.notes : "",
                accent: /^#[0-9a-f]{6}$/i.test(item.accent)
                  ? item.accent
                  : base.accent,
                theme: presets.some((t) => t.name === item.theme)
                  ? item.theme
                  : base.theme,
                motion: !!item.motion,
                widgets,
                customWidgets,
                links: item.links.map((l) => ({ ...l, id: uid() })),
                tabs: item.tabs.map((t) => ({ ...t, id: uid() })),
              };
            });
            setProfiles([...profiles, ...imported]);
            notify("Workspaces imported");
          } catch {
            notify(
              "Invalid workspace backup. Please choose an Orbital export.",
            );
          }
          e.target.value = "";
        }}
      />
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={17} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);


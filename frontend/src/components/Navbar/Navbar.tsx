import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "../../api/notifications";
import type { Notification } from "../../types/notifications";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import styles from "./Navbar.module.css";

type NavItem = {
  id: string;
  label: string;
  href: string;
};

type Role = "guest" | "user" | "admin";

type NavbarProps = {
  exclude?: string[];
  excludeAll?: boolean;
};

const NOTIF_ICONS: Record<string, string> = {
  new_review:      "⭐",
  listing_removed: "🚫",
  badge_earned:    "🏅",
  first_sale:      "🎉",
  listing_sold:    "✅",
  suggestion:      "💡",
};

export function Navbar({ exclude = [], excludeAll = false}: NavbarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const NAV_CONFIG: Record<Role, NavItem[]> = {
    guest: [
      { id: "marketplace", label: "Marketplace", href: "/" },
    ],
    user: [
      { id: "marketplace", label: "Marketplace", href: "/" },
      { id: "inbox", label: "Inbox", href: "/messages" },
      { id: "saved", label: "Saved", href: "/saved" },
      { id: "create", label: "+ Create Listing", href: "/create-listing" },
    ],
    admin: [
      { id: "marketplace", label: "Marketplace", href: "/" },
      { id: "inbox", label: "Inbox", href: "/messages" },
      { id: "saved", label: "Saved", href: "/saved" },
      { id: "admin", label: "Admin Dashboard", href: "/admin" },
    ],
  };

  const role: Role = !user
    ? "guest"
    : user.role === "admin"
    ? "admin"
    : "user";

  const links = excludeAll ? [] : NAV_CONFIG[role].filter((item) => !exclude.includes(item.id));

  const DROPDOWN_CONFIG: Record<Role, NavItem[]> = {
    guest: [],
    user: [
      { id: "profile", label: "My Profile", href: "/profile" },
      { id: "listings", label: "My Listings", href: "/my-listings" },
      { id: "saved", label: "Saved", href: "/saved" },
      { id: "inbox", label: "Inbox", href: "/messages" },
    ],
    admin: [
      { id: "profile", label: "My Profile", href: "/profile" },
      { id: "listings", label: "My Listings", href: "/my-listings" },
      { id: "saved", label: "Saved", href: "/saved" },
      { id: "inbox", label: "Inbox", href: "/messages" },
      { id: "admin", label: "Admin Dashboard", href: "/admin" },
    ],
  };

  const dropdownLinks = excludeAll ? [] : DROPDOWN_CONFIG[role].filter((item) => !exclude.includes(item.id));

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await listNotifications();
      setNotifications(data.items);
      setUnreadCount(data.unread_count);
    } catch {
      // silently ignore
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleNotifClick(notif: Notification) {
    if (!notif.read_at) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.link) {
      window.location.href = notif.link;
    }
    setNotifOpen(false);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  }

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className={styles.navbar}>
      {/* Brand */}
      <a href="/" className={styles.brand}>
        <img src="/logo.png" alt="TradeForge" className={styles.brandLogo} />
      </a>

      <nav className={styles.navLinks}>
        {links.map((link) => (
          <a
              key={link.href}
              href={link.href}
              className={
                link.id === "create"
                  ? styles.createListing
                  : styles.link
              }
            >
            {link.label}
          </a>
        ))}

        {!excludeAll && !user && (
          <a href="/login" className={styles.link}>
            Login
          </a>
        )}

        {/* Bell notification icon */}
        {user && (
          <div ref={notifRef} className={styles.dropdownWrapper}>
            <button
              className={styles.bellBtn}
              onClick={() => setNotifOpen((o) => !o)}
              aria-label="Notifications"
              title="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className={styles.bellBadge}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifHeader}>
                  <span className={styles.notifTitle}>Notifications</span>
                  {unreadCount > 0 && (
                    <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className={styles.notifEmpty}>No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      className={n.read_at ? styles.notifItem : styles.notifItemUnread}
                      onClick={() => handleNotifClick(n)}
                    >
                      <span className={styles.notifIcon}>{NOTIF_ICONS[n.type] ?? "🔔"}</span>
                      <div className={styles.notifContent}>
                        <div className={styles.notifItemTitle}>{n.title}</div>
                        <div className={styles.notifItemBody}>{n.body}</div>
                        <div className={styles.notifItemTime}>
                          {new Date(n.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {!n.read_at && <span className={styles.unreadDot} />}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {user && (
          <div ref={dropdownRef} className={styles.dropdownWrapper}>
            <button
              className={styles.avatarBtn}
              onClick={() => setDropdownOpen((o) => !o)}
              title={user.full_name}
            >
              <Avatar className="w-[38px] h-[38px] rounded-[10px] ring-2 ring-[#22c55e]/40 ring-offset-1 ring-offset-[#0a0a0a]">
                <AvatarImage src={user.profile_picture ?? undefined} alt={user.full_name} />
                <AvatarFallback className="rounded-[10px] text-xs font-black">{initials}</AvatarFallback>
              </Avatar>
            </button>

            {dropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.full_name}</div>
                  <div className={styles.userEmail}>{user.email}</div>

                  {user.role === "admin" && (
                    <span className={styles.adminBadge}>Admin</span>
                  )}
                </div>

                {dropdownLinks.map((item) => (
                  <a key={item.href} href={item.href} className={styles.dropdownItem}>
                    {item.label}
                  </a>
                ))}

                <button
                  className={styles.logout}
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

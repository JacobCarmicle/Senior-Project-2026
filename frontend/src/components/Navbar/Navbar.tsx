import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
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

export function Navbar({ exclude = [], excludeAll = false}: NavbarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const NAV_CONFIG: Record<Role, NavItem[]> = {
    guest: [
      { id: "marketplace", label: "Marketplace", href: "/" },
    ],
    user: [
      { id: "marketplace", label: "Marketplace", href: "/" },
      { id: "inbox", label: "Inbox", href: "/messages" },
      { id: "reviews", label: "Reviews", href: "/reviews" },
      { id: "saved", label: "Saved", href: "/saved" },
      { id: "create", label: "+ Create Listing", href: "/create-listing" },
    ],
    admin: [
      { id: "marketplace", label: "Marketplace", href: "/" },
      { id: "inbox", label: "Inbox", href: "/messages" },
      { id: "reviews", label: "Reviews", href: "/reviews" },
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  // const links = [
  //   { label: "Marketplace", href: "/" },
  //   { label: "Inbox", href: "/messages" },
  //   { label: "Reviews", href: "/reviews" },
  //   { label: "Saved", href: "/saved" },
  // ];

  // const dropdownLinks = [
  //   { label: "My Profile", href: "/profile" },
  //   { label: "My Listings", href: "/my-listings" },
  //   { label: "Saved", href: "/saved" },
  //   { label: "Inbox", href: "/messages" },
  //   ...(user?.role === "admin" ? [{ label: "Admin Dashboard", href: "/admin" }] : []),
  // ];

  return (
    <header className={styles.navbar}>
      {/* Brand */}
      <a href="/" className={styles.brand}>
        TradeForge
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

        {user && (
          <div ref={dropdownRef} className={styles.dropdownWrapper}>
            <button
              className={styles.avatar}
              onClick={() => setDropdownOpen((o) => !o)}
              title={user.full_name}
            >
              {initials}
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

// export default NavBar
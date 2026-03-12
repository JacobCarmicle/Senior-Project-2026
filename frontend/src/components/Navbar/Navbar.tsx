import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "./Navbar.module.css";

export function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const links = [
    { label: "Marketplace", href: "/" },
    { label: "Inbox", href: "/messages" },
    { label: "Reviews", href: "/reviews" },
    { label: "Saved", href: "/saved" },
  ];

  const dropdownLinks = [
    { label: "My Profile", href: "/profile" },
    { label: "My Listings", href: "/my-listings" },
    { label: "Saved", href: "/saved" },
    { label: "Inbox", href: "/messages" },
    ...(user?.role === "admin" ? [{ label: "Admin Dashboard", href: "/admin" }] : []),
  ];

  return (
    <header className={styles.navbar}>
      {/* Brand */}
      <a href="/" className={styles.brand}>
        <span className={styles.brandDot}></span>
        TradeForge
      </a>

      <nav className={styles.navLinks}>
        {links.map((link) => (
          <a key={link.href} href={link.href} className={styles.link}>
            {link.label}
          </a>
        ))}

        <a href="/create-listing" className={styles.createListing}>
          + Create Listing
        </a>

        {!user && (
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
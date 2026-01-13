import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
  },
  header: {
    background: "#1a1a2e",
    color: "white",
    padding: "1rem 2rem",
    display: "flex",
    alignItems: "center",
    gap: "2rem",
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: 600,
    margin: 0,
  },
  nav: {
    display: "flex",
    gap: "1rem",
  },
  link: {
    color: "#888",
    textDecoration: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    transition: "all 0.2s",
  },
  activeLink: {
    color: "white",
    background: "rgba(255,255,255,0.1)",
  },
  main: {
    flex: 1,
    padding: "2rem",
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
  },
};

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: "/errors", label: "Errors" },
    { path: "/trends", label: "Trends" },
  ];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Error Ingestor</h1>
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.link,
                ...(location.pathname === item.path ? styles.activeLink : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

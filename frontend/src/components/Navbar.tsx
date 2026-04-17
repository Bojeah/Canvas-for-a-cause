import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="group nav-action nav-action-idle gap-2"
        >
          <img
            src="/pausc-logo-placeholder.svg"
            alt="PAUSC ART Auction logo"
            className="h-6 w-6 rounded-sm border border-neutral-200 dark:border-neutral-700"
          />
          <span className="text-sm font-semibold tracking-wide text-current">
            PAUSC ART AUCTION
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-action ${isActive ? "nav-action-active" : "nav-action-idle"}`
            }
          >
            Home
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/artworks"
                className={({ isActive }) =>
                  `nav-action ${isActive ? "nav-action-active" : "nav-action-idle"}`
                }
              >
                Artworks
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="nav-action nav-action-idle"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `nav-action ${isActive ? "nav-action-active" : "nav-action-idle"}`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `nav-action ${isActive ? "nav-action-active" : "nav-action-idle"}`
                }
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

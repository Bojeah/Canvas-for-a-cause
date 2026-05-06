import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b h-20 border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <Link
          to="/"
          className="group flex min-w-0 items-center gap-2 text-current sm:gap-4"
          onClick={closeMobileMenu}
        >
          <img
            src="/PAUSC_logo.png"
            alt="PAUSC ART Auction logo"
            className="h-15 w-15 shrink-0 object-contain sm:h-20 sm:w-20"
          />
          <span className="min-w-0 whitespace-nowrap text-[15px] font-semibold tracking-wide text-current sm:text-sm md:text-base">
            PAUSC ART AUCTION
          </span>
        </Link>

        <button
          type="button"
          className="nav-action nav-action-idle h-8! w-8! p-0! sm:hidden"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          {isMobileMenuOpen ? <FiX size={16} aria-hidden="true" /> : <FiMenu size={16} aria-hidden="true" />}
        </button>

        <div className="ml-auto hidden items-center justify-end gap-2 sm:flex">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/artworks"
                className={({ isActive }) =>
                  `nav-action h-10! px-4! py-2! text-sm ${isActive ? "nav-action-active" : "nav-action-idle"}`
                }
              >
                Artworks
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="nav-action nav-action-idle h-10! px-4! py-2! text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `nav-action h-10! px-4! py-2! text-sm ${isActive ? "nav-action-active" : "nav-action-idle"}`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `nav-action h-10! px-4! py-2! text-sm ${isActive ? "nav-action-active" : "nav-action-idle"}`
                }
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {isMobileMenuOpen ? (
        <div
          id="mobile-nav-menu"
          className="border-t border-neutral-200 px-3 py-2 sm:hidden dark:border-neutral-800"
        >
          <div className="flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/artworks"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `nav-action h-9! w-full justify-center px-3! py-2! text-xs ${isActive ? "nav-action-active" : "nav-action-idle"}`
                  }
                >
                  Artworks
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="nav-action nav-action-idle h-9! w-full justify-center px-3! py-2! text-xs"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `nav-action h-9! w-full justify-center px-3! py-2! text-xs ${isActive ? "nav-action-active" : "nav-action-idle"}`
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `nav-action h-9! w-full justify-center px-3! py-2! text-xs ${isActive ? "nav-action-active" : "nav-action-idle"}`
                  }
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

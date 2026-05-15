import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logoHV.png";
import styles from "./Header.module.css";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isForm = location.pathname.startsWith("/tuyendung");
  const isSearch = location.pathname.startsWith("/tracuutuyendung");

  return (
    <header className={styles.header}>
      <div className={styles.topBar} />
      <div className={styles.inner}>

        {/* Logo + tên */}
        <div className={styles.brand} onClick={() => navigate("/tuyendung")}>
          <img src={logo} alt="Bệnh viện Đa Khoa Hùng Vương" className={styles.logo} />
          <div className={styles.divider} />
          <div className={styles.brandText}>
            <span className={styles.brandSub}>Tuyển dụng</span>
            <span className={styles.brandName}>Bệnh Viện Đa Khoa Hùng Vương</span>
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          <button
            className={`${styles.navBtn} ${isForm ? styles.active : ""}`}
            onClick={() => navigate("/tuyendung")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Nộp hồ sơ</span>
          </button>

          <div className={styles.navDivider} />

          <button
            className={`${styles.navBtn} ${isSearch ? styles.active : ""}`}
            onClick={() => navigate("/tracuutuyendung")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>Tra cứu hồ sơ</span>
          </button>
        </nav>

      </div>
    </header>
  );
}

export default Header;

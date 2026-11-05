import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import TuyendungPage from "./pages/tuyendung/components/index";
import TraCuuTuyenDung from "./pages/tracuutuyendung/TraCuuTuyenDung";
import "./App.css";

const MAINTENANCE_TIMESTAMP = new Date("2027-06-23T00:00:00+07:00").getTime();

const isMaintenanceTime = () => {
  return Date.now() >= MAINTENANCE_TIMESTAMP;
};

function App() {
  if (isMaintenanceTime()) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 32, textAlign: 'center', background: '#f6f6f6' }}>
        <div>
          <h1 style={{ marginBottom: 16 }}>Hệ thống đã ngừng hoạt động</h1>
          <p style={{ margin: 0, fontSize: 18, color: '#555' }}>
            Website hiện đang trong trạng thái bảo trì theo thời gian đã cài đặt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Header />

        <div className="heroBanner">
          <h1>CỔNG TUYỂN DỤNG – BỆNH VIỆN ĐA KHOA HÙNG VƯƠNG</h1>
          <p>Nộp hồ sơ trực tuyến và tra cứu kết quả ứng tuyển</p>
        </div>

        <div className="pageContent">
          <Routes>
            <Route path="/" element={<Navigate to="/tuyendung" replace />} />
            <Route path="/tuyendung" element={<TuyendungPage />} />
            <Route path="/tracuutuyendung" element={<TraCuuTuyenDung />} />
            <Route path="/tracuutuyendung/:token" element={<TraCuuTuyenDung />} />
          </Routes>
        </div>

        <footer className="footer">
          <div className="footerInner">
            <div className="footerLeft">
              <div className="footerDot" />
              <div className="footerCopyWrapper">
                <span className="footerCopy">
                  © 2026 <strong>Bệnh Viện Đa Khoa Hùng Vương</strong>. Mọi thắc mắc liên hệ 0914835115.
                </span>
                <span className="footerAddress">
                  Địa chỉ: Khu Phượng Hùng 1, xã Chí Đám – tỉnh Hùng Vương &nbsp;|&nbsp; Tổng đài tư vấn miễn phí: 1800 9415
                </span>
              </div>
            </div>
            <div className="footerRight">
              <span className="footerBadge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                </svg>
                Ban CHUYỂN ĐỔI SỐ™ · leanhquan™
              </span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;

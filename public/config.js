// =====================================================================
// CAU HINH CHAY CUA WEB UNG VIEN
// Sua truc tiep file nay tren server (thu muc build), KHONG can build lai.
// Sua xong: Ctrl+F5 tren trinh duyet de lay ban moi.
// =====================================================================
window.APP_CONFIG = {
  // Dia chi backend.
  //   null = giu nhu luc build (ban production: goi /api/... cung domain, IIS web.config chuyen tiep)
  //   ""   = bat buoc goi cung domain
  //   "http://10.16.4.55:8084" = goi thang backend
  API_BASE: null,

  // Dia chi may chu anh (upload + hien thi anh dai dien, bang cap, chung chi).
  // Vd: "https://img.benhvienhungvuong.vn" hoac "http://10.16.4.55:8083"
  IMAGE_SERVER_URL: "https://img.benhvienhungvuong.vn",

  // Thoi gian cho toi da khi upload 1 anh (mili giay).
  IMAGE_UPLOAD_TIMEOUT_MS: 30000
};

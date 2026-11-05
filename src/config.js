// Doc cau hinh chay tu public/config.js (window.APP_CONFIG).
// Thu tu uu tien: config.js tren server -> bien moi truong luc build -> mac dinh.
const runtime = (typeof window !== "undefined" && window.APP_CONFIG) || {};

const trimSlash = (url) => (url || "").replace(/\/+$/, "");

export const API_BASE = trimSlash(runtime.API_BASE ?? process.env.REACT_APP_API_BASE ?? "");
export const API_BASE_TUYENDUNG = API_BASE;

export const IMAGE_SERVER_URL = trimSlash(
  runtime.IMAGE_SERVER_URL ||
  process.env.REACT_APP_IMAGE_SERVER_URL ||
  "https://img.benhvienhungvuong.vn"
);

export const IMAGE_UPLOAD_TIMEOUT_MS =
  Number(runtime.IMAGE_UPLOAD_TIMEOUT_MS) > 0 ? Number(runtime.IMAGE_UPLOAD_TIMEOUT_MS) : 30000;

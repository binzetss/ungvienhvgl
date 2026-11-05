import { IMAGE_SERVER_URL as IMAGE_SERVER, IMAGE_UPLOAD_TIMEOUT_MS as UPLOAD_TIMEOUT_MS } from "../config";

export const uploadToImageServer = async (file, folder = "anh-ung-vien-tuyen-dung-chungchi") => {
  const fd = new FormData();
  fd.append("files", file);

  let res;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
    try {
      res = await fetch(
        `${IMAGE_SERVER}/api/upload?path=${encodeURIComponent(folder)}`,
        { method: "POST", body: fd, signal: controller.signal }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        `Upload ảnh "${file.name}" quá thời gian chờ (${UPLOAD_TIMEOUT_MS / 1000}s). Vui lòng kiểm tra kết nối mạng và thử lại.`
      );
    }
    throw new Error(
      `Không thể kết nối đến máy chủ ảnh. Vui lòng kiểm tra kết nối Internet và thử lại. (Chi tiết: ${err.message})`
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text())?.slice(0, 200) || "";
    } catch {
      // ignore - keep detail empty
    }
    throw new Error(`Upload ảnh thất bại (mã lỗi ${res.status})${detail ? `: ${detail}` : ""}`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Server ảnh trả về dữ liệu không hợp lệ (không phải JSON). Vui lòng thử lại.");
  }

  const filename = data.uploaded?.[0];
  if (!filename) throw new Error("Server không trả về tên file đã upload. Vui lòng thử lại.");
  return `${IMAGE_SERVER}/images/${folder}/${filename}`;
};

export const validateAndResizeImage = (
  file,
  maxSizeMB = 20,
  scale = 0.7,
  quality = 0.7
) => {
  return new Promise((resolve, reject) => {
    // PDF → giữ nguyên, không resize
    if (file.type === "application/pdf") {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        reject(`File "${file.name}" vượt quá ${maxSizeMB}MB`);
        return;
      }
      resolve(file);
      return;
    }

    if (!file.type.startsWith("image/")) {
      reject("Chỉ cho phép upload file ảnh hoặc PDF");
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      reject(`Ảnh "${file.name}" vượt quá ${maxSizeMB}MB`);
      return;
    }

    // ảnh nhỏ → không resize
    if (sizeMB <= 2) {
      resolve(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(`Không thể đọc file "${file.name}"`);
    reader.onload = (e) => (img.src = e.target.result);
    reader.readAsDataURL(file);

    img.onerror = () => reject(`Không thể xử lý ảnh "${file.name}". Vui lòng dùng định dạng JPG, PNG hoặc PDF.`);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject("Resize ảnh thất bại");
            return;
          }

          resolve(
            new File([blob], file.name, {
              type: file.type,
            })
          );
        },
        file.type,
        quality
      );
    };
  });
};

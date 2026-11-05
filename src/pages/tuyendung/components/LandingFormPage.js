import React, { useContext, useState, useEffect } from "react";
import PaginateBar from "./PaginateBar";
import classes from "../css/LandingFormPage.module.css";
import UserNameForm from "./UserNameForm";
import UsageForm from "./UsageForm";
import ApplicationForm from "./ApplicationForm";
import ReviewForm from "./ReviewForm";
import FormContext from "../store/form-context";
import { API_BASE } from "../../../config";
import { isApplicationFormValid } from "./ApplicationForm";
import { isUserPersonalInfoValid, validateOptionalPersonalInfo } from "./UserNameForm";
import {
  isUsageFormValid,
  validateOptionalUsageInfo,
  isDegreeRequirementValid,
  isDegreeCmeFilesValid,
  isCmeRequirementValid,
  isLicenseRequirementValid,
} from "./UsageForm";

const SUBMIT_TIMEOUT_MS = 30000;

// Best-effort extraction of a human-readable message from a failed HTTP response.
// Spring Boot's default error body is JSON ({message, error, ...}); some errors
// come back as plain text/HTML. Falls back gracefully either way.
async function extractErrorMessage(res) {
  let bodyText = "";
  try {
    bodyText = await res.text();
  } catch {
    return "";
  }
  if (!bodyText) return "";
  try {
    const json = JSON.parse(bodyText);
    return json.message || json.error || bodyText.slice(0, 300);
  } catch {
    return bodyText.slice(0, 300);
  }
}

function LandingFormPage() {
  const {
    page,
    setCurrentPage,
    numOfPages,
    formData,
    resetDataState,
    popup,
    showPopup,
    closePopup,
  } = useContext(FormContext);
const { formKey } = useContext(FormContext);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  // Đọc từ public/supportContact.json lúc chạy (không nhúng cứng lúc build) —
  // để đổi số điện thoại chỉ cần sửa thẳng file JSON đã deploy trên IIS
  // (D:\...\build\supportContact.json), không cần build/deploy lại code.
  const [supportContact, setSupportContact] = useState({
    technical: { label: "Hỗ trợ kỹ thuật", phone: "" },
    profile: { label: "Hồ sơ/tuyển dụng", phone: "" },
  });
  useEffect(() => {
    // cache: "no-store" + query bust theo thời gian — để mỗi lần vào trang đều
    // lấy đúng bản JSON mới nhất trên server, không bị trình duyệt lấy bản cũ
    // đã cache lại trước đó.
    fetch(`/supportContact.json?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then(setSupportContact)
      .catch(() => {});
  }, []);

  const [confirmPopup, setConfirmPopup] = useState({
    show: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const showConfirmPopup = () => {
    setConfirmPopup({ show: true });
  };

  const closeConfirmPopup = () => {
    setConfirmPopup({ show: false });
  };

  const handleConfirmOK = () => {
    closeConfirmPopup();
    setCurrentPage(page + 1);
  };

  const pageSet = async () => {
     
    if (page === 1) {
      const r = isUserPersonalInfoValid(formData);
      if (!r.valid) return showPopup(r.message, "error");
      const opt = validateOptionalPersonalInfo(formData);
      if (!opt.valid) return showPopup(opt.message, "error");

      return showConfirmPopup();
    }

    if (page === 2) {
      const r = isApplicationFormValid(formData);
      if (!r.valid) return showPopup(r.message, "error");
    }

    if (page === 3) {
      const files = isDegreeCmeFilesValid(formData);
      if (!files.valid) return showPopup(files.message, "error");
      const req = isDegreeRequirementValid(formData);
      if (!req.valid) return showPopup(req.message, "error");
      const cme = isCmeRequirementValid(formData);
      if (!cme.valid) return showPopup(cme.message, "error");
      const license = isLicenseRequirementValid(formData);
      if (!license.valid) return showPopup(license.message, "error");
      const lengths = isUsageFormValid(formData);
      if (!lengths.valid) return showPopup(lengths.message, "error");
      const opt = validateOptionalUsageInfo(formData);
      if (!opt.valid) return showPopup(opt.message, "error");
    }

    if (page < numOfPages) {
      setCurrentPage(page + 1);
      return;
    }

    const validatorSteps = [
      { fn: isUserPersonalInfoValid,      targetPage: 1, pageLabel: "Trang 1 - Thông tin cá nhân" },
      { fn: validateOptionalPersonalInfo, targetPage: 1, pageLabel: "Trang 1 - Thông tin cá nhân" },
      { fn: isApplicationFormValid,       targetPage: 2, pageLabel: "Trang 2 - Ứng tuyển" },
      { fn: isDegreeCmeFilesValid,        targetPage: 3, pageLabel: "Trang 3 - Sức khỏe & chuyên môn" },
      { fn: isDegreeRequirementValid,     targetPage: 3, pageLabel: "Trang 3 - Sức khỏe & chuyên môn" },
      { fn: isCmeRequirementValid,        targetPage: 3, pageLabel: "Trang 3 - Sức khỏe & chuyên môn" },
      { fn: isLicenseRequirementValid,    targetPage: 3, pageLabel: "Trang 3 - Sức khỏe & chuyên môn" },
      { fn: isUsageFormValid,             targetPage: 3, pageLabel: "Trang 3 - Sức khỏe & chuyên môn" },
      { fn: validateOptionalUsageInfo,    targetPage: 3, pageLabel: "Trang 3 - Sức khỏe & chuyên môn" },
    ];

    for (const { fn, targetPage, pageLabel } of validatorSteps) {
      const r = fn(formData);
      if (!r.valid) {
        setCurrentPage(targetPage);
        showPopup(`${r.message}\n\n(${pageLabel})`, "error");
        return;
      }
    }
 
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const form = new FormData();

      // Convert "" → null for Integer/Date/Number fields the backend expects.
      // Jackson does not coerce an empty string "" to Integer/LocalDate/Double,
      // so leaving an optional numeric/date field blank throws a deserialization
      // error that fails the whole submit with no useful message.
      const toIntOrNull = (v) =>
        v === "" || v === null || v === undefined ? null : Number(v);
      const toDateOrNull = (v) =>
        v === "" || v === null || v === undefined ? null : v;
      const toNumOrNull = (v) =>
        v === "" || v === null || v === undefined ? null : Number(v);

      const cleanCmes = (Array.isArray(formData.cmes) ? formData.cmes : []).map(
        (c) => ({
          ...c,
          cmeStartDate: toDateOrNull(c.cmeStartDate),
          cmeEndDate: toDateOrNull(c.cmeEndDate),
          cmeIssueDate: toDateOrNull(c.cmeIssueDate),
          cmeHours: toNumOrNull(c.cmeHours),
        })
      );

      const otherCertFileUrls = Array.isArray(formData.otherCertFileUrls)
        ? formData.otherCertFileUrls
        : [];
      const otherCertName = formData.otherCertificate?.name?.trim();
      const hasOtherCert = !!otherCertName || otherCertFileUrls.length > 0;

      const cleanOtherCertificate = hasOtherCert
        ? {
            ...(formData.otherCertificate || {}),
            name: otherCertName || "Chứng chỉ khác",
            startDate: toDateOrNull(formData.otherCertificate?.startDate),
            endDate: toDateOrNull(formData.otherCertificate?.endDate),
            issueDate: toDateOrNull(formData.otherCertificate?.issueDate),
            hours: toNumOrNull(formData.otherCertificate?.hours),
            fileUrls: otherCertFileUrls,
          }
        : null;

      const cleanData = {
        ...formData,
        avatarPreview: null,
        idTrangThaiTuyenDung: 1,
        gender: toIntOrNull(formData.gender),
        religionId: toIntOrNull(formData.religionId),
        maritalStatusId: toIntOrNull(formData.maritalStatusId),
        childrenCount: toIntOrNull(formData.childrenCount),
        youngestChildAge: toIntOrNull(formData.youngestChildAge),
        weight: toIntOrNull(formData.weight),
        applyPositionId: toIntOrNull(formData.applyPositionId),
        licenseIssueDate: toDateOrNull(formData.licenseIssueDate),
        cmes: cleanCmes,
        otherCertificate: cleanOtherCertificate,
      };

      form.append("data", JSON.stringify(cleanData));

      let res;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
        try {
          res = await fetch(`${API_BASE}/api/hvoffice2/tuyen-dung`, {
            method: "POST",
            body: form,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (networkErr) {
        if (networkErr.name === "AbortError") {
          throw new Error(
            `Gửi hồ sơ quá thời gian chờ (${SUBMIT_TIMEOUT_MS / 1000}s). Vui lòng kiểm tra kết nối mạng và thử lại. Thông tin bạn đã nhập vẫn còn nguyên, không cần nhập lại.`
          );
        }
        throw new Error(
          `Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối Internet và thử lại. (Chi tiết: ${networkErr.message})`
        );
      }

      if (!res.ok) {
        const serverMessage = await extractErrorMessage(res);
        throw new Error(
          `Máy chủ từ chối yêu cầu (mã lỗi ${res.status}).${serverMessage ? ` Chi tiết: ${serverMessage}` : " Vui lòng thử lại hoặc liên hệ quản trị viên."}`
        );
      }

      const tuyenDungId = await res.json();
      console.log("Tuyen dung ID:", tuyenDungId);


      const detailRes = await fetch(`${API_BASE}/api/hvoffice2/tuyen-dung/${tuyenDungId}`);
      if (detailRes.ok) {
        const detail = await detailRes.json();
        console.log("Token:", detail.token);

        const successMessage = `Gửi Thành Công!\n\nMã ứng tuyển của bạn: ${detail.token}\n\nĐể tiện tra cứu về thông tin ứng tuyển của mình, chúng tôi sẽ gửi mã ứng tuyển của bạn thông qua Email: ${formData.email}\n\nVui lòng kiểm tra email hoặc lưu lại mã ứng tuyển để tra cứu trên website ungvien.benhvienhungvuong.vn/tracuutuyendung`;

        showPopup(successMessage, "success");
      } else {
        const successMessage = `Gửi Thành Công!\n\nĐể tiện tra cứu về thông tin ứng tuyển của mình, chúng tôi sẽ gửi mã ứng tuyển của bạn thông qua Email: ${formData.email}\n\nVui lòng kiểm tra email để lấy mã tuyển dụng của bạn để tra cứu trên website ungvien.benhvienhungvuong.vn/tracuutuyendung`;
        showPopup(successMessage, "success");
      }

      resetDataState();
      setCurrentPage(1);
    } catch (err) {
      console.error("Submit tuyen-dung failed:", err);
      showPopup(
        err?.message
          ? `Gửi hồ sơ thất bại.\n\n${err.message}`
          : "Lỗi khi gửi dữ liệu lên server. Vui lòng thử lại hoặc liên hệ quản trị viên.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
     <div className={classes.form} key={formKey}>
    
      {popup.show && (
        <div className={classes.modalOverlay} onClick={closePopup}>
          <div
            className={`${classes.modalContent} ${
              popup.type === "success" ? classes.success : classes.error
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={classes.modalIcon}>
              {popup.type === "success" ? "✓" : "⚠"}
            </div>
            <h2 className={classes.modalTitle}>
              {popup.type === "success" ? "Thành Công!" : "Lỗi!"}
            </h2>
            <p className={classes.modalMessage}>{popup.message}</p>
            {popup.type === "error" && (
              <div className={classes.supportBox}>
                <p>Hỗ trợ kỹ thuật <strong>{supportContact.technical.phone}</strong></p>
                <p>Hồ sơ/tuyển dụng <strong>{supportContact.profile.phone}</strong></p>
              </div>
            )}
            <button className={classes.modalButton} onClick={closePopup}>
              Đóng
            </button>
          </div>
        </div>
      )}

      {confirmPopup.show && (
        <div className={classes.modalOverlay} onClick={closeConfirmPopup}>
          <div
            className={`${classes.modalContent} ${classes.confirmModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={classes.confirmIconWrapper}>
              <div className={classes.confirmIconCircle}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 16V24M24 32H24.02M44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4C35.0457 4 44 12.9543 44 24Z" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3B82F6"/>
                      <stop offset="1" stopColor="#2563EB"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <h2 className={classes.confirmTitle}>Xác nhận thông tin liên hệ</h2>
            <p className={classes.confirmSubtitle} style={{ color: '#dc2626', fontWeight: '500' }}>
              Vui lòng kiểm tra kỹ thông tin bên dưới để chúng tôi có thể liên hệ với bạn
            </p>

            <div className={classes.confirmInfoWrapper}>
              <div className={classes.infoItemBox}>
                <div className={classes.infoItemIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={classes.infoItemContent}>
                  <div className={classes.infoItemLabel}>EMAIL</div>
                  <div className={classes.infoItemValue}>{formData.email}</div>
                </div>
              </div>

              <div className={classes.infoItemBox}>
                <div className={classes.infoItemIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H17C8.71573 21 2 14.2843 2 6V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H5C5 4.46957 3 3.96086 3 5Z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={classes.infoItemContent}>
                  <div className={classes.infoItemLabel}>SỐ ĐIỆN THOẠI</div>
                  <div className={classes.infoItemValue}>{formData.phone}</div>
                </div>
              </div>
            </div>

            <div className={classes.confirmButtonGroup}>
              <button className={classes.btnConfirm} onClick={handleConfirmOK}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.6667 5L7.5 14.1667L3.33333 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Xác nhận đúng
              </button>
              <button className={classes.btnEdit} onClick={closeConfirmPopup}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M12.5 3.33301L14.1667 1.66634C14.3877 1.44533 14.6864 1.32031 15 1.32031C15.3136 1.32031 15.6123 1.44533 15.8333 1.66634L18.3333 4.16634C18.5543 4.38736 18.6794 4.68607 18.6794 4.99967C18.6794 5.31328 18.5543 5.61199 18.3333 5.83301L7.5 16.6663H2.5V11.6663L12.5 3.33301Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Chỉnh sửa lại
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <PaginateBar />
        {page === 1 && <UserNameForm />}
        {page === 2 && <ApplicationForm />}
        {page === 3 && <UsageForm />}
        {page === 4 && <ReviewForm />}
        <br />
        <button
          className="button"
          onClick={pageSet}
          disabled={isSubmitting}
          style={isSubmitting ? { opacity: 0.7, cursor: "not-allowed" } : {}}
        >
          {isSubmitting ? "Đang gửi..." : page === numOfPages ? "Gửi Thông Tin" : "Tiếp Theo"}
        </button>

        <div style={{ marginTop: 10, width: "100%", textAlign: "left", color: "#dc2626", fontSize: 12.5, fontFamily: "'Roboto', sans-serif", lineHeight: 1.6 }}>
          <div>Hỗ trợ kỹ thuật: <strong>{supportContact.technical.phone}</strong></div>
          <div>Hồ sơ/tuyển dụng: <strong>{supportContact.profile.phone}</strong></div>
        </div>
      </div>
    </div>

  );
}

export default LandingFormPage;

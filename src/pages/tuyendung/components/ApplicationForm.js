import React, { useContext, useEffect, useState } from "react";
import FormContext from "../store/form-context";
import classes from "../css/Form.module.css";
import { API_BASE_TUYENDUNG as API_BASE } from "../../../config";
import CharCount from "./CharCount";
import { FIELD_LIMITS } from "../store/fieldLimits";


export const REQUIRED_FIELDS_APPLICATION = [
  { key: "applyPositionId", label: "Vị trí ứng tuyển" },
  { key: "jobDetail", label: "Vị trí công việc chi tiết" },
  { key: "workExperience", label: "Kinh nghiệm làm việc" },
  { key: "professionalSkills", label: "Kỹ năng chuyên môn" },
  { key: "softSkills", label: "Kỹ năng mềm / Sở thích" },
  { key: "careerExpectation", label: "Nguyện vọng khi làm việc tại Bệnh viện" },
];

export const isApplicationFormValid = (formData) => {
  for (const field of REQUIRED_FIELDS_APPLICATION) {
    const value = formData[field.key];

    if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return {
        valid: false,
        field: field.key,
        label: field.label,
        message: `Bạn thiếu thông tin tại: ${field.label}`,
      };
    }
  }

  /* validate field length limits */
  const lengthChecks = [
    { key: "jobDetail",          label: "Vị trí công việc chi tiết" },
    { key: "workExperience",     label: "Kinh nghiệm làm việc" },
    { key: "professionalSkills", label: "Kỹ năng chuyên môn" },
    { key: "softSkills",         label: "Kỹ năng mềm / Sở thích" },
    { key: "careerExpectation",  label: "Nguyện vọng" },
  ];
  for (const { key, label } of lengthChecks) {
    const val = formData[key];
    const max = FIELD_LIMITS[key];
    if (typeof val === "string" && val.length > max) {
      return {
        valid: false,
        field: key,
        label,
        message: `${label} vượt quá ${max} ký tự (hiện tại ${val.length} ký tự). Vui lòng rút ngắn lại.`,
      };
    }
  }

  return { valid: true };
};


function ApplicationForm() {
  const { formData, setFormData, showPopup } = useContext(FormContext);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/hvoffice2/danh-muc/vi-tri-tuyen-dung`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Mã lỗi ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`);
        }
        return res.json();
      })
      .then((data) => setPositions(data?.data ?? []))
      .catch((err) => {
        console.error("[ViTri API ERROR]", err);
        showPopup(
          `Không tải được danh sách vị trí ứng tuyển. Vui lòng tải lại trang, hoặc liên hệ quản trị viên nếu vẫn còn lỗi.\n(Chi tiết: ${err.message})`,
          "error"
        );
      });
  }, [showPopup]);

  const changeHandler = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 10 * 1024 * 1024;

    const invalidFile = files.find((file) => file.size > MAX_SIZE);

    if (invalidFile) {
      showPopup(
        `File "${invalidFile.name}" vượt quá 10MB. Vui lòng chọn file nhỏ hơn.`,
        "error"
      );
      e.target.value = "";
      return;
    }

    setFormData((prev) => ({
      ...prev,
      attachments: files,
    }));
  };

  return (
    <>
      <div className={`${classes.container} ${classes.headings}`}>
        <h1>Thông tin ứng tuyển</h1>
        <p>Vui lòng điền đầy đủ và chính xác các thông tin bên dưới</p>
      </div>

      <div className={classes.grid2}>
        <div className={`${classes.field} ${classes.span2}`}>
          <label className={classes.sectionTitle}>
            IV. Thông tin ứng tuyển
          </label>
        </div>

        <div className={classes.field}>
          <label>
            Vị trí ứng tuyển <span className={classes.star}>*</span>
          </label>
          <select
            value={formData.applyPositionId ?? ""}
            onChange={(e) => {
              const selectedId = e.target.value === "" ? null : Number(e.target.value);
              const selectedPos = positions.find((p) => p.id === selectedId);
              setFormData((prev) => ({
                ...prev,
                applyPositionId: selectedId,
                applyPosition: selectedPos?.ten ?? "",
                applyPositionRequireDegree: selectedPos
                  ? Number(selectedPos.isYeuCauBangCap) === 1
                  : false,
              }));
            }}
          >
            <option value="">-- Chọn --</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.ten}
              </option>
            ))}
          </select>
        </div>

        <div className={classes.field}>
          <label>
            Vị trí công việc chi tiết <span className={classes.star}>*</span>
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Bác sĩ Nội tim mạch"
            value={formData.jobDetail || ""}
            onChange={changeHandler("jobDetail")}
            maxLength={FIELD_LIMITS.jobDetail}
          />
          <CharCount value={formData.jobDetail} max={FIELD_LIMITS.jobDetail} />
        </div>

        <div className={`${classes.field} ${classes.span2}`}>
          <label>
            Kinh nghiệm làm việc <span className={classes.star}>*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Ngày bắt đầu – ngày kết thúc – Chức danh – Vị trí – Đơn vị công tác"
            value={formData.workExperience || ""}
            onChange={changeHandler("workExperience")}
            maxLength={FIELD_LIMITS.workExperience}
          />
          <CharCount value={formData.workExperience} max={FIELD_LIMITS.workExperience} />
        </div>

        <div className={`${classes.field} ${classes.span2}`}>
          <label>
            Kỹ năng chuyên môn <span className={classes.star}>*</span>
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Chẩn đoán hình ảnh, phẫu thuật nội soi..."
            value={formData.professionalSkills || ""}
            onChange={changeHandler("professionalSkills")}
            maxLength={FIELD_LIMITS.professionalSkills}
          />
          <CharCount value={formData.professionalSkills} max={FIELD_LIMITS.professionalSkills} />
        </div>

        <div className={`${classes.field} ${classes.span2}`}>
          <label>
            Kỹ năng mềm / Sở thích <span className={classes.star}>*</span>
          </label>
          <input
            type="text"
            placeholder="Giao tiếp, làm việc nhóm, đọc sách..."
            value={formData.softSkills || ""}
            onChange={changeHandler("softSkills")}
            maxLength={FIELD_LIMITS.softSkills}
          />
          <CharCount value={formData.softSkills} max={FIELD_LIMITS.softSkills} />
        </div>

        <div className={`${classes.field} ${classes.span2}`}>
          <label>
            Nguyện vọng khi làm việc tại Bệnh viện{" "}
            <span className={classes.star}>*</span>
          </label>
          <input
            type="text"
            placeholder="Mong muốn phát triển chuyên môn, gắn bó lâu dài..."
            value={formData.careerExpectation || ""}
            onChange={changeHandler("careerExpectation")}
            maxLength={FIELD_LIMITS.careerExpectation}
          />
          <CharCount value={formData.careerExpectation} max={FIELD_LIMITS.careerExpectation} />
        </div>
      </div>
    </>
  );
}

export default ApplicationForm;



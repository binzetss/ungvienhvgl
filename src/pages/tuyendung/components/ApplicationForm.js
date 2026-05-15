import React, { useContext } from "react";
import FormContext from "../store/form-context";
import classes from "../css/Form.module.css";


export const REQUIRED_FIELDS_APPLICATION = [
  { key: "applyPosition", label: "Vị trí ứng tuyển" },
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

  return { valid: true };
};


function ApplicationForm() {
  const { formData, setFormData, showPopup } = useContext(FormContext);

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
            value={formData.applyPosition || ""}
            onChange={changeHandler("applyPosition")}
          >
            <option value="">-- Chọn --</option>
            <option value="Bác sĩ">Bác sĩ</option>
            <option value="Điều dưỡng">Điều dưỡng</option>
            <option value="Kỹ thuật viên">Kỹ thuật viên</option>
            <option value="Hành chính">Hành chính</option>
            <option value="Khác">Khác</option>
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
          />
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
          />
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
          />
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
          />
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
          />
        </div>
      </div>
    </>
  );
}

export default ApplicationForm;



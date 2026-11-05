import React, { useContext, useState, useEffect } from "react";
import FormContext from "../store/form-context";
import classes from "../css/Form.module.css";
import Select from "react-select";
import CharCount from "./CharCount";
import { FIELD_LIMITS } from "../store/fieldLimits";

export const REQUIRED_FIELDS_ADDITIONAL = [
  { key: "birthPlace", label: "Nơi sinh" },
  { key: "ethnicity", label: "Dân tộc" },
  { key: "religionId", label: "Tôn giáo" },
  { key: "phone", label: "Số điện thoại" },
  { key: "email", label: "Email" },
];

export const isAdditionalPersonalInfoValid = (formData) => {
  for (const field of REQUIRED_FIELDS_ADDITIONAL) {
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
 
  const phoneRegex = /^(0\d{9,10}|\+84\d{9,10})$/;
  if (!phoneRegex.test(formData.phone.trim())) {
    return {
      valid: false,
      field: "phone",
      label: "Số điện thoại",
      message: "Số điện thoại phải từ 10-11 số và bắt đầu từ 0 hoặc +(84) ",
    };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email.trim())) {
    return {
      valid: false,
      field: "email",
      label: "Email",
      message: "Email không hợp lệ",
    };
  }

  return { valid: true };
};

function AdditionalPersonalInfoForm() {
  const { formData, setFormData } = useContext(FormContext);
  const [religions, setReligions] = useState([]);
  const [maritalStatuses, setMaritalStatuses] = useState([]);

  const religionOptions = religions.map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const changeHandler = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "44px",
      height: "44px",
      borderRadius: "6px",
      borderColor: state.isFocused ? "#0e73ba" : "rgba(0, 0, 0, 0.25)",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(37, 99, 235, 0.15)" : "none",
      "&:hover": {
        borderColor: "#0e73ba",
      },
      fontSize: "0.95rem",
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 12px",
    }),
    input: (base) => ({
      ...base,
      outline: "none",
      boxShadow: "none",
      border: "none",
    }),
    placeholder: (base) => ({
      ...base,
      color: "rgba(0, 0, 0, 0.4)",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#111827",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: "44px",
    }),
    menu: (base) => ({
      ...base,
      zIndex: 10,
    }),
  };

  useEffect(() => {
    setMaritalStatuses([
      { id: 1, name: "Độc thân" },
      { id: 2, name: "Đã kết hôn" },
      { id: 3, name: "Ly hôn" },
      { id: 4, name: "Góa" },
    ]);
  }, []);

  useEffect(() => {
    setReligions([
      { id: 1, name: "Không" },
      { id: 2, name: "Phật giáo" },
      { id: 3, name: "Công giáo" },
      { id: 4, name: "Tin Lành" },
      { id: 5, name: "Hồi giáo (Islam)" },
      { id: 6, name: "Cao Đài" },
      { id: 7, name: "Phật giáo Hòa Hảo" },
      { id: 8, name: "Baha’i" },
      { id: 9, name: "Tịnh độ cư sĩ Phật hội Việt Nam" },
      { id: 10, name: "Tứ Ân Hiếu Nghĩa" },
      { id: 11, name: "Minh Sư Đạo" },
      { id: 12, name: "Minh Lý Đạo" },
      { id: 13, name: "Bửu Sơn Kỳ Hương" },
      { id: 14, name: "Phật giáo Tứ Ân Hiếu Nghĩa" },
      { id: 15, name: "Ấn Độ giáo" },
      { id: 16, name: "Do Thái giáo" },
    ]);
  }, []);

  return (
    <>
      <span className={`${classes.container} ${classes.headings}`}>
        <h1>Thông tin cá nhân bổ sung</h1>
        <p>Vui lòng điền đầy đủ và chính xác các thông tin bên dưới</p>
      </span>

      <div className={classes.grid2}>

        <div className={classes.field}>
          <label>
            Dân tộc <span className={classes.star}>*</span>
          </label>
          <input
            type="text"
            placeholder="Kinh"
            value={formData.ethnicity || ""}
            onChange={changeHandler("ethnicity")}
            maxLength={FIELD_LIMITS.ethnicity}
          />
        </div>

        <div className={classes.field}>
          <label>
            Tôn giáo <span className={classes.star}>*</span>
          </label>
          <Select
            styles={selectStyles}
            options={religionOptions}
            placeholder="Chọn tôn giáo..."
            isClearable
            value={
              religionOptions.find(
                (opt) => opt.value === formData.religionId
              ) || null
            }
            onChange={(selected) =>
              setFormData((prev) => ({
                ...prev,
                religionId: selected ? selected.value : "",
              }))
            }
          />
        </div>

        <div className={classes.field}>
          <label>Tình trạng hôn nhân</label>
          <select
            value={formData.maritalStatusId ?? ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                maritalStatusId:
                  e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
          >
            <option value="">-- Chọn --</option>
            {maritalStatuses.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className={classes.field}>
          <label>Số con (nếu có)</label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={formData.childrenCount || ""}
            onChange={changeHandler("childrenCount")}
          />
        </div>

        <div className={`${classes.field} ${classes.span2}`}>
          <label>Tuổi con nhỏ nhất</label>
          <input
            type="number"
            min="0"
            placeholder="Tuổi"
            value={formData.youngestChildAge || ""}
            onChange={changeHandler("youngestChildAge")}
          />
        </div>

        <div className={classes.field}>
          <label>
            Số điện thoại <span className={classes.star}>*</span>
          </label>
          <input
            type="text"
            placeholder="090xxxxxxx"
            value={formData.phone || ""}
            onChange={changeHandler("phone")}
            maxLength={FIELD_LIMITS.phone}
          />
        </div>

        <div className={classes.field}>
          <label>
            Email <span className={classes.star}>*</span>
          </label>
          <input
            type="email"
            placeholder="example@email.com"
            value={formData.email || ""}
            onChange={changeHandler("email")}
            maxLength={FIELD_LIMITS.email}
          />
        </div>

        <div className={`${classes.field} ${classes.span2}`}>
          <label className="classes.sectionTitle1">
            Thông tin người liên hệ khi cần thiết
          </label>
        </div>

        <div className={classes.field}>
          <label>Họ và tên</label>
          <input
            type="text"
            placeholder="Nguyễn Văn B"
            value={formData.emergencyName || ""}
            onChange={changeHandler("emergencyName")}
            maxLength={FIELD_LIMITS.emergencyName}
          />
        </div>

        <div className={`${classes.field}`}>
          <label>Mối quan hệ</label>
          <input
            type="text"
            placeholder="Cha / Mẹ / Vợ / Chồng"
            value={formData.emergencyRelation || ""}
            onChange={changeHandler("emergencyRelation")}
            maxLength={FIELD_LIMITS.emergencyRelation}
          />
        </div>
          <div className={`${classes.field} ${classes.span2}`}>
          <label>Số điện thoại</label>
          <input
            type="text"
            placeholder="090xxxxxxx"
            value={formData.emergencyPhone || ""}
            onChange={changeHandler("emergencyPhone")}
            maxLength={FIELD_LIMITS.emergencyPhone}
          />
        </div>

        <div className={`${classes.field} ${classes.span2}`}>
          <label className={classes.sectionTitle}>Thông tin sức khỏe</label>
        </div>

        <div className={`${classes.field} ${classes.span2}`}>
          <label>Tình trạng sức khỏe hiện tại</label>
          <input
            type="text"
            placeholder="Tốt / Bình thường / Có vấn đề cần lưu ý"
            value={formData.healthStatus || ""}
            onChange={changeHandler("healthStatus")}
            maxLength={FIELD_LIMITS.healthStatus}
          />
          <CharCount value={formData.healthStatus} max={FIELD_LIMITS.healthStatus} />
        </div>

        <div className={classes.field}>
          <label>Chiều cao (cm)</label>
          <input
            type="number"
            min="0"
            placeholder="170"
            value={formData.height || ""}
            onChange={changeHandler("height")}
          />
        </div>

        <div className={classes.field}>
          <label>Cân nặng (kg)</label>
          <input
            type="number"
            min="0"
            placeholder="60"
            value={formData.weight || ""}
            onChange={changeHandler("weight")}
          />
        </div>

        <div className={`${classes.field} ${classes.span2}`}>
          <label>Tiền sử bệnh / Bệnh lý cần lưu ý (nếu có)</label>
          <input
            type="text"
            placeholder="Ví dụ: Cao huyết áp, tiểu đường, dị ứng thuốc..."
            value={formData.medicalHistory || ""}
            onChange={changeHandler("medicalHistory")}
            maxLength={FIELD_LIMITS.medicalHistory}
          />
          <CharCount value={formData.medicalHistory} max={FIELD_LIMITS.medicalHistory} />
        </div>
      </div>
    </>
  );
}

export default AdditionalPersonalInfoForm;

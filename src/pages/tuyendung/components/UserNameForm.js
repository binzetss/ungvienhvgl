import React, { useContext, useRef, useState, useEffect, useCallback } from "react";
import FormContext from "../store/form-context";
import classes from "../css/Form.module.css";
import Select from "react-select";
import { API_BASE } from "../../../config";
import { uploadToImageServer } from "../../../utils/imageUtils";
import CharCount from "./CharCount";
import { FIELD_LIMITS } from "../store/fieldLimits";


export const REQUIRED_FIELDS = [
  { key: "avatarUrl", label: "Ảnh đại diện" },
  { key: "fullName", label: "Họ và tên" },
  { key: "currentAddress", label: "Chỗ ở hiện tại" },
  { key: "dob", label: "Ngày sinh" },
  { key: "gender", label: "Giới tính" },
  { key: "cccd", label: "Số CCCD" },
  { key: "cccdDate", label: "Ngày cấp CCCD" },
  { key: "cccdPlace", label: "Nơi cấp CCCD" },
  { key: "permanentAddress", label: "Địa chỉ thường trú" },
  { key: "hometownWard", label: "Quê Quán" },
  { key: "birthPlace", label: "Nơi sinh" },
  { key: "ethnicity", label: "Dân tộc" },
  { key: "religionId", label: "Tôn giáo" },
  { key: "phone", label: "Số điện thoại" },
  { key: "email", label: "Email" },
];

export const isUserPersonalInfoValid = (formData) => {
  for (const field of REQUIRED_FIELDS) {
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

  /* validate cccd duplicate */
  if (formData.cccdDuplicate) {
    return {
      valid: false,
      field: "cccd",
      label: "Số CCCD",
      message: "Số CCCD này đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.",
    };
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

  /* validate email */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email.trim())) {
    return {
      valid: false,
      field: "email",
      label: "Email",
      message: "Email không hợp lệ",
    };
  }

  /* validate field length limits */
  const lengthChecks = [
    { key: "fullName",          label: "Họ và tên" },
    { key: "permanentAddress",  label: "Địa chỉ thường trú" },
    { key: "currentAddress",    label: "Chỗ ở hiện tại" },
    { key: "hometownWard",      label: "Quê quán" },
    { key: "birthPlace",        label: "Nơi sinh" },
    { key: "ethnicity",         label: "Dân tộc" },
    { key: "emergencyName",     label: "Người liên hệ – Họ tên" },
    { key: "emergencyRelation", label: "Người liên hệ – Quan hệ" },
    { key: "healthStatus",      label: "Tình trạng sức khỏe" },
    { key: "medicalHistory",    label: "Tiền sử bệnh" },
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

export const validateOptionalPersonalInfo = (formData) => {
  const filled = (v) => v !== "" && v !== null && v !== undefined;

  if (filled(formData.childrenCount)) {
    const val = Number(formData.childrenCount);
    if (isNaN(val) || !Number.isInteger(val) || val < 0) {
      return { valid: false, message: "Số con phải là số nguyên không âm (ví dụ: 2)" };
    }
  }

  if (filled(formData.youngestChildAge)) {
    const val = Number(formData.youngestChildAge);
    if (isNaN(val) || !Number.isInteger(val) || val < 0) {
      return { valid: false, message: "Tuổi con nhỏ nhất phải là số nguyên không âm (ví dụ: 5)" };
    }
  }

  if (filled(formData.height)) {
    const val = Number(formData.height);
    if (isNaN(val) || val <= 0 || val > 300) {
      return { valid: false, message: "Chiều cao không hợp lệ — nhập số cm từ 1 đến 300 (ví dụ: 165)" };
    }
  }

  if (filled(formData.weight)) {
    const val = Number(formData.weight);
    if (isNaN(val) || !Number.isInteger(val) || val <= 0 || val > 500) {
      return { valid: false, message: "Cân nặng không hợp lệ — nhập số kg nguyên từ 1 đến 500 (ví dụ: 60)" };
    }
  }

  if (filled(formData.emergencyPhone)) {
    const phone = String(formData.emergencyPhone).trim();
    if (phone !== "") {
      const phoneRegex = /^(0\d{9,10}|\+84\d{9,10})$/;
      if (!phoneRegex.test(phone)) {
        return {
          valid: false,
          message: "Số điện thoại người thân không hợp lệ — phải từ 10-11 số, bắt đầu từ 0 hoặc +84 (ví dụ: 0901234567)",
        };
      }
    }
  }

  return { valid: true };
};

function UserPersonalInfoForm() {
  const { formData, setFormData, showPopup } = useContext(FormContext);
  const fileRef = useRef(null);
  const [religions, setReligions] = useState([]);
  const [maritalStatuses, setMaritalStatuses] = useState([]);
  const [cccdError, setCccdError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const cccdTimerRef = useRef(null);

  const religionOptions = religions.map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const checkCccd = useCallback((value) => {
    if (cccdTimerRef.current) clearTimeout(cccdTimerRef.current);
    if (!value || value.length < 12) {
      setCccdError("");
      setFormData((prev) => ({ ...prev, cccdDuplicate: false }));
      return;
    }
    cccdTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hvoffice2/tuyen-dung/check-cccd?cccd=${encodeURIComponent(value)}`);
        if (res.ok) {
          const exists = await res.json();
          if (exists) {
            setCccdError("Số CCCD này đã tồn tại trong hệ thống");
            setFormData((prev) => ({ ...prev, cccdDuplicate: true }));
          } else {
            setCccdError("");
            setFormData((prev) => ({ ...prev, cccdDuplicate: false }));
          }
        }
      } catch (err) {
        console.error("Check CCCD failed:", err);
      }
    }, 500);
  }, [setFormData]);

  const changeHandler = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    if (field === "cccd") {
      checkCccd(e.target.value);
    }
  };

  const imageHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      showPopup(`Ảnh vượt quá ${MAX_SIZE_MB}MB. Vui lòng chọn ảnh nhỏ hơn.`, "error");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, avatarPreview: previewUrl }));

    setUploadingAvatar(true);
    try {
      const url = await uploadToImageServer(file, "anh-ung-vien-tuyen-dung");
      setFormData((prev) => ({
        ...prev,
        avatarUrl: url,
        avatarPreview: url,
      }));
    } catch (err) {
      // Upload failed — clear the local preview too, otherwise the applicant
      // sees a picture that was never actually saved and thinks it worked.
      setFormData((prev) => ({ ...prev, avatarUrl: "", avatarPreview: "" }));
      e.target.value = "";
      showPopup("Lỗi upload ảnh đại diện: " + err.message, "error");
    } finally {
      setUploadingAvatar(false);
    }
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
      { id: 8, name: "Baha'i" },
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
      <div className={`${classes.container} ${classes.headings}`}>
        <h1>Thông tin cá nhân</h1>
        <p>Vui lòng điền đầy đủ và chính xác các thông tin bên dưới</p>
      </div>

      <div className={classes.avatarBox} style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Ảnh đại diện <span className={classes.star}>*</span>
        </label>
        <div
          className={classes.avatarPreview}
          onClick={() => fileRef.current.click()}
          style={{ margin: '0 auto' }}
        >
          {formData.avatarPreview ? (
            <img src={formData.avatarPreview} alt="Avatar preview" />
          ) : (
            <span>Chọn ảnh đại diện</span>
          )}
        </div>
        {uploadingAvatar && (
          <small className={classes.hint} style={{ display: "block", marginTop: 4 }}>
            Đang tải ảnh lên...
          </small>
        )}
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileRef}
          onChange={imageHandler}
        />
        <small className={classes.hint}>JPG, PNG • Tối đa 5MB</small>
      </div>

      <div className={classes.grid2}>
        <div className={`${classes.field}`}>
          <label>
            Họ và tên <span className={classes.star}>*</span>
          </label>
          <input
            type="text"
            placeholder="Nguyễn Văn A"
            value={formData.fullName || ""}
            onChange={changeHandler("fullName")}
            maxLength={FIELD_LIMITS.fullName}
            required
          />
          <CharCount value={formData.fullName} max={FIELD_LIMITS.fullName} />
        </div>

        <div className={classes.field}>
          <label>
            Giới tính <span className={classes.star}>*</span>
          </label>
          <select
            value={formData.gender ?? ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                gender: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            required
          >
            <option value="">-- Chọn --</option>
            <option value={0}>Nam</option>
            <option value={1}>Nữ</option>
          </select>
        </div>

        <div className={`${classes.field}`}>
          <label>
            Ngày sinh <span className={classes.star}>*</span>
          </label>
          <input
            type="date"
            value={formData.dob || ""}
            onChange={changeHandler("dob")}
            required
          />
        </div>

        <div className={classes.field}>
          <label>
            Nơi sinh <span className={classes.star}>*</span>
          </label>
          <input
            type="text"
            placeholder="Tỉnh / Thành phố"
            value={formData.birthPlace || ""}
            onChange={changeHandler("birthPlace")}
            maxLength={FIELD_LIMITS.birthPlace}
          />
        </div>

        <div className={classes.field}>
          <label>
            Số CCCD <span className={classes.star}>*</span>
          </label>
          <input
            type="text"
            placeholder="Gồm 12 chữ số"
            value={formData.cccd || ""}
            onChange={changeHandler("cccd")}
            maxLength={FIELD_LIMITS.cccd}
            required
            style={cccdError ? { borderColor: "#dc2626" } : {}}
          />
          {cccdError && (
            <span style={{ color: "#dc2626", fontSize: 13, marginTop: 4 }}>
              {cccdError}
            </span>
          )}
        </div>

        <div className={classes.field}>
          <label>
            Ngày cấp CCCD <span className={classes.star}>*</span>
          </label>
          <input
            type="date"
            value={formData.cccdDate || ""}
            onChange={changeHandler("cccdDate")}
            required
          />
        </div>

        <div className={classes.field}>
          <label>
            Nơi cấp CCCD <span className={classes.star}>*</span>
          </label>
          <select
            value={formData.cccdPlace || ""}
            onChange={changeHandler("cccdPlace")}
            required
          >
            <option value="">-- Chọn --</option>
            <option value="Cục Cảnh sát quản lý hành chính về trật tự xã hội">Cục Cảnh sát quản lý hành chính về trật tự xã hội</option>
            <option value="Bộ Công an">Bộ Công an</option>
          </select>
        </div>

        <div className={`${classes.field}`}>
          <label>
            Quê Quán <span className={classes.star}>*</span>
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Hà Nội"
            value={formData.hometownWard || ""}
            onChange={changeHandler("hometownWard")}
            maxLength={FIELD_LIMITS.hometownWard}
            required
          />
          <CharCount value={formData.hometownWard} max={FIELD_LIMITS.hometownWard} />
        </div>

        <div className={classes.field}>
          <label>
            Địa chỉ thường trú <span className={classes.star}>*</span>
          </label>
          <input
            type="text"
            placeholder="Số nhà, đường, phường/xã, quận/huyện"
            value={formData.permanentAddress || ""}
            onChange={changeHandler("permanentAddress")}
            maxLength={FIELD_LIMITS.permanentAddress}
            required
          />
          <CharCount value={formData.permanentAddress} max={FIELD_LIMITS.permanentAddress} />
        </div>

        <div className={classes.field}>
          <label>
            Chỗ ở hiện tại <span className={classes.star}>*</span>
          </label>
          <input
            type="text"
            placeholder="Nếu khác địa chỉ thường trú"
            value={formData.currentAddress || ""}
            onChange={changeHandler("currentAddress")}
            maxLength={FIELD_LIMITS.currentAddress}
            required
          />
          <CharCount value={formData.currentAddress} max={FIELD_LIMITS.currentAddress} />
        </div>
 
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

export default UserPersonalInfoForm;

import React, { useContext, useState, useEffect } from "react";
import FormContext from "../store/form-context";
import classes from "../css/Form.module.css";
import { validateAndResizeImage, uploadToImageServer } from "../../../utils/imageUtils";
import { API_BASE_TUYENDUNG as API_BASE } from "../../../config";
import CharCount from "./CharCount";
import { FIELD_LIMITS } from "../store/fieldLimits";

export const isUsageFormValid = (formData) => {
  const degrees = formData.degrees || [];
  for (let i = 0; i < degrees.length; i++) {
    const d = degrees[i];
    const checks = [
      { key: "degreeMajor",       label: `Chuyên ngành (bằng cấp ${i + 1})` },
      { key: "degreeInstitution", label: `Đơn vị đào tạo (bằng cấp ${i + 1})` },
    ];
    for (const { key, label } of checks) {
      const val = d[key];
      const max = FIELD_LIMITS[key];
      if (typeof val === "string" && val.length > max)
        return { valid: false, field: key, label, message: `${label} vượt quá ${max} ký tự (hiện tại ${val.length} ký tự). Vui lòng rút ngắn lại.` };
    }
  }

  const cmes = formData.cmes || [];
  for (let i = 0; i < cmes.length; i++) {
    const c = cmes[i];
    const checks = [
      { key: "cmeName",        label: `Tên CME (${i + 1})` },
      { key: "cmeInstitution", label: `Đơn vị đào tạo CME (${i + 1})` },
    ];
    for (const { key, label } of checks) {
      const val = c[key];
      const max = FIELD_LIMITS[key];
      if (typeof val === "string" && val.length > max)
        return { valid: false, field: key, label, message: `${label} vượt quá ${max} ký tự (hiện tại ${val.length} ký tự). Vui lòng rút ngắn lại.` };
    }
  }

  const licenseChecks = [
    { key: "licenseNumber", label: "Số chứng chỉ hành nghề" },
    { key: "licensePlace",  label: "Nơi cấp chứng chỉ" },
    { key: "licenseDegree", label: "Văn bằng chuyên môn" },
    { key: "licenseScope",  label: "Phạm vi hoạt động" },
  ];
  for (const { key, label } of licenseChecks) {
    const val = formData[key];
    const max = FIELD_LIMITS[key];
    if (typeof val === "string" && val.length > max)
      return { valid: false, field: key, label, message: `${label} vượt quá ${max} ký tự (hiện tại ${val.length} ký tự). Vui lòng rút ngắn lại.` };
  }

  return { valid: true };
};

function UsageForm() {
  const { formData, setFormData, showPopup } = useContext(FormContext);

  const degrees = Array.isArray(formData.degrees) ? formData.degrees : [];
  const cmes = Array.isArray(formData.cmes) ? formData.cmes : [];
  const otherCertFileUrls = Array.isArray(formData.otherCertFileUrls)
    ? formData.otherCertFileUrls
    : [];

  const [uploadingDegree, setUploadingDegree] = useState({});
  const [uploadingCme, setUploadingCme] = useState({});
  const [uploadingOther, setUploadingOther] = useState(false);
  const [studyTypes, setStudyTypes] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);

  useEffect(() => {
    const checkOk = async (r, label) => {
      if (!r.ok) {
        const body = await r.text().catch(() => "");
        throw new Error(`${label}: mã lỗi ${r.status}${body ? ` - ${body.slice(0, 200)}` : ""}`);
      }
      return r.json();
    };

    fetch(`${API_BASE}/api/hvoffice2/danh-muc/trinh-do`)
      .then((r) => checkOk(r, "Danh sách trình độ"))
      .then((res) => setEducationLevels(res.data || res))
      .catch((err) => {
        console.error("[Trinh do API ERROR]", err);
        showPopup(`Không tải được danh sách "Trình độ". Vui lòng tải lại trang. (Chi tiết: ${err.message})`, "error");
      });

    fetch(`${API_BASE}/api/hvoffice2/danh-muc/hinh-thuc-dao-tao`)
      .then((r) => checkOk(r, "Danh sách hình thức đào tạo"))
      .then((res) => setStudyTypes(res.data || res))
      .catch((err) => {
        console.error("[Hinh thuc dao tao API ERROR]", err);
        showPopup(`Không tải được danh sách "Hình thức đào tạo". Vui lòng tải lại trang. (Chi tiết: ${err.message})`, "error");
      });
  }, [showPopup]);

  const changeHandler = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const toggleSkip = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.checked }));
  };

  const updateDegree = (index, field, value) => {
    const list = [...degrees];
    list[index] = { ...list[index], [field]: value };
    setFormData((prev) => ({ ...prev, degrees: list }));
  };

  const addDegree = () => {
    setFormData((prev) => ({
      ...prev,
      degrees: [
        ...(Array.isArray(prev.degrees) ? prev.degrees : []),
        {
          degreeMajor: "",
          degreeLevelId: null,
          degreeInstitution: "",
          degreeStudyTypeId: null,
          graduationYear: "",
          idXepLoaiDaoTao: null,
          fileUrls: [],
        },
      ],
    }));
  };

  const removeDegree = () => {
    if (degrees.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      degrees: degrees.slice(0, -1),
    }));
  };

  const handleDegreeFileUpload = (index) => async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;
    setUploadingDegree((prev) => ({ ...prev, [index]: true }));
    try {
      const urls = [];
      for (const f of rawFiles) {
        const resized = await validateAndResizeImage(f, 10);
        const url = await uploadToImageServer(resized, "anh-ung-vien-tuyen-dung-bangcap");
        urls.push(url);
      }
      const list = [...degrees];
      list[index] = { ...list[index], fileUrls: [...(list[index].fileUrls || []), ...urls] };
      setFormData((prev) => ({ ...prev, degrees: list }));
    } catch (err) {
      showPopup("Lỗi upload ảnh bằng cấp: " + (err?.message || err), "error");
      e.target.value = "";
    } finally {
      setUploadingDegree((prev) => ({ ...prev, [index]: false }));
    }
  };

  const removeDegreeFileUrl = (degreeIndex, urlIndex) => {
    const list = [...degrees];
    const urls = [...(list[degreeIndex].fileUrls || [])];
    urls.splice(urlIndex, 1);
    list[degreeIndex] = { ...list[degreeIndex], fileUrls: urls };
    setFormData((prev) => ({ ...prev, degrees: list }));
  };


  const updateCME = (index, field, value) => {
    const list = [...cmes];
    list[index] = { ...list[index], [field]: value };
    setFormData((prev) => ({ ...prev, cmes: list }));
  };

  const addCME = () => {
    setFormData((prev) => ({
      ...prev,
      cmes: [
        ...(Array.isArray(prev.cmes) ? prev.cmes : []),
        {
          cmeName: "",
          cmeInstitution: "",
          cmeStudyTypeId: null,
          cmeStartDate: "",
          cmeEndDate: "",
          cmeHours: "",
          cmeIssueDate: "",
          fileUrls: [],
        },
      ],
    }));
  };
  const degreeRanks = [
    { id: 1, name: "Xuất sắc" },
    { id: 2, name: "Giỏi" },
    { id: 3, name: "Khá" },
    { id: 4, name: "Trung bình" },
    { id: 5, name: "Đạt" },
  ];
  const removeCME = () => {
    if (cmes.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      cmes: cmes.slice(0, -1),
    }));
  };
  const updateOtherCert = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      otherCertificate: {
        ...(prev.otherCertificate || {}),
        [field]: value,
      },
    }));
  };
  const handleCMEFileUpload = (index) => async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;
    setUploadingCme((prev) => ({ ...prev, [index]: true }));
    try {
      const urls = [];
      for (const f of rawFiles) {
        const resized = await validateAndResizeImage(f, 10);
        const url = await uploadToImageServer(resized, "anh-ung-vien-tuyen-dung-chungchi");
        urls.push(url);
      }
      const list = [...cmes];
      list[index] = { ...list[index], fileUrls: [...(list[index].fileUrls || []), ...urls] };
      setFormData((prev) => ({ ...prev, cmes: list }));
    } catch (err) {
      showPopup("Lỗi upload ảnh CME: " + (err?.message || err), "error");
      e.target.value = "";
    } finally {
      setUploadingCme((prev) => ({ ...prev, [index]: false }));
    }
  };

  const removeCmeFileUrl = (cmeIndex, urlIndex) => {
    const list = [...cmes];
    const urls = [...(list[cmeIndex].fileUrls || [])];
    urls.splice(urlIndex, 1);
    list[cmeIndex] = { ...list[cmeIndex], fileUrls: urls };
    setFormData((prev) => ({ ...prev, cmes: list }));
  };

  const handleOtherCertFiles = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;
    setUploadingOther(true);
    try {
      const urls = [];
      for (const f of rawFiles) {
        const resized = await validateAndResizeImage(f, 10);
        const url = await uploadToImageServer(resized, "anh-ung-vien-tuyen-dung-chungchi");
        urls.push(url);
      }
      setFormData((prev) => ({
        ...prev,
        otherCertFileUrls: [...(prev.otherCertFileUrls || []), ...urls],
      }));
    } catch (err) {
      showPopup("Lỗi upload ảnh chứng chỉ: " + (err?.message || err), "error");
      e.target.value = "";
    } finally {
      setUploadingOther(false);
    }
  };

  const removeOtherCertFileUrl = (urlIndex) => {
    setFormData((prev) => {
      const urls = [...(prev.otherCertFileUrls || [])];
      urls.splice(urlIndex, 1);
      return { ...prev, otherCertFileUrls: urls };
    });
  };

  const renderUploadedUrls = (urls = [], onRemove) =>
    urls.length === 0 ? null : (
      <ul style={{ marginTop: 6, paddingLeft: 16 }}>
        {urls.map((url, i) => (
          <li key={i} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <a href={url} target="_blank" rel="noreferrer">Ảnh {i + 1}</a>
            <button type="button" onClick={() => onRemove(i)} style={{ fontSize: 11, cursor: "pointer" }}>✕</button>
          </li>
        ))}
      </ul>
    );

  return (
    <>

      <div className={`${classes.container} ${classes.headings}`}>
        <h1>Thông tin sức khỏe & chuyên môn</h1>
        <p>Vui lòng điền đầy đủ và chính xác các thông tin bên dưới</p>
      </div>

      <div className={classes.grid2}>
        <div className={`${classes.span2}`}>
          <label className={classes.sectionTitle}>
            II. Trình độ chuyên môn – Bằng cấp
            {formData.applyPositionRequireDegree && (
              <span className={classes.star}> *</span>
            )}
          </label>
          <label className={classes.skipCheckbox}>
            <input
              type="checkbox"
              checked={!!formData.noDegree}
              onChange={toggleSkip("noDegree")}
            />
            Tôi không có bằng cấp phù hợp
          </label>
        </div>

        {!formData.noDegree && formData.degrees?.map((d, i) => (
          <React.Fragment key={i}>
            <div className={`${classes.span2} ${classes.degreeRowHeader}`}>
              <span className={classes.degreeTitle}>Bằng cấp {i + 1}</span>
            </div>

            <div className={classes.field}>
              <label>Chuyên ngành</label>
              <input
                value={d.degreeMajor}
                onChange={(e) => updateDegree(i, "degreeMajor", e.target.value)}
                maxLength={FIELD_LIMITS.degreeMajor}
              />
              <CharCount value={d.degreeMajor} max={FIELD_LIMITS.degreeMajor} />
            </div>
            <div className={classes.field}>
              <label>Trình độ</label>
              <select
                value={d.degreeLevelId ?? ""}
                onChange={(e) =>
                  updateDegree(
                    i,
                    "degreeLevelId",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              >
                <option value="">-- Chọn --</option>
                {educationLevels.map((lv) => (
                  <option key={lv.id} value={lv.id}>{lv.ten}</option>
                ))}
              </select>
            </div>

            <div className={classes.field}>
              <label>Đơn vị đào tạo</label>
              <input
                value={d.degreeInstitution}
                onChange={(e) =>
                  updateDegree(i, "degreeInstitution", e.target.value)
                }
                maxLength={FIELD_LIMITS.degreeInstitution}
              />
              <CharCount value={d.degreeInstitution} max={FIELD_LIMITS.degreeInstitution} />
            </div>
            <div className={classes.field}>
              <label>Hình thức đào tạo</label>
              <select
                value={d.degreeStudyTypeId ?? ""}
                onChange={(e) =>
                  updateDegree(
                    i,
                    "degreeStudyTypeId",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              >
                <option value="">-- Chọn --</option>
                {studyTypes.map((st) => (
                  <option key={st.id} value={st.id}>{st.ten}</option>
                ))}
              </select>
            </div>

            <div className={classes.field}>
              <label>Năm tốt nghiệp</label>
              <input
                type="number"
                value={d.graduationYear}
                onChange={(e) =>
                  updateDegree(i, "graduationYear", e.target.value)
                }
              />
            </div>
            <div className={classes.field}>
              <label>Xếp loại</label>
              <select
                value={d.idXepLoaiDaoTao ?? ""}
                onChange={(e) =>
                  updateDegree(
                    i,
                    "idXepLoaiDaoTao",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              >
                <option value="">-- Chọn --</option>
                {degreeRanks.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={`${classes.field} ${classes.span2}`}>
              <label>Ảnh chứng chỉ / bằng cấp</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                multiple
                disabled={uploadingDegree[i]}
                onChange={handleDegreeFileUpload(i)}
              />
              {uploadingDegree[i] && <span style={{ fontSize: 12 }}>Đang upload...</span>}
              {renderUploadedUrls(d.fileUrls || [], (urlIdx) => removeDegreeFileUrl(i, urlIdx))}
            </div>
          </React.Fragment>
        ))}

        {!formData.noDegree && (
          <div className={`${classes.span2} ${classes.degreeActions}`}>
            <button className={classes.btnAdd} onClick={addDegree}>
              + Thêm bằng cấp
            </button>
            {degrees.length > 1 && (
              <button className={classes.btnRemove} onClick={removeDegree}>
                Xóa bằng cấp
              </button>
            )}
          </div>
        )}

        <div className={`${classes.span2}`}>
          <label className={classes.sectionTitle}>
            III. Chứng chỉ đào tạo (CME)
            <span className={classes.star}> *</span>
          </label>
          <label className={classes.skipCheckbox}>
            <input
              type="checkbox"
              checked={!!formData.noCme}
              onChange={toggleSkip("noCme")}
            />
            Tôi không có chứng chỉ CME
          </label>
        </div>

        {!formData.noCme && cmes.map((c, i) => (
          <React.Fragment key={i}>
            <div className={`${classes.span2} ${classes.degreeRowHeader}`}>
              <span className={classes.degreeTitle}>CME {i + 1}</span>
            </div>

            <div className={classes.field}>
              <label>Tên CME</label>
              <input
                value={c.cmeName}
                onChange={(e) => updateCME(i, "cmeName", e.target.value)}
                maxLength={FIELD_LIMITS.cmeName}
              />
              <CharCount value={c.cmeName} max={FIELD_LIMITS.cmeName} />
            </div>
            <div className={classes.field}>
              <label>Đơn vị đào tạo</label>
              <input
                value={c.cmeInstitution}
                onChange={(e) => updateCME(i, "cmeInstitution", e.target.value)}
                maxLength={FIELD_LIMITS.cmeInstitution}
              />
              <CharCount value={c.cmeInstitution} max={FIELD_LIMITS.cmeInstitution} />
            </div>
            <div className={classes.field}>
              <label>Hình thức</label>
              <select
                value={c.cmeStudyTypeId ?? ""}
                onChange={(e) =>
                  updateCME(
                    i,
                    "cmeStudyTypeId",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
              >
                <option value="">-- Chọn --</option>
                {studyTypes.map((st) => (
                  <option key={st.id} value={st.id}>{st.ten}</option>
                ))}
              </select>
            </div>

            <div className={classes.field}>
              <label>Ngày bắt đầu</label>
              <input
                type="date"
                value={c.cmeStartDate}
                onChange={(e) => updateCME(i, "cmeStartDate", e.target.value)}
              />
            </div>
            <div className={classes.field}>
              <label>Ngày kết thúc</label>
              <input
                type="date"
                value={c.cmeEndDate}
                onChange={(e) => updateCME(i, "cmeEndDate", e.target.value)}
              />
            </div>
            <div className={classes.field}>
              <label>Số tiết</label>
              <input
                type="number"
                value={c.cmeHours}
                onChange={(e) => updateCME(i, "cmeHours", e.target.value)}
              />
            </div>
            <div className={classes.field}>
              <label>Ngày cấp</label>
              <input
                type="date"
                value={c.cmeIssueDate}
                onChange={(e) => updateCME(i, "cmeIssueDate", e.target.value)}
              />
            </div>

            <div className={classes.field}>
              <label>Ảnh chứng chỉ CME</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                multiple
                disabled={uploadingCme[i]}
                onChange={handleCMEFileUpload(i)}
              />
              {uploadingCme[i] && <span style={{ fontSize: 12 }}>Đang upload...</span>}
              {renderUploadedUrls(c.fileUrls || [], (urlIdx) => removeCmeFileUrl(i, urlIdx))}
            </div>
          </React.Fragment>
        ))}

        {!formData.noCme && (
          <div className={`${classes.span2} ${classes.degreeActions}`}>
            <button className={classes.btnAdd} onClick={addCME}>
              + Thêm CME
            </button>
            {cmes.length > 1 && (
              <button className={classes.btnRemove} onClick={removeCME}>
                Xóa CME
              </button>
            )}
          </div>
        )}

        <div className={`${classes.field} ${classes.span2}`}>
          <label className={classes.sectionTitle}>3. Chứng chỉ khác</label>
        </div>

        <div className={classes.field}>
          <label>Tên chứng chỉ</label>
          <input
            type="text"
            value={formData.otherCertificate?.name || ""}
            onChange={(e) => updateOtherCert("name", e.target.value)}
          />
        </div>

        <div className={classes.field}>
          <label>Đơn vị đào tạo</label>
          <input
            type="text"
            value={formData.otherCertificate?.institution || ""}
            onChange={(e) => updateOtherCert("institution", e.target.value)}
          />
        </div>

        <div className={classes.field}>
          <label>Hình thức đào tạo</label>
          <select
            value={formData.otherCertificate?.studyTypeId ?? ""}
            onChange={(e) =>
              updateOtherCert(
                "studyTypeId",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          >
            <option value="">-- Chọn --</option>
            {studyTypes.map((st) => (
              <option key={st.id} value={st.id}>{st.ten}</option>
            ))}
          </select>
        </div>

        <div className={classes.field}>
          <label>Ngày bắt đầu</label>
          <input
            type="date"
            value={formData.otherCertificate?.startDate || ""}
            onChange={(e) => updateOtherCert("startDate", e.target.value)}
          />
        </div>

        <div className={classes.field}>
          <label>Ngày kết thúc</label>
          <input
            type="date"
            value={formData.otherCertificate?.endDate || ""}
            onChange={(e) => updateOtherCert("endDate", e.target.value)}
          />
        </div>

        <div className={classes.field}>
          <label>Số tiết</label>
          <input
            type="number"
            value={formData.otherCertificate?.hours || ""}
            onChange={(e) => updateOtherCert("hours", e.target.value)}
          />
        </div>

        <div className={classes.field}>
          <label>Ngày cấp</label>
          <input
            type="date"
            value={formData.otherCertificate?.issueDate || ""}
            onChange={(e) => updateOtherCert("issueDate", e.target.value)}
          />
        </div>

        <div className={classes.field}>
          <label>Ảnh chứng chỉ khác</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
            multiple
            disabled={uploadingOther}
            onChange={handleOtherCertFiles}
          />
          {uploadingOther && <span style={{ fontSize: 12 }}>Đang upload...</span>}
          {renderUploadedUrls(otherCertFileUrls, removeOtherCertFileUrl)}
        </div>

        <div className={classes.span2}>
          <label className={classes.sectionTitle}>
            4. CCHN / GPHN
            <span className={classes.star}> *</span>
          </label>
          <label className={classes.skipCheckbox}>
            <input
              type="checkbox"
              checked={!!formData.noLicense}
              onChange={toggleSkip("noLicense")}
            />
            Tôi không có CCHN/GPHN
          </label>
        </div>

        {!formData.noLicense && (
          <>
            {[
              ["Số", "licenseNumber", "text", FIELD_LIMITS.licenseNumber],
              ["Ngày cấp", "licenseIssueDate", "date", null],
              ["Nơi cấp", "licensePlace", "text", FIELD_LIMITS.licensePlace],
              ["Văn bằng chuyên môn", "licenseDegree", "text", FIELD_LIMITS.licenseDegree],
            ].map(([label, key, type, maxLen]) => (
              <div className={classes.field} key={key}>
                <label>{label}</label>
                <input
                  type={type}
                  value={formData[key] || ""}
                  onChange={changeHandler(key)}
                  {...(maxLen ? { maxLength: maxLen } : {})}
                />
                {maxLen && maxLen >= 200 && <CharCount value={formData[key]} max={maxLen} />}
              </div>
            ))}

            <div className={`${classes.field} ${classes.span2}`}>
              <label>Phạm vi hoạt động</label>
              <input
                type="text"
                value={formData.licenseScope || ""}
                onChange={changeHandler("licenseScope")}
                maxLength={FIELD_LIMITS.licenseScope}
              />
              <CharCount value={formData.licenseScope} max={FIELD_LIMITS.licenseScope} />
            </div>
          </>
        )}
      </div>
    </>
  );
}

export const isDegreeCmeFilesValid = (formData) => {
  const degrees = Array.isArray(formData.degrees) ? formData.degrees : [];
  for (let i = 0; i < degrees.length; i++) {
    const d = degrees[i];
    const hasFiles = Array.isArray(d.fileUrls) && d.fileUrls.length > 0;
    const hasMajor = d.degreeMajor && d.degreeMajor.trim() !== "";
    if (hasFiles && !hasMajor) {
      return {
        valid: false,
        message: `Bằng cấp ${i + 1}: Bạn đã tải ảnh nhưng chưa nhập Chuyên ngành. Vui lòng bổ sung để ảnh không bị mất.`,
      };
    }
  }

  const cmes = Array.isArray(formData.cmes) ? formData.cmes : [];
  for (let i = 0; i < cmes.length; i++) {
    const c = cmes[i];
    const hasFiles = Array.isArray(c.fileUrls) && c.fileUrls.length > 0;
    const hasName = c.cmeName && c.cmeName.trim() !== "";
    if (hasFiles && !hasName) {
      return {
        valid: false,
        message: `CME ${i + 1}: Bạn đã tải ảnh nhưng chưa nhập Tên CME. Vui lòng bổ sung để ảnh không bị mất.`,
      };
    }
  }

  return { valid: true };
};

export const isDegreeRequirementValid = (formData) => {
  if (!formData.applyPositionRequireDegree) return { valid: true };
  if (formData.noDegree) return { valid: true };

  const degrees = Array.isArray(formData.degrees) ? formData.degrees : [];
  const hasValidDegree = degrees.some(
    (d) => d.degreeMajor && d.degreeMajor.trim() !== ""
  );

  if (!hasValidDegree) {
    const positionName = formData.applyPosition?.trim()
      ? `"${formData.applyPosition}"`
      : "đã chọn";
    return {
      valid: false,
      message: `Vị trí ${positionName} yêu cầu bắt buộc nhập thông tin bằng cấp. Vui lòng bổ sung chuyên ngành ở mục Bằng cấp, hoặc tích "Tôi không có bằng cấp phù hợp".`,
    };
  }

  return { valid: true };
};

export const isCmeRequirementValid = (formData) => {
  if (formData.noCme) return { valid: true };

  const cmes = Array.isArray(formData.cmes) ? formData.cmes : [];
  const hasValidCme = cmes.some((c) => c.cmeName && c.cmeName.trim() !== "");

  if (!hasValidCme) {
    return {
      valid: false,
      message: `Vui lòng nhập ít nhất 1 chứng chỉ CME, hoặc tích "Tôi không có chứng chỉ CME".`,
    };
  }

  return { valid: true };
};

export const isLicenseRequirementValid = (formData) => {
  if (formData.noLicense) return { valid: true };

  if (!formData.licenseNumber || formData.licenseNumber.trim() === "") {
    return {
      valid: false,
      message: `Vui lòng nhập số CCHN/GPHN, hoặc tích "Tôi không có CCHN/GPHN".`,
    };
  }

  return { valid: true };
};

export const validateOptionalUsageInfo = (formData) => {
  const currentYear = new Date().getFullYear();
  const filled = (v) => v !== "" && v !== null && v !== undefined;

  if (Array.isArray(formData.degrees)) {
    for (let i = 0; i < formData.degrees.length; i++) {
      const d = formData.degrees[i];
      if (!d.degreeMajor || d.degreeMajor.trim() === "") continue;

      if (filled(d.graduationYear)) {
        const year = Number(d.graduationYear);
        if (!Number.isInteger(year) || isNaN(year) || year < 1950 || year > currentYear) {
          return {
            valid: false,
            message: `Bằng cấp ${i + 1}: Năm tốt nghiệp không hợp lệ — nhập năm từ 1950 đến ${currentYear}`,
          };
        }
      }
    }
  }

  if (Array.isArray(formData.cmes)) {
    for (let i = 0; i < formData.cmes.length; i++) {
      const c = formData.cmes[i];
      if (!c.cmeName || c.cmeName.trim() === "") continue;

      if (filled(c.cmeHours)) {
        const hours = Number(c.cmeHours);
        if (isNaN(hours) || hours < 0) {
          return {
            valid: false,
            message: `CME ${i + 1}: Số tiết không hợp lệ — phải là số không âm (ví dụ: 16)`,
          };
        }
      }
    }
  }

  return { valid: true };
};

export default UsageForm;

import React, { useContext } from "react";
import FormContext from "../store/form-context";
import rv from "../css/ReviewForm.module.css";
import classes from "../css/Form.module.css";

const GENDER_MAP   = { 0: "Nam", 1: "Nữ" };
const MARITAL_MAP  = { 1: "Độc thân", 2: "Đã kết hôn", 3: "Ly hôn", 4: "Góa" };
const STUDY_MAP    = { 1: "Chính quy", 2: "Vừa học vừa làm", 3: "Tại chức", 4: "Liên thông", 5: "Đào tạo ngắn hạn" };
const LEVEL_MAP    = { 1: "Trung cấp", 2: "Cao đẳng", 3: "Đại học", 4: "Sau đại học", 5: "Chuyên khoa I", 6: "Chuyên khoa II" };
const RANK_MAP     = { 1: "Xuất sắc", 2: "Giỏi", 3: "Khá", 4: "Trung bình", 5: "Đạt" };

const val = (v) => (v !== null && v !== undefined && v !== "" ? v : <span style={{ color: "#cbd5e1" }}>—</span>);

function Row({ label, value }) {
  return (
    <div className={rv.row}>
      <span className={rv.rowLabel}>{label}</span>
      <span className={rv.rowValue}>{val(value)}</span>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className={rv.section}>
      <div className={rv.sectionHeader}>
        <span className={rv.sectionIcon}>{icon}</span>
        <span className={rv.sectionTitle}>{title}</span>
      </div>
      <div className={rv.sectionBody}>{children}</div>
    </div>
  );
}

function ReviewForm() {
  const { formData } = useContext(FormContext);
  const [previewImage, setPreviewImage] = React.useState(null); // kept for lightbox

  const renderFileLinks = (urls) => {
    if (!urls || urls.length === 0) return val("");
    return (
      <div className={rv.fileList}>
        {urls.map((url, i) => (
          <span key={i} className={rv.fileChip} onClick={() => window.open(url, "_blank")} style={{ cursor: "pointer" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Ảnh {i + 1}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={`${classes.container} ${classes.headings}`}>
        <h1>Xem lại thông tin ứng viên</h1>
        <p>Vui lòng kiểm tra kỹ trước khi gửi hồ sơ</p>
      </div>

      <div className={rv.wrapper}>

        {/* ===== I. CÁ NHÂN ===== */}
        <Section icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} title="I. Thông tin cá nhân">
          {formData.avatarPreview && (
            <div className={rv.avatarWrap}>
              <img src={formData.avatarPreview} alt="Ảnh đại diện" className={rv.avatar} />
              <span className={rv.avatarLabel}>Ảnh đại diện</span>
            </div>
          )}
          <div className={rv.grid2}>
            <Row label="Họ và tên"         value={formData.fullName} />
            <Row label="Ngày sinh"          value={formData.dob} />
            <Row label="Giới tính"          value={GENDER_MAP[formData.gender]} />
            <Row label="Số CCCD"            value={formData.cccd} />
            <Row label="Ngày cấp CCCD"      value={formData.cccdDate} />
            <Row label="Nơi cấp CCCD"       value={formData.cccdPlace} />
            <Row label="Địa chỉ thường trú" value={formData.permanentAddress} />
            <Row label="Chỗ ở hiện tại"     value={formData.currentAddress} />
            <Row label="Quê quán"           value={[formData.hometownWard, formData.hometownProvince].filter(Boolean).join(", ")} />
            <Row label="Nơi sinh"           value={formData.birthPlace} />
            <Row label="Dân tộc"            value={formData.ethnicity} />
            <Row label="Tình trạng HN"      value={MARITAL_MAP[formData.maritalStatusId]} />
            <Row label="Số điện thoại"      value={formData.phone} />
            <Row label="Email"              value={formData.email} />
          </div>

          {(formData.emergencyName || formData.emergencyPhone) && (
            <div className={rv.subSection}>
              <div className={rv.subTitle}>Người liên hệ khi cần</div>
              <div className={rv.grid2}>
                <Row label="Họ và tên"      value={formData.emergencyName} />
                <Row label="Số điện thoại"  value={formData.emergencyPhone} />
                <Row label="Mối quan hệ"    value={formData.emergencyRelation} />
              </div>
            </div>
          )}
        </Section>

        {/* ===== II. SỨC KHỎE ===== */}
        <Section icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>} title="II. Thông tin sức khỏe">
          <div className={rv.grid2}>
            <Row label="Tình trạng sức khỏe" value={formData.healthStatus} />
            <Row label="Chiều cao"            value={formData.height ? `${formData.height} cm` : ""} />
            <Row label="Cân nặng"             value={formData.weight  ? `${formData.weight} kg`  : ""} />
            <Row label="Tiền sử bệnh"         value={formData.medicalHistory} />
          </div>
        </Section>

        {/* ===== III. CHUYÊN MÔN ===== */}
        <Section icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>} title="III. Trình độ chuyên môn">

          {/* Bằng cấp */}
          {formData.degrees?.filter(d => d.degreeMajor).map((d, i) => (
            <div key={i} className={rv.subSection}>
              <div className={rv.subTitle}>Bằng cấp {i + 1}</div>
              <div className={rv.grid2}>
                <Row label="Chuyên ngành"      value={d.degreeMajor} />
                <Row label="Trình độ"          value={LEVEL_MAP[d.degreeLevelId]} />
                <Row label="Đơn vị đào tạo"    value={d.degreeInstitution} />
                <Row label="Hình thức"         value={STUDY_MAP[d.degreeStudyTypeId]} />
                <Row label="Năm tốt nghiệp"    value={d.graduationYear} />
                <Row label="Xếp loại"          value={RANK_MAP[d.idXepLoaiDaoTao]} />
                {d.fileUrls?.length > 0 && <Row label="File đính kèm" value={renderFileLinks(d.fileUrls)} />}
              </div>
            </div>
          ))}

          {/* CME */}
          {formData.cmes?.filter(c => c.cmeName).map((c, i) => (
            <div key={i} className={rv.subSection}>
              <div className={rv.subTitle}>CME {i + 1}</div>
              <div className={rv.grid2}>
                <Row label="Tên CME"         value={c.cmeName} />
                <Row label="Đơn vị đào tạo"  value={c.cmeInstitution} />
                <Row label="Ngày bắt đầu"    value={c.cmeStartDate} />
                <Row label="Ngày kết thúc"   value={c.cmeEndDate} />
                <Row label="Số tiết"         value={c.cmeHours} />
                <Row label="Ngày cấp"        value={c.cmeIssueDate} />
                {c.fileUrls?.length > 0 && <Row label="File đính kèm" value={renderFileLinks(c.fileUrls)} />}
              </div>
            </div>
          ))}

          {/* CCHN */}
          {formData.licenseNumber && (
            <div className={rv.subSection}>
              <div className={rv.subTitle}>CCHN / GPHN</div>
              <div className={rv.grid2}>
                <Row label="Số"                   value={formData.licenseNumber} />
                <Row label="Ngày cấp"             value={formData.licenseIssueDate} />
                <Row label="Nơi cấp"              value={formData.licensePlace} />
                <Row label="Văn bằng chuyên môn"  value={formData.licenseDegree} />
                <Row label="Phạm vi hoạt động"    value={formData.licenseScope} />
              </div>
            </div>
          )}
        </Section>

        {/* ===== IV. ỨNG TUYỂN ===== */}
        <Section icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>} title="IV. Thông tin ứng tuyển">
          <div className={rv.grid2}>
            <Row label="Vị trí ứng tuyển"    value={formData.applyPosition} />
            <Row label="Vị trí chi tiết"      value={formData.jobDetail} />
            <Row label="Kinh nghiệm"          value={formData.workExperience} />
            <Row label="Kỹ năng chuyên môn"   value={formData.professionalSkills} />
            <Row label="Kỹ năng mềm"          value={formData.softSkills} />
            <Row label="Nguyện vọng"          value={formData.careerExpectation} />
          </div>
        </Section>

      </div>

      {/* Lightbox preview ảnh */}
      {previewImage && (
        <div className={rv.lightbox} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className={rv.lightboxImg} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

export default ReviewForm;

import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api } from "./api";
import pageBackground from "../../background.jpg";

const EMPTY_FILTERS = { patientId: "", studyDate: "" };

function LoginPage({ onLogin, isAuthenticated }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ username: "admin", password: "admin123" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    username: "",
    department: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await api.login(loginForm);
      localStorage.setItem("medical_platform_token", result.token);
      localStorage.setItem("medical_platform_user", JSON.stringify(result.user));
      onLogin(result.user);
      navigate("/dashboard");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setLoading(false);
      setError("两次输入的密码不一致");
      return;
    }

    try {
      await api.register({
        fullName: registerForm.fullName,
        username: registerForm.username,
        department: registerForm.department,
        password: registerForm.password
      });

      setSuccessMessage("注册成功，请使用新账号登录");
      setLoginForm({
        username: registerForm.username,
        password: registerForm.password
      });
      setRegisterForm({
        fullName: "",
        username: "",
        department: "",
        password: "",
        confirmPassword: ""
      });
      setMode("login");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="page-shell login-shell with-photo-background"
      style={{ "--page-bg-image": `url(${pageBackground})` }}
    >
      <div className="page-backdrop" />

      <section className="login-floating-card">
        <div className="login-card-header">
          <span className="hero-badge">Medical Imaging Platform</span>
          <h1>医疗影像数据管理平台</h1>
          <p>本地部署的轻量化控制台，完成账号登录、医生注册、影像上传、影像检索与在线预览。</p>
        </div>

        <div className="login-mode-toggle">
          <button
            className={mode === "login" ? "mode-button active" : "mode-button"}
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setSuccessMessage("");
            }}
          >
            登录
          </button>
          <button
            className={mode === "register" ? "mode-button active" : "mode-button"}
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
              setSuccessMessage("");
            }}
          >
            医生注册
          </button>
        </div>

        <div className="login-feature-row">
          <div>
            <strong>影像上传</strong>
            <span>支持图片文件录入与预览</span>
          </div>
          <div>
            <strong>医生注册</strong>
            <span>新医生可直接创建个人账号</span>
          </div>
          <div>
            <strong>本地运行</strong>
            <span>Docker + MySQL 快速联调</span>
          </div>
        </div>

        {mode === "login" ? (
          <form className="login-form" onSubmit={handleLoginSubmit}>
            <label>
              用户名
              <input
                value={loginForm.username}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, username: event.target.value }))
                }
                placeholder="请输入用户名"
              />
            </label>

            <label>
              密码
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder="请输入密码"
              />
            </label>

            {error ? <div className="form-error">{error}</div> : null}
            {successMessage ? <div className="form-success">{successMessage}</div> : null}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "登录中..." : "进入系统"}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegisterSubmit}>
            <label>
              姓名
              <input
                value={registerForm.fullName}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
                placeholder="请输入真实姓名"
              />
            </label>

            <label>
              用户名
              <input
                value={registerForm.username}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, username: event.target.value }))
                }
                placeholder="至少 3 个字符"
              />
            </label>

            <label>
              科室
              <input
                value={registerForm.department}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, department: event.target.value }))
                }
                placeholder="例如：影像科"
              />
            </label>

            <label>
              密码
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder="至少 6 个字符"
              />
            </label>

            <label>
              确认密码
              <input
                type="password"
                value={registerForm.confirmPassword}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
                placeholder="再次输入密码"
              />
            </label>

            {error ? <div className="form-error">{error}</div> : null}
            {successMessage ? <div className="form-success">{successMessage}</div> : null}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "注册中..." : "创建医生账号"}
            </button>
          </form>
        )}

        <div className="login-tips">
          <span>管理员：admin / admin123</span>
          <span>演示医生：doctor / doctor123</span>
        </div>
      </section>
    </div>
  );
}

function DashboardPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [uploadForm, setUploadForm] = useState({
    patientName: "",
    patientId: "",
    studyDate: "",
    modality: "CT",
    description: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData(activeFilters = EMPTY_FILTERS) {
    setLoading(true);
    setMessage("");

    try {
      const [imageList, userList] = await Promise.all([
        api.getImages(activeFilters),
        user?.role === "admin" ? api.getUsers() : Promise.resolve([])
      ]);

      setImages(imageList);
      setSelectedImage((current) => {
        if (current) {
          return imageList.find((item) => item.id === current.id) || imageList[0] || null;
        }

        return imageList[0] || null;
      });
      setUsers(userList);
    } catch (loadError) {
      if (loadError.message.includes("登录")) {
        handleLogout();
      } else {
        setMessage(loadError.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(EMPTY_FILTERS);
  }, []);

  function handleLogout() {
    localStorage.removeItem("medical_platform_token");
    localStorage.removeItem("medical_platform_user");
    onLogout();
    navigate("/");
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      setMessage("请选择需要上传的医疗影像图片");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const formData = new FormData();
      Object.entries(uploadForm).forEach(([key, value]) => formData.append(key, value));
      formData.append("image", selectedFile);

      const result = await api.uploadImage(formData);

      setUploadForm({
        patientName: "",
        patientId: "",
        studyDate: "",
        modality: "CT",
        description: ""
      });
      setSelectedFile(null);
      setFilters(EMPTY_FILTERS);
      setMessage(result.message || "影像上传成功");
      await loadData(EMPTY_FILTERS);
    } catch (uploadError) {
      setMessage(uploadError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      const result = await api.deleteImage(id);
      setMessage(result.message || "影像已删除");
      await loadData(filters);
    } catch (deleteError) {
      setMessage(deleteError.message);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadData(filters);
  }

  function handleResetFilters() {
    setFilters(EMPTY_FILTERS);
    loadData(EMPTY_FILTERS);
  }

  return (
    <div
      className="dashboard-shell with-photo-background"
      style={{ "--page-bg-image": `url(${pageBackground})` }}
    >
      <div className="page-backdrop dashboard-backdrop" />

      <header className="dashboard-header elevated-surface">
        <div>
          <span className="hero-badge">Imaging Console</span>
          <h1>医疗影像管理控制台</h1>
          <p>支持影像上传、患者检索、在线回看，以及管理员账号目录查看。</p>
        </div>

        <div className="user-panel">
          <div>
            <strong>{user?.fullName}</strong>
            <span>
              {user?.role === "admin" ? "管理员" : "医生"} · {user?.department || "未分配科室"}
            </span>
          </div>
          <button className="ghost-button" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <span>影像总数</span>
          <strong>{images.length}</strong>
        </article>
        <article className="stat-card">
          <span>当前角色</span>
          <strong>{user?.role === "admin" ? "Admin" : "Doctor"}</strong>
        </article>
        <article className="stat-card">
          <span>可上传格式</span>
          <strong>PNG / JPG / JPEG</strong>
        </article>
      </section>

      {message ? <div className="global-message elevated-surface">{message}</div> : null}

      <main className="content-grid">
        <section className="panel upload-panel">
          <div className="panel-heading">
            <h2>上传影像数据</h2>
            <span>填写病例基础信息后上传图片文件</span>
          </div>

          <form className="upload-form" onSubmit={handleUpload}>
            <label>
              患者姓名
              <input
                value={uploadForm.patientName}
                onChange={(event) =>
                  setUploadForm((prev) => ({ ...prev, patientName: event.target.value }))
                }
                placeholder="例如：张三"
                required
              />
            </label>

            <label>
              病例编号
              <input
                value={uploadForm.patientId}
                onChange={(event) =>
                  setUploadForm((prev) => ({ ...prev, patientId: event.target.value }))
                }
                placeholder="例如：CASE-2026-001"
                required
              />
            </label>

            <label>
              检查日期
              <input
                type="date"
                value={uploadForm.studyDate}
                onChange={(event) =>
                  setUploadForm((prev) => ({ ...prev, studyDate: event.target.value }))
                }
                required
              />
            </label>

            <label>
              影像类型
              <select
                value={uploadForm.modality}
                onChange={(event) =>
                  setUploadForm((prev) => ({ ...prev, modality: event.target.value }))
                }
              >
                <option value="CT">CT</option>
                <option value="MRI">MRI</option>
                <option value="X-Ray">X-Ray</option>
                <option value="Ultrasound">Ultrasound</option>
              </select>
            </label>

            <label className="full-width">
              病例备注
              <textarea
                rows="4"
                value={uploadForm.description}
                onChange={(event) =>
                  setUploadForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="可填写脱敏后的补充说明"
              />
            </label>

            <label className="file-picker full-width">
              <span>{selectedFile ? selectedFile.name : "选择医疗影像图片"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              />
            </label>

            <button className="primary-button full-width" type="submit" disabled={submitting}>
              {submitting ? "上传中..." : "提交影像"}
            </button>
          </form>
        </section>

        <section className="panel library-panel">
          <div className="panel-heading">
            <h2>影像库</h2>
            <span>支持按病例编号与检查日期过滤，默认展示全部条目。</span>
          </div>

          <form className="filter-row" onSubmit={handleSearch}>
            <input
              value={filters.patientId}
              onChange={(event) => setFilters((prev) => ({ ...prev, patientId: event.target.value }))}
              placeholder="搜索病例编号"
            />
            <input
              type="date"
              value={filters.studyDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, studyDate: event.target.value }))}
            />
            <button className="ghost-button" type="submit">
              查询
            </button>
            <button className="ghost-button" type="button" onClick={handleResetFilters}>
              重置
            </button>
          </form>

          <div className="library-layout">
            <div className="image-list">
              {loading ? <div className="empty-state">正在加载影像数据...</div> : null}
              {!loading && !images.length ? <div className="empty-state">暂无影像记录</div> : null}

              {images.map((image) => (
                <article
                  key={image.id}
                  className={`image-item ${selectedImage?.id === image.id ? "active" : ""}`}
                  onClick={() => setSelectedImage(image)}
                >
                  <div>
                    <strong>{image.patient_name}</strong>
                    <span>
                      {image.patient_id} · {image.modality}
                    </span>
                    <small>{image.study_date?.slice(0, 10)}</small>
                  </div>
                  <button
                    className="danger-link"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(image.id);
                    }}
                  >
                    删除
                  </button>
                </article>
              ))}
            </div>

            <div className="preview-panel">
              {selectedImage ? (
                <>
                  <img src={selectedImage.previewUrl} alt={selectedImage.patient_name} />
                  <div className="preview-meta">
                    <h3>{selectedImage.patient_name}</h3>
                    <p>病例编号：{selectedImage.patient_id}</p>
                    <p>检查日期：{selectedImage.study_date?.slice(0, 10)}</p>
                    <p>检查类型：{selectedImage.modality}</p>
                    <p>上传人员：{selectedImage.uploader_name || "未知"}</p>
                    <p>备注：{selectedImage.description || "无"}</p>
                  </div>
                </>
              ) : (
                <div className="empty-state">选择左侧影像后可在此处预览详细信息</div>
              )}
            </div>
          </div>
        </section>

        {user?.role === "admin" ? (
          <section className="panel user-list-panel">
            <div className="panel-heading">
              <h2>账号目录</h2>
              <span>管理员可查看系统内账号与角色。</span>
            </div>

            <div className="user-list">
              {users.map((account) => (
                <article key={account.id} className="user-card">
                  <div>
                    <strong>{account.full_name}</strong>
                    <span>{account.username}</span>
                    <small>
                      {account.role === "admin" ? "管理员" : "医生"} · {account.department || "未分配"}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("medical_platform_user");
    return stored ? JSON.parse(stored) : null;
  });

  return (
    <Routes>
      <Route path="/" element={<LoginPage onLogin={setUser} isAuthenticated={Boolean(user)} />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user}>
            <DashboardPage user={user} onLogout={() => setUser(null)} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}

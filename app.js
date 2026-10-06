const DEFAULT_DATA = window.PORTFOLIO_DATA || {};
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const SB = window.SUPABASE_CONFIG || {};
const hasSupabaseConfig = Boolean(
  window.supabase &&
  SB.url &&
  SB.anonKey &&
  !SB.url.includes("YOUR-PROJECT-REF") &&
  !SB.anonKey.includes("YOUR_SUPABASE"),
);
const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(SB.url, SB.anonKey)
  : null;

const D = {
  personal: { ...(DEFAULT_DATA.personal || {}) },
  skills: { ...(DEFAULT_DATA.skills || {}) },
  experience: [...(DEFAULT_DATA.experience || [])],
  projects: [...(DEFAULT_DATA.projects || [])],
  certifications: [...(DEFAULT_DATA.certifications || [])],
  education: [...(DEFAULT_DATA.education || [])],
};
let currentUser = null;
let adminVerified = false;

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
const safeUrl = (value) => {
  const v = String(value || "").trim();
  if (/^(https?:|mailto:|tel:)/i.test(v) || v.startsWith("assets/")) return v;
  return "";
};
const uid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function fallbackData() {
  D.personal = { ...(DEFAULT_DATA.personal || {}), ...(D.personal || {}) };
  D.skills = { ...(DEFAULT_DATA.skills || {}), ...(D.skills || {}) };
  D.experience = [...(DEFAULT_DATA.experience || [])];
  D.education = [...(DEFAULT_DATA.education || [])];
  D.projects = [...(DEFAULT_DATA.projects || [])];
  D.certifications = [...(DEFAULT_DATA.certifications || [])];
}

function mapProfile(row) {
  return {
    id: row.id,
    name: row.name || "Manish Singh",
    role: row.role || "Data Analyst",
    tagline: row.tagline || "",
    location: row.location || "",
    phone: row.phone || "",
    email: row.email || "",
    linkedin: row.linkedin || "",
    github: row.github || "",
    portfolio: row.portfolio || "",
    resumeUrl: row.resume_url || "",
    resumePath: row.resume_path || "",
    photoUrl: row.photo_url || "",
    photoPath: row.photo_path || "",
  };
}
function mapProject(row) {
  return { ...row, image: row.image_url || "", mediaKey: row.image_path || "" };
}
function mapCert(row) {
  return {
    ...row,
    file: row.file_url || "",
    mediaKey: row.file_path || "",
    mediaType: row.file_type || "",
  };
}

async function loadPortfolioFromSupabase() {
  if (!supabaseClient) return false;
  try {
    const [profileRes, projectsRes, certsRes] = await Promise.all([
      supabaseClient
        .from("portfolio_profile")
        .select("*")
        .eq("id", 1)
        .maybeSingle(),
      supabaseClient
        .from("projects")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabaseClient
        .from("certifications")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);
    if (profileRes.error) throw profileRes.error;
    if (projectsRes.error) throw projectsRes.error;
    if (certsRes.error) throw certsRes.error;
    if (profileRes.data)
      D.personal = {
        ...(DEFAULT_DATA.personal || {}),
        ...mapProfile(profileRes.data),
      };
    D.projects = (projectsRes.data || []).map(mapProject);
    D.certifications = (certsRes.data || []).map(mapCert);
    return true;
  } catch (error) {
    console.error("Supabase load failed:", error);
    showToast(`Supabase load failed: ${error.message}`, "error");
    fallbackData();
    return false;
  }
}

function renderSkills() {
  $("#skillsGrid").innerHTML = Object.entries(D.skills || {})
    .map(
      ([cat, items]) =>
        `<article class="skill-card reveal"><h3>${esc(cat)}</h3><div class="skill-list">${items.map((x) => `<span class="skill">${esc(x)}</span>`).join("")}</div></article>`,
    )
    .join("");
}
function renderExperience() {
  $("#experienceTimeline").innerHTML = (D.experience || [])
    .map(
      (x) =>
        `<article class="timeline-item reveal"><div class="timeline-meta"><div><h3>${esc(x.role)}</h3><div class="company">${esc(x.company)}</div></div><span class="period">${esc(x.period)}</span></div>${x.score ? `<span class="score">${esc(x.score)}</span>` : ""}<div class="tech-row">${(x.tech || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div><ul>${(x.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("")}</ul></article>`,
    )
    .join("");
}
function renderEducation() {
  $("#educationTimeline").innerHTML = (D.education || [])
    .map(
      (e) =>
        `<article class="education-item reveal"><div><h3>${esc(e.degree)}</h3><p>${esc(e.institution)}</p></div><time>${esc(e.period)}</time></article>`,
    )
    .join("");
}
function dashboardArt() {
  return `<div class="dashboard-art"><div class="mini-kpis"><i></i><i></i><i></i></div><div class="mini-bars">${[42, 70, 53, 88, 62, 96, 76].map((h) => `<i style="height:${h}%"></i>`).join("")}</div></div>`;
}

async function renderProjects() {
  const box = $("#projectsGrid");
  const cards = (D.projects || []).map((p) => {
    const src = safeUrl(p.image);
    return `<article class="project-card reveal"><div class="project-image">${src ? `<img src="${esc(src)}" alt="${esc(p.title)}" loading="lazy">` : dashboardArt()}</div><div class="project-body"><div class="tag-row">${(p.tech || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><div class="project-links">${safeUrl(p.github) ? `<a class="small-btn" href="${esc(safeUrl(p.github))}" target="_blank" rel="noreferrer">GitHub ↗</a>` : ""}${safeUrl(p.demo) ? `<a class="small-btn" href="${esc(safeUrl(p.demo))}" target="_blank" rel="noreferrer">Live Demo ↗</a>` : ""}<button class="small-btn" onclick="openProject('${esc(p.id)}')">View Details</button></div></div></article>`;
  });
  box.innerHTML = cards.length
    ? cards.join("")
    : '<div class="loading-inline">No projects added yet.</div>';
  setupReveal();
}
async function renderCerts() {
  const box = $("#certGrid");
  const cards = (D.certifications || []).map((c) => {
    const src = safeUrl(c.file);
    const preview = src
      ? c.mediaType === "application/pdf"
        ? '<span class="pdf-badge">PDF</span>'
        : `<img src="${esc(src)}" alt="${esc(c.title)}" loading="lazy">`
      : '<div class="cert-icon">✓</div>';
    return `<article class="cert-card reveal" onclick="openCert('${esc(c.id)}')"><div class="cert-preview">${preview}</div><h3>${esc(c.title)}</h3><p>${esc(c.issuer)} · ${esc(c.year)}</p>${safeUrl(c.credential) ? '<span class="credential-label">Credential available ↗</span>' : ""}</article>`;
  });
  box.innerHTML = cards.length
    ? cards.join("")
    : '<div class="loading-inline">No certificates added yet.</div>';
  setupReveal();
}

async function refresh() {
  renderSkills();
  renderExperience();
  renderEducation();
  const projectCount = $("#projectCount");
  if (projectCount) projectCount.textContent = `${D.projects.length}+`;
  const certCount = $("#certCount");
  if (certCount) certCount.textContent = String(D.certifications.length);
  await Promise.all([renderProjects(), renderCerts()]);
  applyPersonal();
  setupReveal();
}
function setupReveal() {
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
      }),
    { threshold: 0.12 },
  );
  $$(".reveal:not(.visible)").forEach((x) => io.observe(x));
}

function applyPersonal() {
  const p = D.personal || {};
  const heroName = $("#heroName");
  if (heroName) heroName.textContent = p.name || "Manish Singh";
  const heroTagline = $("#heroTagline");
  if (heroTagline)
    heroTagline.textContent =
      p.tagline || "Data Analyst · Business Intelligence · Data Visualization";
  const photo = safeUrl(p.photoUrl || p.photo || "");
  if (photo)
    $("#heroPhoto").innerHTML =
      `<img src="${esc(photo)}" alt="${esc(p.name || "Manish Singh")} profile photo">`;
  const email = safeUrl(`mailto:${p.email || ""}`);
  const li = safeUrl(p.linkedin),
    gh = safeUrl(p.github);
  $$(".socials a").forEach((a) => {
    if (a.textContent.trim() === "@") a.href = email;
    if (a.textContent.trim() === "in") a.href = li || "#";
    if (a.textContent.trim() === "GH") a.href = gh || "#";
  });
  $$(".contact-list a").forEach((a) => {
    if (a.dataset.kind === "email") {
      a.href = email;
      a.textContent = `✉ ${p.email || "Email"}`;
    }
    if (a.dataset.kind === "phone") {
      a.href = safeUrl(`tel:+91${String(p.phone || "").replace(/\D/g, "")}`);
      a.textContent = `☎ +91 ${p.phone || ""}`;
    }
    if (a.dataset.kind === "linkedin") a.href = li || "#";
    if (a.dataset.kind === "github") a.href = gh || "#";
  });
  const resumeView = $("#resumeView"),
    resumeDownload = $("#resumeDownload"),
    heroResume = $("#heroResume");
  const resume = safeUrl(p.resumeUrl || "assets/Manish_Singh_Resume.pdf");
  if (resumeView) resumeView.href = resume;
  if (resumeDownload) resumeDownload.href = resume;
  if (heroResume) heroResume.href = resume;
}

window.openProject = async (id) => {
  const p = D.projects.find((x) => x.id === id);
  if (!p) return;
  const image = safeUrl(p.image);
  $("#projectModalContent").innerHTML =
    `<div class="project-detail">${image ? `<img class="detail-project-image" src="${esc(image)}" alt="${esc(p.title)}">` : ""}<span class="section-label">PROJECT DETAIL</span><h2>${esc(p.title)}</h2><div class="tag-row">${(p.tech || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div><h4>PROJECT OVERVIEW</h4><p>${esc(p.overview || p.description)}</p><h4>PROBLEM STATEMENT</h4><p>${esc(p.problem || "Add the business problem or objective from Manage Portfolio.")}</p><h4>TOOLS & TECHNOLOGIES</h4><p>${esc((p.tech || []).join(" · "))}</p><h4>DATA PREPARATION</h4><p>${esc(p.preparation || "Add your data preparation workflow.")}</p><h4>ANALYSIS</h4><p>${esc(p.analysis || "Add your analytical approach.")}</p><h4>KEY INSIGHTS</h4><ul>${(p.insights || []).map((i) => `<li>${esc(i)}</li>`).join("") || "<li>Add key insights from the project manager.</li>"}</ul><h4>OUTCOME</h4><p>${esc(p.outcome || "Add the project outcome.")}</p><div class="project-links">${safeUrl(p.github) ? `<a class="btn primary" href="${esc(safeUrl(p.github))}" target="_blank" rel="noreferrer">GitHub ↗</a>` : ""}${safeUrl(p.demo) ? `<a class="btn secondary" href="${esc(safeUrl(p.demo))}" target="_blank" rel="noreferrer">Live Demo ↗</a>` : ""}</div></div>`;
  openModal("#projectModal");
};
window.openCert = async (id) => {
  const c = D.certifications.find((x) => x.id === id);
  if (!c) return;
  const src = safeUrl(c.file);
  const body = src
    ? c.mediaType === "application/pdf"
      ? `<iframe src="${esc(src)}" title="${esc(c.title)}"></iframe>`
      : `<div class="image-zoom-wrap"><img id="certImage" src="${esc(src)}" alt="${esc(c.title)}"></div>`
    : `<div style="padding:70px 20px;text-align:center"><div class="cert-icon" style="margin:auto">✓</div><h2>${esc(c.title)}</h2><p style="color:#91a4b9">${esc(c.issuer)} · ${esc(c.year)}</p><p style="color:#6f8498">No certificate file uploaded yet.</p></div>`;
  $("#certModalContent").innerHTML =
    `${body}${safeUrl(c.credential) ? `<div class="credential-action"><a class="btn secondary" href="${esc(safeUrl(c.credential))}" target="_blank" rel="noreferrer">Open Credential ↗</a></div>` : ""}`;
  openModal("#certModal");
};

function openModal(sel) {
  $(sel).classList.add("open");
  $(sel).setAttribute("aria-hidden", "false");
}
function closeModals() {
  $$(".modal").forEach((m) => {
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
  });
}
$$("[data-close]").forEach((b) => (b.onclick = closeModals));
$$(".modal").forEach((m) =>
  m.addEventListener("click", (e) => {
    if (e.target === m) closeModals();
  }),
);
$(".menu").onclick = () => $(".nav-links").classList.toggle("open");
$$(".nav-links a").forEach(
  (a) => (a.onclick = () => $(".nav-links").classList.remove("open")),
);
document.addEventListener("click", (e) => {
  if (e.target.id === "certImage") e.target.classList.toggle("zoomed");
});

function showToast(message, type = "success") {
  let toast = $("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "portfolio-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3500);
}
function managerHeader(title, help = "Changes are saved to Supabase.") {
  return `<div class="manager-heading"><div><h3>${esc(title)}</h3><p>${esc(help)}</p></div></div>`;
}

function loginForm() {
  return `<div class="manager-login"><div class="login-mark">MS.</div><h3>Portfolio Admin</h3><p>Sign in with the Supabase account you created for managing this portfolio.</p><form id="loginForm" class="manager-form"><input name="email" type="email" required placeholder="Admin email"><input name="password" type="password" required placeholder="Password"><button class="btn primary" type="submit">Sign In ↗</button></form><div class="manager-tip">Your public portfolio stays readable. Only an authenticated account listed in <b>portfolio_admins</b> can add, edit or delete content.</div></div>`;
}

function certForm(c = {}) {
  return `<form id="certForm" class="manager-form"><input name="id" type="hidden" value="${esc(c.id || "")}"><input name="title" required placeholder="Certificate title" value="${esc(c.title || "")}"><div class="manager-row"><input name="issuer" required placeholder="Issuing organization" value="${esc(c.issuer || "")}"><input name="year" placeholder="Issue year" value="${esc(c.year || "")}"></div><input name="credential" placeholder="Credential link (optional)" value="${esc(c.credential || "")}"><label class="upload-box">Certificate image / PDF<input name="file" type="file" accept="image/*,.pdf"><small>${c.file ? "Current file uploaded. Choose another file to replace it." : "Choose a JPG, PNG or PDF."}</small></label><div class="form-actions"><button type="submit" class="btn primary">${c.id ? "Save Changes" : "Add Certificate"}</button>${c.id ? '<button type="button" class="manager-secondary" onclick="renderManager(\'certs\')">Cancel</button>' : ""}</div></form>`;
}
function projectForm(p = {}) {
  return `<form id="projectForm" class="manager-form"><input name="id" type="hidden" value="${esc(p.id || "")}"><input name="title" required placeholder="Project title" value="${esc(p.title || "")}"><input name="tech" placeholder="Technologies (comma separated)" value="${esc((p.tech || []).join(", "))}"><textarea name="description" required rows="3" placeholder="Short project description">${esc(p.description || "")}</textarea><div class="manager-row"><input name="github" placeholder="GitHub URL" value="${esc(p.github || "")}"><input name="demo" placeholder="Live Demo URL" value="${esc(p.demo || "")}"></div><textarea name="overview" rows="2" placeholder="Project overview">${esc(p.overview || "")}</textarea><textarea name="problem" rows="2" placeholder="Problem statement">${esc(p.problem || "")}</textarea><textarea name="preparation" rows="2" placeholder="Data preparation">${esc(p.preparation || "")}</textarea><textarea name="analysis" rows="2" placeholder="Analysis approach">${esc(p.analysis || "")}</textarea><textarea name="insights" rows="3" placeholder="Key insights — one per line">${esc((p.insights || []).join("\n"))}</textarea><textarea name="outcome" rows="2" placeholder="Outcome">${esc(p.outcome || "")}</textarea><label class="upload-box">Project image / dashboard screenshot<input name="file" type="file" accept="image/*"><small>${p.image ? "Current image uploaded. Choose another to replace it." : "Recommended: dashboard screenshot in JPG/PNG."}</small></label><div class="form-actions"><button type="submit" class="btn primary">${p.id ? "Save Project" : "Add Project"}</button>${p.id ? '<button type="button" class="manager-secondary" onclick="renderManager(\'projects\')">Cancel</button>' : ""}</div></form>`;
}

async function storageUpload(file, folder, oldPath = "") {
  if (!file || !file.size) return { url: "", path: "" };
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${folder}/${Date.now()}-${uid().slice(0, 8)}-${cleanName}`;
  const { error } = await supabaseClient.storage
    .from("portfolio-media")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
  if (error) throw error;
  if (oldPath)
    await supabaseClient.storage.from("portfolio-media").remove([oldPath]);
  const { data } = supabaseClient.storage
    .from("portfolio-media")
    .getPublicUrl(path);
  return { url: data.publicUrl, path };
}
async function removeStorage(path) {
  if (path) await supabaseClient.storage.from("portfolio-media").remove([path]);
}

async function saveCert(e) {
  e.preventDefault();
  const f = new FormData(e.target),
    id = f.get("id");
  const existing = id ? D.certifications.find((x) => x.id === id) : null;
  const payload = {
    title: String(f.get("title")).trim(),
    issuer: String(f.get("issuer")).trim(),
    year: String(f.get("year") || "").trim(),
    credential: safeUrl(f.get("credential")) || null,
    sort_order: existing?.sort_order ?? D.certifications.length,
  };
  const file = f.get("file");
  try {
    let media = { url: existing?.file || "", path: existing?.mediaKey || "" };
    if (file && file.size)
      media = await storageUpload(
        file,
        "certificates",
        existing?.mediaKey || "",
      );
    payload.file_url = media.url || null;
    payload.file_path = media.path || null;
    payload.file_type = file?.size ? file.type : existing?.mediaType || null;
    let result;
    if (id)
      result = await supabaseClient
        .from("certifications")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
    else
      result = await supabaseClient
        .from("certifications")
        .insert(payload)
        .select()
        .single();
    if (result.error) throw result.error;
    await loadPortfolioFromSupabase();
    await refresh();
    await renderManager("certs");
    showToast("Certificate saved to Supabase.");
  } catch (error) {
    console.error(error);
    showToast(error.message, "error");
  }
}

async function saveProject(e) {
  e.preventDefault();
  const f = new FormData(e.target),
    id = f.get("id");
  const existing = id ? D.projects.find((x) => x.id === id) : null;
  const payload = {
    title: String(f.get("title")).trim(),
    tech: String(f.get("tech") || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    description: String(f.get("description")).trim(),
    overview: String(f.get("overview") || "").trim(),
    problem: String(f.get("problem") || "").trim(),
    preparation: String(f.get("preparation") || "").trim(),
    analysis: String(f.get("analysis") || "").trim(),
    insights: String(f.get("insights") || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean),
    outcome: String(f.get("outcome") || "").trim(),
    github: safeUrl(f.get("github")) || null,
    demo: safeUrl(f.get("demo")) || null,
    sort_order: existing?.sort_order ?? D.projects.length,
  };
  const file = f.get("file");
  try {
    let media = { url: existing?.image || "", path: existing?.mediaKey || "" };
    if (file && file.size)
      media = await storageUpload(file, "projects", existing?.mediaKey || "");
    payload.image_url = media.url || null;
    payload.image_path = media.path || null;
    let result;
    if (id)
      result = await supabaseClient
        .from("projects")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
    else
      result = await supabaseClient
        .from("projects")
        .insert(payload)
        .select()
        .single();
    if (result.error) throw result.error;
    await loadPortfolioFromSupabase();
    await refresh();
    await renderManager("projects");
    showToast("Project saved to Supabase.");
  } catch (error) {
    console.error(error);
    showToast(error.message, "error");
  }
}

async function saveProfile(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const p = D.personal || {};
  const payload = {
    name: String(f.get("name")).trim(),
    role: String(f.get("role")).trim(),
    tagline: String(f.get("tagline")).trim(),
    location: String(f.get("location")).trim(),
    phone: String(f.get("phone")).trim(),
    email: String(f.get("email")).trim(),
    linkedin: safeUrl(f.get("linkedin")) || null,
    github: safeUrl(f.get("github")) || null,
    portfolio: safeUrl(f.get("portfolio")) || null,
  };
  const resume = f.get("resume"),
    photo = f.get("photo");
  try {
    let resumeMedia = { url: p.resumeUrl || "", path: p.resumePath || "" };
    let photoMedia = { url: p.photoUrl || "", path: p.photoPath || "" };
    if (resume && resume.size)
      resumeMedia = await storageUpload(resume, "resume", p.resumePath || "");
    if (photo && photo.size)
      photoMedia = await storageUpload(photo, "profile", p.photoPath || "");
    payload.resume_url = resumeMedia.url || null;
    payload.resume_path = resumeMedia.path || null;
    payload.photo_url = photoMedia.url || null;
    payload.photo_path = photoMedia.path || null;
    const { error } = await supabaseClient
      .from("portfolio_profile")
      .update(payload)
      .eq("id", 1);
    if (error) throw error;
    await loadPortfolioFromSupabase();
    await refresh();
    await renderManager("profile");
    showToast("Profile updated in Supabase.");
  } catch (error) {
    console.error(error);
    showToast(error.message, "error");
  }
}

window.deleteCert = async (id) => {
  if (!confirm("Delete this certificate and its uploaded file?")) return;
  try {
    const c = D.certifications.find((x) => x.id === id);
    const { error } = await supabaseClient
      .from("certifications")
      .delete()
      .eq("id", id);
    if (error) throw error;
    if (c?.mediaKey) await removeStorage(c.mediaKey);
    await loadPortfolioFromSupabase();
    await refresh();
    await renderManager("certs");
    showToast("Certificate deleted.");
  } catch (error) {
    showToast(error.message, "error");
  }
};
window.editCert = (id) => {
  const c = D.certifications.find((x) => x.id === id);
  $("#managerContent").innerHTML =
    managerHeader(
      "Edit Certificate",
      "Update the details or replace the certificate file.",
    ) + certForm(c);
  $("#certForm").onsubmit = saveCert;
};
window.deleteProject = async (id) => {
  if (!confirm("Delete this project and its uploaded image?")) return;
  try {
    const p = D.projects.find((x) => x.id === id);
    const { error } = await supabaseClient
      .from("projects")
      .delete()
      .eq("id", id);
    if (error) throw error;
    if (p?.mediaKey) await removeStorage(p.mediaKey);
    await loadPortfolioFromSupabase();
    await refresh();
    await renderManager("projects");
    showToast("Project deleted.");
  } catch (error) {
    showToast(error.message, "error");
  }
};
window.editProject = (id) => {
  const p = D.projects.find((x) => x.id === id);
  $("#managerContent").innerHTML =
    managerHeader(
      "Edit Project",
      "Update all project details and replace the dashboard image whenever you want.",
    ) + projectForm(p);
  $("#projectForm").onsubmit = saveProject;
};

async function seedDefaultContent() {
  if (!adminVerified) return;
  const confirmSeed = confirm(
    "Add the default projects and certificates from data.js to Supabase? Existing records will not be deleted.",
  );
  if (!confirmSeed) return;
  try {
    for (const p of DEFAULT_DATA.projects || []) {
      const exists = D.projects.some((x) => x.title === p.title);
      if (exists) continue;
      const { error } = await supabaseClient
        .from("projects")
        .insert({
          title: p.title,
          tech: p.tech || [],
          description: p.description || "",
          overview: p.overview || "",
          problem: p.problem || "",
          preparation: p.preparation || "",
          analysis: p.analysis || "",
          insights: p.insights || [],
          outcome: p.outcome || "",
          github: safeUrl(p.github) || null,
          demo: safeUrl(p.demo) || null,
          sort_order: D.projects.length,
        })
        .select()
        .single();
      if (error) throw error;
    }
    for (const c of DEFAULT_DATA.certifications || []) {
      const exists = D.certifications.some((x) => x.title === c.title);
      if (exists) continue;
      const { error } = await supabaseClient
        .from("certifications")
        .insert({
          title: c.title,
          issuer: c.issuer || "",
          year: c.year || "",
          credential: safeUrl(c.credential) || null,
          sort_order: D.certifications.length,
        })
        .select()
        .single();
      if (error) throw error;
    }
    const p = DEFAULT_DATA.personal || {};
    await supabaseClient
      .from("portfolio_profile")
      .update({
        name: p.name || "Manish Singh",
        role: p.role || "Data Analyst",
        tagline: p.tagline || "",
        location: p.location || "",
        phone: p.phone || "",
        email: p.email || "",
        linkedin: safeUrl(p.linkedin) || null,
        github: safeUrl(p.github) || null,
        portfolio: safeUrl(p.portfolio) || null,
      })
      .eq("id", 1);
    await loadPortfolioFromSupabase();
    await refresh();
    await renderManager("certs");
    showToast("Default portfolio content added to Supabase.");
  } catch (error) {
    console.error(error);
    showToast(error.message, "error");
  }
}
window.seedDefaultContent = seedDefaultContent;

window.renderManager = async function (tab = "certs") {
  const box = $("#managerContent");
  if (!supabaseClient) {
    box.innerHTML =
      managerHeader(
        "Supabase not configured",
        "Add your Supabase URL and publishable key in supabase-config.js, then reload the site.",
      ) +
      `<div class="manager-tip">Open <b>supabase-config.js</b> and replace the two placeholder values. Never use a service_role key in browser code.</div>`;
    return;
  }
  if (!currentUser || !adminVerified) {
    box.innerHTML = loginForm();
    $("#loginForm").onsubmit = login;
    return;
  }
  if (tab === "certs") {
    box.innerHTML =
      managerHeader(
        "Certificate Library",
        "Add unlimited certificates. Files are stored in Supabase Storage and metadata in PostgreSQL.",
      ) +
      `<div class="manager-toolbar"><button class="manager-secondary" onclick="signOutAdmin()">Sign Out</button><button class="manager-secondary" onclick="seedDefaultContent()">Seed Default Content</button></div><div class="manager-list">${D.certifications.map((c) => `<div class="manager-item"><div class="manager-item-main">${c.file ? '<span class="status-dot"></span>' : ""}<div><b>${esc(c.title)}</b><br><small>${esc(c.issuer)} · ${esc(c.year)}</small></div></div><div class="manager-actions"><button onclick="editCert('${esc(c.id)}')">Edit</button><button class="danger" onclick="deleteCert('${esc(c.id)}')">Delete</button></div></div>`).join("")}</div>${certForm()}<div class="manager-tip">Tip: PDF, JPG and PNG certificates are supported. Recruiters can open each file directly from the public portfolio.</div>`;
    $("#certForm").onsubmit = saveCert;
  } else if (tab === "projects") {
    box.innerHTML =
      managerHeader(
        "Project Library",
        "Add unlimited projects. Each project can have a dashboard screenshot, GitHub URL and live demo.",
      ) +
      `<div class="manager-toolbar"><button class="manager-secondary" onclick="signOutAdmin()">Sign Out</button><button class="manager-secondary" onclick="seedDefaultContent()">Seed Default Content</button></div><div class="manager-list">${D.projects.map((p) => `<div class="manager-item"><div class="manager-item-main">${p.image ? '<span class="status-dot"></span>' : ""}<div><b>${esc(p.title)}</b><br><small>${esc((p.tech || []).join(" · "))}</small></div></div><div class="manager-actions"><button onclick="editProject('${esc(p.id)}')">Edit</button><button class="danger" onclick="deleteProject('${esc(p.id)}')">Delete</button></div></div>`).join("")}</div>${projectForm()}<div class="manager-tip">Keep the card description short; use the detailed fields for the case-study modal.</div>`;
    $("#projectForm").onsubmit = saveProject;
  } else if (tab === "profile") {
    const p = D.personal || {};
    box.innerHTML =
      managerHeader(
        "Profile & Resume",
        "Update your profile, social links, photo and resume from any device after signing in.",
      ) +
      `<div class="manager-toolbar"><button class="manager-secondary" onclick="signOutAdmin()">Sign Out</button></div><form id="profileForm" class="manager-form"><input name="name" required value="${esc(p.name)}" placeholder="Name"><input name="role" required value="${esc(p.role)}" placeholder="Role"><input name="tagline" value="${esc(p.tagline)}" placeholder="Tagline"><input name="location" value="${esc(p.location)}" placeholder="Location"><input name="phone" value="${esc(p.phone)}" placeholder="Phone"><input name="email" type="email" value="${esc(p.email)}" placeholder="Email"><input name="linkedin" value="${esc(p.linkedin)}" placeholder="LinkedIn URL"><input name="github" value="${esc(p.github)}" placeholder="GitHub URL"><input name="portfolio" value="${esc(p.portfolio)}" placeholder="Portfolio URL"><label class="upload-box">Profile photo<input name="photo" type="file" accept="image/*"><small>${p.photoUrl ? "Current photo uploaded. Choose another to replace it." : "Choose a professional profile photo."}</small></label><label class="upload-box">Resume PDF<input name="resume" type="file" accept="application/pdf,.pdf"><small>${p.resumeUrl ? "Current resume uploaded. Choose another PDF to replace it." : "Upload your current resume PDF."}</small></label><div class="form-actions"><button class="btn primary">Save Profile</button></div></form>`;
    $("#profileForm").onsubmit = saveProfile;
  } else if (tab === "backup") {
    box.innerHTML =
      managerHeader(
        "Cloud Backup",
        "Your portfolio content is already stored in Supabase. Use the export button for an extra JSON backup.",
      ) +
      `<div class="backup-actions"><button class="btn primary" onclick="downloadCloudBackup()">Download Cloud Backup</button><button class="manager-secondary" onclick="signOutAdmin()">Sign Out</button></div><div class="manager-tip">Database records live in Supabase PostgreSQL and uploaded media lives in Supabase Storage. This is cross-device; the browser is no longer the source of truth.</div>`;
  }
};

window.downloadCloudBackup = () => {
  const payload = {
    profile: D.personal,
    projects: D.projects,
    certifications: D.certifications,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "manish-portfolio-supabase-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

async function verifyAdmin(user) {
  if (!user || !supabaseClient) return false;
  const { data, error } = await supabaseClient
    .from("portfolio_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("Admin verification:", error);
    return false;
  }
  return Boolean(data);
}
async function login(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: String(f.get("email")).trim(),
    password: String(f.get("password")),
  });
  if (error) {
    showToast(error.message, "error");
    return;
  }
  currentUser = data.user;
  adminVerified = await verifyAdmin(currentUser);
  if (!adminVerified) {
    await supabaseClient.auth.signOut();
    currentUser = null;
    showToast(
      "Admin access is not set up for this account. Add its email in the portfolio_admins block in supabase-schema.sql, run that SQL in Supabase, then sign in again.",
      "error",
    );
    return;
  }
  await renderManager("certs");
  showToast("Signed in successfully.");
}
window.signOutAdmin = async () => {
  await supabaseClient.auth.signOut();
  currentUser = null;
  adminVerified = false;
  renderManager("certs");
  showToast("Signed out.");
};

async function initAuth() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user || null;
  adminVerified = currentUser ? await verifyAdmin(currentUser) : false;
  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    adminVerified = currentUser ? await verifyAdmin(currentUser) : false;
  });
}

$("#openManager").onclick = () => {
  openModal("#managerModal");
  renderManager("certs");
};
$$("[data-tab]").forEach(
  (b) =>
    (b.onclick = () => {
      $$("[data-tab]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      renderManager(b.dataset.tab);
    }),
);

async function submitContact(e) {
  e.preventDefault();
  if (!supabaseClient) {
    alert("Contact form is not configured yet. Please email me directly.");
    return;
  }
  const f = new FormData(e.target);
  const payload = {
    name: String(f.get("name")).trim(),
    email: String(f.get("email")).trim(),
    subject: String(f.get("subject")).trim(),
    message: String(f.get("message")).trim(),
  };
  const { error } = await supabaseClient
    .from("contact_messages")
    .insert(payload);
  if (error) {
    showToast(error.message, "error");
    return;
  }
  e.target.reset();
  showToast("Message sent successfully. Thank you!");
}
const contactForm = $(".contact-form");
if (contactForm) contactForm.onsubmit = submitContact;

async function init() {
  fallbackData();
  $("#year").textContent = new Date().getFullYear();
  if (hasSupabaseConfig) {
    await loadPortfolioFromSupabase();
    await initAuth();
  } else {
    showToast(
      "Supabase is not configured yet. The site is showing default data.",
      "error",
    );
  }
  await refresh();
  setTimeout(() => ($("#loader").style.display = "none"), 500);
}
init();

const SUPABASE_URL = "https://lagkkzzqjuwfevoceiaw.supabase.co";
const SUPABASE_KEY = "sb_publishable_XLH_4Q9-E7JDxmrDwrQSgQ_kBktuLwM";

const configured =
  !SUPABASE_URL.startsWith("YOUR_") &&
  !SUPABASE_KEY.startsWith("YOUR_");

const sb = configured
  ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const app = document.getElementById("app");

let user = null;
let profile = null;
let family = null;
let pregnancy = null;

let view = "home";
let date = new Date();
let filter = "all";

const poop = {
  korokoro: ["コロコロ", "🟤", "koro"],
  banana: ["バナナ", "🍌", "banana"],
  bechabecha: ["ベチャベチャ", "💩", "becha"],
  liquid: ["液体", "💧", "liquid"]
};

const icons = {
  poop: "💩",
  medicine: "💊",
  vomit: "🤢",
  weight: "⚖️",
  period: "🌸",
  note: "📝"
};


/* =========================================================
   ファニーCSS
========================================================= */

function ensureFunnyStyles() {

  if (document.getElementById("funny-app-style")) return;

  const style = document.createElement("style");

  style.id = "funny-app-style";

  style.textContent = `

    body {
      overflow-x:hidden;
    }

    .funny-pop {
      animation: funnyPop .35s ease;
    }

    @keyframes funnyPop {
      0% { transform:scale(.75) rotate(-4deg); opacity:.2; }
      70% { transform:scale(1.08) rotate(2deg); }
      100% { transform:scale(1) rotate(0); opacity:1; }
    }

    .poop {
      position:relative;
      overflow:hidden;
    }

    .poop .emoji {
      transition:transform .15s ease;
    }

    .poop:active .emoji {
      transform:scale(1.5) rotate(15deg);
    }

    .splash {
      position:absolute;
      inset:0;
      pointer-events:none;
      overflow:visible;
    }

    .splash i {
      position:absolute;
      left:50%;
      top:50%;
      width:13px;
      height:13px;
      background:#8b5a3c;
      border-radius:50%;
      transform:translate(-50%,-50%) scale(0);
      opacity:0;
    }

    .splash.active i:nth-child(1) {
      animation:splash1 .7s ease-out;
    }

    .splash.active i:nth-child(2) {
      animation:splash2 .7s ease-out;
    }

    .splash.active i:nth-child(3) {
      animation:splash3 .7s ease-out;
    }

    .splash.active i:nth-child(4) {
      animation:splash4 .7s ease-out;
    }

    .splash.active i:nth-child(5) {
      animation:splash5 .7s ease-out;
    }

    .splash.active i:nth-child(6) {
      animation:splash6 .7s ease-out;
    }

    @keyframes splash1 {
      to {
        transform:translate(-100px,-90px) scale(1);
        opacity:0;
      }
    }

    @keyframes splash2 {
      to {
        transform:translate(100px,-80px) scale(.7);
        opacity:0;
      }
    }

    @keyframes splash3 {
      to {
        transform:translate(-120px,30px) scale(.9);
        opacity:0;
      }
    }

    @keyframes splash4 {
      to {
        transform:translate(110px,45px) scale(.6);
        opacity:0;
      }
    }

    @keyframes splash5 {
      to {
        transform:translate(-40px,-120px) scale(.7);
        opacity:0;
      }
    }

    @keyframes splash6 {
      to {
        transform:translate(55px,110px) scale(.8);
        opacity:0;
      }
    }

    .poop-screen {
      position:fixed;
      inset:0;
      z-index:10000;
      pointer-events:none;
      overflow:hidden;
    }

    .flying-poop {
      position:absolute;
      font-size:42px;
      animation:flyPoop 1.1s cubic-bezier(.15,.8,.3,1) forwards;
    }

    @keyframes flyPoop {
      0% {
        transform:translate(-50%,-50%) scale(.2) rotate(0);
        opacity:1;
      }
      70% {
        opacity:1;
      }
      100% {
        transform:
          translate(
            calc(-50% + var(--x)),
            calc(-50% + var(--y))
          )
          scale(var(--s))
          rotate(var(--r));
        opacity:0;
      }
    }

    .edit-btn,
    .delete-btn {
      border:0;
      border-radius:12px;
      padding:7px 10px;
      font-weight:900;
      cursor:pointer;
      margin-left:4px;
    }

    .edit-btn {
      background:#eee7ff;
    }

    .delete-btn {
      background:#ffe1e1;
      color:#b33;
    }

    .entry-actions {
      margin-top:7px;
      display:flex;
      justify-content:flex-end;
    }

    .calendar-event-list {
      margin-top:12px;
    }

    .calendar-event {
      padding:12px;
      border-radius:16px;
      background:#faf7ff;
      margin:7px 0;
      border:2px solid #eee8f8;
      cursor:pointer;
    }

    .calendar-event:hover {
      transform:translateY(-1px);
    }

    .calendar-event.checkup {
      background:#fff3fa;
      border-color:#ffd4e9;
    }

    .doctor-question {
      padding:13px;
      border-radius:17px;
      background:#faf7ff;
      margin:8px 0;
      border:2px solid #eee8f8;
    }

    .doctor-question.done {
      opacity:.6;
    }

    .doctor-question.done .question-text {
      text-decoration:line-through;
    }

    .mini-actions {
      display:flex;
      justify-content:flex-end;
      gap:5px;
      flex-wrap:wrap;
      margin-top:7px;
    }

    .mini-btn {
      border:0;
      border-radius:11px;
      padding:6px 9px;
      font-weight:900;
      cursor:pointer;
    }

    .mini-btn.edit {
      background:#eee7ff;
    }

    .mini-btn.delete {
      background:#ffe0e0;
      color:#b33;
    }

    .mini-btn.done {
      background:#e4f8e9;
      color:#286b38;
    }

    .calendar .day {
      min-height:78px;
    }

    .calendar .dot {
      display:inline-block;
      font-size:15px;
      margin:1px;
    }

    .calendar-event-title {
      font-weight:1000;
      font-size:16px;
    }

    .calendar-event-time {
      font-size:12px;
      color:#8e8296;
      margin-top:3px;
    }

    .record-detail {
      margin-top:4px;
      font-size:12px;
      color:#8e8296;
    }

    .funny-title {
      font-size:28px;
      font-weight:1000;
      text-align:center;
      margin:8px 0 16px;
    }

    .empty-funny {
      text-align:center;
      padding:25px 10px;
      color:#9b8da3;
      font-weight:900;
    }

  `;

  document.head.appendChild(style);
}


/* =========================================================
   共通
========================================================= */

const esc = s =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const dk = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmt = s => {

  if (!s) return "-";

  const d = new Date(s + "T00:00:00");

  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const tm = s =>
  new Date(s).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit"
  });

const dateTimeLocal = s => {

  if (!s) return "";

  const d = new Date(s);

  const pad = n =>
    String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function flash(text) {

  const x = document.createElement("div");

  x.textContent = text;

  x.style = `
    position:fixed;
    z-index:99999;
    left:50%;
    top:18px;
    transform:translateX(-50%);
    background:#392d42;
    color:#fff;
    padding:12px 18px;
    border-radius:18px;
    font-weight:900;
    box-shadow:0 8px 25px #0003;
    max-width:90%;
    text-align:center;
  `;

  document.body.appendChild(x);

  setTimeout(() => x.remove(), 2400);
}


function modal(title, html) {

  const o = document.createElement("div");

  o.className = "overlay";

  o.innerHTML = `
    <div class="modal">

      <button
        class="close"
        onclick="this.closest('.overlay').remove()"
      >×</button>

      <h2>${title}</h2>

      ${html}

    </div>
  `;

  o.onclick = e => {

    if (e.target === o) {
      o.remove();
    }

  };

  document.body.appendChild(o);
}


function closeModal() {
  document.querySelector(".overlay")?.remove();
}


function askDelete(message, callback) {

  if (
    confirm(
      message ||
      "この記録を削除しますか？"
    )
  ) {
    callback();
  }
}


/* =========================================================
   ウンチ画面演出
========================================================= */

function poopExplosion() {

  const screen =
    document.createElement("div");

  screen.className = "poop-screen";

  for (let i = 0; i < 28; i++) {

    const p =
      document.createElement("div");

    p.className = "flying-poop";

    p.textContent =
      ["💩", "🟤", "💩", "💩"][Math.floor(Math.random() * 4)];

    p.style.left =
      `${50 + (Math.random() * 10 - 5)}%`;

    p.style.top =
      `${50 + (Math.random() * 10 - 5)}%`;

    p.style.setProperty(
      "--x",
      `${Math.random() * 220 - 110}vw`
    );

    p.style.setProperty(
      "--y",
      `${Math.random() * 180 - 90}vh`
    );

    p.style.setProperty(
      "--s",
      `${0.5 + Math.random() * 1.5}`
    );

    p.style.setProperty(
      "--r",
      `${Math.random() * 1000 - 500}deg`
    );

    p.style.animationDelay =
      `${Math.random() * .18}s`;

    screen.appendChild(p);
  }

  document.body.appendChild(screen);

  setTimeout(
    () => screen.remove(),
    1500
  );
}


/* =========================================================
   起動
========================================================= */

async function boot() {

  ensureFunnyStyles();

  if (!configured) {
    config();
    return;
  }

  const {
    data: { session }
  } = await sb.auth.getSession();

  user = session?.user || null;

  if (!user) {
    auth();
    return;
  }

  await loadProfile();

  if (!profile) {
    onboarding();
    return;
  }

  await loadFamily();

  render();
}


/* =========================================================
   プロフィール
========================================================= */

async function loadProfile() {

  const {
    data,
    error
  } =
    await sb
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

  if (error) {

    console.error(error);

    profile = null;

    return;
  }

  profile = data;
}


/* =========================================================
   家族・妊娠
========================================================= */

async function loadFamily() {

  if (!profile?.family_id) {

    family = null;
    pregnancy = null;

    return;
  }

  const {
    data: f
  } =
    await sb
      .from("families")
      .select("*")
      .eq("id", profile.family_id)
      .maybeSingle();

  family = f || null;


  const {
    data: pregnancies
  } =
    await sb
      .from("pregnancies")
      .select("*")
      .eq(
        "family_id",
        profile.family_id
      )
      .order(
        "due_date",
        { ascending: false }
      )
      .limit(1);

  pregnancy =
    pregnancies?.[0] || null;
}


/* =========================================================
   設定エラー
========================================================= */

function config() {

  app.innerHTML = `
    <div class="auth">

      <div class="auth-card">

        <h1>🌈 💩＆💊</h1>

        <div class="notice">
          Supabase設定が必要です
        </div>

        <p class="hint">
          app.js冒頭のSUPABASE_URLとSUPABASE_KEYを設定してください。
        </p>

      </div>

    </div>
  `;
}


/* =========================================================
   ログイン
========================================================= */

function auth() {

  app.innerHTML = `
    <div class="auth">

      <div class="auth-card">

        <h1>💩＆💊</h1>

        <p style="text-align:center;font-weight:900">
          タカちゃん × オタヤダ
        </p>

        <div class="form-grid">

          <input
            id="email"
            class="input"
            type="email"
            placeholder="メールアドレス"
          >

          <input
            id="pass"
            class="input"
            type="password"
            placeholder="パスワード"
          >

          <button
            class="btn primary"
            onclick="login()"
          >
            ログイン
          </button>

          <button
            class="btn soft"
            onclick="signup()"
          >
            新規登録
          </button>

        </div>

      </div>

    </div>
  `;
}


async function login() {

  const emailValue =
    document
      .getElementById("email")
      ?.value
      .trim();

  const passValue =
    document
      .getElementById("pass")
      ?.value;

  if (!emailValue || !passValue) {

    flash(
      "メールアドレスとパスワードを入力してください"
    );

    return;
  }

  const { error } =
    await sb.auth.signInWithPassword({
      email: emailValue,
      password: passValue
    });

  if (error) {

    flash(error.message);

    return;
  }

  await boot();
}


async function signup() {

  const emailValue =
    document
      .getElementById("email")
      ?.value
      .trim();

  const passValue =
    document
      .getElementById("pass")
      ?.value;

  if (!emailValue || !passValue) {

    flash(
      "メールアドレスとパスワードを入力してください"
    );

    return;
  }

  const {
    data,
    error
  } =
    await sb.auth.signUp({
      email: emailValue,
      password: passValue
    });

  if (error) {

    flash(error.message);

    return;
  }

  user = data.user;

  if (user) {
    onboarding();
  }
}


/* =========================================================
   初回登録
========================================================= */

function onboarding() {

  app.innerHTML = `
    <div class="auth">

      <div class="auth-card">

        <h1>🌈 はじめよう</h1>

        <p class="hint">
          最初に登録する人が家族を作ります。<br>
          もう一人は後から招待コードで参加できます。
        </p>

        <div class="form-grid">

          <input
            id="name"
            class="input"
            placeholder="表示名（タカちゃん / オタヤダ）"
          >

          <select id="role" class="input">

            <option value="wife">
              👩 妻
            </option>

            <option value="husband">
              👨 夫
            </option>

          </select>

          <input
            id="due"
            class="input"
            type="date"
            value="2027-01-07"
          >

          <button
            class="btn primary"
            onclick="createFamily()"
          >
            👩‍❤️‍👨 家族を作って開始
          </button>

          <div style="
            text-align:center;
            font-weight:900;
            color:#9b8da3;
          ">
            または
          </div>

          <input
            id="inviteCode"
            class="input"
            placeholder="招待コード 6文字"
            maxlength="6"
            style="text-transform:uppercase"
          >

          <button
            class="btn pink"
            onclick="joinFamily()"
          >
            🔗 招待コードで参加
          </button>

        </div>

      </div>

    </div>
  `;
}


/* =========================================================
   家族作成
========================================================= */

async function createFamily() {

  const n =
    document
      .getElementById("name")
      ?.value
      .trim();

  const r =
    document
      .getElementById("role")
      ?.value;

  const d =
    document
      .getElementById("due")
      ?.value;

  if (!n || !d) {

    flash(
      "名前と予定日を入力してください"
    );

    return;
  }

  const inviteCode =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();


  const {
    data: f,
    error: familyError
  } =
    await sb
      .from("families")
      .insert({
        family_name:
          "タカちゃん＆オタヤダ",
        invite_code:
          inviteCode
      })
      .select()
      .single();

  if (familyError) {

    flash(familyError.message);

    return;
  }


  const {
    error: profileError
  } =
    await sb
      .from("profiles")
      .insert({
        id: user.id,
        family_id: f.id,
        display_name: n,
        role: r
      });

  if (profileError) {

    flash(profileError.message);

    return;
  }


  const {
    error: pregnancyError
  } =
    await sb
      .from("pregnancies")
      .insert({
        family_id: f.id,
        mother_profile_id:
          r === "wife"
            ? user.id
            : null,
        due_date: d
      });

  if (pregnancyError) {

    console.warn(
      "pregnancy insert:",
      pregnancyError
    );
  }


  await loadProfile();
  await loadFamily();

  flash("🎉 家族を作りました！");

  render();
}


/* =========================================================
   家族参加
========================================================= */

async function joinFamily() {

  const code =
    document
      .getElementById("inviteCode")
      ?.value
      .trim()
      .toUpperCase();

  const n =
    document
      .getElementById("name")
      ?.value
      .trim();

  const r =
    document
      .getElementById("role")
      ?.value;

  if (!n) {

    flash(
      "表示名を入力してください"
    );

    return;
  }

  if (!code || code.length !== 6) {

    flash(
      "6文字の招待コードを入力してください"
    );

    return;
  }

  const {
    data: f,
    error
  } =
    await sb
      .from("families")
      .select("*")
      .eq(
        "invite_code",
        code
      )
      .maybeSingle();

  if (error || !f) {

    flash(
      "招待コードが見つかりません"
    );

    return;
  }


  const {
    error: profileError
  } =
    await sb
      .from("profiles")
      .insert({
        id: user.id,
        family_id: f.id,
        display_name: n,
        role: r
      });

  if (profileError) {

    flash(
      profileError.message
    );

    return;
  }

  await loadProfile();
  await loadFamily();

  flash(
    "👩‍❤️‍👨 家族に参加しました！"
  );

  render();
}


/* =========================================================
   招待
========================================================= */

async function showInvite() {

  if (!family) {

    flash(
      "家族情報がありません"
    );

    return;
  }

  let code =
    family.invite_code;

  if (!code) {

    code =
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const { error } =
      await sb
        .from("families")
        .update({
          invite_code: code
        })
        .eq(
          "id",
          family.id
        );

    if (error) {

      flash(error.message);

      return;
    }

    family.invite_code =
      code;
  }


  modal(
    "👩‍❤️‍👨 家族に招待",
    `

      <div
        style="
          font-size:42px;
          letter-spacing:8px;
          font-weight:1000;
          text-align:center;
          background:#f1eaff;
          border-radius:20px;
          padding:20px;
          margin:12px 0;
        "
      >
        ${esc(code)}
      </div>

      <button
        class="btn primary"
        style="width:100%"
        onclick="copyInvite('${esc(code)}')"
      >
        📋 招待コードをコピー
      </button>

      <button
        class="btn soft"
        style="width:100%;margin-top:8px"
        onclick="shareInvite('${esc(code)}')"
      >
        📤 共有する
      </button>

    `
  );
}


async function copyInvite(code) {

  try {

    await navigator.clipboard.writeText(code);

    flash(
      "📋 コピーしました！"
    );

  } catch {

    flash(
      "コード：" + code
    );
  }
}


async function shareInvite(code) {

  const text =
    `💩＆💊 体調・服薬記録アプリ\n\n` +
    `家族招待コード：${code}`;

  if (navigator.share) {

    try {

      await navigator.share({
        title: "💩＆💊 家族招待",
        text
      });

    } catch {}

  } else {

    await copyInvite(code);
  }
}


/* =========================================================
   Health Record
========================================================= */

async function hr(
  type,
  comment = "",
  recordedAt = null
) {

  const {
    data,
    error
  } =
    await sb
      .from("health_records")
      .insert({
        family_id:
          profile.family_id,
        profile_id:
          user.id,
        record_type:
          type,
        recorded_at:
          recordedAt ||
          new Date().toISOString(),
        comment
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data;
}


/* =========================================================
   💩 ウンチ
========================================================= */

async function poopAdd(
  type,
  button
) {

  const splash =
    button?.querySelector(".splash");

  if (splash) {

    splash.classList.remove("active");

    void splash.offsetWidth;

    splash.classList.add("active");
  }

  poopExplosion();

  const comment =
    prompt(
      "💬 ウンチへのコメント（任意）"
    ) ?? "";

  try {

    const record =
      await hr(
        "poop",
        comment
      );

    const {
      error
    } =
      await sb
        .from("poop_records")
        .insert({
          health_record_id:
            record.id,
          poop_type:
            type,
          comment
        });

    if (error) {
      throw error;
    }

    flash(
      "💩 ブワァァァ！！記録したよ！"
    );

    render();

  } catch (e) {

    console.error(e);

    flash(
      "記録できませんでした：" +
      e.message
    );
  }
}


/* =========================================================
   💊 薬一覧
========================================================= */

async function meds() {

  const {
    data,
    error
  } =
    await sb
      .from("medications")
      .select("*")
      .eq(
        "family_id",
        profile.family_id
      )
      .eq(
        "is_active",
        true
      )
      .order(
        "created_at"
      );

  if (error) {

    console.error(error);

    return [];
  }

  return data || [];
}


/* =========================================================
   💊 服薬
========================================================= */

async function medAddById(id) {

  const {
    data: medicine,
    error
  } =
    await sb
      .from("medications")
      .select("*")
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error || !medicine) {

    flash(
      "薬が見つかりません"
    );

    return;
  }

  medAdd(
    medicine.id,
    medicine.name,
    medicine.icon || "💊"
  );
}


async function medAdd(
  id,
  name,
  icon
) {

  try {

    const record =
      await hr(
        "medicine"
      );

    const {
      error
    } =
      await sb
        .from("medication_logs")
        .insert({
          health_record_id:
            record.id,
          medication_id:
            id
        });

    if (error) {
      throw error;
    }

    flash(
      `${icon} ${name}を飲んだ！`
    );

    render();

  } catch (e) {

    flash(
      "服薬記録に失敗：" +
      e.message
    );
  }
}


/* =========================================================
   💊 サプリ追加
========================================================= */

function addMed() {

  modal(
    "💊 薬・サプリを追加",
    `

      <div class="form-grid">

        <input
          id="mn"
          class="input"
          placeholder="例：葉酸サプリ"
        >

        <input
          id="mi"
          class="input"
          value="💊"
          placeholder="アイコン"
        >

        <input
          id="md"
          class="input"
          placeholder="メモ（任意）"
        >

        <button
          class="btn primary"
          onclick="saveMed()"
        >
          💊 追加する
        </button>

      </div>

    `
  );
}


async function saveMed() {

  const name =
    document
      .getElementById("mn")
      ?.value
      .trim();

  const icon =
    document
      .getElementById("mi")
      ?.value ||
    "💊";

  const description =
    document
      .getElementById("md")
      ?.value ||
    "";

  if (!name) {

    flash(
      "薬・サプリ名を入力してください"
    );

    return;
  }

  const {
    error
  } =
    await sb
      .from("medications")
      .insert({
        family_id:
          profile.family_id,
        name,
        icon,
        description,
        is_active: true
      });

  if (error) {

    flash(
      error.message
    );

    return;
  }

  closeModal();

  flash(
    "💊 追加しました"
  );

  render();
}


/* =========================================================
   💊 サプリ編集
========================================================= */

function editMed(id) {

  loadMedicationForEdit(id);
}


async function loadMedicationForEdit(id) {

  const {
    data,
    error
  } =
    await sb
      .from("medications")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (error || !data) {

    flash(
      "薬が見つかりません"
    );

    return;
  }

  modal(
    "✏️ 薬・サプリを編集",
    `

      <div class="form-grid">

        <input
          id="editMn"
          class="input"
          value="${esc(data.name)}"
        >

        <input
          id="editMi"
          class="input"
          value="${esc(data.icon || "💊")}"
        >

        <input
          id="editMd"
          class="input"
          value="${esc(data.description || "")}"
        >

        <button
          class="btn primary"
          onclick="updateMed('${id}')"
        >
          💾 保存
        </button>

        <button
          class="btn danger"
          onclick="deleteMed('${id}')"
        >
          🗑️ この薬・サプリを削除
        </button>

      </div>

    `
  );
}


async function updateMed(id) {

  const name =
    document
      .getElementById("editMn")
      ?.value
      .trim();

  const icon =
    document
      .getElementById("editMi")
      ?.value ||
    "💊";

  const description =
    document
      .getElementById("editMd")
      ?.value ||
    "";

  if (!name) {

    flash(
      "名前を入力してください"
    );

    return;
  }

  const {
    error
  } =
    await sb
      .from("medications")
      .update({
        name,
        icon,
        description
      })
      .eq(
        "id",
        id
      );

  if (error) {

    flash(
      error.message
    );

    return;
  }

  closeModal();

  flash(
    "💊 更新しました"
  );

  render();
}


async function deleteMed(id) {

  askDelete(
    "この薬・サプリを削除しますか？\n過去の服薬記録は残ります。",
    async () => {

      const {
        error
      } =
        await sb
          .from("medications")
          .update({
            is_active: false
          })
          .eq(
            "id",
            id
          );

      if (error) {

        flash(
          error.message
        );

        return;
      }

      closeModal();

      flash(
        "🗑️ 削除しました"
      );

      render();
    }
  );
}


/* =========================================================
   🤢 吐いた
========================================================= */

function addVomit() {

  modal(
    "🤢 吐いた記録",
    `

      <div class="form-grid">

        <input
          id="vomitDate"
          class="input"
          type="datetime-local"
          value="${dateTimeLocal(new Date().toISOString())}"
        >

        <select
          id="vomitSeverity"
          class="input"
        >

          <option value="1">
            😌 軽い
          </option>

          <option value="2">
            😐 少しつらい
          </option>

          <option value="3" selected>
            😵 普通
          </option>

          <option value="4">
            😫 かなりつらい
          </option>

          <option value="5">
            🤮 とてもつらい
          </option>

        </select>

        <textarea
          id="vomitComment"
          class="input textarea"
          placeholder="状況・食べたものなど"
        ></textarea>

        <button
          class="btn pink"
          onclick="saveVomit()"
        >
          🤢 記録する
        </button>

      </div>

    `
  );
}


async function saveVomit() {

  const severity =
    Number(
      document
        .getElementById(
          "vomitSeverity"
        )
        ?.value
    );

  const comment =
    document
      .getElementById(
        "vomitComment"
      )
      ?.value ||
    "";

  const dt =
    document
      .getElementById(
        "vomitDate"
      )
      ?.value;

  try {

    const record =
      await hr(
        "vomit",
        comment,
        dt
          ? new Date(dt).toISOString()
          : null
      );

    const {
      error
    } =
      await sb
        .from("vomit_records")
        .insert({
          health_record_id:
            record.id,
          severity,
          comment
        });

    if (error) {
      throw error;
    }

    closeModal();

    flash(
      "🤢 記録したよ"
    );

    render();

  } catch (e) {

    flash(
      "記録できませんでした：" +
      e.message
    );
  }
}


/* =========================================================
   ⚖️ 体重
========================================================= */

function addWeight() {

  modal(
    "⚖️ 体重を記録",
    `

      <div class="form-grid">

        <input
          id="weightDate"
          class="input"
          type="datetime-local"
          value="${dateTimeLocal(new Date().toISOString())}"
        >

        <input
          id="weightValue"
          class="input"
          type="number"
          step="0.1"
          placeholder="kg"
        >

        <input
          id="weightComment"
          class="input"
          placeholder="メモ（任意）"
        >

        <button
          class="btn primary"
          onclick="saveWeight()"
        >
          ⚖️ 保存
        </button>

      </div>

    `
  );
}


async function saveWeight() {

  const weight =
    parseFloat(
      document
        .getElementById(
          "weightValue"
        )
        ?.value
    );

  const comment =
    document
      .getElementById(
        "weightComment"
      )
      ?.value ||
    "";

  const dt =
    document
      .getElementById(
        "weightDate"
      )
      ?.value;

  if (!weight) {

    flash(
      "体重を入力してください"
    );

    return;
  }

  try {

    const record =
      await hr(
        "weight",
        comment,
        dt
          ? new Date(dt).toISOString()
          : null
      );

    const {
      error
    } =
      await sb
        .from("weight_records")
        .insert({
          health_record_id:
            record.id,
          weight_kg:
            weight,
          comment
        });

    if (error) {
      throw error;
    }

    closeModal();

    flash(
      "⚖️ 保存したよ"
    );

    render();

  } catch (e) {

    flash(
      "体重を保存できませんでした：" +
      e.message
    );
  }
}


/* =========================================================
   🌸 生理
========================================================= */

function addPeriod() {

  modal(
    "🌸 生理を記録",
    `

      <div class="form-grid">

        <input
          id="periodDate"
          class="input"
          type="datetime-local"
          value="${dateTimeLocal(new Date().toISOString())}"
        >

        <select
          id="periodType"
          class="input"
        >

          <option value="start">
            🌸 生理開始
          </option>

          <option value="end">
            🌸 生理終了
          </option>

          <option value="pain">
            😖 生理痛
          </option>

        </select>

        <select
          id="periodLevel"
          class="input"
        >

          <option value="1">
            少ない
          </option>

          <option value="2" selected>
            普通
          </option>

          <option value="3">
            多い
          </option>

        </select>

        <textarea
          id="periodComment"
          class="input textarea"
          placeholder="コメント"
        ></textarea>

        <button
          class="btn pink"
          onclick="savePeriod()"
        >
          🌸 記録する
        </button>

      </div>

    `
  );
}


async function savePeriod() {

  const type =
    document
      .getElementById(
        "periodType"
      )
      ?.value;

  const level =
    Number(
      document
        .getElementById(
          "periodLevel"
        )
        ?.value
    );

  const comment =
    document
      .getElementById(
        "periodComment"
      )
      ?.value ||
    "";

  const dt =
    document
      .getElementById(
        "periodDate"
      )
      ?.value;

  try {

    const record =
      await hr(
        "period",
        comment,
        dt
          ? new Date(dt).toISOString()
          : null
      );

    const {
      error
    } =
      await sb
        .from("period_records")
        .insert({
          health_record_id:
            record.id,
          period_type:
            type,
          flow_level:
            level,
          comment
        });

    if (error) {
      throw error;
    }

    closeModal();

    flash(
      "🌸 生理記録を保存しました"
    );

    render();

  } catch (e) {

    console.error(e);

    flash(
      "生理記録に失敗：" +
      e.message
    );
  }
}


/* =========================================================
   📒 今日の記録
========================================================= */

async function dayRecords(
  targetDate
) {

  const {
    data,
    error
  } =
    await sb
      .from("health_records")
      .select(`
        id,
        profile_id,
        record_type,
        recorded_at,
        comment,

        poop_records(
          poop_type,
          comment
        ),

        medication_logs(
          medication_id,
          dose,
          comment,
          medications(
            name,
            icon
          )
        ),

        vomit_records(
          severity,
          comment
        ),

        weight_records(
          weight_kg,
          comment
        ),

        period_records(
          period_type,
          flow_level,
          pain_level,
          comment
        )
      `)
      .eq(
        "family_id",
        profile.family_id
      )
      .gte(
        "recorded_at",
        targetDate +
        "T00:00:00"
      )
      .lt(
        "recorded_at",
        targetDate +
        "T23:59:59.999"
      )
      .order(
        "recorded_at",
        {
          ascending:false
        }
      );

  if (error) {

    console.error(error);

    return [];
  }

  return data || [];
}


/* =========================================================
   📒 記録タイトル
========================================================= */

function recordInfo(record) {

  let name =
    record.record_type;

  let icon =
    icons[
      record.record_type
    ] || "📝";

  let detail = "";


  if (
    record.record_type ===
    "poop"
  ) {

    const map = {
      korokoro:
        ["コロコロ", "🟤"],
      banana:
        ["バナナ", "🍌"],
      bechabecha:
        ["ベチャベチャ", "💩"],
      liquid:
        ["液体", "💧"]
    };

    const value =
      record
        .poop_records?.[0]
        ?.poop_type;

    [name, icon] =
      map[value] ||
      ["ウンチ", "💩"];
  }


  if (
    record.record_type ===
    "medicine"
  ) {

    const medication =
      record
        .medication_logs?.[0]
        ?.medications;

    name =
      medication?.name ||
      "薬";

    icon =
      medication?.icon ||
      "💊";

    const dose =
      record
        .medication_logs?.[0]
        ?.dose;

    if (dose) {
      detail = `量：${esc(dose)}`;
    }
  }


  if (
    record.record_type ===
    "vomit"
  ) {

    name =
      "吐いた";

    const severity =
      record
        .vomit_records?.[0]
        ?.severity;

    if (severity) {
      detail =
        "つらさ：" +
        "★".repeat(severity);
    }
  }


  if (
    record.record_type ===
    "weight"
  ) {

    const value =
      record
        .weight_records?.[0]
        ?.weight_kg;

    name =
      `体重 ${value || "-"}kg`;
  }


  if (
    record.record_type ===
    "period"
  ) {

    const p =
      record
        .period_records?.[0]
        ?.period_type;

    if (p === "start") {
      name = "生理開始";
    }
    else if (p === "end") {
      name = "生理終了";
    }
    else {
      name = "生理痛";
    }

    icon = "🌸";
  }


  return {
    name,
    icon,
    detail
  };
}


/* =========================================================
   📒 記録表示
========================================================= */

function entry(record) {

  const info =
    recordInfo(record);

  return `
    <div class="entry funny-pop">

      <div class="ico">
        ${info.icon}
      </div>

      <div class="meta">

        <b>
          ${esc(info.name)}
        </b>

        <small>
          ${tm(record.recorded_at)}
          ${
            record.comment
              ? "　💬 " +
                esc(record.comment)
              : ""
          }
        </small>

        ${
          info.detail
            ? `
              <div class="record-detail">
                ${info.detail}
              </div>
            `
            : ""
        }

        <div class="entry-actions">

          <button
            class="edit-btn"
            onclick="editHealthRecord('${record.id}')"
          >
            ✏️ 編集
          </button>

          <button
            class="delete-btn"
            onclick="deleteHealthRecord('${record.id}')"
          >
            🗑️ 削除
          </button>

        </div>

      </div>

    </div>
  `;
}


/* =========================================================
   🏠 ホーム
========================================================= */

async function home() {

  const records =
    await dayRecords(
      dk(date)
    );

  const medications =
    await meds();

  const poopCount =
    records.filter(
      x =>
        x.record_type ===
        "poop"
    ).length;

  const medicineCount =
    records.filter(
      x =>
        x.record_type ===
        "medicine"
    ).length;

  const vomitCount =
    records.filter(
      x =>
        x.record_type ===
        "vomit"
    ).length;

  const weight =
    records.find(
      x =>
        x.record_type ===
        "weight"
    )
      ?.weight_records?.[0]
      ?.weight_kg ||
    "-";


  const gestation =
    pregnancy
      ? pregnancyStatus()
      : "妊娠情報なし";


  return `

    <header class="hero">

      <div class="toilet">
        🚽
      </div>

      <h1>
        💩＆くすり記録
      </h1>

      <p>
        タカちゃん × オタヤダ
      </p>

      <div
        class="notice"
        style="
          display:inline-block;
          margin-top:8px;
        "
      >
        🤰 ${gestation}
      </div>

    </header>


    <main class="panel">

      <div class="card datebar">

        <button
          onclick="shiftDate(-1)"
        >
          ‹
        </button>

        <div class="date">
          ${fmt(dk(date))}
        </div>

        <button
          onclick="shiftDate(1)"
        >
          ›
        </button>

        <button
          class="btn soft"
          onclick="go('calendar')"
        >
          📅
        </button>

      </div>


      <div class="stats">

        <div class="stat">
          <b>💩 ${poopCount}</b>
          <small>ウンチ</small>
        </div>

        <div class="stat">
          <b>💊 ${medicineCount}</b>
          <small>薬</small>
        </div>

        <div class="stat">
          <b>🤢 ${vomitCount}</b>
          <small>吐いた</small>
        </div>

        <div class="stat">
          <b>⚖️ ${weight}</b>
          <small>体重</small>
        </div>

      </div>


      <div class="card">

        <div class="section-title">
          💩 ウンチ出た〜！
        </div>

        <div class="poop-grid">

          ${
            Object.entries(poop)
              .map(
                ([key, [name, emoji, css]]) =>
                  `
                    <button
                      class="poop ${css}"
                      onclick="
                        poopAdd(
                          '${key}',
                          this
                        )
                      "
                    >

                      <span class="emoji">
                        ${emoji}
                      </span>

                      <span class="name">
                        ${name}
                      </span>

                      <div class="splash">

                        <i></i>
                        <i></i>
                        <i></i>
                        <i></i>
                        <i></i>
                        <i></i>

                      </div>

                    </button>
                  `
              )
              .join("")
          }

        </div>

      </div>


      <div class="card">

        <div class="section-title">
          💊 飲んだもの
        </div>

        <div class="med-grid">

          ${
            medications
              .map(
                medicine =>
                  `
                    <div
                      style="
                        position:relative;
                        display:flex;
                        flex-direction:column;
                        gap:4px;
                      "
                    >

                      <button
                        class="med"
                        onclick="
                          medAddById(
                            '${medicine.id}'
                          )
                        "
                      >

                        <span class="emoji">
                          ${esc(
                            medicine.icon ||
                            "💊"
                          )}
                        </span>

                        ${esc(
                          medicine.name
                        )}

                      </button>

                      <button
                        class="mini-btn edit"
                        onclick="
                          editMed(
                            '${medicine.id}'
                          )
                        "
                      >
                        ✏️ 編集
                      </button>

                    </div>
                  `
              )
              .join("")
          }


          <button
            class="addmed"
            onclick="addMed()"
          >
            ＋ 薬・サプリを追加
          </button>

        </div>

      </div>


      <div class="quick-grid">

        <button
          class="btn pink"
          onclick="addVomit()"
        >
          🤢 吐いた
        </button>

        <button
          class="btn primary"
          onclick="addWeight()"
        >
          ⚖️ 体重
        </button>

        <button
          class="btn soft"
          onclick="addPeriod()"
        >
          🌸 生理
        </button>

        <button
          class="btn soft"
          onclick="notifyPartner()"
        >
          🔔 オタヤダに知らせる
        </button>

      </div>


      <div class="card">

        <div class="section-title">
          📒 ${fmt(dk(date))}の記録
        </div>

        <div class="list">

          ${
            records.length
              ? records
                  .map(entry)
                  .join("")
              : `
                <div class="empty">
                  まだ記録はないよ〜！
                </div>
              `
          }

        </div>

      </div>


      <div class="card">

        <button
          class="btn primary"
          style="width:100%"
          onclick="go('questions')"
        >
          📝 医師に聞きたいこと
        </button>

      </div>

    </main>

    ${nav("home")}
  `;
}


/* =========================================================
   妊娠ステータス
========================================================= */

function pregnancyStatus() {

  if (!pregnancy) {
    return "妊娠情報なし";
  }

  const due =
    new Date(
      pregnancy.due_date +
      "T00:00:00"
    );

  const start =
    new Date(due);

  start.setDate(
    start.getDate() -
    280
  );

  const days =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          start.getTime()
        ) / 86400000
      )
    );

  return `
    ${Math.floor(days / 7)}週${days % 7}日
  `;
}


/* =========================================================
   日付移動
========================================================= */

function shiftDate(amount) {

  date.setDate(
    date.getDate() +
    amount
  );

  render();
}


/* =========================================================
   📝 Health Record 編集
========================================================= */

async function editHealthRecord(id) {

  const {
    data: record,
    error
  } =
    await sb
      .from("health_records")
      .select(`
        *,
        poop_records(*),
        medication_logs(
          *,
          medications(
            *
          )
        ),
        vomit_records(*),
        weight_records(*),
        period_records(*)
      `)
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error || !record) {

    flash(
      "記録が見つかりません"
    );

    return;
  }


  let body = `
    <input
      id="editRecordDate"
      class="input"
      type="datetime-local"
      value="${dateTimeLocal(record.recorded_at)}"
    >

    <textarea
      id="editRecordComment"
      class="input textarea"
      placeholder="コメント"
    >${esc(record.comment || "")}</textarea>
  `;


  if (
    record.record_type ===
    "poop"
  ) {

    const current =
      record
        .poop_records?.[0]
        ?.poop_type ||
      "banana";

    body += `

      <select
        id="editPoopType"
        class="input"
      >

        ${
          Object.entries(poop)
            .map(
              ([key, [name]]) =>
                `
                  <option
                    value="${key}"
                    ${current === key ? "selected" : ""}
                  >
                    ${name}
                  </option>
                `
            )
            .join("")
        }

      </select>

    `;
  }


  if (
    record.record_type ===
    "medicine"
  ) {

    const currentMedication =
      record
        .medication_logs?.[0]
        ?.medication_id ||
      "";

    const medications =
      await meds();

    body += `

      <select
        id="editMedicationId"
        class="input"
      >

        ${
          medications
            .map(
              m =>
                `
                  <option
                    value="${m.id}"
                    ${
                      m.id ===
                      currentMedication
                        ? "selected"
                        : ""
                    }
                  >
                    ${esc(m.icon || "💊")}
                    ${esc(m.name)}
                  </option>
                `
            )
            .join("")
        }

      </select>

      <input
        id="editDose"
        class="input"
        placeholder="量（任意）"
        value="${esc(
          record
            .medication_logs?.[0]
            ?.dose || ""
        )}"
      >

    `;
  }


  if (
    record.record_type ===
    "vomit"
  ) {

    const severity =
      record
        .vomit_records?.[0]
        ?.severity ||
      3;

    body += `

      <select
        id="editVomitSeverity"
        class="input"
      >

        ${
          [1,2,3,4,5]
            .map(
              n =>
                `
                  <option
                    value="${n}"
                    ${n === severity ? "selected" : ""}
                  >
                    ${"★".repeat(n)}
                  </option>
                `
            )
            .join("")
        }

      </select>

    `;
  }


  if (
    record.record_type ===
    "weight"
  ) {

    body += `

      <input
        id="editWeight"
        class="input"
        type="number"
        step="0.1"
        value="${
          record
            .weight_records?.[0]
            ?.weight_kg || ""
        }"
      >

    `;
  }


  if (
    record.record_type ===
    "period"
  ) {

    const p =
      record
        .period_records?.[0];

    body += `

      <select
        id="editPeriodType"
        class="input"
      >

        <option
          value="start"
          ${p?.period_type === "start" ? "selected" : ""}
        >
          🌸 生理開始
        </option>

        <option
          value="end"
          ${p?.period_type === "end" ? "selected" : ""}
        >
          🌸 生理終了
        </option>

        <option
          value="pain"
          ${p?.period_type === "pain" ? "selected" : ""}
        >
          😖 生理痛
        </option>

      </select>

      <select
        id="editPeriodFlow"
        class="input"
      >

        <option value="1">
          少ない
        </option>

        <option
          value="2"
          ${
            p?.flow_level === 2
              ? "selected"
              : ""
          }
        >
          普通
        </option>

        <option
          value="3"
          ${
            p?.flow_level === 3
              ? "selected"
              : ""
          }
        >
          多い
        </option>

      </select>

    `;
  }


  modal(
    "✏️ 記録を編集",
    `

      <div class="form-grid">

        ${body}

        <button
          class="btn primary"
          onclick="
            updateHealthRecord(
              '${id}',
              '${record.record_type}'
            )
          "
        >
          💾 保存する
        </button>

      </div>

    `
  );
}


/* =========================================================
   Health Record 更新
========================================================= */

async function updateHealthRecord(
  id,
  type
) {

  const dt =
    document
      .getElementById(
        "editRecordDate"
      )
      ?.value;

  const comment =
    document
      .getElementById(
        "editRecordComment"
      )
      ?.value ||
    "";

  if (!dt) {

    flash(
      "日時を入力してください"
    );

    return;
  }


  const {
    error: updateError
  } =
    await sb
      .from("health_records")
      .update({
        recorded_at:
          new Date(dt)
            .toISOString(),
        comment
      })
      .eq(
        "id",
        id
      );

  if (updateError) {

    flash(
      updateError.message
    );

    return;
  }


  let childError = null;


  if (type === "poop") {

    const value =
      document
        .getElementById(
          "editPoopType"
        )
        ?.value;

    const {
      error
    } =
      await sb
        .from("poop_records")
        .update({
          poop_type:
            value,
          comment
        })
        .eq(
          "health_record_id",
          id
        );

    childError = error;
  }


  if (type === "medicine") {

    const medicationId =
      document
        .getElementById(
          "editMedicationId"
        )
        ?.value;

    const dose =
      document
        .getElementById(
          "editDose"
        )
        ?.value ||
      "";

    const {
      error
    } =
      await sb
        .from("medication_logs")
        .update({
          medication_id:
            medicationId,
          dose,
          comment
        })
        .eq(
          "health_record_id",
          id
        );

    childError = error;
  }


  if (type === "vomit") {

    const severity =
      Number(
        document
          .getElementById(
            "editVomitSeverity"
          )
          ?.value
      );

    const {
      error
    } =
      await sb
        .from("vomit_records")
        .update({
          severity,
          comment
        })
        .eq(
          "health_record_id",
          id
        );

    childError = error;
  }


  if (type === "weight") {

    const weight =
      parseFloat(
        document
          .getElementById(
            "editWeight"
          )
          ?.value
      );

    const {
      error
    } =
      await sb
        .from("weight_records")
        .update({
          weight_kg:
            weight,
          comment
        })
        .eq(
          "health_record_id",
          id
        );

    childError = error;
  }


  if (type === "period") {

    const periodType =
      document
        .getElementById(
          "editPeriodType"
        )
        ?.value;

    const flow =
      Number(
        document
          .getElementById(
            "editPeriodFlow"
          )
          ?.value
      );

    const {
      error
    } =
      await sb
        .from("period_records")
        .update({
          period_type:
            periodType,
          flow_level:
            flow,
          comment
        })
        .eq(
          "health_record_id",
          id
        );

    childError = error;
  }


  if (childError) {

    flash(
      childError.message
    );

    return;
  }


  closeModal();

  flash(
    "✏️ 記録を更新しました"
  );

  render();
}


/* =========================================================
   Health Record 削除
========================================================= */

async function deleteHealthRecord(id) {

  askDelete(
    "この記録を削除しますか？",
    async () => {

      try {

        const tables = [
          "poop_records",
          "medication_logs",
          "vomit_records",
          "weight_records",
          "period_records"
        ];

        for (
          const table
          of tables
        ) {

          const {
            error
          } =
            await sb
              .from(table)
              .delete()
              .eq(
                "health_record_id",
                id
              );

          if (error) {
            throw error;
          }
        }


        const {
          error
        } =
          await sb
            .from("health_records")
            .delete()
            .eq(
              "id",
              id
            );

        if (error) {
          throw error;
        }

        flash(
          "🗑️ 削除しました"
        );

        render();

      } catch (e) {

        console.error(e);

        flash(
          "削除できませんでした：" +
          e.message
        );
      }
    }
  );
}


/* =========================================================
   📅 カレンダー
========================================================= */

async function calendar() {

  const year =
    date.getFullYear();

  const month =
    date.getMonth();

  const first =
    new Date(
      year,
      month,
      1
    );

  const start =
    new Date(first);

  start.setDate(
    1 -
    first.getDay()
  );

  const last =
    new Date(
      year,
      month + 1,
      0
    );


  const {
    data: records
  } =
    await sb
      .from("health_records")
      .select(
        "recorded_at,record_type"
      )
      .eq(
        "family_id",
        profile.family_id
      )
      .gte(
        "recorded_at",
        dk(start) +
        "T00:00:00"
      )
      .lte(
        "recorded_at",
        dk(last) +
        "T23:59:59"
      );


  const {
    data: events
  } =
    await sb
      .from("calendar_events")
      .select(`
        id,
        title,
        description,
        start_at,
        end_at,
        event_type,
        is_all_day
      `)
      .eq(
        "family_id",
        profile.family_id
      )
      .gte(
        "start_at",
        dk(start) +
        "T00:00:00+09:00"
      )
      .lte(
        "start_at",
        dk(last) +
        "T23:59:59+09:00"
      )
      .order(
        "start_at"
      );


  const byDate = {};


  (records || [])
    .forEach(record => {

      const key =
        record.recorded_at
          .substring(0,10);

      if (!byDate[key]) {
        byDate[key] = [];
      }

      if (
        filter === "all" ||
        filter ===
          record.record_type
      ) {

        byDate[key]
          .push({
            icon:
              icons[
                record.record_type
              ] ||
              "📝",
            type:
              record.record_type
          });
      }
    });


  (events || [])
    .forEach(event => {

      const key =
        new Date(
          event.start_at
        )
          .toLocaleDateString(
            "sv-SE",
            {
              timeZone:
                "Asia/Tokyo"
            }
          );

      if (!byDate[key]) {
        byDate[key] = [];
      }

      byDate[key].push({
        icon:
          event.event_type ===
          "checkup"
            ? "🏥"
            : "📌",
        type:
          event.event_type
      });
    });


  const cells = [];


  for (
    let i = 0;
    i < 42;
    i++
  ) {

    const d =
      new Date(start);

    d.setDate(
      start.getDate() +
      i
    );

    const key =
      dk(d);

    const types =
      byDate[key] ||
      [];


    cells.push(`
      <button
        class="
          day
          ${d.getMonth() !== month ? "other" : ""}
          ${key === dk(new Date()) ? "today" : ""}
        "
        onclick="
          calendarDayClick(
            '${key}'
          )
        "
      >

        <b>
          ${d.getDate()}
        </b>

        <div>

          ${
            types
              .slice(0,6)
              .map(
                item =>
                  `
                    <span class="dot">
                      ${item.icon}
                    </span>
                  `
              )
              .join("")
          }

        </div>

      </button>
    `);
  }


  const filters = [
    ["all", "すべて"],
    ["poop", "💩"],
    ["medicine", "💊"],
    ["vomit", "🤢"],
    ["weight", "⚖️"],
    ["period", "🌸"]
  ];


  const selectedEvents =
    (events || [])
      .filter(
        e =>
          new Date(
            e.start_at
          )
            .toLocaleDateString(
              "sv-SE",
              {
                timeZone:
                  "Asia/Tokyo"
              }
            ) ===
          dk(date)
      );


  return `

    <header class="hero">

      <div class="toilet">
        📅
      </div>

      <h1>
        カレンダー
      </h1>

      <p>
        💩💊🤢⚖️🌸📌🏥
      </p>

    </header>


    <main class="panel">

      <div class="card datebar">

        <button
          onclick="
            date = new Date(
              year,
              month - 1,
              1
            );
            render()
          "
        >
          ‹
        </button>

        <div class="date">
          ${year}年${month + 1}月
        </div>

        <button
          onclick="
            date = new Date(
              year,
              month + 1,
              1
            );
            render()
          "
        >
          ›
        </button>

      </div>


      <div class="tabs">

        ${
          filters
            .map(
              ([value,label]) =>
                `
                  <button
                    class="
                      tab
                      ${
                        filter === value
                          ? "on"
                          : ""
                      }
                    "
                    onclick="
                      filter='${value}';
                      render()
                    "
                  >
                    ${label}
                  </button>
                `
            )
            .join("")
        }

      </div>


      <div class="card">

        <div class="calendar">

          ${
            ["日","月","火","水","木","金","土"]
              .map(
                x =>
                  `
                    <div class="cal-head">
                      ${x}
                    </div>
                  `
              )
              .join("")
          }

          ${cells.join("")}

        </div>

      </div>


      <div class="card">

        <div class="section-title">
          📌 ${fmt(dk(date))}の予定
        </div>

        ${
          selectedEvents.length
            ? `
              <div class="calendar-event-list">

                ${
                  selectedEvents
                    .map(
                      event =>
                        `
                          <div
                            class="
                              calendar-event
                              ${
                                event.event_type ===
                                "checkup"
                                  ? "checkup"
                                  : ""
                              }
                            "
                            onclick="
                              editCalendarEvent(
                                '${event.id}'
                              )
                            "
                          >

                            <div class="calendar-event-title">

                              ${
                                event.event_type ===
                                "checkup"
                                  ? "🏥 "
                                  : "📌 "
                              }

                              ${esc(
                                event.title
                              )}

                            </div>

                            <div class="calendar-event-time">

                              ${
                                event.is_all_day
                                  ? "終日"
                                  : tm(
                                      event.start_at
                                    )
                              }

                              ${
                                event.description
                                  ? "　" +
                                    esc(
                                      event.description
                                    )
                                  : ""
                              }

                            </div>

                          </div>
                        `
                    )
                    .join("")
                }

              </div>
            `
            : `
              <div class="empty-funny">
                📭 この日の予定はまだないよ！
              </div>
            `
        }


        <button
          class="btn primary"
          style="width:100%;margin-top:10px"
          onclick="
            eventModal(
              '${dk(date)}'
            )
          "
        >
          📌 この日に予定を追加
        </button>

      </div>


      <div class="card">

        <div class="section-title">
          🏥 検診
        </div>

        <button
          class="btn pink"
          style="width:100%"
          onclick="
            checkupModal(
              '${dk(date)}'
            )
          "
        >
          🏥 この日に検診を追加
        </button>

      </div>


      <div class="card">

        <button
          class="btn soft"
          style="width:100%"
          onclick="go('questions')"
        >
          📝 医師に聞きたいこと
        </button>

      </div>

    </main>

    ${nav("calendar")}
  `;
}


/* =========================================================
   カレンダーの日付タップ
========================================================= */

function calendarDayClick(
  key
) {

  date =
    new Date(
      key +
      "T00:00:00"
    );

  modal(
    `${fmt(key)} 📅`,
    `

      <div class="form-grid">

        <button
          class="btn primary"
          onclick="
            closeModal();
            eventModal('${key}')
          "
        >
          📌 予定を追加
        </button>

        <button
          class="btn pink"
          onclick="
            closeModal();
            checkupModal('${key}')
          "
        >
          🏥 検診を追加
        </button>

        <button
          class="btn soft"
          onclick="
            closeModal();
            go('home')
          "
        >
          📒 この日の記録を見る
        </button>

      </div>

    `
  );
}


/* =========================================================
   📌 予定追加
========================================================= */

function eventModal(
  selectedDate = dk(date)
) {

  modal(
    "📌 予定を追加",
    `

      <div class="form-grid">

        <input
          id="eventTitle"
          class="input"
          placeholder="例：病院・買い物・予定"
        >

        <input
          id="eventDate"
          class="input"
          type="date"
          value="${selectedDate}"
        >

        <input
          id="eventTime"
          class="input"
          type="time"
          value="10:00"
        >

        <select
          id="eventType"
          class="input"
        >

          <option value="other">
            📌 その他
          </option>

          <option value="appointment">
            🗓️ 予定
          </option>

          <option value="checkup">
            🏥 検診
          </option>

        </select>

        <textarea
          id="eventComment"
          class="input textarea"
          placeholder="メモ"
        ></textarea>

        <button
          class="btn primary"
          onclick="saveEvent()"
        >
          📌 追加
        </button>

      </div>

    `
  );
}


/* =========================================================
   予定保存
========================================================= */

async function saveEvent() {

  const title =
    document
      .getElementById(
        "eventTitle"
      )
      ?.value
      .trim();

  const eventDate =
    document
      .getElementById(
        "eventDate"
      )
      ?.value;

  const eventTime =
    document
      .getElementById(
        "eventTime"
      )
      ?.value;

  const eventType =
    document
      .getElementById(
        "eventType"
      )
      ?.value ||
    "other";

  const comment =
    document
      .getElementById(
        "eventComment"
      )
      ?.value ||
    "";

  if (!title || !eventDate) {

    flash(
      "予定名と日付を入力してください"
    );

    return;
  }


  const {
    error
  } =
    await sb
      .from("calendar_events")
      .insert({
        family_id:
          profile.family_id,
        created_by:
          user.id,
        title,
        description:
          comment,
        start_at:
          `${eventDate}T${eventTime || "10:00"}:00+09:00`,
        event_type:
          eventType,
        is_all_day:
          false
      });

  if (error) {

    flash(
      "予定を保存できませんでした：" +
      error.message
    );

    return;
  }

  closeModal();

  date =
    new Date(
      eventDate +
      "T00:00:00"
    );

  flash(
    "📌 カレンダーに予定を追加しました！"
  );

  render();
}


/* =========================================================
   📌 予定編集
========================================================= */

async function editCalendarEvent(id) {

  const {
    data,
    error
  } =
    await sb
      .from("calendar_events")
      .select("*")
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error || !data) {

    flash(
      "予定が見つかりません"
    );

    return;
  }


  modal(
    "✏️ 予定を編集",
    `

      <div class="form-grid">

        <input
          id="editEventTitle"
          class="input"
          value="${esc(data.title)}"
        >

        <input
          id="editEventDate"
          class="input"
          type="date"
          value="${new Date(data.start_at).toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"})}"
        >

        <input
          id="editEventTime"
          class="input"
          type="time"
          value="${new Date(data.start_at).toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit",hour12:false})}"
        >

        <select
          id="editEventType"
          class="input"
        >

          <option
            value="other"
            ${
              data.event_type === "other"
                ? "selected"
                : ""
            }
          >
            📌 その他
          </option>

          <option
            value="appointment"
            ${
              data.event_type === "appointment"
                ? "selected"
                : ""
            }
          >
            🗓️ 予定
          </option>

          <option
            value="checkup"
            ${
              data.event_type === "checkup"
                ? "selected"
                : ""
            }
          >
            🏥 検診
          </option>

        </select>

        <textarea
          id="editEventComment"
          class="input textarea"
        >${esc(data.description || "")}</textarea>

        <button
          class="btn primary"
          onclick="
            updateCalendarEvent(
              '${id}'
            )
          "
        >
          💾 保存
        </button>

        <button
          class="btn danger"
          onclick="
            deleteCalendarEvent(
              '${id}'
            )
          "
        >
          🗑️ この予定を削除
        </button>

      </div>

    `
  );
}


async function updateCalendarEvent(id) {

  const title =
    document
      .getElementById(
        "editEventTitle"
      )
      ?.value
      .trim();

  const d =
    document
      .getElementById(
        "editEventDate"
      )
      ?.value;

  const t =
    document
      .getElementById(
        "editEventTime"
      )
      ?.value ||
    "10:00";

  const type =
    document
      .getElementById(
        "editEventType"
      )
      ?.value ||
    "other";

  const description =
    document
      .getElementById(
        "editEventComment"
      )
      ?.value ||
    "";

  if (!title || !d) {

    flash(
      "タイトルと日付を入力してください"
    );

    return;
  }


  const {
    error
  } =
    await sb
      .from("calendar_events")
      .update({
        title,
        description,
        start_at:
          `${d}T${t}:00+09:00`,
        event_type:
          type
      })
      .eq(
        "id",
        id
      );

  if (error) {

    flash(
      error.message
    );

    return;
  }

  closeModal();

  date =
    new Date(
      d +
      "T00:00:00"
    );

  flash(
    "✏️ 予定を更新しました"
  );

  render();
}


async function deleteCalendarEvent(id) {

  askDelete(
    "この予定を削除しますか？",
    async () => {

      const {
        error
      } =
        await sb
          .from("calendar_events")
          .delete()
          .eq(
            "id",
            id
          );

      if (error) {

        flash(
          error.message
        );

        return;
      }

      closeModal();

      flash(
        "🗑️ 予定を削除しました"
      );

      render();
    }
  );
}


/* =========================================================
   🏥 検診
========================================================= */

function checkupModal(
  selectedDate = dk(date)
) {

  modal(
    "🏥 検診記録",
    `

      <div class="form-grid">

        <input
          id="checkupDate"
          class="input"
          type="date"
          value="${selectedDate}"
        >

        <input
          id="checkupTime"
          class="input"
          type="time"
          value="10:00"
        >

        <input
          id="checkupTitle"
          class="input"
          value="妊婦健診"
          placeholder="例：妊婦健診"
        >

        <input
          id="checkupWeek"
          class="input"
          type="number"
          placeholder="妊娠週数（例：20）"
        >

        <input
          id="checkupDay"
          class="input"
          type="number"
          placeholder="妊娠日数（例：3）"
        >

        <input
          id="checkupWeight"
          class="input"
          type="number"
          step="0.1"
          placeholder="体重 kg"
        >

        <input
          id="checkupSys"
          class="input"
          type="number"
          placeholder="血圧 上"
        >

        <input
          id="checkupDia"
          class="input"
          type="number"
          placeholder="血圧 下"
        >

        <textarea
          id="checkupNote"
          class="input textarea"
          placeholder="先生のメモ・検診内容"
        ></textarea>

        <input
          id="nextCheckup"
          class="input"
          type="date"
          placeholder="次回健診"
        >

        <button
          class="btn pink"
          onclick="saveCheckup()"
        >
          🏥 検診を保存
        </button>

      </div>

    `
  );
}


async function saveCheckup() {

  const d =
    document
      .getElementById(
        "checkupDate"
      )
      ?.value;

  const time =
    document
      .getElementById(
        "checkupTime"
      )
      ?.value ||
    "10:00";

  const title =
    document
      .getElementById(
        "checkupTitle"
      )
      ?.value
      .trim() ||
    "妊婦健診";

  const week =
    Number(
      document
        .getElementById(
          "checkupWeek"
        )
        ?.value
    ) || null;

  const day =
    Number(
      document
        .getElementById(
          "checkupDay"
        )
        ?.value
    ) || null;

  const weight =
    parseFloat(
      document
        .getElementById(
          "checkupWeight"
        )
        ?.value
    ) || null;

  const sys =
    Number(
      document
        .getElementById(
          "checkupSys"
        )
        ?.value
    ) || null;

  const dia =
    Number(
      document
        .getElementById(
          "checkupDia"
        )
        ?.value
    ) || null;

  const note =
    document
      .getElementById(
        "checkupNote"
      )
      ?.value ||
    "";

  const next =
    document
      .getElementById(
        "nextCheckup"
      )
      ?.value ||
    null;


  if (!d) {

    flash(
      "検診日を入力してください"
    );

    return;
  }


  try {

    const {
      data: event,
      error: eventError
    } =
      await sb
        .from("calendar_events")
        .insert({
          family_id:
            profile.family_id,
          created_by:
            user.id,
          title,
          description:
            note,
          start_at:
            `${d}T${time}:00+09:00`,
          event_type:
            "checkup",
          is_all_day:
            false
        })
        .select()
        .single();

    if (eventError) {
      throw eventError;
    }


    const {
      error: checkupError
    } =
      await sb
        .from("checkups")
        .insert({
          family_id:
            profile.family_id,
          event_id:
            event.id,
          pregnancy_id:
            pregnancy?.id ||
            null,
          gestational_week:
            week,
          gestational_day:
            day,
          weight_kg:
            weight,
          systolic:
            sys,
          diastolic:
            dia,
          doctor_note:
            note,
          next_checkup_date:
            next
        });

    if (checkupError) {
      throw checkupError;
    }


    closeModal();

    date =
      new Date(
        d +
        "T00:00:00"
      );

    flash(
      "🏥 検診をカレンダーに追加しました！"
    );

    render();

  } catch (e) {

    console.error(e);

    flash(
      "検診を保存できませんでした：" +
      e.message
    );
  }
}


/* =========================================================
   🏥 検診一覧
========================================================= */

async function getCheckups() {

  const {
    data,
    error
  } =
    await sb
      .from("checkups")
      .select(`
        *,
        calendar_events(
          id,
          title,
          description,
          start_at
        )
      `)
      .eq(
        "family_id",
        profile.family_id
      )
      .order(
        "created_at",
        {
          ascending:false
        }
      );

  if (error) {

    console.error(error);

    return [];
  }

  return data || [];
}


/* =========================================================
   🏥 検診編集
========================================================= */

async function editCheckup(id) {

  const {
    data,
    error
  } =
    await sb
      .from("checkups")
      .select(`
        *,
        calendar_events(*)
      `)
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error || !data) {

    flash(
      "検診記録が見つかりません"
    );

    return;
  }


  const event =
    data.calendar_events;


  const localDate =
    new Date(
      event.start_at
    );


  modal(
    "✏️ 検診を編集",
    `

      <div class="form-grid">

        <input
          id="editCheckupDate"
          class="input"
          type="date"
          value="${localDate.toLocaleDateString("sv-SE",{timeZone:"Asia/Tokyo"})}"
        >

        <input
          id="editCheckupTime"
          class="input"
          type="time"
          value="${localDate.toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit",hour12:false})}"
        >

        <input
          id="editCheckupTitle"
          class="input"
          value="${esc(event.title || "妊婦健診")}"
        >

        <input
          id="editCheckupWeek"
          class="input"
          type="number"
          value="${data.gestational_week ?? ""}"
          placeholder="妊娠週数"
        >

        <input
          id="editCheckupDay"
          class="input"
          type="number"
          value="${data.gestational_day ?? ""}"
          placeholder="妊娠日数"
        >

        <input
          id="editCheckupWeight"
          class="input"
          type="number"
          step="0.1"
          value="${data.weight_kg ?? ""}"
          placeholder="体重"
        >

        <input
          id="editCheckupSys"
          class="input"
          type="number"
          value="${data.systolic ?? ""}"
          placeholder="血圧 上"
        >

        <input
          id="editCheckupDia"
          class="input"
          type="number"
          value="${data.diastolic ?? ""}"
          placeholder="血圧 下"
        >

        <textarea
          id="editCheckupNote"
          class="input textarea"
        >${esc(data.doctor_note || "")}</textarea>

        <input
          id="editNextCheckup"
          class="input"
          type="date"
          value="${data.next_checkup_date || ""}"
        >

        <button
          class="btn primary"
          onclick="
            updateCheckup(
              '${id}',
              '${event.id}'
            )
          "
        >
          💾 保存
        </button>

        <button
          class="btn danger"
          onclick="
            deleteCheckup(
              '${id}',
              '${event.id}'
            )
          "
        >
          🗑️ 検診を削除
        </button>

      </div>

    `
  );
}


/* =========================================================
   検診更新
========================================================= */

async function updateCheckup(
  id,
  eventId
) {

  const d =
    document
      .getElementById(
        "editCheckupDate"
      )
      ?.value;

  const time =
    document
      .getElementById(
        "editCheckupTime"
      )
      ?.value ||
    "10:00";

  const title =
    document
      .getElementById(
        "editCheckupTitle"
      )
      ?.value
      .trim() ||
    "妊婦健診";

  const week =
    Number(
      document
        .getElementById(
          "editCheckupWeek"
        )
        ?.value
    ) || null;

  const day =
    Number(
      document
        .getElementById(
          "editCheckupDay"
        )
        ?.value
    ) || null;

  const weight =
    parseFloat(
      document
        .getElementById(
          "editCheckupWeight"
        )
        ?.value
    ) || null;

  const sys =
    Number(
      document
        .getElementById(
          "editCheckupSys"
        )
        ?.value
    ) || null;

  const dia =
    Number(
      document
        .getElementById(
          "editCheckupDia"
        )
        ?.value
    ) || null;

  const note =
    document
      .getElementById(
        "editCheckupNote"
      )
      ?.value ||
    "";

  const next =
    document
      .getElementById(
        "editNextCheckup"
      )
      ?.value ||
    null;


  if (!d) {

    flash(
      "検診日を入力してください"
    );

    return;
  }


  const {
    error: eventError
  } =
    await sb
      .from("calendar_events")
      .update({
        title,
        description:
          note,
        start_at:
          `${d}T${time}:00+09:00`,
        event_type:
          "checkup"
      })
      .eq(
        "id",
        eventId
      );

  if (eventError) {

    flash(
      eventError.message
    );

    return;
  }


  const {
    error
  } =
    await sb
      .from("checkups")
      .update({
        gestational_week:
          week,
        gestational_day:
          day,
        weight_kg:
          weight,
        systolic:
          sys,
        diastolic:
          dia,
        doctor_note:
          note,
        next_checkup_date:
          next
      })
      .eq(
        "id",
        id
      );

  if (error) {

    flash(
      error.message
    );

    return;
  }


  closeModal();

  date =
    new Date(
      d +
      "T00:00:00"
    );

  flash(
    "🏥 検診を更新しました"
  );

  render();
}


/* =========================================================
   🏥 検診削除
========================================================= */

async function deleteCheckup(
  id,
  eventId
) {

  askDelete(
    "この検診記録とカレンダー予定を削除しますか？",
    async () => {

      try {

        const {
          error: cError
        } =
          await sb
            .from("checkups")
            .delete()
            .eq(
              "id",
              id
            );

        if (cError) {
          throw cError;
        }


        const {
          error: eError
        } =
          await sb
            .from("calendar_events")
            .delete()
            .eq(
              "id",
              eventId
            );

        if (eError) {
          throw eError;
        }

        closeModal();

        flash(
          "🗑️ 検診を削除しました"
        );

        render();

      } catch (e) {

        flash(
          "削除できませんでした：" +
          e.message
        );
      }
    }
  );
}


/* =========================================================
   📝 医師に聞きたいこと
========================================================= */

async function questions() {

  const {
    data,
    error
  } =
    await sb
      .from("doctor_questions")
      .select("*")
      .eq(
        "family_id",
        profile.family_id
      )
      .order(
        "is_done",
        {
          ascending:true
        }
      )
      .order(
        "created_at",
        {
          ascending:false
        }
      );

  if (error) {

    flash(
      error.message
    );

    return `
      ${nav("questions")}
    `;
  }


  return `

    <header class="hero">

      <div class="toilet">
        🩺
      </div>

      <h1>
        📝 医師に聞きたいこと
      </h1>

      <p>
        健診前にメモしておこう！
      </p>

    </header>


    <main class="panel">

      <div class="card">

        <button
          class="btn primary"
          style="width:100%"
          onclick="addQuestion()"
        >
          ＋ 質問を追加
        </button>

      </div>


      <div class="card">

        ${
          data?.length
            ? data
                .map(
                  q =>
                    `
                      <div
                        class="
                          doctor-question
                          ${
                            q.is_done
                              ? "done"
                              : ""
                          }
                        "
                      >

                        <div
                          class="question-text"
                          style="
                            font-weight:1000;
                            font-size:16px;
                          "
                        >
                          ❓ ${esc(q.question)}
                        </div>

                        ${
                          q.answered_note
                            ? `
                              <div
                                style="
                                  margin-top:8px;
                                  font-size:13px;
                                "
                              >
                                💬
                                ${esc(
                                  q.answered_note
                                )}
                              </div>
                            `
                            : ""
                        }

                        <div class="mini-actions">

                          <button
                            class="mini-btn done"
                            onclick="
                              toggleQuestion(
                                '${q.id}',
                                ${!q.is_done}
                              )
                            "
                          >
                            ${
                              q.is_done
                                ? "↩️ 未完了"
                                : "✅ 完了"
                            }
                          </button>

                          <button
                            class="mini-btn edit"
                            onclick="
                              editQuestion(
                                '${q.id}'
                              )
                            "
                          >
                            ✏️ 編集
                          </button>

                          <button
                            class="mini-btn delete"
                            onclick="
                              deleteQuestion(
                                '${q.id}'
                              )
                            "
                          >
                            🗑️ 削除
                          </button>

                        </div>

                      </div>
                    `
                )
                .join("")
            : `
              <div class="empty-funny">
                🩺 先生に聞くこと、まだないよ！
              </div>
            `
        }

      </div>

    </main>

    ${nav("questions")}
  `;
}


function addQuestion() {

  modal(
    "📝 医師に聞きたいこと",
    `

      <div class="form-grid">

        <textarea
          id="questionText"
          class="input textarea"
          placeholder="例：この薬は飲み続けて大丈夫？"
        ></textarea>

        <textarea
          id="questionAnswer"
          class="input textarea"
          placeholder="回答メモ（後から入力）"
        ></textarea>

        <button
          class="btn primary"
          onclick="saveQuestion()"
        >
          📝 追加する
        </button>

      </div>

    `
  );
}


async function saveQuestion() {

  const question =
    document
      .getElementById(
        "questionText"
      )
      ?.value
      .trim();

  const answer =
    document
      .getElementById(
        "questionAnswer"
      )
      ?.value ||
    "";

  if (!question) {

    flash(
      "質問を入力してください"
    );

    return;
  }


  const {
    error
  } =
    await sb
      .from("doctor_questions")
      .insert({
        family_id:
          profile.family_id,
        created_by:
          user.id,
        question,
        answered_note:
          answer,
        is_done:
          false
      });

  if (error) {

    flash(
      error.message
    );

    return;
  }

  closeModal();

  flash(
    "📝 質問を追加しました"
  );

  render();
}


async function editQuestion(id) {

  const {
    data,
    error
  } =
    await sb
      .from("doctor_questions")
      .select("*")
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error || !data) {

    flash(
      "質問が見つかりません"
    );

    return;
  }


  modal(
    "✏️ 質問を編集",
    `

      <div class="form-grid">

        <textarea
          id="editQuestionText"
          class="input textarea"
        >${esc(data.question)}</textarea>

        <textarea
          id="editQuestionAnswer"
          class="input textarea"
        >${esc(data.answered_note || "")}</textarea>

        <button
          class="btn primary"
          onclick="
            updateQuestion(
              '${id}'
            )
          "
        >
          💾 保存
        </button>

        <button
          class="btn danger"
          onclick="
            deleteQuestion(
              '${id}'
            )
          "
        >
          🗑️ 削除
        </button>

      </div>

    `
  );
}


async function updateQuestion(id) {

  const question =
    document
      .getElementById(
        "editQuestionText"
      )
      ?.value
      .trim();

  const answer =
    document
      .getElementById(
        "editQuestionAnswer"
      )
      ?.value ||
    "";

  if (!question) {

    flash(
      "質問を入力してください"
    );

    return;
  }


  const {
    error
  } =
    await sb
      .from("doctor_questions")
      .update({
        question,
        answered_note:
          answer
      })
      .eq(
        "id",
        id
      );

  if (error) {

    flash(
      error.message
    );

    return;
  }

  closeModal();

  flash(
    "✏️ 質問を更新しました"
  );

  render();
}


async function toggleQuestion(
  id,
  value
) {

  const {
    error
  } =
    await sb
      .from("doctor_questions")
      .update({
        is_done:
          value
      })
      .eq(
        "id",
        id
      );

  if (error) {

    flash(
      error.message
    );

    return;
  }

  render();
}


async function deleteQuestion(id) {

  askDelete(
    "この質問を削除しますか？",
    async () => {

      const {
        error
      } =
        await sb
          .from("doctor_questions")
          .delete()
          .eq(
            "id",
            id
          );

      if (error) {

        flash(
          error.message
        );

        return;
      }

      closeModal();

      flash(
        "🗑️ 質問を削除しました"
      );

      render();
    }
  );
}


/* =========================================================
   🤰 妊娠ページ
========================================================= */

async function pregnancyPage() {

  let gestation =
    "未設定";

  let remaining =
    "-";


  if (pregnancy) {

    const due =
      new Date(
        pregnancy.due_date +
        "T00:00:00"
      );

    const start =
      new Date(due);

    start.setDate(
      start.getDate() -
      280
    );

    const days =
      Math.max(
        0,
        Math.floor(
          (
            Date.now() -
            start.getTime()
          ) /
          86400000
        )
      );

    gestation =
      `${Math.floor(days / 7)}週${days % 7}日`;

    remaining =
      Math.ceil(
        (
          due.getTime() -
          Date.now()
        ) /
        86400000
      );
  }


  const weeks =
    pregnancy
      ? Number(
          pregnancyWeek()
        )
      : 0;


  let checklist = [];


  if (weeks < 8) {

    checklist = [
      "次回の産婦人科の予定を確認",
      "葉酸サプリを忘れず記録",
      "体調が悪いときは無理をしない",
      "先生に聞きたいことをメモ"
    ];

  } else if (weeks < 12) {

    checklist = [
      "次回健診を確認",
      "母子手帳・必要書類を確認",
      "体調・吐き気を記録",
      "薬を飲んだら記録"
    ];

  } else if (weeks < 20) {

    checklist = [
      "健診予定を確認",
      "体重を定期的に記録",
      "体調の変化をメモ",
      "先生に聞きたいことを整理"
    ];

  } else if (weeks < 28) {

    checklist = [
      "健診予定を確認",
      "体重の推移を確認",
      "出産準備について相談",
      "必要な買い物をリスト化"
    ];

  } else {

    checklist = [
      "健診予定を確認",
      "出産準備を確認",
      "入院準備を確認",
      "病院への連絡方法を確認"
    ];
  }


  const checkups =
    await getCheckups();


  return `

    <header class="hero">

      <div class="toilet">
        🤰
      </div>

      <h1>
        妊娠
      </h1>

      <p>
        タカちゃんの妊娠ダッシュボード
      </p>

    </header>


    <main class="panel">

      <div class="card">

        <div class="notice">

          🤰
          <b>
            ${gestation}
          </b>

          ／

          予定日まで
          <b>
            ${remaining}日
          </b>

        </div>

      </div>


      <div class="card">

        <div class="section-title">
          📌 今週やること
        </div>

        <ul>

          ${
            checklist
              .map(
                item =>
                  `<li>${esc(item)}</li>`
              )
              .join("")
          }

        </ul>

      </div>


      <div class="card">

        <div class="section-title">
          🗓️ 出産予定日
        </div>

        <p
          style="
            font-size:24px;
            font-weight:1000
          "
        >
          ${
            pregnancy
              ? fmt(
                  pregnancy.due_date
                )
              : "未設定"
          }
        </p>

      </div>


      <div class="card">

        <div class="section-title">
          🏥 検診記録
        </div>

        ${
          checkups.length
            ? checkups
                .map(
                  c => {

                    const e =
                      c.calendar_events;

                    return `
                      <div
                        class="calendar-event checkup"
                        onclick="
                          editCheckup(
                            '${c.id}'
                          )
                        "
                      >

                        <div
                          class="calendar-event-title"
                        >
                          🏥
                          ${esc(
                            e?.title ||
                            "妊婦健診"
                          )}
                        </div>

                        <div
                          class="calendar-event-time"
                        >
                          ${
                            e
                              ? fmt(
                                  new Date(
                                    e.start_at
                                  )
                                    .toLocaleDateString(
                                      "sv-SE",
                                      {
                                        timeZone:
                                          "Asia/Tokyo"
                                      }
                                    )
                                )
                              : "-"
                          }

                          ${
                            c.gestational_week != null
                              ? `　${c.gestational_week}週${c.gestational_day || 0}日`
                              : ""
                          }
                        </div>

                        ${
                          c.doctor_note
                            ? `
                              <div
                                class="record-detail"
                              >
                                ${esc(
                                  c.doctor_note
                                )}
                              </div>
                            `
                            : ""
                        }

                      </div>
                    `;
                  }
                )
                .join("")
            : `
              <div class="empty-funny">
                🏥 まだ検診記録がないよ！
              </div>
            `
        }

        <button
          class="btn pink"
          style="
            width:100%;
            margin-top:10px
          "
          onclick="
            checkupModal(
              '${dk(date)}'
            )
          "
        >
          🏥 検診を追加
        </button>

      </div>


      <div class="card">

        <button
          class="btn primary"
          style="width:100%"
          onclick="go('questions')"
        >
          📝 医師に聞きたいこと
        </button>

      </div>


      <div class="card">

        <button
          class="btn soft"
          style="width:100%"
          onclick="go('calendar')"
        >
          📅 カレンダーを見る
        </button>

      </div>

    </main>

    ${nav("pregnancy")}
  `;
}


function pregnancyWeek() {

  if (!pregnancy) {
    return 0;
  }

  const due =
    new Date(
      pregnancy.due_date +
      "T00:00:00"
    );

  const start =
    new Date(due);

  start.setDate(
    start.getDate() -
    280
  );

  return Math.floor(
    Math.max(
      0,
      (
        Date.now() -
        start.getTime()
      ) /
      86400000
    ) / 7
  );
}


/* =========================================================
   👩‍❤️‍👨 夫婦・設定
========================================================= */

async function settings() {

  let members = [];


  if (family) {

    const {
      data
    } =
      await sb
        .from("profiles")
        .select(
          "display_name,role"
        )
        .eq(
          "family_id",
          family.id
        );

    members =
      data || [];
  }


  const medications =
    await meds();


  return `

    <header class="hero">

      <div class="toilet">
        ❤️
      </div>

      <h1>
        夫婦
      </h1>

      <p>
        2人で一緒に使う
      </p>

    </header>


    <main class="panel">

      <div class="card">

        <div class="section-title">
          👩‍❤️‍👨 家族メンバー
        </div>

        ${
          members.length
            ? members
                .map(
                  member =>
                    `
                      <div
                        class="member"
                        style="
                          padding:12px;
                          background:#faf7ff;
                          border-radius:15px;
                          margin:6px 0;
                        "
                      >

                        ${
                          member.role === "wife"
                            ? "👩"
                            : "👨"
                        }

                        <b>
                          ${esc(
                            member.display_name
                          )}
                        </b>

                      </div>
                    `
                )
                .join("")
            : `
              <div class="empty">
                メンバー情報なし
              </div>
            `
        }

      </div>


      <div class="card">

        <div class="section-title">
          🔗 家族に招待
        </div>

        <button
          class="btn primary"
          onclick="showInvite()"
        >
          🔗 招待コードを表示
        </button>

      </div>


      <div class="card">

        <div class="section-title">
          💊 薬・サプリ管理
        </div>

        ${
          medications.length
            ? medications
                .map(
                  m =>
                    `
                      <div
                        style="
                          display:flex;
                          align-items:center;
                          justify-content:space-between;
                          gap:8px;
                          padding:10px;
                          margin:6px 0;
                          background:#faf7ff;
                          border-radius:15px;
                        "
                      >

                        <div>
                          ${esc(
                            m.icon ||
                            "💊"
                          )}
                          <b>
                            ${esc(m.name)}
                          </b>
                        </div>

                        <button
                          class="mini-btn edit"
                          onclick="
                            editMed(
                              '${m.id}'
                            )
                          "
                        >
                          ✏️
                        </button>

                      </div>
                    `
                )
                .join("")
            : `
              <div class="empty">
                薬・サプリはまだないよ
              </div>
            `
        }

        <button
          class="btn soft"
          style="
            width:100%;
            margin-top:8px
          "
          onclick="addMed()"
        >
          ＋ 薬・サプリを追加
        </button>

      </div>


      <div class="card">

        <button
          class="btn pink"
          onclick="notifyPartner()"
        >
          🔔 通知をテスト
        </button>

      </div>


      <div class="card">

        <button
          class="btn danger"
          onclick="
            sb.auth.signOut()
              .then(
                () => location.reload()
              )
          "
        >
          ログアウト
        </button>

      </div>

    </main>

    ${nav("settings")}
  `;
}


/* =========================================================
   🔔 通知
========================================================= */

async function notifyPartner() {

  flash(
    "🔔 通知機能は次の工程で接続します！"
  );
}


/* =========================================================
   📒 全履歴
========================================================= */

async function allRecords() {

  const {
    data,
    error
  } =
    await sb
      .from("health_records")
      .select(`
        id,
        record_type,
        recorded_at,
        comment,

        poop_records(
          poop_type
        ),

        medication_logs(
          medications(
            name,
            icon
          )
        ),

        vomit_records(
          severity
        ),

        weight_records(
          weight_kg
        ),

        period_records(
          period_type
        )
      `)
      .eq(
        "family_id",
        profile.family_id
      )
      .order(
        "recorded_at",
        {
          ascending:false
        }
      )
      .limit(200);

  if (error) {

    flash(
      error.message
    );

    return;
  }


  modal(
    "📒 最近の記録",
    `

      <div class="list">

        ${
          data?.length
            ? data
                .map(entry)
                .join("")
            : `
              <div class="empty">
                まだ記録がありません
              </div>
            `
        }

      </div>

    `
  );
}


/* =========================================================
   ナビ
========================================================= */

function nav(active) {

  return `

    <nav class="nav">

      <button
        class="
          ${active === "home" ? "active" : ""}
        "
        onclick="go('home')"
      >
        <span>🏠</span>
        ホーム
      </button>


      <button
        class="
          ${active === "calendar" ? "active" : ""}
        "
        onclick="go('calendar')"
      >
        <span>📅</span>
        カレンダー
      </button>


      <button
        class="
          ${active === "pregnancy" ? "active" : ""}
        "
        onclick="go('pregnancy')"
      >
        <span>🤰</span>
        妊娠
      </button>


      <button
        class="
          ${active === "questions" ? "active" : ""}
        "
        onclick="go('questions')"
      >
        <span>📝</span>
        質問
      </button>


      <button
        class="
          ${active === "settings" ? "active" : ""}
        "
        onclick="go('settings')"
      >
        <span>❤️</span>
        夫婦
      </button>


      <button
        onclick="allRecords()"
      >
        <span>📒</span>
        履歴
      </button>

    </nav>
  `;
}


/* =========================================================
   画面切替
========================================================= */

async function go(nextView) {

  view =
    nextView;

  await render();
}


async function render() {

  if (!user) {

    auth();

    return;
  }

  if (!profile) {

    onboarding();

    return;
  }


  if (view === "calendar") {

    app.innerHTML =
      await calendar();

    return;
  }


  if (view === "pregnancy") {

    app.innerHTML =
      await pregnancyPage();

    return;
  }


  if (view === "settings") {

    app.innerHTML =
      await settings();

    return;
  }


  if (view === "questions") {

    app.innerHTML =
      await questions();

    return;
  }


  app.innerHTML =
    await home();
}


/* =========================================================
   起動
========================================================= */

boot();

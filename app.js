const SUPABASE_URL="https://lagkkzzqjuwfevoceiaw.supabase.co";
const SUPABASE_KEY="sb_publishable_XLH_4Q9-E7JDxmrDwrQSgQ_kBktuLwM";

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
  const d = new Date(s + "T00:00:00");
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const tm = s =>
  new Date(s).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit"
  });

function flash(text) {
  const x = document.createElement("div");

  x.textContent = text;

  x.style = `
    position:fixed;
    z-index:9999;
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


/* =========================================================
   起動
========================================================= */

async function boot() {

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
   Supabase 基本情報
========================================================= */

async function loadProfile() {

  const { data, error } =
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


async function loadFamily() {

  if (!profile?.family_id) {
    family = null;
    pregnancy = null;
    return;
  }

  const { data: f } =
    await sb
      .from("families")
      .select("*")
      .eq("id", profile.family_id)
      .single();

  family = f || null;

  const { data: p } =
    await sb
      .from("pregnancies")
      .select("*")
      .eq("family_id", profile.family_id)
      .eq("is_active", true)
      .maybeSingle();

  pregnancy = p || null;
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

  const emailValue = document.getElementById("email")?.value.trim();
  const passValue = document.getElementById("pass")?.value;

  if (!emailValue || !passValue) {
    flash("メールアドレスとパスワードを入力してください");
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

  const emailValue = document.getElementById("email")?.value.trim();
  const passValue = document.getElementById("pass")?.value;

  if (!emailValue || !passValue) {
    flash("メールアドレスとパスワードを入力してください");
    return;
  }

  const { data, error } =
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

  const n = document.getElementById("name")?.value.trim();
  const r = document.getElementById("role")?.value;
  const d = document.getElementById("due")?.value;

  if (!n || !d) {
    flash("名前と予定日を入力してください");
    return;
  }

  const inviteCode =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  const { data: f, error: familyError } =
    await sb
      .from("families")
      .insert({
        family_name: "タカちゃん＆オタヤダ",
        invite_code: inviteCode
      })
      .select()
      .single();

  if (familyError) {
    flash(familyError.message);
    return;
  }

  const { error: profileError } =
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

  const start =
    new Date(d + "T00:00:00");

  start.setDate(start.getDate() - 280);

  const { error: pregnancyError } =
    await sb
      .from("pregnancies")
      .insert({
        family_id: f.id,
        mother_profile_id:
          r === "wife" ? user.id : null,
        due_date: d,
        pregnancy_start_date: dk(start),
        is_active: true
      });

  if (pregnancyError) {
    console.warn(pregnancyError);
  }

  await loadProfile();
  await loadFamily();

  flash("🎉 家族を作りました！");

  render();
}


/* =========================================================
   招待コードで参加
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
    flash("表示名を入力してください");
    return;
  }

  if (!code || code.length !== 6) {
    flash("6文字の招待コードを入力してください");
    return;
  }

  const { data: f, error } =
    await sb
      .from("families")
      .select("*")
      .eq("invite_code", code)
      .maybeSingle();

  if (error || !f) {
    flash("招待コードが見つかりません");
    return;
  }

  const { error: profileError } =
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

  await loadProfile();
  await loadFamily();

  flash("👩‍❤️‍👨 家族に参加しました！");

  render();
}


/* =========================================================
   家族招待
========================================================= */

async function showInvite() {

  if (!family) {
    flash("家族情報がありません");
    return;
  }

  let code = family.invite_code;

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
        .eq("id", family.id);

    if (error) {
      flash(error.message);
      return;
    }

    family.invite_code = code;
  }

  modal(
    "👩‍❤️‍👨 家族に招待",
    `
      <div
        class="invite-code"
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

      <p class="hint">
        オタヤダ側で「招待コードで参加」を選んで、このコードを入力してください。
      </p>
    `
  );
}


async function copyInvite(code) {

  try {

    await navigator.clipboard.writeText(code);

    flash("📋 コピーしました！");

  } catch {

    flash("コード：" + code);

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
   健康記録 共通
========================================================= */

async function hr(type, comment = "") {

  const { data, error } =
    await sb
      .from("health_records")
      .insert({
        family_id: profile.family_id,
        profile_id: user.id,
        record_type: type,
        recorded_at: new Date().toISOString(),
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

async function poopAdd(type, button) {

  const splash =
    button?.querySelector(".splash");

  if (splash) {

    splash.classList.remove("active");

    void splash.offsetWidth;

    splash.classList.add("active");
  }

  const comment =
    prompt("💬 ウンチへのコメント（任意）") ?? "";

  try {

    const record =
      await hr("poop", comment);

    const { error } =
      await sb
        .from("poop_records")
        .insert({
          health_record_id: record.id,
          poop_type: type,
          comment
        });

    if (error) {
      throw error;
    }

    flash("💩 ブワッ！記録したよ！");

    render();

  } catch (e) {

    console.error(e);

    flash("記録できませんでした：" + e.message);
  }
}


/* =========================================================
   💊 薬
========================================================= */

async function meds() {

  const { data, error } =
    await sb
      .from("medications")
      .select("*")
      .eq("family_id", profile.family_id)
      .eq("is_active", true)
      .order("created_at");

  if (error) {

    console.error(error);

    return [];
  }

  return data || [];
}


async function medAdd(id, name, icon) {

  try {

    const record =
      await hr("medicine");

    const { error } =
      await sb
        .from("medication_logs")
        .insert({
          health_record_id: record.id,
          medication_id: id
        });

    if (error) {
      throw error;
    }

    flash(`${icon} ${name}を飲んだ！`);

    render();

  } catch (e) {

    flash("服薬記録に失敗：" + e.message);
  }
}


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
          追加する
        </button>

      </div>
    `
  );
}


async function saveMed() {

  const name =
    document.getElementById("mn")?.value.trim();

  const icon =
    document.getElementById("mi")?.value || "💊";

  const description =
    document.getElementById("md")?.value || "";

  if (!name) {

    flash("薬・サプリ名を入力してください");

    return;
  }

  const { error } =
    await sb
      .from("medications")
      .insert({
        family_id: profile.family_id,
        name,
        icon,
        description,
        is_active: true
      });

  closeModal();

  if (error) {

    flash(error.message);

    return;
  }

  flash("💊 追加しました");

  render();
}


/* =========================================================
   🤢 吐いた
========================================================= */

function addVomit() {

  modal(
    "🤢 吐いた記録",
    `
      <div class="form-grid">

        <select id="vomitSeverity" class="input">

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
      document.getElementById("vomitSeverity")?.value
    );

  const comment =
    document.getElementById("vomitComment")?.value || "";

  try {

    const record =
      await hr("vomit", comment);

    const { error } =
      await sb
        .from("vomit_records")
        .insert({
          health_record_id: record.id,
          severity,
          comment
        });

    if (error) {
      throw error;
    }

    closeModal();

    flash("🤢 記録したよ");

    render();

  } catch (e) {

    flash("記録できませんでした：" + e.message);
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
      document.getElementById("weightValue")?.value
    );

  const comment =
    document.getElementById("weightComment")?.value || "";

  if (!weight) {

    flash("体重を入力してください");

    return;
  }

  try {

    const record =
      await hr("weight", comment);

    const { error } =
      await sb
        .from("weight_records")
        .insert({
          health_record_id: record.id,
          weight_kg: weight,
          comment
        });

    if (error) {
      throw error;
    }

    closeModal();

    flash("⚖️ 保存したよ");

    render();

  } catch (e) {

    flash("体重を保存できませんでした：" + e.message);
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

        <select id="periodType" class="input">

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

        <select id="periodLevel" class="input">

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
    document.getElementById("periodType")?.value;

  const level =
    Number(
      document.getElementById("periodLevel")?.value
    );

  const comment =
    document.getElementById("periodComment")?.value || "";

  try {

    const record =
      await hr("period", comment);

    const { error } =
      await sb
        .from("period_records")
        .insert({
          health_record_id: record.id,
          period_type: type,
          flow_level: level,
          comment
        });

    if (error) {
      throw error;
    }

    closeModal();

    flash("🌸 生理記録を保存しました");

    render();

  } catch (e) {

    console.error(e);

    flash(
      "生理記録に失敗しました。period_recordsテーブルが必要です。"
    );
  }
}


/* =========================================================
   📅 今日の記録
========================================================= */

async function dayRecords(targetDate) {

  const { data, error } =
    await sb
      .from("health_records")
      .select(`
        id,
        record_type,
        recorded_at,
        comment,

        poop_records(
          poop_type,
          comment
        ),

        medication_logs(
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
          comment
        )
      `)
      .eq("family_id", profile.family_id)
      .gte(
        "recorded_at",
        targetDate + "T00:00:00"
      )
      .lte(
        "recorded_at",
        targetDate + "T23:59:59"
      )
      .order(
        "recorded_at",
        { ascending: false }
      );

  if (error) {

    console.error(error);

    return [];
  }

  return data || [];
}


/* =========================================================
   📒 記録表示
========================================================= */

function entry(record) {

  let name = record.record_type;
  let icon = icons[record.record_type] || "📝";

  if (record.record_type === "poop") {

    const map = {
      korokoro: ["コロコロ", "🟤"],
      banana: ["バナナ", "🍌"],
      bechabecha: ["ベチャベチャ", "💩"],
      liquid: ["液体", "💧"]
    };

    const value =
      record.poop_records?.[0]?.poop_type;

    [name, icon] =
      map[value] || ["ウンチ", "💩"];
  }

  if (record.record_type === "medicine") {

    const medicine =
      record.medication_logs?.[0]?.medications;

    name = medicine?.name || "薬";
    icon = medicine?.icon || "💊";
  }

  if (record.record_type === "vomit") {

    name = "吐いた";

    const severity =
      record.vomit_records?.[0]?.severity;

    if (severity) {
      name += `　${"★".repeat(severity)}`;
    }
  }

  if (record.record_type === "weight") {

    const value =
      record.weight_records?.[0]?.weight_kg;

    name =
      `体重 ${value || "-"}kg`;
  }

  if (record.record_type === "period") {

    const p =
      record.period_records?.[0]?.period_type;

    if (p === "start") {
      name = "生理開始";
    } else if (p === "end") {
      name = "生理終了";
    } else {
      name = "生理痛";
    }

    icon = "🌸";
  }

  return `
    <div class="entry">

      <div class="ico">
        ${icon}
      </div>

      <div class="meta">

        <b>${esc(name)}</b>

        <small>
          ${tm(record.recorded_at)}

          ${
            record.comment
              ? "　💬 " + esc(record.comment)
              : ""
          }
        </small>

      </div>

    </div>
  `;
}


/* =========================================================
   🏠 ホーム
========================================================= */

async function home() {

  const records =
    await dayRecords(dk(date));

  const medications =
    await meds();

  const poopCount =
    records.filter(
      x => x.record_type === "poop"
    ).length;

  const medicineCount =
    records.filter(
      x => x.record_type === "medicine"
    ).length;

  const vomitCount =
    records.filter(
      x => x.record_type === "vomit"
    ).length;

  const periodCount =
    records.filter(
      x => x.record_type === "period"
    ).length;

  const weight =
    records.find(
      x => x.record_type === "weight"
    )?.weight_records?.[0]?.weight_kg || "-";

  let gestation = "妊娠情報なし";

  if (pregnancy) {

    const start =
      new Date(
        pregnancy.pregnancy_start_date +
        "T00:00:00"
      );

    const days =
      Math.max(
        0,
        Math.floor(
          (Date.now() - start.getTime()) /
          86400000
        )
      );

    gestation =
      `${Math.floor(days / 7)}週${days % 7}日`;
  }

  return `
    <header class="hero">

      <div class="toilet">🚽</div>

      <h1>💩＆くすり記録</h1>

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

        <button onclick="shiftDate(-1)">
          ‹
        </button>

        <div class="date">
          ${fmt(dk(date))}
        </div>

        <button onclick="shiftDate(1)">
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
                ([key, [name, emoji, css]]) => `
                  <button
                    class="poop ${css}"
                    onclick="
                      poopAdd('${key}',this)
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
                medicine => `
                  <button
                    class="med"
                    onclick="
                      medAdd(
                        '${medicine.id}',
                        '${esc(medicine.name)}',
                        '${esc(medicine.icon || "💊")}'
                      )
                    "
                  >

                    <span class="emoji">
                      ${esc(medicine.icon || "💊")}
                    </span>

                    ${esc(medicine.name)}

                  </button>
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
              ? records.map(entry).join("")
              : `
                <div class="empty">
                  まだ記録はないよ〜！
                </div>
              `
          }

        </div>

      </div>

    </main>

    ${nav("home")}
  `;
}


/* =========================================================
   日付移動
========================================================= */

function shiftDate(amount) {

  date.setDate(
    date.getDate() + amount
  );

  render();
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
    1 - first.getDay()
  );

  const last =
    new Date(
      year,
      month + 1,
      0
    );

  const { data } =
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
        dk(start) + "T00:00:00"
      )
      .lte(
        "recorded_at",
        dk(last) + "T23:59:59"
      );

  const byDate = {};

  (data || []).forEach(record => {

    const key =
      record.recorded_at.substring(
        0,
        10
      );

    if (!byDate[key]) {
      byDate[key] = [];
    }

    byDate[key].push(
      record.record_type
    );
  });


  const cells = [];

  for (let i = 0; i < 42; i++) {

    const d =
      new Date(start);

    d.setDate(
      start.getDate() + i
    );

    const key =
      dk(d);

    const types =
      (byDate[key] || [])
        .filter(
          type =>
            filter === "all" ||
            type === filter
        );

    cells.push(`
      <button
        class="
          day
          ${d.getMonth() !== month ? "other" : ""}
          ${key === dk(new Date()) ? "today" : ""}
        "
        onclick="
          date = new Date('${key}T00:00:00');
          go('home')
        "
      >

        <b>
          ${d.getDate()}
        </b>

        <div>

          ${
            types
              .map(
                type =>
                  `<span class="dot">
                    ${icons[type] || "📝"}
                  </span>`
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


  return `
    <header class="hero">

      <div class="toilet">
        📅
      </div>

      <h1>
        カレンダー
      </h1>

      <p>
        過去の記録をひと目で
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
              ([value, label]) => `
                <button
                  class="
                    tab
                    ${filter === value ? "on" : ""}
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
                  `<div class="cal-head">
                    ${x}
                  </div>`
              )
              .join("")
          }

          ${cells.join("")}

        </div>

      </div>


      <div class="card">

        <button
          class="btn primary"
          onclick="eventModal()"
        >
          📌 予定を追加
        </button>

      </div>

    </main>

    ${nav("calendar")}
  `;
}


/* =========================================================
   📌 予定
========================================================= */

function eventModal() {

  modal(
    "📌 予定を追加",
    `
      <div class="form-grid">

        <input
          id="eventTitle"
          class="input"
          placeholder="例：妊婦健診"
        >

        <input
          id="eventDate"
          class="input"
          type="date"
          value="${dk(date)}"
        >

        <input
          id="eventTime"
          class="input"
          type="time"
          value="10:00"
        >

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


async function saveEvent() {

  const title =
    document
      .getElementById("eventTitle")
      ?.value.trim();

  const eventDate =
    document
      .getElementById("eventDate")
      ?.value;

  const eventTime =
    document
      .getElementById("eventTime")
      ?.value;

  const comment =
    document
      .getElementById("eventComment")
      ?.value || "";

  if (!title || !eventDate) {

    flash("予定名と日付を入力してください");

    return;
  }

  const { error } =
    await sb
      .from("calendar_events")
      .insert({
        family_id: profile.family_id,
        created_by: user.id,
        title,
        description: comment,
        start_at:
          `${eventDate}T${eventTime || "10:00"}:00+09:00`,
        event_type: "other"
      });

  closeModal();

  if (error) {

    flash(
      "予定を保存できませんでした：" +
      error.message
    );

    return;
  }

  flash("📌 予定を追加しました");

  render();
}


/* =========================================================
   🤰 妊娠ページ
========================================================= */

function pregnancyPage() {

  let gestation = "未設定";
  let remaining = "-";

  if (pregnancy) {

    const start =
      new Date(
        pregnancy.pregnancy_start_date +
        "T00:00:00"
      );

    const due =
      new Date(
        pregnancy.due_date +
        "T00:00:00"
      );

    const days =
      Math.max(
        0,
        Math.floor(
          (Date.now() -
            start.getTime()) /
          86400000
        )
      );

    gestation =
      `${Math.floor(days / 7)}週${days % 7}日`;

    remaining =
      Math.ceil(
        (due.getTime() - Date.now()) /
        86400000
      );
  }


  let checklist = [];

  const weeks =
    pregnancy
      ? Math.floor(
          Math.max(
            0,
            (
              Date.now() -
              new Date(
                pregnancy.pregnancy_start_date +
                "T00:00:00"
              ).getTime()
            ) /
            86400000
          ) / 7
        )
      : 0;


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

        <p class="hint">
          これは日常管理用のチェックリストです。
          医療上の判断や緊急時の対応は医療機関へ確認してください。
        </p>

      </div>


      <div class="card">

        <div class="section-title">
          🗓️ 出産予定日
        </div>

        <p style="font-size:24px;font-weight:1000">
          ${
            pregnancy
              ? fmt(pregnancy.due_date)
              : "未設定"
          }
        </p>

      </div>


      <div class="card">

        <button
          class="btn primary"
          onclick="eventModal()"
        >
          🏥 健診・予定を追加
        </button>

      </div>

    </main>

    ${nav("pregnancy")}
  `;
}


/* =========================================================
   👩‍❤️‍👨 夫婦ページ
========================================================= */

async function settings() {

  let members = [];

  if (family) {

    const { data } =
      await sb
        .from("profiles")
        .select(
          "display_name,role"
        )
        .eq(
          "family_id",
          family.id
        );

    members = data || [];
  }


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
                  member => `
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

        <p class="hint">
          オタヤダ、またはタカちゃんを
          同じ家族データに招待できます。
        </p>

        <button
          class="btn primary"
          onclick="showInvite()"
        >
          🔗 招待コードを表示
        </button>

      </div>


      <div class="card">

        <div class="section-title">
          🔔 通知
        </div>

        <p class="hint">
          「オタヤダに知らせる」を押したときに
          相手へ通知する機能です。
        </p>

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
              .then(() => location.reload())
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

  /*
    現段階ではWeb Pushのバックエンドがまだありません。

    次工程で

    Service Worker
       ↓
    Push Subscription
       ↓
    Supabase Edge Function
       ↓
    Web Push
       ↓
    オタヤダのiPhone

    を接続します。
  */

  flash(
    "🔔 通知機能は次の工程で接続します！"
  );
}


/* =========================================================
   📒 全履歴
========================================================= */

async function allRecords() {

  const { data, error } =
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
          ascending: false
        }
      )
      .limit(200);

  if (error) {

    flash(error.message);

    return;
  }


  const html =
    (data || [])
      .map(entry)
      .join("");


  modal(
    "📒 最近の記録",
    `
      <div class="list">

        ${
          html ||
          `
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
   ナビゲーション
========================================================= */

function nav(active) {

  return `
    <nav class="nav">

      <button
        class="${active === "home" ? "active" : ""}"
        onclick="go('home')"
      >
        <span>🏠</span>
        ホーム
      </button>


      <button
        class="${active === "calendar" ? "active" : ""}"
        onclick="go('calendar')"
      >
        <span>📅</span>
        カレンダー
      </button>


      <button
        class="${active === "pregnancy" ? "active" : ""}"
        onclick="go('pregnancy')"
      >
        <span>🤰</span>
        妊娠
      </button>


      <button
        class="${active === "settings" ? "active" : ""}"
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
   画面切り替え
========================================================= */

async function go(nextView) {

  view = nextView;

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
      pregnancyPage();

    return;
  }

  if (view === "settings") {

    app.innerHTML =
      await settings();

    return;
  }

  app.innerHTML =
    await home();
}


/* =========================================================
   起動
========================================================= */

boot();

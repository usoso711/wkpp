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

      <h2>${esc(title)}</h2>

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
    data: { session },
    error
  } = await sb.auth.getSession();

  if (error) {
    console.error(error);
    auth();
    return;
  }

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
   認証状態監視
========================================================= */

if (configured) {
  sb.auth.onAuthStateChange(async (_event, session) => {

    user = session?.user || null;

    if (!user) {
      profile = null;
      family = null;
      pregnancy = null;
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
  });
}


/* =========================================================
   Supabase 基本情報
========================================================= */

async function loadProfile() {

  if (!user) {
    profile = null;
    return;
  }

  const {
    data,
    error
  } = await sb
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("profiles:", error);
    profile = null;
    return;
  }

  profile = data || null;
}


async function loadFamily() {

  family = null;
  pregnancy = null;

  if (!profile?.family_id) {
    return;
  }

  /* 家族 */
  const {
    data: f,
    error: familyError
  } = await sb
    .from("families")
    .select("*")
    .eq("id", profile.family_id)
    .maybeSingle();

  if (familyError) {
    console.error("families:", familyError);
  }

  family = f || null;


  /* 妊娠 */
  const {
    data: p,
    error: pregnancyError
  } = await sb
    .from("pregnancies")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("due_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pregnancyError) {
    console.error("pregnancies:", pregnancyError);
  }

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

  const emailValue =
    document.getElementById("email")?.value.trim();

  const passValue =
    document.getElementById("pass")?.value;

  if (!emailValue || !passValue) {
    flash("メールアドレスとパスワードを入力してください");
    return;
  }

  const {
    error
  } = await sb.auth.signInWithPassword({
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
    document.getElementById("email")?.value.trim();

  const passValue =
    document.getElementById("pass")?.value;

  if (!emailValue || !passValue) {
    flash("メールアドレスとパスワードを入力してください");
    return;
  }

  if (passValue.length < 6) {
    flash("パスワードは6文字以上にしてください");
    return;
  }

  const {
    data,
    error
  } = await sb.auth.signUp({
    email: emailValue,
    password: passValue
  });

  if (error) {
    flash(error.message);
    return;
  }

  user = data.user;

  if (!user) {
    flash("確認メールを確認してください");
    return;
  }

  onboarding();
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
    document.getElementById("name")?.value.trim();

  const r =
    document.getElementById("role")?.value;

  const d =
    document.getElementById("due")?.value;

  if (!n || !d) {
    flash("名前と予定日を入力してください");
    return;
  }

  const inviteCode =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();


  /* 家族 */
  const {
    data: f,
    error: familyError
  } = await sb
    .from("families")
    .insert({
      family_name: "タカちゃん＆オタヤダ",
      invite_code: inviteCode
    })
    .select()
    .single();

  if (familyError) {
    console.error(familyError);
    flash("家族を作成できません：" + familyError.message);
    return;
  }


  /* プロフィール */
  const {
    error: profileError
  } = await sb
    .from("profiles")
    .insert({
      id: user.id,
      family_id: f.id,
      display_name: n,
      role: r
    });

  if (profileError) {
    console.error(profileError);

    /* 作成した家族を削除 */
    await sb
      .from("families")
      .delete()
      .eq("id", f.id);

    flash("プロフィール作成に失敗：" + profileError.message);
    return;
  }


  /* 妊娠 */
  const {
    error: pregnancyError
  } = await sb
    .from("pregnancies")
    .insert({
      family_id: f.id,
      mother_profile_id:
        r === "wife" ? user.id : null,
      due_date: d
    });

  if (pregnancyError) {
    console.error("pregnancies:", pregnancyError);

    flash(
      "家族は作成しましたが、妊娠情報の登録に失敗しました：" +
      pregnancyError.message
    );
  } else {
    flash("🎉 家族を作りました！");
  }

  await loadProfile();
  await loadFamily();

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


  const {
    data: f,
    error
  } = await sb
    .from("families")
    .select("*")
    .eq("invite_code", code)
    .maybeSingle();

  if (error) {
    console.error(error);
    flash("家族情報を取得できません：" + error.message);
    return;
  }

  if (!f) {
    flash("招待コードが見つかりません");
    return;
  }


  const {
    error: profileError
  } = await sb
    .from("profiles")
    .insert({
      id: user.id,
      family_id: f.id,
      display_name: n,
      role: r
    });

  if (profileError) {
    console.error(profileError);
    flash("家族への参加に失敗：" + profileError.message);
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

    const {
      error
    } = await sb
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
        相手側で「招待コードで参加」を選んで、
        このコードを入力してください。
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

  if (!profile?.family_id || !user?.id) {
    throw new Error("ログイン情報または家族情報がありません");
  }

  const {
    data,
    error
  } = await sb
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

    const {
      error
    } = await sb
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

  if (!profile?.family_id) {
    return [];
  }

  const {
    data,
    error
  } = await sb
    .from("medications")
    .select("*")
    .eq("family_id", profile.family_id)
    .eq("is_active", true)
    .order("created_at", {
      ascending: true
    });

  if (error) {

    console.error("medications:", error);

    return [];
  }

  return data || [];
}


async function medAdd(id, name, icon) {

  try {

    const record =
      await hr("medicine");

    const {
      error
    } = await sb
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

    console.error(e);

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

  const {
    error
  } = await sb
    .from("medications")
    .insert({
      family_id: profile.family_id,
      name,
      icon,
      description,
      is_active: true
    });

  if (error) {
    flash("追加できません：" + error.message);
    return;
  }

  closeModal();

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

    const {
      error
    } = await sb
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

    console.error(e);

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

  if (!Number.isFinite(weight) || weight <= 0) {

    flash("正しい体重を入力してください");

    return;
  }

  try {

    const record =
      await hr("weight", comment);

    const {
      error
    } = await sb
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

    console.error(e);

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

    const {
      error
    } = await sb
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

    flash("生理記録に失敗しました：" + e.message);
  }
}


/* =========================================================
   📅 今日の記録
========================================================= */

async function dayRecords(targetDate) {

  const start =
    `${targetDate}T00:00:00`;

  const end =
    `${targetDate}T23:59:59.999`;

  const {
    data,
    error
  } = await sb
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
    .gte("recorded_at", start)
    .lte("recorded_at", end)
    .order("recorded_at", {
      ascending: false
    });

  if (error) {

    console.error("health_records:", error);

    return [];
  }

  return data || [];
}


/* =========================================================
   📒 記録表示
========================================================= */

function entry(record) {

  let name =
    record.record_type;

  let icon =
    icons[record.record_type] || "📝";


  /* 💩 */
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


  /* 💊 */
  if (record.record_type === "medicine") {

    const medicine =
      record.medication_logs?.[0]?.medications;

    name =
      medicine?.name || "薬";

    icon =
      medicine?.icon || "💊";
  }


  /* 🤢 */
  if (record.record_type === "vomit") {

    name = "吐いた";

    const severity =
      record.vomit_records?.[0]?.severity;

    if (severity) {
      name +=
        `　${"★".repeat(severity)}`;
    }
  }


  /* ⚖️ */
  if (record.record_type === "weight") {

    const value =
      record.weight_records?.[0]?.weight_kg;

    name =
      `体重 ${value ?? "-"}kg`;
  }


  /* 🌸 */
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

        <b>
          ${esc(name)}
        </b>

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
   妊娠週数
========================================================= */

function getGestation() {

  if (!pregnancy?.due_date) {
    return null;
  }

  const due =
    new Date(
      pregnancy.due_date + "T00:00:00"
    );

  const today =
    new Date();

  today.setHours(0, 0, 0, 0);

  const start =
    new Date(due);

  start.setDate(
    start.getDate() - 280
  );

  const days =
    Math.floor(
      (
        today.getTime() -
        start.getTime()
      ) / 86400000
    );

  const safeDays =
    Math.max(0, days);

  return {
    weeks: Math.floor(safeDays / 7),
    days: safeDays % 7,
    totalDays: safeDays
  };
}


function getRemainingDays() {

  if (!pregnancy?.due_date) {
    return null;
  }

  const due =
    new Date(
      pregnancy.due_date + "T00:00:00"
    );

  const today =
    new Date();

  today.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.ceil(
      (
        due.getTime() -
        today.getTime()
      ) / 86400000
    )
  );
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


  const weight =
    records.find(
      x => x.record_type === "weight"
    )?.weight_records?.[0]?.weight_kg || "-";


  const g =
    getGestation();

  const gestation =
    g
      ? `${g.weeks}週${g.days}日`
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


      <!-- 💩 -->
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
                    onclick="poopAdd('${key}',this)"
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


      <!-- 💊 -->
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
                        ${JSON.stringify(medicine.name)},
                        ${JSON.stringify(medicine.icon || "💊")}
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


      <!-- クイック -->
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
          🔔 相手に知らせる
        </button>

      </div>


      <!-- 今日の記録 -->
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


  const {
    data,
    error
  } = await sb
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


  if (error) {
    console.error(error);
  }


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
      [...new Set(
        (byDate[key] || [])
          .filter(
            type =>
              filter === "all" ||
              type === filter
          )
      )];


    cells.push(`
      <button
        class="
          day
          ${d.getMonth() !== month ? "other" : ""}
          ${
            key === dk(new Date())
              ? "today"
              : ""
          }
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


      <div class="card">

        <button
          class="btn soft"
          onclick="showCalendarEvents()"
        >
          📋 予定一覧
        </button>

      </div>

    </main>

    ${nav("calendar")}
  `;
}


/* =========================================================
   📌 予定追加
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


  const {
    error
  } = await sb
    .from("calendar_events")
    .insert({
      family_id: profile.family_id,
      created_by: user.id,
      title,
      description: comment,
      start_at:
        `${eventDate}T${eventTime || "10:00"}:00+09:00`,
      event_type: "other",
      is_all_day: false
    });


  if (error) {

    console.error(error);

    flash(
      "予定を保存できませんでした：" +
      error.message
    );

    return;
  }


  closeModal();

  flash("📌 予定を追加しました");

  render();
}


/* =========================================================
   📋 予定一覧
========================================================= */

async function showCalendarEvents() {

  const {
    data,
    error
  } = await sb
    .from("calendar_events")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("start_at", {
      ascending: true
    })
    .limit(100);


  if (error) {
    flash(error.message);
    return;
  }


  const html =
    (data || [])
      .map(event => {

        const d =
          new Date(event.start_at);

        return `
          <div
            style="
              padding:14px;
              background:#faf7ff;
              border-radius:16px;
              margin-bottom:8px;
            "
          >

            <b>
              📌 ${esc(event.title)}
            </b>

            <div class="hint">
              ${d.toLocaleString("ja-JP")}
            </div>

            ${
              event.description
                ? `
                  <div style="margin-top:5px">
                    ${esc(event.description)}
                  </div>
                `
                : ""
            }

          </div>
        `;
      })
      .join("");


  modal(
    "📋 予定一覧",
    html ||
      `
        <div class="empty">
          予定はありません
        </div>
      `
  );
}


/* =========================================================
   🤰 妊娠ページ
========================================================= */

function pregnancyPage() {

  const g =
    getGestation();

  const gestation =
    g
      ? `${g.weeks}週${g.days}日`
      : "未設定";

  const remaining =
    getRemainingDays();


  let weeks =
    g?.weeks || 0;

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
            ${
              remaining === null
                ? "-"
                : remaining
            }日
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

        <p
          style="
            font-size:24px;
            font-weight:1000
          "
        >
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


      <div class="card">

        <button
          class="btn soft"
          onclick="doctorQuestions()"
        >
          📝 医師に聞きたいこと
        </button>

      </div>


      <div class="card">

        <button
          class="btn soft"
          onclick="checkups()"
        >
          🏥 健診記録
        </button>

      </div>

    </main>

    ${nav("pregnancy")}
  `;
}


/* =========================================================
   📝 医師への質問
========================================================= */

async function doctorQuestions() {

  const {
    data,
    error
  } = await sb
    .from("doctor_questions")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("created_at", {
      ascending: false
    })
    .limit(100);


  if (error) {
    flash(error.message);
    return;
  }


  const list =
    (data || [])
      .map(q => `
        <div
          style="
            padding:14px;
            border-radius:16px;
            background:#faf7ff;
            margin-bottom:8px;
          "
        >

          <div>
            ${
              q.is_done
                ? "✅"
                : "❓"
            }

            <b>
              ${esc(q.question)}
            </b>
          </div>

          ${
            q.answered_note
              ? `
                <div class="hint">
                  回答：${esc(q.answered_note)}
                </div>
              `
              : ""
          }

        </div>
      `)
      .join("");


  modal(
    "📝 医師に聞きたいこと",
    `
      <button
        class="btn primary"
        style="width:100%;margin-bottom:12px"
        onclick="addDoctorQuestion()"
      >
        ＋ 質問を追加
      </button>

      ${
        list ||
        `
          <div class="empty">
            質問はまだありません
          </div>
        `
      }
    `
  );
}


function addDoctorQuestion() {

  modal(
    "📝 質問を追加",
    `
      <div class="form-grid">

        <textarea
          id="questionText"
          class="input textarea"
          placeholder="先生に聞きたいこと"
        ></textarea>

        <button
          class="btn primary"
          onclick="saveDoctorQuestion()"
        >
          保存
        </button>

      </div>
    `
  );
}


async function saveDoctorQuestion() {

  const question =
    document
      .getElementById("questionText")
      ?.value
      .trim();

  if (!question) {
    flash("質問を入力してください");
    return;
  }


  const {
    error
  } = await sb
    .from("doctor_questions")
    .insert({
      family_id: profile.family_id,
      created_by: user.id,
      question,
      is_done: false
    });


  if (error) {
    flash(error.message);
    return;
  }


  closeModal();

  flash("📝 質問を追加しました");

  doctorQuestions();
}


/* =========================================================
   🏥 健診
========================================================= */

async function checkups() {

  const {
    data,
    error
  } = await sb
    .from("checkups")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("next_checkup_date", {
      ascending: true
    });


  if (error) {
    flash(error.message);
    return;
  }


  const html =
    (data || [])
      .map(c => `
        <div
          style="
            background:#faf7ff;
            border-radius:16px;
            padding:14px;
            margin-bottom:8px;
          "
        >

          <b>
            🏥 ${c.gestational_week ?? "-"}週
            ${c.gestational_day ?? 0}日
          </b>

          ${
            c.weight_kg !== null
              ? `<div>⚖️ ${c.weight_kg}kg</div>`
              : ""
          }

          ${
            c.systolic !== null
              ? `<div>🩺 ${c.systolic}/${c.diastolic ?? "-"}</div>`
              : ""
          }

          ${
            c.doctor_note
              ? `<div>📝 ${esc(c.doctor_note)}</div>`
              : ""
          }

          ${
            c.next_checkup_date
              ? `<div class="hint">
                  次回：${fmt(c.next_checkup_date)}
                </div>`
              : ""
          }

        </div>
      `)
      .join("");


  modal(
    "🏥 健診記録",
    `
      <button
        class="btn primary"
        style="width:100%;margin-bottom:12px"
        onclick="addCheckup()"
      >
        ＋ 健診を記録
      </button>

      ${
        html ||
        `
          <div class="empty">
            健診記録はありません
          </div>
        `
      }
    `
  );
}


function addCheckup() {

  const g =
    getGestation();

  modal(
    "🏥 健診を記録",
    `
      <div class="form-grid">

        <input
          id="checkupWeight"
          class="input"
          type="number"
          step="0.1"
          placeholder="体重 kg（任意）"
        >

        <input
          id="checkupSys"
          class="input"
          type="number"
          placeholder="血圧 上（任意）"
        >

        <input
          id="checkupDia"
          class="input"
          type="number"
          placeholder="血圧 下（任意）"
        >

        <textarea
          id="checkupNote"
          class="input textarea"
          placeholder="先生からのコメント・診察内容"
        ></textarea>

        <input
          id="nextCheckup"
          class="input"
          type="date"
          placeholder="次回健診"
        >

        <button
          class="btn primary"
          onclick="saveCheckup()"
        >
          🏥 保存
        </button>

      </div>
    `
  );
}


async function saveCheckup() {

  const weight =
    parseFloat(
      document.getElementById("checkupWeight")?.value
    );

  const systolic =
    parseInt(
      document.getElementById("checkupSys")?.value
    );

  const diastolic =
    parseInt(
      document.getElementById("checkupDia")?.value
    );

  const doctorNote =
    document.getElementById("checkupNote")?.value || "";

  const nextDate =
    document.getElementById("nextCheckup")?.value || null;


  const g =
    getGestation();


  const payload = {
    family_id: profile.family_id,
    gestational_week: g?.weeks ?? null,
    gestational_day: g?.days ?? null,
    weight_kg:
      Number.isFinite(weight)
        ? weight
        : null,
    systolic:
      Number.isFinite(systolic)
        ? systolic
        : null,
    diastolic:
      Number.isFinite(diastolic)
        ? diastolic
        : null,
    doctor_note: doctorNote,
    next_checkup_date: nextDate
  };


  const {
    error
  } = await sb
    .from("checkups")
    .insert(payload);


  if (error) {
    flash(error.message);
    return;
  }


  closeModal();

  flash("🏥 健診を保存しました");

  render();
}


/* =========================================================
   👩‍❤️‍👨 夫婦
========================================================= */

async function settings() {

  let members = [];


  if (family) {

    const {
      data,
      error
    } = await sb
      .from("profiles")
      .select(
        "display_name,role"
      )
      .eq(
        "family_id",
        family.id
      );

    if (error) {
      console.error(error);
    }

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
          同じ家族データに相手を招待できます。
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
          💊 薬・サプリ
        </div>

        <button
          class="btn soft"
          onclick="manageMeds()"
        >
          💊 薬・サプリを管理
        </button>

      </div>


      <div class="card">

        <div class="section-title">
          🔔 通知
        </div>

        <p class="hint">
          「相手に知らせる」を押したときの通知設定です。
          Web Pushは別途接続が必要です。
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
          onclick="logout()"
        >
          ログアウト
        </button>

      </div>

    </main>

    ${nav("settings")}
  `;
}


/* =========================================================
   💊 薬管理
========================================================= */

async function manageMeds() {

  const list =
    await meds();


  const html =
    list
      .map(m => `
        <div
          style="
            display:flex;
            align-items:center;
            gap:10px;
            background:#faf7ff;
            padding:12px;
            border-radius:15px;
            margin-bottom:8px;
          "
        >

          <span style="font-size:28px">
            ${esc(m.icon || "💊")}
          </span>

          <div style="flex:1">

            <b>
              ${esc(m.name)}
            </b>

            ${
              m.description
                ? `
                  <div class="hint">
                    ${esc(m.description)}
                  </div>
                `
                : ""
            }

          </div>

        </div>
      `)
      .join("");


  modal(
    "💊 薬・サプリ管理",
    `
      <button
        class="btn primary"
        style="width:100%;margin-bottom:12px"
        onclick="addMed()"
      >
        ＋ 薬・サプリを追加
      </button>

      ${
        html ||
        `
          <div class="empty">
            まだ登録されていません
          </div>
        `
      }
    `
  );
}


/* =========================================================
   🔔 通知
========================================================= */

async function notifyPartner() {

  /*
    Web Pushの実送信は、
    
    Service Worker
      ↓
    push_subscriptions
      ↓
    Supabase Edge Function
      ↓
    Web Push
    
    が必要。

    現段階では通知UIのみ。
  */

  flash(
    "🔔 通知機能は次工程で接続します！"
  );
}


/* =========================================================
   📒 全履歴
========================================================= */

async function allRecords() {

  const {
    data,
    error
  } = await sb
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
   ログアウト
========================================================= */

async function logout() {

  const {
    error
  } = await sb.auth.signOut();

  if (error) {
    flash(error.message);
    return;
  }

  user = null;
  profile = null;
  family = null;
  pregnancy = null;

  auth();
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

/* =========================================================
   💩＆💊アプリ
   完全版 app.js
========================================================= */

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
  comment: "💬",
  note: "📝"
};


/* =========================================================
   🔔 通知 / Web Push
   重要：通知機能はログイン画面・通常アプリ起動から完全分離。
   通知側でエラーが起きてもアプリ本体は停止しません。
========================================================= */

// ここには「VAPID公開鍵」だけを入れます。秘密鍵は絶対に入れないでください。
// 以前生成した vapid.txt の PUBLIC KEY をそのまま貼り付けてください。
const VAPID_PUBLIC_KEY = "BJYEmRReeH1tVq966Ax0rokY7sfoya8qwzpBCi3Z_n3wprAzBUNKV1-A0VsJQbeAIpuX2hDv1sYvzleMto3yYeg";
const PUSH_SW_PATH = "./sw.js";

function notificationSupported() {
  return (
    window.isSecureContext &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function registerPushServiceWorker() {
  try {
    if (!notificationSupported()) return null;
    const reg = await navigator.serviceWorker.register(PUSH_SW_PATH, { scope: "./" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.warn("Service Worker登録失敗（アプリ本体には影響なし）", e);
    return null;
  }
}

async function getPushSubscription() {
  try {
    const reg = await registerPushServiceWorker();
    if (!reg) return null;
    return await reg.pushManager.getSubscription();
  } catch (e) {
    console.warn("Push購読取得失敗", e);
    return null;
  }
}

async function enablePushNotifications() {
  if (!user) {
    flash("先にログインしてください");
    return;
  }

  if (!notificationSupported()) {
    flash("iPhoneではSafariからホーム画面に追加したPWAで利用してください");
    return;
  }

  if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.includes("PASTE_YOUR")) {
    flash("VAPID公開鍵をapp.jsに設定してください");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      flash("通知が許可されませんでした。iPhoneの設定を確認してください");
      return;
    }

    const reg = await registerPushServiceWorker();
    if (!reg) throw new Error("Service Workerを登録できませんでした");

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    const json = subscription.toJSON();
    const keys = json.keys || {};

    // 既存のSupabaseスキーマ（endpoint UNIQUE / p256dh / auth）に合わせて保存。
    // push_subscriptions に enabled や subscription JSON が無くても動くようにしています。
    const result = await sb
      .from("push_subscriptions")
      .upsert({
        user_id: user.id,
        family_id: profile?.family_id || null,
        endpoint: json.endpoint,
        p256dh: keys.p256dh || "",
        auth: keys.auth || "",
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString()
      }, { onConflict: "endpoint" });

    if (result.error) throw result.error;

    await saveNotificationPreference(true);
    flash("🔔 通知をONにしました！");
    render();
  } catch (e) {
    console.error("Push有効化エラー", e);
    flash("通知設定に失敗しました：" + (e.message || e));
  }
}

async function disablePushNotifications() {
  try {
    const subscription = await getPushSubscription();
    if (subscription) await subscription.unsubscribe();

    if (user) {
      // 既存スキーマでは push_subscriptions に enabled 列がないため、購読自体を削除します。
      await sb.from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);
      await saveNotificationPreference(false);
    }

    flash("🔕 通知をOFFにしました");
    render();
  } catch (e) {
    console.error(e);
    flash("通知OFFに失敗しました");
  }
}

async function saveNotificationPreference(enabledOverride = null) {
  if (!user) return;
  const time = document.getElementById("notifyTime")?.value || localStorage.getItem("notifyTime") || "20:00";
  const message = document.getElementById("notifyMessage")?.value || localStorage.getItem("notifyMessage") || "今日の体調・服薬記録はしましたか？";
  const checkbox = document.getElementById("notifyEnabled");
  const enabled = enabledOverride === null
    ? (checkbox ? checkbox.checked : localStorage.getItem("notifyEnabled") === "true")
    : enabledOverride;
  const notifyOnRecordCheckbox = document.getElementById("notifyOnRecord");
  const notifyOnRecord = notifyOnRecordCheckbox
    ? notifyOnRecordCheckbox.checked
    : localStorage.getItem("notifyOnRecord") !== "false";

  localStorage.setItem("notifyTime", time);
  localStorage.setItem("notifyMessage", message);
  localStorage.setItem("notifyEnabled", String(enabled));
  localStorage.setItem("notifyOnRecord", String(notifyOnRecord));

  try {
    const { error } = await sb
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        family_id: profile?.family_id || null,
        enabled,
        notify_on_record: notifyOnRecord,
        daily_time: time,
        message,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo",
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    if (error) console.warn("通知設定DB保存失敗", error);
  } catch (e) {
    console.warn("通知設定DB保存失敗", e);
  }
}

async function notifyFamilyRecord(type, detail = "") {
  try {
    if (!user || !profile?.family_id) return;
    const { data, error } = await sb.functions.invoke("send-notifications", {
      body: {
        event: "record",
        user_id: user.id,
        family_id: profile.family_id,
        record_type: type,
        detail
      }
    });
    if (error) {
      console.warn("相方への記録通知に失敗", error);
      flash("⚠️ 相方への通知に失敗：" + (error.message || error));
      return;
    }
    console.log("record notify result", data);
    if (!data?.sent) {
      flash("📭 通知は送信されましたが、届く相手がいませんでした（相方の通知設定を確認してください）");
    }
  } catch (e) {
    // 記録保存そのものは成功しているので、通知失敗では記録を巻き戻さない。
    console.warn("相方への記録通知に失敗", e);
    flash("⚠️ 相方への通知に失敗：" + (e.message || e));
  }
}

async function saveNotificationSettingsFromUI() {
  await saveNotificationPreference(null);
  flash("💾 通知設定を保存しました");
}

async function testPushNotification() {
  try {
    if (!user) {
      flash("先にログインしてください");
      return;
    }

    flash("🧪 送信中…");

    const sub = await getPushSubscription();
    if (!sub || Notification.permission !== "granted") {
      flash("先に「通知をONにする」を設定してください（購読が見つかりません）");
      return;
    }

    // Edge Function経由で送るため、アプリを閉じた状態のPushも確認できます。
    // 通信が固まって無反応に見えるのを防ぐため、10秒でタイムアウトさせます。
    const invokePromise = sb.functions.invoke("send-notifications", {
      body: { test: true, user_id: user.id }
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("サーバーからの応答がありません（タイムアウト）")), 10000)
    );

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

    if (error) throw error;
    flash(data?.sent ? "🔔 サーバーからテスト通知を送信しました！" : "📭 通知先がありません");
  } catch (e) {
    console.error(e);
    flash("テスト通知に失敗しました：" + (e?.message || String(e)));
  }
}

async function notificationStatus() {
  const subscription = await getPushSubscription();
  return !!subscription && Notification.permission === "granted";
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

const dk = d => {
  const x = new Date(d);

  return `${x.getFullYear()}-${String(
    x.getMonth() + 1
  ).padStart(2, "0")}-${String(
    x.getDate()
  ).padStart(2, "0")}`;
};

const fmt = s => {
  if (!s) return "-";

  const d = new Date(
    String(s).includes("T")
      ? s
      : `${s}T00:00:00`
  );

  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const tm = s => {
  if (!s) return "";

  return new Date(s).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

function localDateTimeValue(s) {
  if (!s) return "";

  const d = new Date(s);

  const local = new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
}

function flash(text) {

  const stackIndex = document.querySelectorAll(".app-flash").length;

  const x = document.createElement("div");

  x.className = "app-flash";
  x.textContent = text;

  x.style = `
    position:fixed;
    z-index:99999;
    left:50%;
    top:${18 + stackIndex * 56}px;
    transform:translateX(-50%);
    background:#392d42;
    color:#fff;
    padding:13px 18px;
    border-radius:18px;
    font-weight:900;
    box-shadow:0 8px 30px #0004;
    max-width:90%;
    text-align:center;
    font-size:14px;
  `;

  document.body.appendChild(x);

  setTimeout(() => x.remove(), 2400);
}

function flashUndo(text, onUndo) {

  const stackIndex = document.querySelectorAll(".app-flash").length;

  const x = document.createElement("div");

  x.className = "app-flash";

  x.style = `
    position:fixed;
    z-index:99999;
    left:50%;
    top:${18 + stackIndex * 56}px;
    transform:translateX(-50%);
    background:#392d42;
    color:#fff;
    padding:10px 10px 10px 18px;
    border-radius:18px;
    font-weight:900;
    box-shadow:0 8px 30px #0004;
    max-width:92%;
    display:flex;
    align-items:center;
    gap:10px;
    font-size:14px;
  `;

  const label = document.createElement("span");
  label.textContent = text;

  const undoBtn = document.createElement("button");
  undoBtn.textContent = "↩️ 元に戻す";
  undoBtn.style = `
    background:#fff;
    color:#392d42;
    border:none;
    border-radius:12px;
    padding:6px 12px;
    font-weight:900;
    font-size:13px;
    flex-shrink:0;
  `;

  undoBtn.onclick = () => {
    x.remove();
    onUndo();
  };

  x.appendChild(label);
  x.appendChild(undoBtn);

  document.body.appendChild(x);

  setTimeout(() => x.remove(), 6000);
}


/* =========================================================
   💩 ファニーウンチ演出
========================================================= */

function poopExplosion() {

  const emojis = [
    "💩",
    "💩",
    "💩",
    "🟤",
    "💩",
    "💩",
    "🟫",
    "💩",
    "💩",
    "🤎",
    "💩",
    "💩"
  ];

  emojis.forEach((emoji, i) => {

    const x = document.createElement("div");

    x.textContent = emoji;

    const angle =
      (Math.PI * 2 / emojis.length) * i;

    const distance =
      120 + Math.random() * 180;

    x.style = `
      position:fixed;
      z-index:99998;
      left:50%;
      top:48%;
      font-size:${28 + Math.random() * 32}px;
      pointer-events:none;
      transform:translate(-50%,-50%);
      animation:poopFly .9s cubic-bezier(.2,.8,.2,1) forwards;
      --x:${Math.cos(angle) * distance}px;
      --y:${Math.sin(angle) * distance}px;
      --r:${Math.random() * 720 - 360}deg;
    `;

    document.body.appendChild(x);

    setTimeout(() => x.remove(), 1000);
  });
}


/* =========================================================
   💊 お薬ブワッ演出
========================================================= */

function pillExplosion() {

  const emojis = [
    "💊", "💊", "💊", "💊",
    "💊", "💊", "💊", "💊"
  ];

  emojis.forEach((emoji, i) => {

    const x = document.createElement("div");

    x.textContent = emoji;

    const angle =
      (Math.PI * 2 / emojis.length) * i;

    const distance =
      100 + Math.random() * 150;

    x.style = `
      position:fixed;
      z-index:99998;
      left:50%;
      top:48%;
      font-size:${26 + Math.random() * 26}px;
      pointer-events:none;
      transform:translate(-50%,-50%);
      animation:poopFly .9s cubic-bezier(.2,.8,.2,1) forwards;
      --x:${Math.cos(angle) * distance}px;
      --y:${Math.sin(angle) * distance}px;
      --r:${Math.random() * 720 - 360}deg;
    `;

    document.body.appendChild(x);

    setTimeout(() => x.remove(), 1000);
  });
}


/* =========================================================
   モーダル
========================================================= */

function modal(title, html) {

  const old = document.querySelector(".overlay");

  if (old) old.remove();

  const o = document.createElement("div");

  o.className = "overlay";

  o.innerHTML = `
    <div class="modal">

      <button
        class="close"
        onclick="this.closest('.overlay').remove()"
      >×</button>

      <h2 style="padding-right:44px">${title}</h2>

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
   CSS追加
========================================================= */

function injectExtraCSS() {

  if (document.getElementById("app-extra-css")) return;

  const style = document.createElement("style");

  style.id = "app-extra-css";

  style.textContent = `

    * {
      box-sizing:border-box;
    }

    html,body {
      margin:0;
      padding:0;
      width:100%;
      max-width:100%;
      min-width:0;
      overflow-x:hidden;
    }

    #app {
      width:100%;
      max-width:100%;
      min-width:0;
      overflow-x:hidden;
    }

    body {
      padding-bottom:92px;
    }

    button,
    input,
    select,
    textarea {
      font:inherit;
    }

    button {
      -webkit-tap-highlight-color:transparent;
    }

    .hero {
      position:relative;
      overflow:hidden;
      padding:22px 20px 26px;
      text-align:center;
    }

    .hero h1 {
      margin:0;
      font-size:38px;
      line-height:1.1;
      color:#fff;
      -webkit-text-stroke:2px #5a2f96;
      text-shadow:
        0 4px 0 #5a2f96,
        0 8px 18px #2a123f66;
      letter-spacing:.01em;
    }

    .date {
      flex:1;
      min-width:0;
      text-align:center;
      font-weight:900;
      font-size:16px;
      color:#3d2c52;
    }

    .datebar button {
      background:#f1ecff;
      color:#5f3d99;
      border-radius:14px;
      font-size:18px;
      font-weight:900;
    }

    .stats {
      margin-bottom:16px !important;
    }

    .hero p {
      margin:6px 0 0;
      font-size:15px;
      font-weight:800;
      color:#fff;
      opacity:.92;
    }

    .hero .notice {
      margin-top:14px !important;
    }

    .hero .toilet {
      display:none !important;
    }

    .notice {
      color:#5b416b !important;
      background:#fff2a8 !important;
      border:2px solid #f1d96b;
      text-shadow:none !important;
    }

    .notice,
    .notice * {
      color:#5b416b !important;
      text-shadow:none !important;
    }

    /* 下部4タブをiPhone幅でも必ず均等配置 */
    .nav {
      position:fixed !important;
      inset:auto 0 0 0 !important;
      left:0 !important;
      right:0 !important;
      bottom:0 !important;
      width:100vw !important;
      max-width:none !important;
      min-width:0 !important;
      margin:0 !important;
      transform:none !important;
      z-index:10000 !important;
      display:grid !important;
      grid-template-columns:repeat(4,minmax(0,1fr)) !important;
      align-items:stretch !important;
      justify-items:stretch !important;
      padding:7px 8px calc(7px + env(safe-area-inset-bottom)) !important;
      gap:5px !important;
      box-sizing:border-box !important;
      overflow:visible !important;
    }

    .nav button {
      display:flex !important;
      flex-direction:column !important;
      align-items:center !important;
      justify-content:center !important;
      min-width:0 !important;
      max-width:none !important;
      width:100% !important;
      margin:0 !important;
      padding:6px 2px !important;
      font-size:11px !important;
      line-height:1.15 !important;
      white-space:nowrap !important;
      overflow:hidden !important;
    }

    .nav button span {
      display:block;
      font-size:21px;
      line-height:22px;
      margin-bottom:2px;
    }

    .nav button b {
      font-size:11px;
      line-height:1.15;
      font-weight:900;
    }

    .calendar-link {
      flex:0 0 42px !important;
      width:42px !important;
      min-width:42px !important;
      height:42px !important;
      padding:0 !important;
      display:grid !important;
      place-items:center !important;
      font-size:22px !important;
      line-height:1 !important;
    }

    .calendar-link span {
      display:block;
      font-size:22px;
      line-height:1;
      margin:0;
    }

    .modal-sticky-actions {
      position:sticky;
      bottom:-18px;
      padding:10px 0 18px;
      background:linear-gradient(to bottom, rgba(255,255,255,.82), #fff 28%);
      z-index:5;
    }

    .modal-sticky-actions .btn {
      width:100%;
      min-height:50px;
      font-size:16px;
    }

    .modal {
      position:relative;
    }

    .close {
      position:absolute;
      top:14px;
      right:14px;
      z-index:20;
      width:36px;
      height:36px;
      border:none;
      border-radius:50%;
      background:#f1ecff;
      color:#5f3d99;
      font-size:20px;
      font-weight:900;
      line-height:1;
      display:flex;
      align-items:center;
      justify-content:center;
    }

    .panel {
      width:100%;
      max-width:720px;
      margin:0 auto;
      padding-left:12px !important;
      padding-right:12px !important;
      padding-bottom:150px !important;
    }

    .card {
      width:100%;
      max-width:100%;
      overflow:hidden;
      background:#fff;
      border-radius:22px;
      padding:16px;
      margin-bottom:16px;
      box-shadow:0 6px 24px #37194b1a;
      animation:cardIn .35s cubic-bezier(.2,.8,.2,1) backwards;
    }

    @keyframes cardIn {
      0% {
        opacity:0;
        transform:translateY(10px) scale(.98);
      }
      100% {
        opacity:1;
        transform:translateY(0) scale(1);
      }
    }

    .stat, .poop, .med {
      animation:cardIn .3s cubic-bezier(.2,.8,.2,1) backwards;
    }

    .stats {
      display:grid !important;
      grid-template-columns:repeat(4,minmax(0,1fr)) !important;
      gap:7px !important;
    }

    .stat {
      min-width:0;
      overflow:hidden;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:2px;
      padding:12px 4px;
      border-radius:18px;
      background:#f3eefc;
      box-shadow:0 3px 10px #37194b12;
    }

    .stat-poop {
      background:linear-gradient(160deg,#ffe4c2,#ffd39c);
    }

    .stat-med {
      background:linear-gradient(160deg,#d7f5df,#b9ecc7);
    }

    .stat-vomit {
      background:linear-gradient(160deg,#ffd9e6,#ffbdd4);
    }

    .stat-weight {
      background:linear-gradient(160deg,#cdeeff,#a9e0fb);
    }

    .stat b {
      font-size:18px;
      color:#3d2c52;
    }

    .stat small {
      font-size:10px;
      font-weight:800;
      color:#5c4b70;
    }

    .input, textarea.input, select.input {
      width:100%;
      min-width:0;
      max-width:100%;
      box-sizing:border-box;
      border:2px solid #eee0ff;
      background:#faf7ff;
      border-radius:14px;
      padding:12px 14px;
      font-size:15px;
      color:#3d2c52;
      font-weight:700;
      margin-bottom:10px;
    }

    input[type="date"].input,
    input[type="time"].input,
    input[type="datetime-local"].input {
      -webkit-appearance:none;
      appearance:none;
    }

    .input:focus, textarea.input:focus, select.input:focus {
      outline:none;
      border-color:#b79fe8;
    }

    textarea.input {
      resize:vertical;
      min-height:64px;
      font-weight:500;
    }

    .form-grid {
      display:flex;
      flex-direction:column;
      gap:2px;
    }

    label {
      font-weight:800;
      color:#4a3468;
      font-size:13px;
    }

    input[type="checkbox"] {
      width:18px;
      height:18px;
      accent-color:#7c5cc4;
    }

    .hint {
      font-size:12px;
      color:#8d8291;
      line-height:1.5;
      margin:4px 0 10px;
    }

    .quick-grid {
      display:grid !important;
      grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      gap:8px !important;
      margin-bottom:22px !important;
    }

    .quick-grid + .card {
      margin-top:22px !important;
    }

    button {
      font-family:inherit;
    }

    .btn {
      display:flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      width:100%;
      border:none;
      border-radius:16px;
      padding:15px 12px;
      font-weight:900;
      font-size:15px;
      cursor:pointer;
      background:#f1ecff;
      color:#5f3d99;
      box-shadow:0 3px 10px #37194b14;
      transition:transform .12s ease;
    }

    .btn:active {
      transform:scale(.97);
    }

    .btn.primary {
      background:linear-gradient(135deg,#9b7bd8,#7c5cc4);
      color:#fff;
    }

    .btn.soft {
      background:linear-gradient(135deg,#f6f0ff,#e9defc);
      color:#5f3d99;
    }

    .btn.pink {
      background:linear-gradient(135deg,#ff9fc0,#ff6f9c);
      color:#fff;
    }

    .btn.danger {
      background:#ffe3e6;
      color:#d23a55;
    }

    .section-title {
      font-weight:900;
      font-size:15px;
      color:#4a3468;
      margin-bottom:12px;
    }

    .poop-grid, .med-grid {
      position:relative;
    }

    .poop, .med, .addmed {
      position:relative;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:4px;
      border:none;
      border-radius:18px;
      padding:16px 8px;
      font-weight:900;
      font-size:14px;
      cursor:pointer;
      overflow:hidden;
      box-shadow:0 4px 14px #37194b1f;
      transition:transform .12s ease;
      color:#fff;
    }

    .poop:active, .med:active, .addmed:active {
      transform:scale(.96);
    }

    .poop .emoji, .med .emoji {
      font-size:30px;
      line-height:1;
    }

    .poop.koro {
      background:linear-gradient(150deg,#a9795a,#7a5138);
    }

    .poop.banana {
      background:linear-gradient(150deg,#ffd76a,#f4a723);
      color:#5c3d10;
    }

    .poop.becha {
      background:linear-gradient(150deg,#ffc861,#ff8a3d);
      color:#5c2f10;
    }

    .poop.liquid {
      background:linear-gradient(150deg,#7fd4f5,#3aa3e0);
    }

    .med {
      background:#fff;
      color:#3a5fc4;
      border:2px solid #6f8cff;
      box-shadow:0 3px 10px #37194b12;
    }

    .addmed {
      background:#f6f2ff;
      color:#7c5cc4;
      border:2px dashed #b79fe8;
      box-shadow:none;
    }

    .splash {
      position:absolute;
      inset:0;
      pointer-events:none;
    }

    .splash i {
      display:none;
    }

    .poop-grid {
      display:grid !important;
      grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      gap:10px !important;
    }

    .med-grid {
      display:grid !important;
      grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      gap:8px !important;
    }

    .calendar {
      width:100%;
      display:grid !important;
      grid-template-columns:repeat(7,minmax(0,1fr)) !important;
      gap:3px !important;
    }

    .day {
      min-width:0 !important;
      min-height:67px !important;
      padding:5px 2px !important;
      overflow:hidden;
      border:none;
      background:#faf7ff;
      border-radius:12px;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:flex-start;
      gap:3px;
      color:#3d2c52;
      font-weight:700;
    }

    .day b {
      font-size:14px;
      font-weight:900;
    }

    .day .dot {
      font-size:12px;
      display:inline-block;
    }

    .day.other {
      opacity:.35;
      background:transparent;
    }

    .day.today {
      background:linear-gradient(160deg,#ffe4c2,#ffd39c);
    }

    .day.today b {
      color:#7a4a10;
    }

    .day.selected {
      outline:2px solid #9b7bd8;
      outline-offset:-2px;
      border-radius:12px;
      background:linear-gradient(160deg,#e9defc,#d9c8f7);
    }

    .entry {
      display:flex;
      align-items:flex-start;
      gap:8px;
      margin:10px 0;
      max-width:84%;
    }

    .entry .ico {
      font-size:22px;
      line-height:1;
      flex-shrink:0;
      margin-top:2px;
    }

    .entry .meta {
      background:#fff;
      border-radius:4px 16px 16px 16px;
      padding:9px 13px;
      box-shadow:0 2px 10px #37194b14;
      min-width:0;
    }

    .meta-title {
      font-weight:900;
      font-size:15px;
      color:#3d2c52;
    }

    .meta-time {
      font-size:11px;
      color:#a099a8;
      font-weight:700;
      margin-top:2px;
    }

    .meta-comment {
      font-size:13px;
      color:#5c4b70;
      margin-top:4px;
      line-height:1.4;
    }

    .entry-partner {
      margin-right:auto;
    }

    .entry-mine {
      margin-left:auto;
      flex-direction:row-reverse;
      text-align:right;
    }

    .entry-mine .meta {
      background:#efe6ff;
      border-radius:16px 4px 16px 16px;
    }

    .entry .record-actions {
      justify-content:flex-start;
    }

    .entry-mine .record-actions {
      justify-content:flex-end;
    }

    .reaction-row {
      display:flex;
      flex-wrap:wrap;
      gap:5px;
      margin-top:6px;
    }

    .entry-mine .reaction-row {
      justify-content:flex-end;
    }

    .reaction-chip {
      border:none;
      background:#f1ecff;
      border-radius:12px;
      padding:3px 9px;
      font-size:12px;
      font-weight:700;
      color:#5f3d99;
    }

    .reaction-chip-mine {
      background:#9b7bd8;
      color:#fff;
    }

    .react-mini {
      border:none;
      background:#f1ecff;
      border-radius:10px;
      padding:4px 9px;
      font-size:14px;
    }

    .reaction-picker {
      position:fixed;
      z-index:99998;
      display:flex;
      gap:4px;
      background:#fff;
      border-radius:16px;
      padding:8px;
      box-shadow:0 8px 30px #0004;
    }

    .reaction-picker button {
      border:none;
      background:none;
      font-size:22px;
      padding:4px;
      cursor:pointer;
    }

    .tabs {
      display:flex;
      overflow-x:auto;
      gap:6px;
      padding-bottom:5px;
      scrollbar-width:none;
    }

    .tabs::-webkit-scrollbar {
      display:none;
    }

    .tab {
      flex:0 0 auto;
      border:none;
      background:#f1ecff;
      color:#5f3d99;
      font-weight:800;
      font-size:13px;
      padding:8px 14px;
      border-radius:14px;
      cursor:pointer;
    }

    .tab.active {
      background:linear-gradient(135deg,#9b7bd8,#7c5cc4);
      color:#fff;
    }

    .overlay {
      z-index:20000 !important;
      padding-bottom:env(safe-area-inset-bottom);
    }

    .modal {
      max-height:90vh !important;
      padding-bottom:calc(18px + env(safe-area-inset-bottom)) !important;
    }

    .record-actions {
      display:flex;
      gap:5px;
      margin-top:7px;
    }

    .record-actions button {
      flex:1;
      border:0;
      border-radius:10px;
      padding:7px;
      font-weight:900;
      cursor:pointer;
    }

    .edit-mini {
      background:#eee7ff;
      color:#654b91;
    }

    .delete-mini {
      background:#ffe4e4;
      color:#b53b3b;
    }

    .event-item,
    .checkup-item,
    .question-item {
      background:#faf7ff;
      border-radius:16px;
      padding:12px;
      margin:8px 0;
    }

    .event-date {
      font-size:12px;
      font-weight:900;
      color:#886b99;
    }

    .event-title {
      font-size:16px;
      font-weight:1000;
      margin-top:3px;
    }

    .question-done {
      opacity:.55;
      text-decoration:line-through;
    }

    .mini-btn {
      border:0;
      border-radius:10px;
      padding:7px 10px;
      font-weight:900;
      cursor:pointer;
    }

    .mini-edit {
      background:#ece4ff;
    }

    .mini-delete {
      background:#ffe0e0;
    }

    .mini-done {
      background:#dff7e7;
    }

    .family-history-list {
      max-height:55vh;
      overflow-y:auto;
    }

    @keyframes poopFly {
      0% {
        opacity:1;
        transform:translate(-50%,-50%) scale(.3) rotate(0);
      }

      70% {
        opacity:1;
      }

      100% {
        opacity:0;
        transform:
          translate(
            calc(-50% + var(--x)),
            calc(-50% + var(--y))
          )
          scale(1.15)
          rotate(var(--r));
      }
    }

    @media(max-width:380px) {

      body {
        padding-bottom:88px;
      }

      .nav {
        padding-left:5px !important;
        padding-right:5px !important;
        gap:3px !important;
      }

      .nav button {
        padding-left:1px !important;
        padding-right:1px !important;
        font-size:10px !important;
      }

      .nav button span {
        font-size:20px !important;
      }

      .stats {
        gap:4px !important;
      }

      .stat b {
        font-size:15px;
      }

      .quick-grid {
        gap:6px !important;
      }

      .nav button {
        font-size:10px !important;
      }

    }

  `;

  document.head.appendChild(style);
}


/* =========================================================
   起動
========================================================= */

async function boot() {

  injectExtraCSS();

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

  // 通知の初期化は「ログイン後」に限定。失敗してもアプリ本体は止めない。
  try {
    const notifyEnabled = localStorage.getItem("notifyEnabled") === "true";
    if (notifyEnabled) await registerPushServiceWorker();
  } catch (e) {
    console.warn("通知初期化失敗（無視）", e);
  }

  render();
}


/* =========================================================
   Profile
========================================================= */

async function loadProfile() {

  const {
    data,
    error
  } = await sb
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
   Family / Pregnancy
========================================================= */

async function loadFamily() {

  if (!profile?.family_id) {
    family = null;
    pregnancy = null;
    return;
  }

  const {
    data: f,
    error: familyError
  } = await sb
    .from("families")
    .select("*")
    .eq("id", profile.family_id)
    .maybeSingle();

  if (familyError) {
    console.error(familyError);
  }

  family = f || null;

  /*
    現在の pregnancies テーブルで確実に存在する
    family_id / due_date のみ利用する
  */

  const {
    data: p,
    error: pregnancyError
  } = await sb
    .from("pregnancies")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("due_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (pregnancyError) {
    console.error(pregnancyError);
  }

  pregnancy = p || null;
}


/* =========================================================
   Config
========================================================= */

function config() {

  app.innerHTML = `
    <div class="auth">
      <div class="auth-card">

        <h1>💩＆💊</h1>

        <div class="notice">
          Supabase設定が必要です
        </div>

        <p class="hint">
          app.js冒頭の設定を確認してください。
        </p>

      </div>
    </div>
  `;
}


/* =========================================================
   Auth
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
    document.getElementById("email")?.value.trim();

  const passValue =
    document.getElementById("pass")?.value;

  if (!emailValue || !passValue) {
    flash("メールアドレスとパスワードを入力してください");
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

  if (user) {
    onboarding();
  } else {
    flash("確認メールを確認してください");
  }
}


/* =========================================================
   Onboarding
========================================================= */

function onboarding() {

  app.innerHTML = `
    <div class="auth">

      <div class="auth-card">

        <h1>🌈 はじめよう</h1>

        <p class="hint">
          家族を作る人は「家族を作る」。<br>
          すでに家族がある場合は招待コードで参加できます。
        </p>

        <div class="form-grid">

          <input
            id="name"
            class="input"
            placeholder="表示名"
          >

          <select id="role" class="input">

            <option value="wife">👩 妻</option>
            <option value="husband">👨 夫</option>

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
            👩‍❤️‍👨 家族を作る
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
   Family Create
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
    flash(familyError.message);
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
    flash(profileError.message);
    return;
  }

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
    console.warn(
      "妊娠情報保存:",
      pregnancyError.message
    );
  }

  await loadProfile();
  await loadFamily();

  flash("🎉 家族を作りました！");

  render();
}


/* =========================================================
   Join Family
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

  /*
    familiesを直接SELECTしない。
    RPCで招待コードを検索して参加する。
  */

  const {
    data,
    error
  } = await sb.rpc(
    "join_family_by_invite_code",
    {
      p_invite_code: code,
      p_display_name: n,
      p_role: r
    }
  );

  if (error) {
    console.error(error);
    flash(error.message);
    return;
  }

  if (!data) {
    flash("家族への参加に失敗しました");
    return;
  }

  await loadProfile();
  await loadFamily();

  flash("👩‍❤️‍👨 家族に参加しました！");

  render();
}


/* =========================================================
   Invite
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
        style="
          font-size:38px;
          letter-spacing:7px;
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
        📋 コピー
      </button>

      <button
        class="btn soft"
        style="width:100%;margin-top:8px"
        onclick="shareInvite('${esc(code)}')"
      >
        📤 共有
      </button>
    `
  );
}


async function copyInvite(code) {

  try {

    await navigator.clipboard.writeText(code);

    flash("📋 コピーしました！");

  } catch {

    flash("招待コード：" + code);

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

    copyInvite(code);

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
  } = await sb
    .from("health_records")
    .insert({
      family_id: profile.family_id,
      profile_id: user.id,
      record_type: type,
      recorded_at:
        recordedAt ||
        new Date().toISOString(),
      comment
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}


function quickCommentEnabled() {
  return localStorage.getItem("quickCommentEnabled") !== "false"; // デフォルトON
}

function askQuickComment(label) {
  if (!quickCommentEnabled()) return "";
  return prompt(label) ?? "";
}


/* =========================================================
   💬 コメント（独立した記録タイプ）
========================================================= */

function addCommentForm() {

  modal(
    "💬 コメントを残す",
    `
      <textarea
        id="freeCommentText"
        class="input textarea"
        placeholder="ひとこと残そう…"
        rows="4"
      ></textarea>

      <div class="modal-sticky-actions">
        <button class="btn primary" onclick="saveFreeComment()">
          💬 コメントを保存
        </button>
      </div>
    `
  );
}

async function saveFreeComment() {

  const text =
    document
      .getElementById("freeCommentText")
      ?.value
      ?.trim();

  if (!text) {
    flash("コメントを入力してください");
    return;
  }

  try {

    await hr("comment", text);

    await notifyFamilyRecord("comment", `「${text}」とコメントしました`);

    closeModal();

    flash("💬 コメントを保存しました");

    render();

  } catch (e) {

    flash("コメントの保存に失敗：" + (e.message || e));
  }
}


/* =========================================================
   💩 Poop
========================================================= */

async function poopAdd(type, button) {

  poopExplosion();

  if (button) {

    button.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.18) rotate(-4deg)" },
        { transform: "scale(.95) rotate(4deg)" },
        { transform: "scale(1)" }
      ],
      {
        duration:450,
        easing:"ease-out"
      }
    );

  }

  const comment =
    askQuickComment("💬 ウンチへのコメント（任意）");

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

    if (error) throw error;

    await notifyFamilyRecord("poop", `${poop[type]?.[0] || "ウンチ"}を記録しました`);
    flash("💩 ブワァァァッ！！記録したよ！");

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
   💊 Medication
========================================================= */

async function meds() {

  const {
    data,
    error
  } = await sb
    .from("medications")
    .select("*")
    .eq(
      "family_id",
      profile.family_id
    )
    .eq("is_active", true)
    .order("created_at");

  if (error) {

    console.error(error);

    return [];
  }

  return data || [];
}


async function medAdd(
  id,
  name,
  icon,
  button
) {

  pillExplosion();

  if (button) {

    button.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.18) rotate(-4deg)" },
        { transform: "scale(.95) rotate(4deg)" },
        { transform: "scale(1)" }
      ],
      {
        duration:450,
        easing:"ease-out"
      }
    );

  }

  const comment =
    askQuickComment("💬 お薬へのコメント（任意）");

  try {

    const record =
      await hr("medicine", comment);

    const { error } =
      await sb
        .from("medication_logs")
        .insert({
          health_record_id: record.id,
          medication_id: id
        });

    if (error) throw error;

    await notifyFamilyRecord("medicine", `${name}を記録しました`);
    flash(
      `${icon} ブワッ！${name}を飲んだ！`
    );

    render();

  } catch (e) {

    flash(
      "服薬記録に失敗：" +
      e.message
    );
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
          ＋ 登録
        </button>

      </div>
    `
  );
}


async function saveMed() {

  const name =
    document.getElementById("mn")?.value.trim();

  const icon =
    document.getElementById("mi")?.value ||
    "💊";

  const description =
    document.getElementById("md")?.value ||
    "";

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
        is_active:true
      });

  if (error) {
    flash(error.message);
    return;
  }

  closeModal();

  flash("💊 登録しました");

  render();
}


/* =========================================================
   Medication 編集
========================================================= */

async function editMedication(id) {

  const {
    data,
    error
  } = await sb
    .from("medications")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    flash(error.message);
    return;
  }

  modal(
    "✏️ 薬・サプリを編集",
    `
      <div class="form-grid">

        <input
          id="editMedName"
          class="input"
          value="${esc(data.name)}"
        >

        <input
          id="editMedIcon"
          class="input"
          value="${esc(data.icon || "💊")}"
        >

        <input
          id="editMedDescription"
          class="input"
          value="${esc(data.description || "")}"
        >

        <button
          class="btn primary"
          onclick="updateMedication('${id}')"
        >
          💾 保存
        </button>

        <button
          class="btn danger"
          onclick="deleteMedication('${id}')"
        >
          🗑️ 削除
        </button>

      </div>
    `
  );
}


async function updateMedication(id) {

  const name =
    document
      .getElementById("editMedName")
      ?.value.trim();

  const icon =
    document
      .getElementById("editMedIcon")
      ?.value || "💊";

  const description =
    document
      .getElementById("editMedDescription")
      ?.value || "";

  if (!name) {
    flash("名前を入力してください");
    return;
  }

  const { error } =
    await sb
      .from("medications")
      .update({
        name,
        icon,
        description
      })
      .eq("id", id);

  if (error) {
    flash(error.message);
    return;
  }

  closeModal();

  flash("💊 更新しました");

  render();
}


async function deleteMedication(id) {

  if (!confirm(
    "この薬・サプリを登録一覧から削除しますか？"
  )) return;

  /*
    履歴を壊さないため、
    medication_logsがある薬はis_active=falseにする。
  */

  const { error } =
    await sb
      .from("medications")
      .update({
        is_active:false
      })
      .eq("id", id);

  if (error) {
    flash(error.message);
    return;
  }

  closeModal();

  flash("🗑️ 削除しました");

  render();
}


/* =========================================================
   🤢 Vomit
========================================================= */

function addVomit() {

  modal(
    "🤢 吐いた記録",
    `
      <div class="form-grid">

        <input
          id="vomitDateTime"
          class="input"
          type="datetime-local"
          value="${localDateTimeValue(new Date())}"
        >

        <select
          id="vomitSeverity"
          class="input"
        >

          <option value="1">😌 軽い</option>
          <option value="2">😐 少しつらい</option>
          <option value="3" selected>😵 普通</option>
          <option value="4">😫 かなりつらい</option>
          <option value="5">🤮 とてもつらい</option>

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
      document.getElementById(
        "vomitSeverity"
      )?.value
    );

  const comment =
    document.getElementById(
      "vomitComment"
    )?.value || "";

  const recordedAt =
    document.getElementById(
      "vomitDateTime"
    )?.value;

  try {

    const record =
      await hr(
        "vomit",
        comment,
        recordedAt
          ? new Date(recordedAt).toISOString()
          : null
      );

    const { error } =
      await sb
        .from("vomit_records")
        .insert({
          health_record_id:record.id,
          severity,
          comment
        });

    if (error) throw error;

    await notifyFamilyRecord("vomit", "吐いた記録を登録しました");
    closeModal();

    flash("🤢 記録したよ");

    render();

  } catch(e) {

    flash(
      "記録できませんでした：" +
      e.message
    );
  }
}


/* =========================================================
   ⚖️ Weight
========================================================= */

function addWeight() {

  modal(
    "⚖️ 体重を記録",
    `
      <div class="form-grid">

        <input
          id="weightDateTime"
          class="input"
          type="datetime-local"
          value="${localDateTimeValue(new Date())}"
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
      document.getElementById(
        "weightValue"
      )?.value
    );

  const comment =
    document.getElementById(
      "weightComment"
    )?.value || "";

  const recordedAt =
    document.getElementById(
      "weightDateTime"
    )?.value;

  if (!weight) {
    flash("体重を入力してください");
    return;
  }

  try {

    const record =
      await hr(
        "weight",
        comment,
        recordedAt
          ? new Date(recordedAt).toISOString()
          : null
      );

    const { error } =
      await sb
        .from("weight_records")
        .insert({
          health_record_id:record.id,
          weight_kg:weight,
          comment
        });

    if (error) throw error;

    await notifyFamilyRecord("weight", `体重 ${weight}kgを記録しました`);
    closeModal();

    flash("⚖️ 保存したよ");

    render();

  } catch(e) {

    flash(
      "体重を保存できませんでした：" +
      e.message
    );
  }
}


/* =========================================================
   🌸 Period
========================================================= */

function addPeriod() {

  modal(
    "🌸 生理を記録",
    `
      <div class="form-grid">

        <input
          id="periodDateTime"
          class="input"
          type="datetime-local"
          value="${localDateTimeValue(new Date())}"
        >

        <select
          id="periodType"
          class="input"
        >

          <option value="start">🌸 生理開始</option>
          <option value="end">🌸 生理終了</option>
          <option value="pain">😖 生理痛</option>

        </select>

        <select
          id="periodLevel"
          class="input"
        >

          <option value="1">少ない</option>
          <option value="2" selected>普通</option>
          <option value="3">多い</option>

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
    document.getElementById(
      "periodType"
    )?.value;

  const level =
    Number(
      document.getElementById(
        "periodLevel"
      )?.value
    );

  const comment =
    document.getElementById(
      "periodComment"
    )?.value || "";

  const recordedAt =
    document.getElementById(
      "periodDateTime"
    )?.value;

  try {

    const record =
      await hr(
        "period",
        comment,
        recordedAt
          ? new Date(recordedAt).toISOString()
          : null
      );

    const { error } =
      await sb
        .from("period_records")
        .insert({
          health_record_id:record.id,
          period_type:type,
          flow_level:level,
          comment
        });

    if (error) throw error;

    await notifyFamilyRecord("period", "生理記録を登録しました");
    closeModal();

    flash("🌸 生理記録を保存しました");

    render();

  } catch(e) {

    flash(
      "生理記録に失敗：" +
      e.message
    );
  }
}


/* =========================================================
   📒 Health Record 編集
========================================================= */

async function editHealthRecord(id) {

  const {
    data,
    error
  } = await sb
    .from("health_records")
    .select(`
      *,
      poop_records(*),
      medication_logs(
        *,
        medications(*)
      ),
      vomit_records(*),
      weight_records(*),
      period_records(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    flash(error.message);
    return;
  }

  const type = data.record_type;

  let extra = "";

  if (type === "poop") {

    const value =
      data.poop_records?.[0]?.poop_type ||
      "banana";

    extra = `
      <select
        id="editPoopType"
        class="input"
      >
        ${Object.entries(poop).map(
          ([key, val]) => `
            <option
              value="${key}"
              ${key === value ? "selected" : ""}
            >
              ${val[1]} ${val[0]}
            </option>
          `
        ).join("")}
      </select>
    `;

  } else if (type === "medicine") {

    const medsList = await meds();

    const current =
      data.medication_logs?.[0]?.medication_id;

    extra = `
      <select
        id="editMedicineId"
        class="input"
      >
        ${medsList.map(
          m => `
            <option
              value="${m.id}"
              ${m.id === current ? "selected" : ""}
            >
              ${esc(m.icon || "💊")}
              ${esc(m.name)}
            </option>
          `
        ).join("")}
      </select>
    `;

  } else if (type === "vomit") {

    const severity =
      data.vomit_records?.[0]?.severity || 3;

    extra = `
      <select
        id="editVomitSeverity"
        class="input"
      >
        ${[1,2,3,4,5].map(
          n => `
            <option
              value="${n}"
              ${n === severity ? "selected" : ""}
            >
              ${"★".repeat(n)}
            </option>
          `
        ).join("")}
      </select>
    `;

  } else if (type === "weight") {

    const weight =
      data.weight_records?.[0]?.weight_kg || "";

    extra = `
      <input
        id="editWeight"
        class="input"
        type="number"
        step="0.1"
        value="${weight}"
      >
    `;

  } else if (type === "period") {

    const p =
      data.period_records?.[0];

    extra = `
      <select
        id="editPeriodType"
        class="input"
      >
        <option value="start"
          ${p?.period_type === "start" ? "selected" : ""}
        >
          🌸 生理開始
        </option>

        <option value="end"
          ${p?.period_type === "end" ? "selected" : ""}
        >
          🌸 生理終了
        </option>

        <option value="pain"
          ${p?.period_type === "pain" ? "selected" : ""}
        >
          😖 生理痛
        </option>
      </select>
    `;
  }

  modal(
    "✏️ 記録を編集",
    `
      <div class="form-grid">

        <label>
          日時
        </label>

        <input
          id="editRecordDate"
          class="input"
          type="datetime-local"
          value="${localDateTimeValue(data.recorded_at)}"
        >

        ${extra}

        <textarea
          id="editRecordComment"
          class="input textarea"
        >${esc(data.comment || "")}</textarea>

        <button
          class="btn primary"
          onclick="updateHealthRecord('${id}','${type}')"
        >
          💾 保存
        </button>

        <button
          class="btn danger"
          onclick="deleteHealthRecord('${id}')"
        >
          🗑️ この記録を削除
        </button>

      </div>
    `
  );
}


async function updateHealthRecord(id, type) {

  const recorded =
    document.getElementById(
      "editRecordDate"
    )?.value;

  const comment =
    document.getElementById(
      "editRecordComment"
    )?.value || "";

  const { error } =
    await sb
      .from("health_records")
      .update({
        recorded_at:
          recorded
            ? new Date(recorded).toISOString()
            : new Date().toISOString(),
        comment
      })
      .eq("id", id);

  if (error) {
    flash(error.message);
    return;
  }

  if (type === "poop") {

    const value =
      document.getElementById(
        "editPoopType"
      )?.value;

    await sb
      .from("poop_records")
      .update({
        poop_type:value,
        comment
      })
      .eq("health_record_id", id);

  } else if (type === "medicine") {

    const medicationId =
      document.getElementById(
        "editMedicineId"
      )?.value;

    await sb
      .from("medication_logs")
      .update({
        medication_id:medicationId
      })
      .eq("health_record_id", id);

  } else if (type === "vomit") {

    const severity =
      Number(
        document.getElementById(
          "editVomitSeverity"
        )?.value
      );

    await sb
      .from("vomit_records")
      .update({
        severity,
        comment
      })
      .eq("health_record_id", id);

  } else if (type === "weight") {

    const weight =
      parseFloat(
        document.getElementById(
          "editWeight"
        )?.value
      );

    await sb
      .from("weight_records")
      .update({
        weight_kg:weight,
        comment
      })
      .eq("health_record_id", id);

  } else if (type === "period") {

    const periodType =
      document.getElementById(
        "editPeriodType"
      )?.value;

    await sb
      .from("period_records")
      .update({
        period_type:periodType,
        comment
      })
      .eq("health_record_id", id);
  }

  closeModal();

  flash("✏️ 更新しました");

  render();
}


/* =========================================================
   Health Record 削除
========================================================= */

async function deleteHealthRecord(id) {

  if (!confirm(
    "この記録を削除しますか？"
  )) return;

  const { error } =
    await sb
      .from("health_records")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

  if (error) {
    flash(error.message);
    return;
  }

  closeModal();

  flashUndo("🗑️ 削除しました", () => restoreHealthRecord(id));

  render();
}

async function restoreHealthRecord(id) {

  const { error } =
    await sb
      .from("health_records")
      .update({ deleted_at: null })
      .eq("id", id);

  if (error) {
    flash("元に戻すのに失敗：" + error.message);
    return;
  }

  flash("↩️ 元に戻しました");

  render();
}


/* =========================================================
   今日の記録
========================================================= */

async function dayRecords(targetDate) {

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
      profile_id,

      poop_records(
        poop_type,
        comment
      ),

      medication_logs(
        id,
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
      ),

      record_reactions(
        id,
        user_id,
        emoji
      )
    `)
    .eq(
      "family_id",
      profile.family_id
    )
    .gte(
      "recorded_at",
      new Date(`${targetDate}T00:00:00`).toISOString()
    )
    .lt(
      "recorded_at",
      new Date(`${targetDate}T23:59:59.999`).toISOString()
    )
    .is("deleted_at", null)
    .order(
      "recorded_at",
      { ascending:false }
    );

  if (error) {

    console.error(error);

    return [];
  }

  return data || [];
}


/* =========================================================
   Record Entry
========================================================= */

function entry(record) {

  let name =
    record.record_type;

  let icon =
    icons[record.record_type] ||
    "📝";

  if (record.record_type === "poop") {

    const map = {
      korokoro:["コロコロ","🟤"],
      banana:["バナナ","🍌"],
      bechabecha:["ベチャベチャ","💩"],
      liquid:["液体","💧"]
    };

    const value =
      record.poop_records?.[0]?.poop_type;

    [name,icon] =
      map[value] ||
      ["ウンチ","💩"];
  }

  if (record.record_type === "medicine") {

    const medicine =
      record
        .medication_logs?.[0]
        ?.medications;

    name =
      medicine?.name ||
      "薬";

    icon =
      medicine?.icon ||
      "💊";
  }

  if (record.record_type === "vomit") {

    name = "吐いた";

    const severity =
      record
        .vomit_records?.[0]
        ?.severity;

    if (severity) {
      name +=
        ` ${"★".repeat(severity)}`;
    }
  }

  if (record.record_type === "weight") {

    const value =
      record
        .weight_records?.[0]
        ?.weight_kg;

    name =
      `体重 ${value || "-"}kg`;
  }

  if (record.record_type === "period") {

    const p =
      record
        .period_records?.[0]
        ?.period_type;

    if (p === "start") {
      name = "生理開始";
    } else if (p === "end") {
      name = "生理終了";
    } else {
      name = "生理痛";
    }

    icon = "🌸";
  }

  const isComment =
    record.record_type === "comment";

  if (isComment) {
    name = record.comment || "コメント";
    icon = "💬";
  }

  const isMine = record.profile_id === user?.id;

  const reactions = record.record_reactions || [];

  const grouped = {};
  reactions.forEach(r => {
    (grouped[r.emoji] ||= []).push(r.user_id);
  });

  const myReaction =
    reactions.find(r => r.user_id === user?.id)?.emoji;

  const reactionChips =
    Object.entries(grouped)
      .map(([emoji, uids]) => `
        <button
          class="reaction-chip ${uids.includes(user?.id) ? "reaction-chip-mine" : ""}"
          onclick="toggleReaction('${record.id}','${emoji}')"
        >${emoji} ${uids.length}</button>
      `)
      .join("");

  return `
    <div class="entry ${isMine ? "entry-mine" : "entry-partner"}">

      <div class="ico">
        ${icon}
      </div>

      <div class="meta">

        <div class="meta-title">
          ${esc(name)}
        </div>

        <div class="meta-time">
          ${tm(record.recorded_at)}
        </div>

        ${
          record.comment && !isComment
            ? `<div class="meta-comment">💬 ${esc(record.comment)}</div>`
            : ""
        }

        ${
          reactions.length
            ? `<div class="reaction-row">${reactionChips}</div>`
            : ""
        }

        <div class="record-actions">

          <button
            class="react-mini"
            onclick="openReactionPicker('${record.id}', this)"
          >
            ${myReaction ? myReaction : "😊"}
          </button>

          <button
            class="edit-mini"
            onclick="editHealthRecord('${record.id}')"
          >
            ✏️ 編集
          </button>

          <button
            class="delete-mini"
            onclick="deleteHealthRecord('${record.id}')"
          >
            🗑️ 削除
          </button>

        </div>

      </div>

    </div>
  `;
}


const REACTION_EMOJIS = ["👍","❤️","😂","😮","😢","🙏","🎉","💪"];

function openReactionPicker(recordId, button) {

  document
    .querySelectorAll(".reaction-picker")
    .forEach(el => el.remove());

  const picker = document.createElement("div");

  picker.className = "reaction-picker";

  picker.innerHTML =
    REACTION_EMOJIS
      .map(e => `
        <button onclick="toggleReaction('${recordId}','${e}');this.closest('.reaction-picker').remove()">${e}</button>
      `)
      .join("");

  document.body.appendChild(picker);

  const rect = button.getBoundingClientRect();

  picker.style.position = "fixed";
  picker.style.left =
    `${Math.min(rect.left, window.innerWidth - 260)}px`;
  picker.style.top =
    `${rect.top - 54}px`;

  setTimeout(() => {
    document.addEventListener(
      "click",
      function closePicker(e) {
        if (!picker.contains(e.target) && e.target !== button) {
          picker.remove();
          document.removeEventListener("click", closePicker);
        }
      }
    );
  }, 0);
}

async function toggleReaction(recordId, emoji) {

  if (!user) return;

  try {

    const { data: existing } =
      await sb
        .from("record_reactions")
        .select("id, emoji")
        .eq("health_record_id", recordId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existing && existing.emoji === emoji) {

      await sb
        .from("record_reactions")
        .delete()
        .eq("id", existing.id);

    } else {

      await sb
        .from("record_reactions")
        .upsert(
          {
            health_record_id: recordId,
            user_id: user.id,
            emoji
          },
          { onConflict: "health_record_id,user_id" }
        );
    }

    render();

  } catch (e) {

    flash("リアクションに失敗：" + (e.message || e));
  }
}


/* =========================================================
   📌 Calendar Events
========================================================= */

async function eventsForMonth(
  year,
  month
) {

  const start =
    new Date(
      year,
      month,
      1
    );

  const end =
    new Date(
      year,
      month + 1,
      1
    );

  const {
    data,
    error
  } = await sb
    .from("calendar_events")
    .select("*")
    .eq(
      "family_id",
      profile.family_id
    )
    .gte(
      "start_at",
      start.toISOString()
    )
    .lt(
      "start_at",
      end.toISOString()
    )
    .order("start_at");

  if (error) {

    console.error(error);

    return [];
  }

  return data || [];
}


async function eventsForDate(
  targetDate
) {

  const start =
    new Date(
      `${targetDate}T00:00:00`
    );

  const end =
    new Date(
      start
    );

  end.setDate(
    end.getDate() + 1
  );

  const {
    data,
    error
  } = await sb
    .from("calendar_events")
    .select("*")
    .eq(
      "family_id",
      profile.family_id
    )
    .gte(
      "start_at",
      start.toISOString()
    )
    .lt(
      "start_at",
      end.toISOString()
    )
    .order("start_at");

  if (error) {

    console.error(error);

    return [];
  }

  return data || [];
}


/* =========================================================
   📅 Calendar
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

  const [
    healthData,
    events
  ] = await Promise.all([

    sb
      .from("health_records")
      .select(
        "id,recorded_at,record_type"
      )
      .eq(
        "family_id",
        profile.family_id
      )
      .gte(
        "recorded_at",
        start.toISOString()
      )
      .lt(
        "recorded_at",
        new Date(
          year,
          month + 1,
          1
        ).toISOString()
      )
      .is("deleted_at", null),

    eventsForMonth(
      year,
      month
    )

  ]);

  const byDate = {};

  (healthData.data || [])
    .forEach(record => {

      const key =
        new Date(
          record.recorded_at
        ).toLocaleDateString(
          "sv-SE"
        );

      if (!byDate[key]) {
        byDate[key] = {
          health:[],
          events:[]
        };
      }

      byDate[key].health.push(
        record
      );
    });

  events.forEach(event => {

    const key =
      new Date(
        event.start_at
      ).toLocaleDateString(
        "sv-SE"
      );

    if (!byDate[key]) {
      byDate[key] = {
        health:[],
        events:[]
      };
    }

    byDate[key].events.push(
      event
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

    const item =
      byDate[key] ||
      {
        health:[],
        events:[]
      };

    const types =
      item.health
        .map(
          x => x.record_type
        )
        .filter(
          type =>
            filter === "all" ||
            type === filter
        );

    const eventCount =
      item.events.length;

    const selected =
      key === dk(date);

    cells.push(`
      <button
        class="
          day
          ${d.getMonth() !== month ? "other" : ""}
          ${key === dk(new Date()) ? "today" : ""}
          ${selected ? "selected" : ""}
        "
        onclick="calendarDay('${key}')"
      >

        <b>
          ${d.getDate()}
        </b>

        <div>

          ${
            types.slice(0,3)
              .map(
                type =>
                  `<span class="dot">
                    ${icons[type] || "📝"}
                  </span>`
              )
              .join("")
          }

          ${
            eventCount
              ? `<span class="dot">📌</span>`
              : ""
          }

        </div>

      </button>
    `);
  }


  const filters = [
    ["all","すべて"],
    ["poop","💩"],
    ["medicine","💊"],
    ["vomit","🤢"],
    ["weight","⚖️"],
    ["period","🌸"]
  ];


  const selectedDate =
    dk(date);

  const [
    selectedEvents,
    selectedRecords
  ] = await Promise.all([
    eventsForDate(selectedDate),
    dayRecords(selectedDate)
  ]);


  return `
    <header class="hero">

      <h1>📅 カレンダー</h1>

      <p>
        記録も予定もまとめて見えるよ
      </p>

    </header>

    <main class="panel">

      <div class="card datebar">

        <button
          type="button"
          aria-label="前の月"
          onclick="changeCalendarMonth(-1)"
        >
          ‹
        </button>

        <div class="date">
          ${year}年${month + 1}月
        </div>

        <button
          type="button"
          aria-label="次の月"
          onclick="changeCalendarMonth(1)"
        >
          ›
        </button>

      </div>

      <div class="tabs">

        ${
          filters.map(
            ([value,label]) => `
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
          ).join("")
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

        <div class="section-title">
          📌 ${fmt(selectedDate)}の予定
        </div>

        ${
          selectedEvents.length
            ? selectedEvents
                .map(eventItem)
                .join("")
            : `
              <div class="empty">
                この日の予定はないよ
              </div>
            `
        }

        <button
          class="btn primary"
          style="width:100%;margin-top:10px"
          onclick="eventModal('${selectedDate}')"
        >
          ＋ この日に予定を追加
        </button>

      </div>

      <div class="card">

        <div class="section-title">
          📒 ${fmt(selectedDate)}の記録
        </div>

        ${
          selectedRecords.length
            ? selectedRecords.map(entry).join("")
            : `
              <div class="empty">
                記録はありません
              </div>
            `
        }

      </div>

    </main>

    ${nav("calendar")}
  `;
}


/* =========================================================
   Calendar day
========================================================= */

function changeCalendarMonth(amount) {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + amount);
  date = d;
  render();
}

function calendarDay(key) {
  date = new Date(`${key}T00:00:00`);
  render();
}


/* =========================================================
   Event Modal
========================================================= */

function eventModal(
  targetDate = dk(date),
  event = null
) {

  const edit =
    !!event;

  modal(
    edit
      ? "✏️ 予定を編集"
      : "📌 予定を追加",
    `
      <div class="form-grid">

        <input
          id="eventTitle"
          class="input"
          placeholder="例：妊婦健診"
          value="${esc(event?.title || "")}"
        >

        <input
          id="eventDate"
          class="input"
          type="date"
          value="${
            event
              ? dk(event.start_at)
              : targetDate
          }"
        >

        <input
          id="eventTime"
          class="input"
          type="time"
          value="${
            event
              ? tm(event.start_at)
              : "10:00"
          }"
        >

        <textarea
          id="eventComment"
          class="input textarea"
          placeholder="メモ"
        >${esc(event?.description || "")}</textarea>

        <select
          id="eventType"
          class="input"
        >

          <option
            value="other"
            ${event?.event_type === "other" ? "selected" : ""}
          >
            📌 その他
          </option>

          <option
            value="checkup"
            ${event?.event_type === "checkup" ? "selected" : ""}
          >
            🏥 検診
          </option>

          <option
            value="hospital"
            ${event?.event_type === "hospital" ? "selected" : ""}
          >
            🏥 病院
          </option>

        </select>

        <div class="modal-sticky-actions">
          <button
            type="button"
            class="btn primary"
            onclick="${
              edit
                ? `updateEvent('${event.id}')`
                : "saveEvent()"
            }"
          >
            ✅ ${edit ? "予定を確定して保存" : "予定を確定して登録"}
          </button>
        </div>

        ${
          edit
            ? `
              <button
                class="btn danger"
                onclick="deleteEvent('${event.id}')"
              >
                🗑️ 削除
              </button>
            `
            : ""
        }

      </div>
    `
  );
}


/* =========================================================
   Save Event
========================================================= */

async function saveEvent() {

  const title =
    document.getElementById(
      "eventTitle"
    )?.value.trim();

  const eventDate =
    document.getElementById(
      "eventDate"
    )?.value;

  const eventTime =
    document.getElementById(
      "eventTime"
    )?.value ||
    "10:00";

  const description =
    document.getElementById(
      "eventComment"
    )?.value || "";

  const eventType =
    document.getElementById(
      "eventType"
    )?.value ||
    "other";

  if (!title || !eventDate) {
    flash("予定名と日付を入力してください");
    return;
  }

  const start =
    new Date(
      `${eventDate}T${eventTime}:00`
    );

  const { error } =
    await sb
      .from("calendar_events")
      .insert({
        family_id:profile.family_id,
        created_by:user.id,
        title,
        description,
        start_at:start.toISOString(),
        event_type:eventType,
        is_all_day:false
      });

  if (error) {
    flash(
      "予定を保存できませんでした：" +
      error.message
    );
    return;
  }

  closeModal();

  flash("📌 カレンダーに追加しました！");

  render();
}


/* =========================================================
   Event Item
========================================================= */

function eventItem(event) {

  return `
    <div class="event-item">

      <div class="event-date">
        ${
          fmt(event.start_at)
        }
       　
        ${
          event.is_all_day
            ? "終日"
            : tm(event.start_at)
        }
      </div>

      <div class="event-title">
        📌 ${esc(event.title)}
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

      <div class="record-actions">

        <button
          class="edit-mini"
          onclick='editEventById("${event.id}")'
        >
          ✏️ 編集
        </button>

        <button
          class="delete-mini"
          onclick='deleteEvent("${event.id}")'
        >
          🗑️ 削除
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   Event Edit
========================================================= */

async function editEventById(id) {

  const {
    data,
    error
  } = await sb
    .from("calendar_events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    flash(error.message);
    return;
  }

  eventModal(
    dk(data.start_at),
    data
  );
}


async function updateEvent(id) {

  const title =
    document.getElementById(
      "eventTitle"
    )?.value.trim();

  const eventDate =
    document.getElementById(
      "eventDate"
    )?.value;

  const eventTime =
    document.getElementById(
      "eventTime"
    )?.value ||
    "10:00";

  const description =
    document.getElementById(
      "eventComment"
    )?.value || "";

  const eventType =
    document.getElementById(
      "eventType"
    )?.value ||
    "other";

  const start =
    new Date(
      `${eventDate}T${eventTime}:00`
    );

  const { error } =
    await sb
      .from("calendar_events")
      .update({
        title,
        description,
        start_at:start.toISOString(),
        event_type:eventType,
        updated_at:new Date().toISOString()
      })
      .eq("id", id);

  if (error) {
    flash(error.message);
    return;
  }

  closeModal();

  flash("✏️ 予定を更新しました");

  render();
}


async function deleteEvent(id) {

  if (!confirm(
    "この予定を削除しますか？"
  )) return;

  const { error } =
    await sb
      .from("calendar_events")
      .delete()
      .eq("id", id);

  if (error) {
    flash(error.message);
    return;
  }

  closeModal();

  flash("🗑️ 予定を削除しました");

  render();
}


/* =========================================================
   🏥 検診
========================================================= */

async function checkups() {

  const {
    data,
    error
  } = await sb
    .from("checkups")
    .select("*")
    .eq(
      "family_id",
      profile.family_id
    )
    .order(
      "next_checkup_date",
      { ascending:true }
    );

  if (error) {

    console.error(error);

    return [];
  }

  return data || [];
}


function checkupModal(
  checkup = null
) {

  modal(
    checkup
      ? "✏️ 検診記録を編集"
      : "🏥 検診を記録",
    `
      <div class="form-grid">

        <label>検診日</label>

        <input
          id="checkupDate"
          class="input"
          type="date"
          value="${
            checkup?.next_checkup_date ||
            dk(date)
          }"
        >

        <input
          id="checkupWeek"
          class="input"
          type="number"
          placeholder="妊娠週数"
          value="${
            checkup?.gestational_week ?? ""
          }"
        >

        <input
          id="checkupDay"
          class="input"
          type="number"
          placeholder="日"
          value="${
            checkup?.gestational_day ?? ""
          }"
        >

        <input
          id="checkupWeight"
          class="input"
          type="number"
          step="0.1"
          placeholder="体重 kg"
          value="${
            checkup?.weight_kg ?? ""
          }"
        >

        <input
          id="checkupSystolic"
          class="input"
          type="number"
          placeholder="血圧 上"
          value="${
            checkup?.systolic ?? ""
          }"
        >

        <input
          id="checkupDiastolic"
          class="input"
          type="number"
          placeholder="血圧 下"
          value="${
            checkup?.diastolic ?? ""
          }"
        >

        <textarea
          id="checkupNote"
          class="input textarea"
          placeholder="医師のメモ・検診結果"
        >${esc(checkup?.doctor_note || "")}</textarea>

        <label>
          次回検診日
        </label>

        <input
          id="nextCheckupDate"
          class="input"
          type="date"
          value="${
            checkup?.next_checkup_date || ""
          }"
        >

        <button
          class="btn primary"
          onclick="${
            checkup
              ? `updateCheckup('${checkup.id}')`
              : "saveCheckup()"
          }"
        >
          💾 保存
        </button>

        ${
          checkup
            ? `
              <button
                class="btn danger"
                onclick="deleteCheckup('${checkup.id}')"
              >
                🗑️ 削除
              </button>
            `
            : ""
        }

      </div>
    `
  );
}


async function saveCheckup() {

  const checkupDate =
    document.getElementById(
      "checkupDate"
    )?.value;

  const week =
    Number(
      document.getElementById(
        "checkupWeek"
      )?.value
    ) || null;

  const day =
    Number(
      document.getElementById(
        "checkupDay"
      )?.value
    ) || null;

  const weight =
    parseFloat(
      document.getElementById(
        "checkupWeight"
      )?.value
    ) || null;

  const systolic =
    Number(
      document.getElementById(
        "checkupSystolic"
      )?.value
    ) || null;

  const diastolic =
    Number(
      document.getElementById(
        "checkupDiastolic"
      )?.value
    ) || null;

  const doctorNote =
    document.getElementById(
      "checkupNote"
    )?.value || "";

  const nextDate =
    document.getElementById(
      "nextCheckupDate"
    )?.value ||
    null;

  if (!checkupDate) {
    flash("検診日を入力してください");
    return;
  }

  const {
    data:checkup,
    error
  } = await sb
    .from("checkups")
    .insert({
      family_id:profile.family_id,
      gestational_week:week,
      gestational_day:day,
      weight_kg:weight,
      systolic,
      diastolic,
      doctor_note:doctorNote,
      next_checkup_date:nextDate
    })
    .select()
    .single();

  if (error) {
    flash(error.message);
    return;
  }

  /*
    検診記録自体もカレンダーに表示するため
    calendar_eventsにも登録
  */

  const {
    data:event,
    error:eventError
  } = await sb
    .from("calendar_events")
    .insert({
      family_id:profile.family_id,
      created_by:user.id,
      title:"🏥 妊婦健診",
      description:
        doctorNote ||
        "検診記録",
      start_at:
        new Date(
          `${checkupDate}T10:00:00`
        ).toISOString(),
      event_type:"checkup",
      is_all_day:false
    })
    .select()
    .single();

  if (!eventError && event) {

    await sb
      .from("checkups")
      .update({
        event_id:event.id
      })
      .eq("id", checkup.id);

  }

  closeModal();

  flash("🏥 検診を記録しました");

  render();
}


async function updateCheckup(id) {

  const checkupDate =
    document.getElementById(
      "checkupDate"
    )?.value;

  const week =
    Number(
      document.getElementById(
        "checkupWeek"
      )?.value
    ) || null;

  const day =
    Number(
      document.getElementById(
        "checkupDay"
      )?.value
    ) || null;

  const weight =
    parseFloat(
      document.getElementById(
        "checkupWeight"
      )?.value
    ) || null;

  const systolic =
    Number(
      document.getElementById(
        "checkupSystolic"
      )?.value
    ) || null;

  const diastolic =
    Number(
      document.getElementById(
        "checkupDiastolic"
      )?.value
    ) || null;

  const doctorNote =
    document.getElementById(
      "checkupNote"
    )?.value || "";

  const nextDate =
    document.getElementById(
      "nextCheckupDate"
    )?.value ||
    null;

  const {
    data:old
  } = await sb
    .from("checkups")
    .select("*")
    .eq("id", id)
    .single();

  const { error } =
    await sb
      .from("checkups")
      .update({
        gestational_week:week,
        gestational_day:day,
        weight_kg:weight,
        systolic,
        diastolic,
        doctor_note:doctorNote,
        next_checkup_date:nextDate,
        updated_at:new Date().toISOString()
      })
      .eq("id", id);

  if (error) {
    flash(error.message);
    return;
  }

  /*
    linked eventも更新
  */

  if (old?.event_id) {

    await sb
      .from("calendar_events")
      .update({
        title:"🏥 妊婦健診",
        description:
          doctorNote ||
          "検診記録",
        start_at:
          new Date(
            `${checkupDate}T10:00:00`
          ).toISOString(),
        updated_at:
          new Date().toISOString()
      })
      .eq(
        "id",
        old.event_id
      );

  } else {

    const {
      data:event
    } = await sb
      .from("calendar_events")
      .insert({
        family_id:profile.family_id,
        created_by:user.id,
        title:"🏥 妊婦健診",
        description:
          doctorNote ||
          "検診記録",
        start_at:
          new Date(
            `${checkupDate}T10:00:00`
          ).toISOString(),
        event_type:"checkup",
        is_all_day:false
      })
      .select()
      .single();

    if (event) {

      await sb
        .from("checkups")
        .update({
          event_id:event.id
        })
        .eq("id",id);

    }
  }

  closeModal();

  flash("✏️ 検診記録を更新しました");

  render();
}


async function deleteCheckup(id) {

  if (!confirm(
    "この検診記録を削除しますか？"
  )) return;

  const {
    data
  } = await sb
    .from("checkups")
    .select("event_id")
    .eq("id",id)
    .single();

  if (data?.event_id) {

    await sb
      .from("calendar_events")
      .delete()
      .eq(
        "id",
        data.event_id
      );
  }

  const { error } =
    await sb
      .from("checkups")
      .delete()
      .eq("id",id);

  if (error) {
    flash(error.message);
    return;
  }

  closeModal();

  flash("🗑️ 検診記録を削除しました");

  render();
}


/* =========================================================
   ❓ 医師に聞きたいこと
========================================================= */

async function doctorQuestions() {

  const {
    data,
    error
  } = await sb
    .from("doctor_questions")
    .select("*")
    .eq(
      "family_id",
      profile.family_id
    )
    .order(
      "created_at",
      { ascending:false }
    );

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}


function questionModal(
  question = null
) {

  modal(
    question
      ? "✏️ 質問を編集"
      : "❓ 医師に聞きたいこと",
    `
      <div class="form-grid">

        <textarea
          id="doctorQuestion"
          class="input textarea"
          placeholder="例：この薬は飲み続けて大丈夫？"
        >${esc(question?.question || "")}</textarea>

        ${
          question
            ? `
              <textarea
                id="doctorAnswer"
                class="input textarea"
                placeholder="回答メモ"
              >${esc(question?.answered_note || "")}</textarea>
            `
            : ""
        }

        <button
          class="btn primary"
          onclick="${
            question
              ? `updateQuestion('${question.id}')`
              : "saveQuestion()"
          }"
        >
          💾 保存
        </button>

        ${
          question
            ? `
              <button
                class="btn danger"
                onclick="deleteQuestion('${question.id}')"
              >
                🗑️ 削除
              </button>
            `
            : ""
        }

      </div>
    `
  );
}


async function saveQuestion() {

  const question =
    document.getElementById(
      "doctorQuestion"
    )?.value.trim();

  if (!question) {
    flash("質問を入力してください");
    return;
  }

  const { error } =
    await sb
      .from("doctor_questions")
      .insert({
        family_id:profile.family_id,
        created_by:user.id,
        question,
        is_done:false
      });

  if (error) {
    flash(error.message);
    return;
  }

  closeModal();

  flash("❓ 質問を追加しました");

  render();
}


async function updateQuestion(id) {

  const question =
    document.getElementById(
      "doctorQuestion"
    )?.value.trim();

  const answeredNote =
    document.getElementById(
      "doctorAnswer"
    )?.value || "";

  const { error } =
    await sb
      .from("doctor_questions")
      .update({
        question,
        answered_note:answeredNote,
        updated_at:new Date().toISOString()
      })
      .eq("id",id);

  if (error) {
    flash(error.message);
    return;
  }

  closeModal();

  flash("✏️ 更新しました");

  render();
}


async function toggleQuestion(
  id,
  done
) {

  const { error } =
    await sb
      .from("doctor_questions")
      .update({
        is_done:!done,
        updated_at:new Date().toISOString()
      })
      .eq("id",id);

  if (error) {
    flash(error.message);
    return;
  }

  render();
}


async function deleteQuestion(id) {

  if (!confirm(
    "この質問を削除しますか？"
  )) return;

  const { error } =
    await sb
      .from("doctor_questions")
      .delete()
      .eq("id",id);

  if (error) {
    flash(error.message);
    return;
  }

  closeModal();

  flash("🗑️ 質問を削除しました");

  render();
}


/* =========================================================
   🏠 Home
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
    )?.weight_records?.[0]
      ?.weight_kg ||
    "-";


  let gestation =
    "妊娠情報なし";

  let remaining =
    "-";

  if (pregnancy?.due_date) {

    const due =
      new Date(
        pregnancy.due_date +
        "T00:00:00"
      );

    const start =
      new Date(due);

    start.setDate(
      start.getDate() - 280
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


  const todayEvents =
    await eventsForDate(
      dk(date)
    );


  return `
    <header class="hero">

      <h1>💩＆💊</h1>

      <p>
        タカちゃん × オタヤダ
      </p>

      <div
        class="notice"
        style="
          display:inline-block;
          margin-top:8px;
          padding:10px 16px;
          border-radius:18px;
          font-weight:1000;
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
          type="button"
          class="btn soft calendar-link"
          aria-label="カレンダーを開く"
          onclick="go('calendar')"
        >
          <span>📅</span>
        </button>

      </div>


      ${
        todayEvents.length
          ? `
            <div class="card">

              <div class="section-title">
                📌 今日の予定
              </div>

              ${todayEvents
                .map(eventItem)
                .join("")}

            </div>
          `
          : ""
      }


      <div class="stats">

        <div class="stat stat-poop">
          <b>💩 ${poopCount}</b>
          <small>ウンチ</small>
        </div>

        <div class="stat stat-med">
          <b>💊 ${medicineCount}</b>
          <small>薬</small>
        </div>

        <div class="stat stat-vomit">
          <b>🤢 ${vomitCount}</b>
          <small>吐いた</small>
        </div>

        <div class="stat stat-weight">
          <b>⚖️ ${weight}</b>
          <small>体重</small>
        </div>

      </div>


      <div class="card">

        <div class="section-title">
          💩 ウンチ出た〜！！
        </div>

        <div class="poop-grid">

          ${
            Object.entries(poop)
              .map(
                ([key,[name,emoji,css]]) => `
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
                        '${esc(medicine.icon || "💊")}',
                        this
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
          onclick="eventModal('${dk(date)}')"
        >
          📌 予定
        </button>

      </div>

      <button
        class="btn soft"
        style="margin-top:8px"
        onclick="addCommentForm()"
      >
        💬 コメントを残す
      </button>


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

    </main>

    ${nav("home")}
  `;
}


/* =========================================================
   Date
========================================================= */

function shiftDate(amount) {

  date.setDate(
    date.getDate() + amount
  );

  render();
}


/* =========================================================
   🤰 Pregnancy
========================================================= */

function pregnancyPage() {

  let gestation =
    "未設定";

  let remaining =
    "-";

  if (pregnancy?.due_date) {

    const due =
      new Date(
        pregnancy.due_date +
        "T00:00:00"
      );

    const start =
      new Date(due);

    start.setDate(
      start.getDate() - 280
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


  return `
    <header class="hero">

      <h1>🤰 妊娠</h1>

      <p>
        タカちゃんの妊娠ダッシュボード
      </p>

    </header>

    <main class="panel">

      <div class="card">

        <div
          class="notice"
          style="
            text-align:center;
            padding:18px;
            border-radius:22px;
          "
        >

          <div style="
            font-size:32px;
            font-weight:1000;
          ">
            🤰 ${gestation}
          </div>

          <div style="
            margin-top:7px;
            font-weight:900;
          ">
            出産予定日まで
            ${remaining}日
          </div>

        </div>

      </div>


      <div class="card">

        <div class="section-title">
          🗓️ 出産予定日
        </div>

        <p style="
          font-size:25px;
          font-weight:1000;
        ">
          ${
            pregnancy?.due_date
              ? fmt(pregnancy.due_date)
              : "未設定"
          }
        </p>

      </div>


      <div class="card">

        <div class="section-title">
          🏥 検診記録
        </div>

        <button
          class="btn primary"
          style="width:100%"
          onclick="checkupModal()"
        >
          ＋ 検診を記録
        </button>

        <div id="checkupList">
          読み込み中…
        </div>

      </div>


      <div class="card">

        <div class="section-title">
          ❓ 医師に聞きたいこと
        </div>

        <button
          class="btn pink"
          style="width:100%"
          onclick="questionModal()"
        >
          ＋ 質問を追加
        </button>

        <div id="questionList">
          読み込み中…
        </div>

      </div>

    </main>

    ${nav("pregnancy")}
  `;
}


/* =========================================================
   Pregnancy後データ描画
========================================================= */

async function loadPregnancyExtras() {

  if (view !== "pregnancy") return;

  const [
    cs,
    qs
  ] = await Promise.all([
    checkups(),
    doctorQuestions()
  ]);

  const checkupBox =
    document.getElementById(
      "checkupList"
    );

  const questionBox =
    document.getElementById(
      "questionList"
    );

  if (checkupBox) {

    checkupBox.innerHTML =
      cs.length
        ? cs.map(
            c => `
              <div class="checkup-item">

                <div class="event-date">
                  🏥 ${fmt(
                    c.next_checkup_date
                  )}
                </div>

                <div style="
                  font-weight:1000;
                  margin-top:4px;
                ">
                  ${
                    c.gestational_week != null
                      ? `${c.gestational_week}週${
                          c.gestational_day || 0
                        }日`
                      : "検診"
                  }
                </div>

                ${
                  c.weight_kg != null
                    ? `<div>⚖️ ${c.weight_kg}kg</div>`
                    : ""
                }

                ${
                  c.systolic != null
                    ? `<div>🩺 ${c.systolic}/${c.diastolic || "-"}</div>`
                    : ""
                }

                ${
                  c.doctor_note
                    ? `
                      <div style="margin-top:6px">
                        📝 ${esc(c.doctor_note)}
                      </div>
                    `
                    : ""
                }

                <div class="record-actions">

                  <button
                    class="edit-mini"
                    onclick='openCheckupEdit("${c.id}")'
                  >
                    ✏️ 編集
                  </button>

                  <button
                    class="delete-mini"
                    onclick='deleteCheckup("${c.id}")'
                  >
                    🗑️ 削除
                  </button>

                </div>

              </div>
            `
          ).join("")
        : `
          <div class="empty">
            まだ検診記録がないよ
          </div>
        `;
  }

  if (questionBox) {

    questionBox.innerHTML =
      qs.length
        ? qs.map(
            q => `
              <div
                class="
                  question-item
                  ${q.is_done ? "question-done" : ""}
                "
              >

                <div style="
                  font-weight:1000;
                ">
                  ❓ ${esc(q.question)}
                </div>

                ${
                  q.answered_note
                    ? `
                      <div style="
                        margin-top:6px;
                      ">
                        📝 ${esc(
                          q.answered_note
                        )}
                      </div>
                    `
                    : ""
                }

                <div
                  style="
                    display:flex;
                    gap:5px;
                    margin-top:8px;
                    flex-wrap:wrap;
                  "
                >

                  <button
                    class="mini-btn mini-done"
                    onclick="
                      toggleQuestion(
                        '${q.id}',
                        ${!!q.is_done}
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
                    class="mini-btn mini-edit"
                    onclick='openQuestionEdit("${q.id}")'
                  >
                    ✏️ 編集
                  </button>

                  <button
                    class="mini-btn mini-delete"
                    onclick='deleteQuestion("${q.id}")'
                  >
                    🗑️ 削除
                  </button>

                </div>

              </div>
            `
          ).join("")
        : `
          <div class="empty">
            先生に聞きたいことを追加してね
          </div>
        `;
  }
}


async function openCheckupEdit(id) {

  const {
    data,
    error
  } = await sb
    .from("checkups")
    .select("*")
    .eq("id",id)
    .single();

  if (error) {
    flash(error.message);
    return;
  }

  checkupModal(data);
}


async function openQuestionEdit(id) {

  const {
    data,
    error
  } = await sb
    .from("doctor_questions")
    .select("*")
    .eq("id",id)
    .single();

  if (error) {
    flash(error.message);
    return;
  }

  questionModal(data);
}


/* =========================================================
   👩‍❤️‍👨 Family
========================================================= */

async function settings() {

  let members = [];

  if (family) {

    const {
      data
    } = await sb
      .from("profiles")
      .select(
        "id,display_name,role"
      )
      .eq(
        "family_id",
        family.id
      );

    members =
      data || [];
  }

  return `
    <header class="hero">

      <h1>❤️ 夫婦</h1>

      <p>
        2人で一緒に使おう
      </p>

    </header>

    <main class="panel">

      <div class="card">

        <div class="section-title">
          👩‍❤️‍👨 家族メンバー
        </div>

        ${
          members.length
            ? members.map(
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

                    ${
                      member.id === user.id
                        ? "（あなた）"
                        : ""
                    }

                  </div>
                `
              ).join("")
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
          style="width:100%"
          onclick="showInvite()"
        >
          🔗 招待コードを表示
        </button>

      </div>


      <div class="card">

        <div class="section-title">
          💊 薬・サプリ管理
        </div>

        <div id="medManage">
          読み込み中…
        </div>

        <button
          class="btn primary"
          style="width:100%;margin-top:10px"
          onclick="addMed()"
        >
          ＋ 薬・サプリを追加
        </button>

      </div>


      <div class="card">

        <div class="section-title">
          📒 全履歴
        </div>

        <button
          class="btn soft"
          style="width:100%"
          onclick="allRecords()"
        >
          📒 履歴を見る
        </button>

      </div>


      <div class="card">
        <div class="section-title">🔔 通知設定</div>
        <p class="hint">アプリを閉じていても、サーバーから指定時刻にPush通知を送ります。</p>

        <div class="form-grid">
          <label style="font-weight:900">通知時刻</label>
          <input id="notifyTime" class="input" type="time" value="${esc(localStorage.getItem("notifyTime") || "20:00")}">
          <textarea id="notifyMessage" class="input textarea" placeholder="通知メッセージ">${esc(localStorage.getItem("notifyMessage") || "今日の体調・服薬記録はしましたか？")}</textarea>

          <label style="display:flex;align-items:center;gap:8px;font-weight:700">
            <input type="checkbox" id="notifyOnRecord" ${localStorage.getItem("notifyOnRecord") !== "false" ? "checked" : ""} onchange="saveNotificationSettingsFromUI()">
            👩‍❤️‍👨 相方が記録したら通知する
          </label>

          <button class="btn primary" onclick="saveNotificationSettingsFromUI()">💾 時刻・メッセージを保存</button>
          <button class="btn soft" onclick="enablePushNotifications()">🔔 通知をONにする</button>
          <button class="btn soft" onclick="testPushNotification()">🧪 テスト通知</button>
          <button class="btn danger" onclick="disablePushNotifications()">🔕 通知をOFFにする</button>
        </div>

        <p class="hint" style="margin-top:10px">iPhoneはSafari → 共有 → ホーム画面に追加 → ホーム画面のアプリから通知ONにしてください。</p>
      </div>


      <div class="card">
        <div class="section-title">💬 コメント入力</div>
        <label style="display:flex;align-items:center;gap:8px;font-weight:700">
          <input type="checkbox" id="quickCommentEnabled" ${quickCommentEnabled() ? "checked" : ""} onchange="localStorage.setItem('quickCommentEnabled', this.checked); flash(this.checked ? '💬 コメント入力をONにしました' : '💬 コメント入力をOFFにしました')">
          記録時にコメント入力を毎回表示する（ウンチ・お薬）
        </label>
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
   Medication管理
========================================================= */

async function loadMedicationManagement() {

  const box =
    document.getElementById(
      "medManage"
    );

  if (!box) return;

  const data =
    await meds();

  box.innerHTML =
    data.length
      ? data.map(
          m => `
            <div
              class="event-item"
            >

              <div style="
                font-size:18px;
                font-weight:1000;
              ">
                ${esc(
                  m.icon || "💊"
                )}
                ${esc(m.name)}
              </div>

              ${
                m.description
                  ? `
                    <div class="hint">
                      ${esc(
                        m.description
                      )}
                    </div>
                  `
                  : ""
              }

              <div class="record-actions">

                <button
                  class="edit-mini"
                  onclick='editMedication("${m.id}")'
                >
                  ✏️ 編集
                </button>

                <button
                  class="delete-mini"
                  onclick='deleteMedication("${m.id}")'
                >
                  🗑️ 削除
                </button>

              </div>

            </div>
          `
        ).join("")
      : `
        <div class="empty">
          薬・サプリはまだ登録されていません
        </div>
      `;
}


/* =========================================================
   📒 All Records
========================================================= */

async function allRecords(keyword = "") {

  let query =
    sb
      .from("health_records")
      .select(`
        id,
        record_type,
        recorded_at,
        comment,
        profile_id,

        poop_records(
          poop_type
        ),

        medication_logs(
          medication_id,
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
        ),

        record_reactions(
          id,
          user_id,
          emoji
        )
      `)
      .eq(
        "family_id",
        profile.family_id
      )
      .is("deleted_at", null)
      .order(
        "recorded_at",
        {
          ascending:false
        }
      )
      .limit(300);

  if (keyword) {
    query = query.ilike("comment", `%${keyword}%`);
  }

  const {
    data,
    error
  } = await query;

  if (error) {
    flash(error.message);
    return;
  }

  modal(
    "📒 最近の記録",
    `
      <input
        class="input"
        placeholder="🔍 コメントで検索…"
        value="${esc(keyword)}"
        onkeydown="if(event.key==='Enter'){allRecords(this.value)}"
      >

      <div class="family-history-list">

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
   Navigation
   ★ 履歴は夫婦へ移動
========================================================= */

function nav(active) {
  return `
    <nav class="nav" aria-label="メインメニュー">
      <button type="button" class="${active === "home" ? "active" : ""}" onclick="go('home')">
        <span>🏠</span><b>ホーム</b>
      </button>
      <button type="button" class="${active === "calendar" ? "active" : ""}" onclick="go('calendar')">
        <span>📅</span><b>カレンダー</b>
      </button>
      <button type="button" class="${active === "pregnancy" ? "active" : ""}" onclick="go('pregnancy')">
        <span>🤰</span><b>妊娠</b>
      </button>
      <button type="button" class="${active === "settings" ? "active" : ""}" onclick="go('settings')">
        <span>❤️</span><b>夫婦</b>
      </button>
    </nav>
  `;
}


/* =========================================================
   View
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
      pregnancyPage();

    await loadPregnancyExtras();

    return;
  }

  if (view === "settings") {

    app.innerHTML =
      await settings();

    await loadMedicationManagement();

    return;
  }

  app.innerHTML =
    await home();
}


/* =========================================================
   起動
========================================================= */

boot();

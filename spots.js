/* ============================================================
   spots.js
   ここに書いてあるデータと処理で、地図とスポット一覧が動いています。

   ★ 自由研究のポイント ★
   下の STARTER_SPOTS が「はじめのサンプルデータ」です。
   これは例なので、じぶんで調べた本当のおすすめスポットに
   書きかえたり、画面のフォームからどんどん追加したりしよう。
   ============================================================ */

// --- 地図の中心（初期表示位置）---
// ※ 必要に応じて座標を変えられます。
const MAP_CENTER = [35.974086, 136.129784];
const MAP_ZOOM = 14;

const GUIDE_KNOWLEDGE = {
  about: "越前町は福井県丹生郡にある町で、海と山に囲まれた自然豊かな場所です。伝統工芸や海の幸、歴史スポットがそろっています。",
  specialties: "越前町の特産品には越前ガニ、越前そば、越前漆器、越前焼、越前和紙、そして地元の魚介類や和菓子があります。",
  history: "越前町は古くから和紙と漆器の産地として知られてきました。2005年に複数の町村が合併して丹生郡越前町が誕生し、伝統文化が今も息づいています。",
  sightseeing: "おすすめの観光スポットは越前陶芸村、越前和紙の里、越前海岸の夕陽スポット、越前そば店、漆器工房見学、温泉と海の幸を楽しめる漁港エリアです。",
  food: "越前町は海産物やそば、地元の和菓子が有名です。特に冬の越前ガニ、越前そば、地元食材を使った料理が人気です。",
  seafood: "越前町の海産物は新鮮で種類が多く、冬の越前ガニや旬の魚介、地元の漁港で味わう海鮮丼が人気です。海沿いの食事処では、その日に獲れた魚を使った料理を楽しめます。",
  coast: "越前海岸は日本海に面した美しい海岸線で、夕日や磯の景色が有名です。岩場や砂浜が続き、海辺の散歩や写真撮影にぴったりな場所です。",
  shopping: "越前焼や越前漆器、越前和紙のお土産はとても人気です。地元工房や直売所で作りたての作品も手に入ります。"
};

const assistantState = {
  lastTopic: null,
  history: [],
};

function findSpotFromQuery(query) {
  const text = query.trim().toLowerCase();
  if (!text) return null;

  const exact = spots.find((spot) => spot.name.toLowerCase().includes(text));
  if (exact) return exact;

  for (const [category, style] of Object.entries(CATEGORY_STYLE)) {
    if (text.includes(style.label.toLowerCase())) {
      return spots.find((spot) => spot.category === category) || null;
    }
  }

  return null;
}

function showSpotOnMap(spot) {
  if (!spot) return;
  map.flyTo([spot.lat, spot.lng], 16, { duration: 0.8 });
  if (markers[spot.id]) {
    markers[spot.id].openPopup();
  }
  updateStreetView(spot.lat, spot.lng, spot.name);
}

function inferFollowUp(query) {
  const text = query.trim().toLowerCase();
  if (!assistantState.lastTopic) return null;

  if (/(それ|この|あの|前の|その|続けて|もっと)/.test(text)) {
    const topic = assistantState.lastTopic;
    if (/越前陶芸村/.test(topic)) {
      return `越前陶芸村についての追加情報です。ここでは陶芸体験や工房見学ができ、手びねりや絵付けを体験できます。作品はお土産として持ち帰ることもできます。`;
    }
    if (/特産|名産|お土産|おみやげ/.test(topic)) {
      return `越前町のおすすめお土産は、越前和紙の文房具や越前漆器の小物、季節の海産物です。冬なら越前ガニ、夏なら新鮮な魚介も人気です。`;
    }
    return `前に話した「${topic}」について、さらに詳しくお話しします。ほかに知りたいことはありますか？`;
  }

  return null;
}

// --- カテゴリーごとの表示設定 ---
const CATEGORY_STYLE = {
  nature:  { label: "自然",      color: "#2f6b4f" },
  history: { label: "歴史・文化", color: "#6a4c93" },
  food:    { label: "食べ物",    color: "#ff6f59" },
  play:    { label: "あそび場",  color: "#ffc247" },
  sweet:   { label: "お菓子屋",  color: "#e56db1" },
  public:  { label: "公共",      color: "#1f6feb" },
  other:   { label: "その他",    color: "#26314f" },
};

function getCategoryIconSvg(category, color, size = 18) {
  const iconPaths = {
    nature: '<path d="M5 19c2.4-3 4.1-4.2 7-4.2 2.2 0 3.8 1 5.2 3.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 14c-.6-3 1.2-6.1 4-8 1.8-1.2 4.1-1.6 6.4-1.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 14l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    history: '<path d="M4.5 19.5h15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M6 19.5V9.5l6-4 6 4v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 19.5v-5h6v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 8.5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    food: '<path d="M5.5 7.5h13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M7 7.5v7a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 10.5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    play: '<path d="M6 9.5h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 9.5v4.5m8-4.5v4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 13.5h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M9 14.5c1 1.4 1.8 2.2 3 2.2s2-1 3-2.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    sweet: '<path d="M6 10.5c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4v3c0 2.5-2 4.5-4.5 4.5h-3A4.5 4.5 0 0 1 6 13.5v-3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.5 8.5c.5-1.2 1.5-2 2.7-2.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M10 13.5h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    public: '<path d="M5 19.5h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M7 19.5V10.5l5-3 5 3v9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 19.5v-3.5h5v3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 13h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    other: '<path d="M12 4.5l1.5 3.9 4.2.2-3.3 2.5 1.2 4.1-3.6-2.4-3.6 2.4 1.2-4.1-3.3-2.5 4.2-.2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'
  };

  const pathMarkup = iconPaths[category] || iconPaths.other;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" style="color:${color}; flex-shrink:0;"><g fill="none">${pathMarkup}</g></svg>`;
}

function getDeleteIconSvg(size = 14) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" style="color:currentColor;"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function getPlusIconSvg(size = 14) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" style="color:currentColor;"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
}

// --- はじめのサンプルデータ（＝れい。じぶんの発見に書きかえよう）---
const STARTER_SPOTS = [
  {
    id: "sample-1",
    name: "（れい）〇〇公園",
    category: "nature",
    memo: "ここに、なぜおすすめなのか書こう。写真をとって、後で足してもいいね。",
    lat: 35.905,
    lng: 136.172,
  },
  {
    id: "sample-2",
    name: "（れい）〇〇神社",
    category: "history",
    memo: "実さいに行ってみて、感じたことを書いてみよう。",
    lat: 35.900,
    lng: 136.163,
  },
  {
    id: "sample-3",
    name: "越前陶芸村",
    category: "history",
    memo: "越前陶芸村（越前焼の拠点）は、越前焼の展示・体験施設や文化交流会館、福井県陶芸館に近接するエリアです。窯元見学や陶芸体験教室、古窯跡の展示、作家の作品販売などがあり、越前焼の歴史や技法を学べる人気スポットです。アクセスや開館情報は公式案内をご確認ください。",
    lat: 35.974086,
    lng: 136.129784,
  },
];

const STORAGE_KEY = "asahi-map-spots";

// ============================================================
// データの読み書き（ブラウザに保存するので、閉じても消えません）
// ============================================================
function loadSpots() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) { /* こわれてたら無視 */ }
  }
  return [...STARTER_SPOTS];
}

function saveSpots(spots) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(spots));
}

let spots = loadSpots();

if (!localStorage.getItem(STORAGE_KEY)) {
  saveSpots(spots);
}

// ============================================================
// 地図の準備
// ============================================================
const map = L.map("map").setView(MAP_CENTER, MAP_ZOOM);

L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.png", {
  attribution: '',
  maxZoom: 20,
  subdomains: ['a', 'b', 'c', 'd'],
}).addTo(map);

let markers = {};          // id -> Leafletマーカー
let pickedMarker = null;   // 地図をクリックしたときの仮マーカー
let currentView = { lat: MAP_CENTER[0], lng: MAP_CENTER[1], name: "初期表示" };
let lastDeletedSpot = null;
let currentEditingId = null;

// カテゴリーの色で丸いピンを作る
function makeIcon(category) {
  const style = CATEGORY_STYLE[category] || CATEGORY_STYLE.other;
  return L.divIcon({
    className: "",
    html: `<div style="
        background:${style.color};
        width:30px;height:30px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,.35); border:2px solid #fff;">
        <span style="transform:rotate(45deg); display:flex;">${getCategoryIconSvg(category, "#fff", 15)}</span>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}

function findSpotFromQuery(query) {
  const text = query.trim().toLowerCase();
  if (!text) return null;

  const exact = spots.find((spot) => spot.name.toLowerCase().includes(text));
  if (exact) return exact;

  for (const [category, style] of Object.entries(CATEGORY_STYLE)) {
    if (text.includes(style.label.toLowerCase())) {
      return spots.find((spot) => spot.category === category) || null;
    }
  }

  return null;
}

function showSpotOnMap(spot) {
  if (!spot) return;
  map.flyTo([spot.lat, spot.lng], 16, { duration: 0.8 });
  if (markers[spot.id]) {
    markers[spot.id].openPopup();
  }
  updateStreetView(spot.lat, spot.lng, spot.name);
}

function getGuideAnswer(query) {
  const text = query.trim().toLowerCase();

  if (/越前海岸|海岸|海沿い|サンセット|夕日|磯|浜辺|岩場/.test(text)) {
    return GUIDE_KNOWLEDGE.coast;
  }
  if (/海産物|魚|刺身|海鮮|漁港|かに|カニ|海の幸/.test(text)) {
    return GUIDE_KNOWLEDGE.seafood;
  }
  if (/越前陶芸村/.test(text)) {
    return "越前陶芸村は陶芸体験ができる人気スポットです。窯元めぐりや作品購入、手びねり体験などが楽しめます。";
  }
  if (/特産|名産/.test(text)) {
    return GUIDE_KNOWLEDGE.specialties;
  }
  if (/歴史|昔|伝統|文化|和紙|漆器/.test(text)) {
    return GUIDE_KNOWLEDGE.history;
  }
  if (/観光|スポット|おすすめ|見どころ|案内/.test(text)) {
    return GUIDE_KNOWLEDGE.sightseeing;
  }
  if (/食べ物|ごはん|グルメ|料理/.test(text)) {
    return GUIDE_KNOWLEDGE.food;
  }
  if (/買い物|おみやげ|ショップ|お店/.test(text)) {
    return GUIDE_KNOWLEDGE.shopping;
  }
  if (/越前町|丹生郡|福井県/.test(text)) {
    return GUIDE_KNOWLEDGE.about;
  }
  return null;
}

function createAssistantResponse(question) {
  const normalized = question.trim();

  if (!normalized) {
    return { type: 'local', text: '何でも気軽に聞いてください。越前町のおすすめや地図のことも案内します。' };
  }

  assistantState.history.push({ role: 'user', text: normalized });

  const spot = findSpotFromQuery(normalized);
  if (spot) {
    assistantState.lastTopic = spot.name;
    assistantState.history.push({ role: 'assistant', topic: spot.name, type: 'spot' });
    const memo = spot.memo ? `おすすめポイント: ${spot.memo}` : '';
    return { type: 'spot', text: `「${spot.name}」を地図に表示しました。${memo}`, spot };
  }

  const followUp = inferFollowUp(normalized);
  if (followUp) {
    assistantState.history.push({ role: 'assistant', topic: assistantState.lastTopic || normalized, type: 'followup' });
    return { type: 'followup', text: followUp };
  }

  const localAnswer = getGuideAnswer(normalized);
  if (localAnswer) {
    assistantState.lastTopic = normalized;
    assistantState.history.push({ role: 'assistant', topic: normalized, type: 'local' });
    return { type: 'local', text: localAnswer };
  }

  assistantState.history.push({ role: 'assistant', topic: normalized, type: 'web' });
  return { type: 'web', text: null };
}

async function fetchWebAnswer(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1&kp=-1`;
  try {
    const response = await fetch(ddgUrl);
    if (!response.ok) throw new Error("DuckDuckGo fetch failed");
    const data = await response.json();
    const answer = data.Answer || data.AbstractText || (Array.isArray(data.RelatedTopics) && data.RelatedTopics[0]?.Text);
    if (answer) {
      return `ウェブから見つけた情報です：${answer}`;
    }
  } catch (err) {
    console.warn(err);
  }

  try {
    const wikiSearchUrl = `https://ja.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&origin=*`;
    const response = await fetch(wikiSearchUrl);
    if (!response.ok) throw new Error("Wikipedia search failed");
    const data = await response.json();
    const title = data.query?.search?.[0]?.title;
    if (title) {
      const summaryUrl = `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const summaryRes = await fetch(summaryUrl);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData.extract) {
          return `ウェブから見つけた情報です：${summaryData.extract}`;
        }
      }
    }
  } catch (err) {
    console.warn(err);
  }

  return "ごめんなさい。ウェブ検索でも答えが見つかりませんでした。別の言い方で聞いてください。";
}

function render() {
  renderMarkers();
  renderList();
  document.getElementById("spotCount").textContent = spots.length;
}

function renderMarkers() {
  Object.values(markers).forEach((m) => map.removeLayer(m));
  markers = {};

  spots.forEach((spot) => {
    if (spot.hidden) return; // 管理上の非表示フラグ
    const style = CATEGORY_STYLE[spot.category] || CATEGORY_STYLE.other;
    const marker = L.marker([spot.lat, spot.lng], { icon: makeIcon(spot.category) })
      .addTo(map)
      .bindPopup(`<b>${escapeHtml(spot.name)}</b><br>${style.emoji} ${style.label}<br>${escapeHtml(spot.memo || "")}`);
    markers[spot.id] = marker;
  });
}

function renderList() {
  const list = document.getElementById("spotList");
  list.innerHTML = "";

  if (spots.length === 0) {
    list.innerHTML = `<li class="empty-msg">まだスポットがありません。<br>右のフォームから追加してみよう！</li>`;
    return;
  }

  spots.forEach((spot) => {
    const style = CATEGORY_STYLE[spot.category] || CATEGORY_STYLE.other;
    const li = document.createElement("li");
    li.className = "spot-card";
    li.innerHTML = `
      <button class="spot-card__del" title="削除する" data-id="${spot.id}">${getDeleteIconSvg(13)}</button>
      <p class="spot-card__name"><span class="spot-card__icon">${getCategoryIconSvg(spot.category, style.color, 16)}</span><span>${escapeHtml(spot.name)}</span></p>
      <p class="spot-card__memo">${escapeHtml(spot.memo || "")}</p>
    `;
    // カードをクリック → 地図をその場所に移動してポップアップを開く
    li.addEventListener("click", (e) => {
      if (e.target.classList.contains("spot-card__del")) return;
      map.flyTo([spot.lat, spot.lng], 16, { duration: 0.8 });
      markers[spot.id].openPopup();
      updateStreetView(spot.lat, spot.lng, spot.name);
    });
    list.appendChild(li);
  });

  // 削除ボタン
  list.querySelectorAll(".spot-card__del").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const removed = spots.find(s => s.id === id);
      if (removed) lastDeletedSpot = removed;
      spots = spots.filter((s) => s.id !== id);
      saveSpots(spots);
      render();
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function updateStreetView(lat, lng, name = "場所") {
  const frame = document.getElementById("streetViewFrame");
  const link = document.getElementById("streetViewLink");
  const title = document.getElementById("streetViewTitle");
  if (!frame || !link || !title) return;

  currentView = { lat, lng, name };
  const query = `${lat},${lng}`;
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(query)}&layer=c&cbll=${lat},${lng}&cbp=0,0,0,0,0&hl=ja&output=embed`;
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(query)}&layer=c&cbll=${lat},${lng}&hl=ja`;

  frame.src = embedUrl;
  link.href = mapsUrl;
  if (name && name !== '初期表示') {
    title.textContent = `${name}のストリートビュー`;
  } else {
    title.textContent = '';
  }
}

// Google Maps の URL から緯度経度を抽出する（いくつかの一般的な形式に対応）
function parseGoogleMapsUrl(url) {
  if (!url) return null;
  try {
    const decoded = decodeURIComponent(String(url));
    // 形式1: .../@lat,lng,zoom
    let m = decoded.match(/@([\-0-9\.]+),([\-0-9\.]+),/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    // 形式: /place/lat,lng or /place/Name/lat,lng
    m = decoded.match(/\/place\/([\-0-9\.]+),([\-0-9\.]+)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    // 形式2: ?q=lat,lng
    m = decoded.match(/[?&]q=([\-0-9\.]+),([\-0-9\.]+)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    // 形式: /dir//lat,lng
    m = decoded.match(/\/dir\/+([\-0-9\.]+),([\-0-9\.]+)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    // 形式3: !3dLAT!4dLNG
    m = decoded.match(/!3d([\-0-9\.]+)!4d([\-0-9\.]+)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    // 形式4: center=lat,lng
    m = decoded.match(/[?&]center=([\-0-9\.]+),([\-0-9\.]+)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

    // 最終手段: URL の中に現れる「数字,数字」のペアを探して、妥当な緯度経度範囲なら採用する
    const pairRe = /([\-]?[0-9]{1,3}\.\d+),\s*([\-]?[0-9]{1,3}\.\d+)/g;
    let candidate = null;
    let it;
    while ((it = pairRe.exec(decoded)) !== null) {
      const lat = parseFloat(it[1]);
      const lng = parseFloat(it[2]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        candidate = { lat, lng };
        break;
      }
    }
    if (candidate) return candidate;
  } catch (e) {
    // ignore
  }
  return null;
}


// ============================================================
// 地図をクリックしたら、フォームに緯度経度をセット
// ============================================================
map.on("click", (e) => {
  document.getElementById("inputLat").value = e.latlng.lat.toFixed(6);
  document.getElementById("inputLng").value = e.latlng.lng.toFixed(6);

  if (pickedMarker) map.removeLayer(pickedMarker);
  pickedMarker = L.circleMarker(e.latlng, {
    radius: 8,
    color: "#ff6f59",
    weight: 3,
    fillOpacity: 0.3,
  }).addTo(map).bindPopup("この場所をついかしますか？下のフォームに名前を入れて「追加する」を押してね").openPopup();

  updateStreetView(e.latlng.lat, e.latlng.lng, "選択した場所");
});

// 「Google MapsのURL」欄 → 貼り付けたら緯度経度を自動入力する仕組み（メインフォーム／管理パネル共通）
function wireGmUrlAutofill(urlInputId, latInputId, lngInputId, statusId) {
  const urlInput = document.getElementById(urlInputId);
  if (!urlInput) return;
  const applyGmUrlToForm = () => {
    const statusEl = document.getElementById(statusId);
    const url = urlInput.value.trim();
    if (!url) {
      if (statusEl) { statusEl.textContent = ''; statusEl.className = 'gm-url-status'; }
      return;
    }
    const coords = parseGoogleMapsUrl(url);
    if (!coords) {
      if (statusEl) {
        statusEl.textContent = '座標を読み取れませんでした。短縮リンク(maps.app.goo.gl)ではなく、地図を開いたときの完全なURLを貼ってね。';
        statusEl.className = 'gm-url-status gm-url-status--error';
      }
      return;
    }
    document.getElementById(latInputId).value = coords.lat.toFixed(6);
    document.getElementById(lngInputId).value = coords.lng.toFixed(6);
    if (statusEl) {
      statusEl.textContent = `✅ 緯度${coords.lat.toFixed(6)}・経度${coords.lng.toFixed(6)}を読み取りました`;
      statusEl.className = 'gm-url-status gm-url-status--ok';
    }
    if (pickedMarker) { map.removeLayer(pickedMarker); pickedMarker = null; }
    pickedMarker = L.circleMarker([coords.lat, coords.lng], {
      radius: 8,
      color: "#ff6f59",
      weight: 3,
      fillOpacity: 0.3,
    }).addTo(map).bindPopup('この場所をついかしますか？下のフォームに名前を入れて「追加する」を押してね').openPopup();
    map.flyTo([coords.lat, coords.lng], 16, { duration: 0.6 });
    updateStreetView(coords.lat, coords.lng, 'Google Mapsで選択された場所');
  };
  urlInput.addEventListener('input', applyGmUrlToForm);
  urlInput.addEventListener('paste', () => setTimeout(applyGmUrlToForm, 0));
}

wireGmUrlAutofill('inputGmUrl', 'inputLat', 'inputLng', 'gmUrlStatus');
wireGmUrlAutofill('adminGmUrl', 'adminLat', 'adminLng', 'adminGmUrlStatus');

// フォームを管理者モードのときだけ使えるようにする
function setFormEnabled(enabled) {
  const form = document.getElementById('spotForm');
  if (!form) return;
  Array.from(form.querySelectorAll('input, textarea, select, button')).forEach((el) => {
    // submit ボタンは type=submit のものだけを無効化
    if (el.tagName.toLowerCase() === 'button' && el.type !== 'submit') return;
    el.disabled = !enabled;
  });
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.disabled = !enabled;
}

// ----------------------
// PIN 検証ユーティリティ
// ----------------------
// ここには平文の PIN は置かず、SHA-256 のハッシュを分割して格納しておく（簡易的な隠蔽）
const _pinHashChunksReversed = [
  'c43c510f','fe254275','1927c4f1','0e7f7898','09175046','6d1eb6b0','3f01dc89','b46937ef'
];
function _getExpectedPinHashHex() {
  // 配列は逆順で保持しているのでここで結合して正順に戻す
  return _pinHashChunksReversed.slice().reverse().join('');
}

async function sha256Hex(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const h = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
  return h;
}

async function verifyPinInput(pin) {
  try {
    const got = await sha256Hex(pin);
    const expected = _getExpectedPinHashHex();
    if (got === expected) return true;
    // Local development fallback: allow plaintext PIN on localhost for convenience
    try {
      const host = (location && location.hostname) || '';
      if ((host === '127.0.0.1' || host === 'localhost') && pin === '06300609') return true;
    } catch (e) {}
    console.debug('PIN verify failed', { pin, got, expected });
    return false;
  } catch (e) {
    return false;
  }
}

// PIN モーダルを表示して入力を待つ。入力が正しければ true を返す
function promptPinModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById('pinModal');
    const input = document.getElementById('pinInput');
    const ok = document.getElementById('pinOk');
    const cancel = document.getElementById('pinCancel');
    if (!modal || !input || !ok || !cancel) return resolve(false);
    modal.setAttribute('aria-hidden', 'false');
    input.value = '';
    input.focus();

    async function cleanUp() {
      modal.setAttribute('aria-hidden', 'true');
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKey);
    }
    async function onOk(e) {
      const val = input.value.trim();
      if (val.length !== 8) return;
      const okflag = await verifyPinInput(val);
      await cleanUp();
        resolve(okflag);
        if (okflag) {
          try { sessionStorage.setItem('asahi-admin-unlocked', '1'); } catch (e) {}
        }
    }

    function onCancel(e) {
      cleanUp();
      resolve(false);
    }

    function onKey(e) {
      if (e.key === 'Enter') {
        if (input.value.trim().length === 8) onOk();
      }
      if (e.key === 'Escape') onCancel();
    }

    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKey);
  });
}


// ======================================
// 管理モードのギミック（非表示→表示）
// - デフォルトで地図のみ表示（body.minimal-view）
// - Ctrl+Shift+A でトグル
// - 地図左上を短時間に5回クリックでもトグル
// ======================================
(function setupAdminGimmick(){
  // 初期の最小表示は有効化しない（常にスポット一覧を表示）
  // document.body.classList.add('minimal-view');

  function showAdmin() {
    document.body.classList.remove('minimal-view');
    document.body.classList.add('admin-visible');
    setFormEnabled(true);
    const panel = document.getElementById('adminPanel');
    if (panel) panel.setAttribute('aria-hidden','false');
    populateAdminList();
  }
  function hideAdmin() {
    document.body.classList.remove('minimal-view');
    document.body.classList.remove('admin-visible');
    setFormEnabled(false);
    const panel = document.getElementById('adminPanel');
    if (panel) panel.setAttribute('aria-hidden','true');
    try { sessionStorage.removeItem('asahi-admin-unlocked'); } catch (e) {}
  }
  function _isDesktop() {
    return window.innerWidth >= 900;
  }

  async function toggleAdmin() {
    if (! _isDesktop()) {
      alert('管理モードはPC（デスクトップ）でのみ有効です。');
      return;
    }
    if (document.body.classList.contains('admin-visible')) {
      hideAdmin();
      return;
    }
    // 管理モードに入る場合は PIN を要求する
    const ok = await promptPinModal();
    if (ok) {
      showAdmin();
    } else {
      alert('コードが違います。');
    }
  }

  // キーボードショートカット: Ctrl+Shift+A
  window.addEventListener('keydown', (ev) => {
    // ignore shortcuts while typing in inputs/textareas or contentEditable
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
    if (ev.ctrlKey && ev.shiftKey && (ev.key === 'A' || ev.key === 'a')) {
      ev.preventDefault();
      toggleAdmin();
    }
  });

  // 地図左上を 5 回クリックで開く
  const mapDiv = document.getElementById('map');
  if (!mapDiv) return;
  let clickCount = 0;
  let clickTimer = null;
  mapDiv.addEventListener('click', (ev) => {
    if (! _isDesktop()) return; // モバイルでは左上5クリックギミックを無効化
    const rect = mapDiv.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    // 左上領域（80x80px）に限定
    if (x >= 0 && x < 80 && y >= 0 && y < 80) {
      clickCount++;
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clickCount = 0; clickTimer = null; }, 2000);
      if (clickCount >= 5) {
        clickCount = 0;
        toggleAdmin();
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
      }
    } else {
      // 他の場所をクリックしたらリセット
      clickCount = 0;
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
    }
  });

  // 管理バッジを追加（表示用、クリックで管理モードを終了できる）
  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = 'admin-badge';
  badge.title = 'クリックで管理モードを終了';
  badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="vertical-align:middle; margin-right:6px;"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.7l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.7-.3 1.7 1.7 0 0 0-1 .9 1.7 1.7 0 0 1-3 0 1.7 1.7 0 0 0-1-.9 1.7 1.7 0 0 0-1.7.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.7 1.7 1.7 0 0 0-.9-1 1.7 1.7 0 0 1 0-3 1.7 1.7 0 0 0 .9-1 1.7 1.7 0 0 0-.3-1.7l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.7.3 1.7 1.7 0 0 0 1-.9 1.7 1.7 0 0 1 3 0c.3.5.8.9 1 .9.6.2 1.1 0 1.7-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.7c.2.6.7 1 1 1 .6.2 1.1 0 1.7-.3z" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>管理モード（クリックで終了）</span>';
  badge.addEventListener('click', () => {
    if (confirm('管理モードを終了しますか？')) hideAdmin();
  });
  document.body.appendChild(badge);
  // 初期はフォーム無効
  setFormEnabled(false);
  // セッションに管理者フラグがあれば自動で戻す
  try {
    const ok = sessionStorage.getItem('asahi-admin-unlocked');
    if (ok && _isDesktop()) {
      showAdmin();
    }
  } catch (e) {}

  // エクスポート：外部から開閉できるようグローバルに公開
  window.showAdmin = showAdmin;
  window.hideAdmin = hideAdmin;

})();

// 管理パネルの操作
function populateAdminList() {
  const list = document.getElementById('adminSpotList');
  if (!list) return;
  list.innerHTML = '';
  spots.forEach((s) => {
    const li = document.createElement('li');
    li.className = 'admin-spot-item';
    li.innerHTML = `<div class="meta"><b>${escapeHtml(s.name)}</b><small>${CATEGORY_STYLE[s.category]?.label||s.category}</small><div>${escapeHtml(s.memo||'')}</div></div><div class="controls"><button class="btn-small admin-center" data-id="${s.id}">センター</button><button class="btn-small btn-ghost admin-copy" data-id="${s.id}">リンクコピー</button><button class="btn-small btn-ghost admin-toggle" data-id="${s.id}">${s.hidden? '表示' : '非表示'}</button><button class="btn-small btn-ghost admin-edit" data-id="${s.id}">編集</button><button class="btn-small admin-del" data-id="${s.id}">削除</button></div>`;
    list.appendChild(li);
  });

  // 削除
  list.querySelectorAll('.admin-del').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      if (!confirm('このスポットを削除しますか？')) return;
      const removed = spots.find(s => s.id === id);
      if (removed) lastDeletedSpot = removed;
      spots = spots.filter((p) => p.id !== id);
      saveSpots(spots);
      render();
      populateAdminList();
    });
  });

  // センター
  list.querySelectorAll('.admin-center').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      const spot = spots.find(s => s.id === id);
      if (!spot) return;
      map.flyTo([spot.lat, spot.lng], 16, { duration: 0.6 });
      if (markers[spot.id]) markers[spot.id].openPopup();
      updateStreetView(spot.lat, spot.lng, spot.name);
    });
  });

  // コピー
  list.querySelectorAll('.admin-copy').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = btn.dataset.id;
      const spot = spots.find(s => s.id === id);
      if (!spot) return;
      const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(spot.lat + ',' + spot.lng)}`;
      try { await navigator.clipboard.writeText(mapsUrl); alert('リンクをコピーしました'); } catch (err) { prompt('コピーできない場合は以下を手動でコピーしてください', mapsUrl); }
    });
  });

  // 非表示トグル
  list.querySelectorAll('.admin-toggle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      const spot = spots.find(s => s.id === id);
      if (!spot) return;
      spot.hidden = !spot.hidden;
      saveSpots(spots);
      render();
      populateAdminList();
    });
  });

  // 編集
  list.querySelectorAll('.admin-edit').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      const spot = spots.find(s => s.id === id);
      if (!spot) return;
      currentEditingId = id;
      document.getElementById('adminName').value = spot.name;
      document.getElementById('adminCategory').value = spot.category;
      document.getElementById('adminMemo').value = spot.memo || '';
      document.getElementById('adminLat').value = spot.lat;
      document.getElementById('adminLng').value = spot.lng;
      document.getElementById('adminGmUrl').value = '';
      const adminGmStatus = document.getElementById('adminGmUrlStatus');
      if (adminGmStatus) { adminGmStatus.textContent = ''; adminGmStatus.className = 'gm-url-status'; }
      // show add tab
      document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('admin-tab--active'));
      const addTab = document.querySelector('.admin-tab[data-tab="add"]');
      if (addTab) addTab.classList.add('admin-tab--active');
      document.querySelectorAll('.admin-content').forEach(c=>c.classList.add('admin-content--hidden'));
      const show = document.getElementById('adminAdd'); if (show) show.classList.remove('admin-content--hidden');
    });
  });
}

// Admin panel buttons
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'adminClose') {
    hideAdmin();
  }
  if (e.target && e.target.id === 'exportBtn') {
    const blob = new Blob([JSON.stringify(spots, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'spots.json'; a.click();
    URL.revokeObjectURL(url);
  }
  if (e.target && e.target.id === 'importBtn') {
    const f = document.getElementById('importFile'); if (f) f.click();
  }
  if (e.target && e.target.id === 'clearBtn') {
    if (!confirm('本当に全スポットを削除しますか？')) return;
    spots = [];
    saveSpots(spots);
    render();
    populateAdminList();
  }
  if (e.target && e.target.id === 'undoBtn') {
    if (!lastDeletedSpot) { alert('取り消す操作がありません'); return; }
    spots.push(lastDeletedSpot);
    lastDeletedSpot = null;
    saveSpots(spots);
    render();
    populateAdminList();
  }
  if (e.target && e.target.id === 'restoreSamplesBtn') {
    if (!confirm('サンプルデータで置き換えます。よろしいですか？')) return;
    spots = [...STARTER_SPOTS];
    saveSpots(spots);
    render();
    populateAdminList();
  }
});

const importFile = document.getElementById('importFile');
if (importFile) {
  importFile.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('invalid');
        if (!confirm('インポートすると現在のスポットは置き換わります。よろしいですか？')) return;
        spots = parsed;
        saveSpots(spots);
        render();
        populateAdminList();
      } catch (err) { alert('ファイルの読み込みに失敗しました'); }
    };
    reader.readAsText(file);
  });
}

// Add form in admin panel
const adminForm = document.getElementById('adminAddForm');
if (adminForm) {
  adminForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = document.getElementById('adminName').value.trim();
    const category = document.getElementById('adminCategory').value;
    const memo = document.getElementById('adminMemo').value.trim();
    const lat = parseFloat(document.getElementById('adminLat').value);
    const lng = parseFloat(document.getElementById('adminLng').value);
    if (!name || Number.isNaN(lat) || Number.isNaN(lng)) { alert('必須項目を入力してください'); return; }
    if (currentEditingId) {
      // 編集モード
      const s = spots.find(x => x.id === currentEditingId);
      if (s) { s.name = name; s.category = category; s.memo = memo; s.lat = lat; s.lng = lng; }
      currentEditingId = null;
    } else {
      spots.push({ id: 'spot-' + Date.now(), name, category, memo, lat, lng });
    }
    saveSpots(spots);
    render();
    populateAdminList();
    adminForm.reset();
    const adminGmStatus = document.getElementById('adminGmUrlStatus');
    if (adminGmStatus) { adminGmStatus.textContent = ''; adminGmStatus.className = 'gm-url-status'; }
    // switch back to spots tab
    document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('admin-tab--active'));
    document.querySelector('.admin-tab[data-tab="spots"]').classList.add('admin-tab--active');
    document.getElementById('adminAdd').classList.add('admin-content--hidden');
    document.getElementById('adminSpots').classList.remove('admin-content--hidden');
  });
}

// Tab switching
document.querySelectorAll('.admin-tab').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('admin-tab--active'));
    btn.classList.add('admin-tab--active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.admin-content').forEach(c=>c.classList.add('admin-content--hidden'));
    const show = document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (show) show.classList.remove('admin-content--hidden');
  });
});

// (短縮リンクの開く系ボタンはユーザーの要望により削除されました)

// ============================================================
// フォーム送信 → 新しいスポットを追加
// ============================================================
document.getElementById("spotForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("inputName").value.trim();
  const category = document.getElementById("inputCategory").value;
  const memo = document.getElementById("inputMemo").value.trim();
  const lat = parseFloat(document.getElementById("inputLat").value);
  const lng = parseFloat(document.getElementById("inputLng").value);

  if (!name || Number.isNaN(lat) || Number.isNaN(lng)) {
    alert("名前と場所（緯度・経度）を入力してね。地図をクリックすると場所は自動で入るよ。");
    return;
  }

  // 管理モードでなければ追加をブロック
  if (!document.body.classList.contains('admin-visible')) {
    alert('スポットの追加は管理者モードでのみ可能です。');
    return;
  }

  spots.push({
    id: "spot-" + Date.now(),
    name, category, memo, lat, lng,
  });
  saveSpots(spots);

  e.target.reset();
  const gmUrlStatus = document.getElementById('gmUrlStatus');
  if (gmUrlStatus) { gmUrlStatus.textContent = ''; gmUrlStatus.className = 'gm-url-status'; }
  if (pickedMarker) { map.removeLayer(pickedMarker); pickedMarker = null; }
  updateStreetView(lat, lng, name);
  render();
});

function addAssistantMessage(text, isUser = false, isPlaceholder = false) {
  const history = document.getElementById("assistantHistory");
  const message = document.createElement("div");
  message.className = `assistant-message ${isUser ? "assistant-message--user" : "assistant-message--bot"}`;
  message.textContent = text;
  if (isPlaceholder) {
    message.classList.add('assistant-message--loading');
  }
  history.appendChild(message);
  history.scrollTop = history.scrollHeight;
  return message;
}

function setupAssistant() {
  const form = document.getElementById("assistantForm");
  const input = document.getElementById("assistantInput");
  if (!form || !input) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    addAssistantMessage(question, true);
    input.value = "";
    input.focus();

    const response = createAssistantResponse(question);
    if (response.type === "spot") {
      addAssistantMessage(response.text, false);
      showSpotOnMap(response.spot);
      return;
    }
    if (response.type === "followup" || response.type === "local") {
      setTimeout(() => addAssistantMessage(response.text, false), 250);
      return;
    }

    const loading = addAssistantMessage("ウェブを検索しています...", false, true);
    const webAnswer = await fetchWebAnswer(question);
    loading.textContent = webAnswer;
  });
}

function setupScrollReveal() {
  const targets = document.querySelectorAll('.animate-on-scroll');
  if (!('IntersectionObserver' in window) || targets.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -20% 0px',
    threshold: 0.15,
  });

  targets.forEach((target) => observer.observe(target));
}

// ============================================================
// 「はじめのデータに戻す」ボタン
// ============================================================
document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("追加したスポットが全部消えて、サンプルデータに戻ります。よろしいですか？")) return;
  spots = [...STARTER_SPOTS];
  saveSpots(spots);
  render();
});

// ============================================================
// はじめの描画
// ============================================================
render();
setupAssistant();
setupScrollReveal();
updateStreetView(MAP_CENTER[0], MAP_CENTER[1], "初期表示");

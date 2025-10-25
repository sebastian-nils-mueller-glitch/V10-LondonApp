/* === LondonApp V3.6.2 – “Smart Maps” Update === */
/* Features:
   ✅ Dynamischer Skyline-Banner (zeitabhängig, Fade-In)
   ✅ Voll funktionsfähige Tageskarte mit Leaflet (nummerierte Marker, Route, Popups)
   ✅ Automatische Koordinaten für bekannte Orte (Map-Button überall aktiv)
   ✅ Accordion, Wetter, Ideen-Erweiterung, Navigation
*/

const el = (q, c = document) => c.querySelector(q);
const els = (q, c = document) => [...c.querySelectorAll(q)];

const dayColors = ["#2b5cff", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#16a085"];
let globalData = null;
let currentDayIndex = null;
let mapInstance = null;

// ---------- Dynamischer Banner ----------
document.addEventListener("DOMContentLoaded", () => {
  setDynamicBanner();
  setInterval(setDynamicBanner, 60 * 60 * 1000);
});

function setDynamicBanner() {
  const banner = el(".trip-banner");
  if (!banner) return;
  const hour = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    hour12: false,
  });
  const h = parseInt(hour, 10);
  let image = "";

  if (h >= 6 && h < 10)
    image = "https://images.unsplash.com/photo-1602535819025-6cf5f7b1bbfe?auto=format&fit=crop&w=1500&q=80";
  else if (h >= 10 && h < 17)
    image = "https://images.unsplash.com/photo-1473959383417-5cd8c1df8a06?auto=format&fit=crop&w=1500&q=80";
  else if (h >= 17 && h < 21)
    image = "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1500&q=80";
  else
    image = "https://images.unsplash.com/photo-1541844053589-346841d0d8f8?auto=format&fit=crop&w=1500&q=80";

  banner.style.transition = "background-image 1.2s ease-in-out";
  banner.style.backgroundImage = `url(${image})`;
}

// ---------- Ortskoordinaten (für Ideen und bekannte Orte) ----------
const coordDB = {
  "Brat Shoreditch": { lat: 51.5243, lng: -0.0788 },
  "Padella Borough Market": { lat: 51.505, lng: -0.091 },
  "Hawksmoor Seven Dials": { lat: 51.5147, lng: -0.1276 },
  "Flat Iron Steak": { lat: 51.5139, lng: -0.1372 },
  "Sketch London": { lat: 51.512, lng: -0.1416 },
  "The Wolseley": { lat: 51.5076, lng: -0.1414 },
  "The Shard Design Level": { lat: 51.5045, lng: -0.0865 },
  "Tate Modern": { lat: 51.5076, lng: -0.0994 },
  "Southbank Walk": { lat: 51.5055, lng: -0.1214 },
  "Tower Bridge View": { lat: 51.5055, lng: -0.0754 },
  "Somerset House": { lat: 51.5111, lng: -0.1162 },
  "Victoria & Albert Museum": { lat: 51.4966, lng: -0.1722 },
  "National Gallery": { lat: 51.5089, lng: -0.1283 },
  "British Museum": { lat: 51.5194, lng: -0.1269 },
  "Sky Garden": { lat: 51.5105, lng: -0.0838 },
  "Millennium Bridge": { lat: 51.508, lng: -0.098 },
  "Piccadilly Circus": { lat: 51.5101, lng: -0.134 },
  "Neal’s Yard": { lat: 51.5145, lng: -0.1267 },
  "St Dunstan in the East": { lat: 51.5096, lng: -0.0814 },
  "Hampstead Heath View": { lat: 51.5606, lng: -0.157 },
  "Primrose Hill": { lat: 51.5396, lng: -0.1607 },
  "Greenwich Observatory": { lat: 51.4769, lng: -0.0005 },
  "Cinnamon Club": { lat: 51.4963, lng: -0.1287 },
  "Ottolenghi Spitalfields": { lat: 51.5201, lng: -0.0755 }
};

// ---------- Daten laden ----------
async function loadData() {
  try {
    const res = await fetch("london2025_data.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("Datei nicht gefunden");
    globalData = await res.json();
    renderDays(globalData.tage || []);
    renderIdeas(globalData.ideen || {});
  } catch (e) {
    console.error("Fehler beim Laden der Daten:", e);
    el("#day-grid").innerHTML = "<div class='card'>⚠️ Reiseplan konnte nicht geladen werden.</div>";
  }
}

// ---------- Tagesübersicht ----------
function renderDays(days) {
  const grid = el("#day-grid");
  grid.innerHTML = "";
  days.forEach((day) => {
    const color = dayColors[(day.tag - 1) % dayColors.length];
    const card = document.createElement("button");
    card.className = "day-card";
    const date = new Date(day.datum).toLocaleDateString("de-DE", {
      weekday: "short", day: "2-digit", month: "2-digit",
    });
    card.innerHTML = `
      <h3 style="color:${color}">Tag ${day.tag} – ${date}</h3>
      <div class="badge" style="color:${color}">
        <span class="dot" style="background:${color}"></span>
        <span>${day.titel}</span>
      </div>`;
    card.onclick = () => openSheet(day.tag - 1);
    grid.appendChild(card);
  });
}

// ---------- Ideen & Alternativen ----------
function renderIdeas(ideas) {
  const wrap = el("#ideas");
  wrap.innerHTML = "";
  const groups = [
    { key: "abends", title: "Abendspaziergänge", icon: "🌆" },
    { key: "design_orte", title: "Design & Orte mit Charakter", icon: "🎨" },
    { key: "kulinarisch", title: "Kulinarische Abende", icon: "🍽️" },
    { key: "kultur_tipps", title: "Kulturelle Geheimtipps", icon: "🏛️" },
    { key: "fotospots", title: "Fotospots", icon: "📷" },
  ];

  groups.forEach((g) => {
    let list = ideas[g.key] || [];
    if (list.length < 10) list = expandIdeaList(list, g.key);

    const group = document.createElement("div");
    group.className = "idea-group collapsed";

    const header = document.createElement("div");
    header.className = "idea-header";
    header.innerHTML = `
      <div class="title">${g.icon} ${g.title}</div>
      <div class="toggle">＋</div>
    `;
    group.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "idea-grid";
    list.forEach((item) => {
      const name = item.name || "";
      const link = item.url || `https://www.tripadvisor.com/Search?q=${encodeURIComponent(name + " London")}`;
      const coords = item.coords || coordDB[name]; // automatisch Koordinaten prüfen
      const pill = document.createElement("div");
      pill.className = "idea-pill";
      pill.innerHTML = `
        <div class="name">${name}</div>
        <div class="actions">
          <button class="btn small">🔗 Link</button>
          ${coords ? `<button class="btn small">📍 Map</button>` : ""}
        </div>
      `;
      const [linkBtn, mapBtn] = pill.querySelectorAll("button");
      linkBtn.onclick = () => window.open(link, "_blank");
      if (mapBtn) mapBtn.onclick = () => openMapForCoords(name, coords.lat, coords.lng);
      grid.appendChild(pill);
    });
    group.appendChild(grid);
    header.onclick = () => toggleAccordion(group);
    wrap.appendChild(group);
  });
}

function toggleAccordion(target) {
  els(".idea-group").forEach((g) => {
    if (g !== target) g.classList.add("collapsed");
  });
  target.classList.toggle("collapsed");
}

// ---------- Ideen auffüllen ----------
function expandIdeaList(list, key) {
  const db = {
    abends: ["Southbank Walk","Leicester Square","Regent’s Park","Soho Nights","Embankment Lights","Piccadilly Circus","Covent Garden Evenings","Trafalgar Square","Canary Wharf Lights","Chelsea Riverside"],
    design_orte: ["Tate Modern","Barbican Centre","Somerset House","The Shard Design Level","Saatchi Gallery","Design District Greenwich","Whitechapel Gallery","Victoria & Albert Museum","Serpentine Pavilion","Museum of London"],
    kulinarisch: ["Flat Iron Steak","Padella Borough Market","Hawksmoor Seven Dials","Sketch London","The Wolseley","Cinnamon Club","Ottolenghi Spitalfields","Dishoom Covent Garden","The Ivy Market Grill","Bill’s Soho"],
    kultur_tipps: ["British Museum","Shakespeare’s Globe","National Gallery","St. Paul’s Cathedral","Science Museum","Royal Albert Hall","Natural History Museum","National Theatre","Somerset House","Barbican Centre"],
    fotospots: ["London Eye","Millennium Bridge","Piccadilly Lights","Neal’s Yard","St Dunstan in the East","Hampstead Heath View","Primrose Hill","Tower Bridge View","Sky Garden","Greenwich Observatory"],
  };
  const names = list.map((i) => i.name);
  db[key].forEach((name) => {
    if (!names.includes(name)) {
      const coords = coordDB[name] || null;
      list.push(coords ? { name, coords } : { name });
    }
  });
  return list.slice(0, 10);
}

// ---------- Bottom Sheet ----------
const sheet = el("#sheet");
const sheetTitle = el("#sheetTitle");
const timeline = el("#timeline");

function openSheet(index) {
  if (!globalData) return;
  const days = globalData.tage || [];
  currentDayIndex = index;
  const day = days[index];

  sheetTitle.textContent = `Tag ${day.tag}: ${day.titel}`;
  timeline.innerHTML = "";

  (day.punkte || []).forEach((p) => {
    const link = p.url || `https://www.tripadvisor.com/Search?q=${encodeURIComponent(p.name + " London")}`;
    const row = document.createElement("div");
    row.className = "event";
    row.innerHTML = `
      <div class="time">${p.zeit || ""}</div>
      <div class="event-card">
        <div class="title">${p.name}</div>
        <div class="row"><a href="${link}" target="_blank">Link</a></div>
      </div>`;
    timeline.appendChild(row);
  });

  addWeatherTile(day);
  updateTopNav(index);

  sheet.classList.remove("hidden");
  requestAnimationFrame(() => sheet.classList.add("visible"));
}

function updateTopNav(index) {
  const days = globalData.tage || [];
  const prev = el("#prevDayTop");
  const next = el("#nextDayTop");
  const mapBtn = el("#openMap");

  prev.disabled = index === 0;
  next.disabled = index === days.length - 1;

  prev.onclick = () => openSheet(index - 1);
  next.onclick = () => openSheet(index + 1);
  mapBtn.onclick = () => openMap(days[index]);
  el("#closeSheet").onclick = closeSheet;
}

function closeSheet() {
  sheet.classList.remove("visible");
  setTimeout(() => sheet.classList.add("hidden"), 250);
}

// ---------- MAP ----------
const mapModal = el("#mapModal");
const closeMapBtn = el("#closeMap");
const mapHint = el("#mapHint");

function openMap(day) {
  if (!day || !day.punkte) return;
  mapModal.classList.remove("hidden");
  requestAnimationFrame(() => mapModal.classList.add("visible"));
  mapHint.classList.add("visible");
  setTimeout(() => mapHint.classList.remove("visible"), 3000);

  if (mapInstance) mapInstance.remove();
  mapInstance = L.map("map", { zoomControl: true, attributionControl: false });

  const coords = day.punkte.filter(p => p.coords);
  const latlngs = coords.map(p => [p.coords.lat, p.coords.lng]);
  const color = dayColors[(day.tag - 1) % dayColors.length];

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(mapInstance);

  coords.forEach((p, i) => {
    const marker = L.marker([p.coords.lat, p.coords.lng], {
      icon: L.divIcon({
        className: "custom-marker",
        html: `<div style="background:${color};color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;">${i + 1}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
      }),
    }).addTo(mapInstance);
    const link = p.url || `https://www.google.com/maps?q=${encodeURIComponent(p.name + ", London")}`;
    marker.bindPopup(`<strong>${p.name}</strong><br>${p.zeit || ""}<br><a href="${link}" target="_blank">📍 Google Maps</a>`);
  });

  if (latlngs.length > 1) {
    L.polyline(latlngs, { color, weight: 3, opacity: 0.8 }).addTo(mapInstance);
    mapInstance.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
  } else if (latlngs.length === 1) {
    mapInstance.setView(latlngs[0], 14);
  }
}

function openMapForCoords(name, lat, lng) {
  openMap({ tag: 0, punkte: [{ name, coords: { lat, lng } }] });
}

closeMapBtn.onclick = () => closeMap();
mapModal.ondblclick = () => closeMap();

function closeMap() {
  mapModal.classList.remove("visible");
  setTimeout(() => mapModal.classList.add("hidden"), 300);
  if (mapInstance) mapInstance.remove();
}

// ---------- Wetter & London Now ----------
async function addWeatherTile(day) {
  const container = document.createElement("div");
  container.className = "widget-row";
  timeline.appendChild(container);

  const weatherDiv = document.createElement("div");
  weatherDiv.className = "weather-tile";
  container.appendChild(weatherDiv);

  const first = (day.punkte || []).find(p => p.coords);
  if (first && first.coords) {
    const { lat, lng } = first.coords;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation_probability,windspeed_10m&daily=temperature_2m_max,precipitation_sum&forecast_days=2&timezone=Europe/London`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const currentTemp = data.current?.temperature_2m;
      const rain = data.current?.precipitation_probability;
      const wind = data.current?.windspeed_10m;
      const tomorrow = data.daily?.temperature_2m_max?.[1];
      const emoji = rain > 60 ? "🌧️" : rain > 30 ? "🌦️" : rain > 10 ? "⛅" : "☀️";
      weatherDiv.innerHTML = `
        <div class="header"><span class="icon">${emoji}</span><strong>${first.name}</strong></div>
        <div class="temp"><span class="big">${currentTemp?.toFixed(0)} °C</span> / <span>${tomorrow?.toFixed(0)} °C morgen</span></div>
        <div class="meta">💧 Regen ${rain ?? "?"}% · 💨 Wind ${wind?.toFixed(0) ?? "?"} km/h</div>`;
    } catch {
      weatherDiv.innerHTML = `<div class="header"><span class="icon">⚠️</span><strong>Wetterdaten nicht verfügbar</strong></div>`;
    }
  }

  addLondonNowTile(container);
}

function addLondonNowTile(container) {
  const nowDiv = document.createElement("div");
  nowDiv.className = "london-tile";
  container.appendChild(nowDiv);
  function updateTime() {
    const londonTime = new Date().toLocaleTimeString("de-DE", {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
    });
    nowDiv.innerHTML = `
      <div class="header"><span class="icon">🇬🇧</span><strong>London Now</strong></div>
      <div class="time">🕒 ${londonTime}</div>
      <div class="sun">🌅 07:42 · 🌇 16:12</div>`;
  }
  updateTime();
  setInterval(updateTime, 60000);
}

// ---------- Init ----------
loadData();


const NASA_API_KEY = "DEMO_KEY"; 
const NASA_APOD_URL = "https://science.nasa.gov/wp-json/wp/v2/apod-basic/"; 
const LAUNCHES_URL = "https://lldev.thespacedevs.com/2.3.0/launches/upcoming/?limit=10";
const BODIES_URL = "https://solar-system-opendata-proxy.vercel.app/api/planets";


function getElement(selector, root = document) {
  return root.querySelector(selector);
}


function getElements(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}


const number = (value, digits = 2) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))
  ? Number(value).toLocaleString("en-US", { maximumFractionDigits: digits }) : "N/A";
const dateText = (value, options = { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) => {
  if (!value) return "Date to be confirmed";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date to be confirmed" : date.toLocaleDateString("en-US", options);
};
const dateTimeText = value => {
  if (!value) return "Time to be confirmed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time to be confirmed";
  return `${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" })}`;
};

async function fetchJSON(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value ?? "N/A";
}


function showSection(sectionId) {
  getElements(".app-section").forEach(section => section.classList.toggle("hidden", section.id !== sectionId));
  getElements(".nav-link").forEach(link => {
    const active = link.dataset.section === sectionId;
    link.classList.toggle("bg-blue-500/10", active);
    link.classList.toggle("text-blue-400", active);
    link.classList.toggle("text-slate-300", !active);
    link.classList.toggle("bg-slate-800", false);
  });
  getElement("#sidebar")?.classList.remove("sidebar-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

getElements(".nav-link").forEach(link => link.addEventListener("click", event => {
  event.preventDefault();
  showSection(link.dataset.section);
}));

getElement("#sidebar-toggle")?.addEventListener("click", () => getElement("#sidebar")?.classList.toggle("sidebar-open"));


const apodDateInput = getElement("#apod-date-input");
const todayISO = new Date().toISOString().slice(0, 10);
if (apodDateInput) {
  apodDateInput.max = todayISO;
  apodDateInput.value = todayISO;
}

function showApodMessage(message, isError = false) {
  const container = getElement("#apod-image-container");
  if (!container) return;
  let status = getElement("#apod-status", container);
  if (!status) {
    status = document.createElement("p");
    status.id = "apod-status";
    status.className = "absolute bottom-3 left-3 right-3 rounded-lg bg-slate-900/90 p-3 text-sm";
    container.appendChild(status);
  }
  status.classList.toggle("text-red-300", isError);
  status.classList.toggle("text-slate-300", !isError);
  status.textContent = message;
}

async function loadApod(date = "") {
  const image = getElement("#apod-image");
  const loading = getElement("#apod-loading");
  const container = getElement("#apod-image-container");
  const status = getElement("#apod-status");
  if (status) status.remove();
  if (loading) loading.classList.remove("hidden");
  if (image) image.classList.add("opacity-30");

  try {
    const params = new URLSearchParams({ api_key: NASA_API_KEY });
    if (date) params.set("date", date);
    const responseData = await fetchJSON(`${NASA_APOD_URL}?${params.toString()}`);

    const apod = Array.isArray(responseData)
      ? (responseData.find(item => item.date === date) || responseData[0])
      : responseData;
    if (!apod) throw new Error("NASA did not return an APOD record for that date.");
    if (loading) loading.classList.add("hidden");
    if (image) {
      image.classList.remove("hidden", "opacity-30");
      image.alt = apod.title || "NASA Astronomy Picture of the Day";
      if (apod.media_type === "image") {
        image.src = apod.hdurl || apod.url;
        image.onerror = () => {
          image.onerror = null;
          image.src = apod.url;
        };
      } else {
        image.classList.add("hidden");
        let frame = getElement("#apod-video-frame", container);
        if (!frame) {
          frame = document.createElement("iframe");
          frame.id = "apod-video-frame";
          frame.className = "w-full h-full min-h-[300px]";
          frame.title = "NASA Astronomy Picture of the Day video";
          frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
          frame.allowFullscreen = true;
          container.appendChild(frame);
        }
        frame.src = apod.permalink || apod.url;
        frame.classList.remove("hidden");
      }
    }
    const frame = getElement("#apod-video-frame", container);
    if (apod.media_type === "image" && frame) {
      frame.src = "about:blank";
      frame.classList.add("hidden");
    }
    setText("apod-title", apod.title || "Astronomy Picture of the Day");
    setText("apod-explanation", apod.explanation || "NASA did not provide an explanation for this item.");
    setText("apod-copyright", apod.copyright ? `© ${apod.copyright}` : "Image credit: NASA");
    setText("apod-date", `Astronomy Picture of the Day — ${dateText(apod.date)}`);
    setText("apod-date-detail", apod.date);
    setText("apod-date-info", apod.date);
    setText("apod-media-type", apod.media_type === "video" ? "Video" : "Image");
    if (apodDateInput) apodDateInput.value = apod.date;
    const fullResolutionButton = getElement("#apod-image-container button");
    if (fullResolutionButton) {
      fullResolutionButton.onclick = () => window.open(apod.hdurl || apod.permalink || apod.url, "_blank", "noopener,noreferrer");
      fullResolutionButton.disabled = apod.media_type !== "image";
      fullResolutionButton.classList.toggle("opacity-50", apod.media_type !== "image");
    }
  } catch (error) {
    if (loading) loading.classList.add("hidden");
    if (image) image.classList.remove("opacity-30");
    showApodMessage(`Could not load NASA's image. ${error.message}. Check your internet connection or NASA API key.`, true);
    console.error("NASA APOD error:", error);
  } finally {

    if (loading) loading.classList.add("hidden");
    if (image) image.classList.remove("opacity-30");
  }
}

getElement("#load-date-btn")?.addEventListener("click", () => {
  if (!apodDateInput?.value) return showApodMessage("Please choose a date first.", true);
  if (apodDateInput.value > todayISO) return showApodMessage("Choose today or an earlier date.", true);
  loadApod(apodDateInput.value);
});
getElement("#today-apod-btn")?.addEventListener("click", () => loadApod(todayISO));
apodDateInput?.addEventListener("keydown", event => {
  if (event.key === "Enter") loadApod(apodDateInput.value);
});



//launch


const launchStatusText = launch => launch.status?.name || launch.status?.abbrev || "Status unavailable";
const launchProvider = launch => launch.launch_service_provider?.name || "Provider not listed";
const launchRocket = launch => launch.rocket?.configuration?.full_name || launch.rocket?.configuration?.name || "Rocket details unavailable";
const launchLocation = launch => launch.pad?.name
  ? `${launch.pad.name}${launch.pad.location?.name ? `, ${launch.pad.location.name}` : ""}`
  : launch.pad?.location?.name || "Launch location to be confirmed";
function launchImage(launch) {

    const candidates = [
    launch.image,
    launch.image?.image_url,
    launch.image?.thumbnail_url,
    launch.rocket?.configuration?.image_url,
    launch.rocket?.configuration?.image?.image_url,
    launch.rocket?.configuration?.image?.thumbnail_url,
    launch.rocket?.configuration?.launch_library_url
  ];
  return candidates.find(value => typeof value === "string" && /^https?:\/\//i.test(value)) || "";
}

function launchImageMarkup(launch, large = false) {
  const imageUrl = launchImage(launch);
  const fallback = `<div class="${imageUrl ? "hidden" : ""} launch-image-fallback flex items-center justify-center h-full min-h-[190px] bg-slate-900/60"><i class="fas fa-rocket text-6xl text-slate-700"></i></div>`;
  if (imageUrl) return `<img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(launch.name || "Rocket launch")}" class="w-full h-full object-cover" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')">${fallback}`;
  return fallback;
}

function renderFeaturedLaunch(launch) {
  const status = launchStatusText(launch);
  const launchDate = launch.net || launch.window_start;
  const mission = launch.mission?.description || "Mission details have not been published yet.";
  const country = launch.pad?.country?.name || "Country not listed";
  const countdownDays = launchDate ? Math.ceil((new Date(launchDate) - new Date()) / 86400000) : null;
  const countdown = countdownDays === null ? "TBD" : countdownDays <= 0 ? "Today" : String(countdownDays);
  const destination = launch.url || "https://thespacedevs.com/llapi";
  getElement("#featured-launch").innerHTML = `
    <article class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">
      <div class="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
      <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-5 md:p-8">
        <div class="flex flex-col justify-between gap-5">
          <div>
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <span class="px-4 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold"><i class="fas fa-star mr-2"></i>Featured Launch</span>
              <span class="px-4 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold">${escapeHTML(status)}</span>
            </div>
            <h3 class="text-2xl md:text-3xl font-bold mb-3 leading-tight">${escapeHTML(launch.name || "Upcoming launch")}</h3>
            <div class="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6 text-slate-400 text-sm">
              <span><i class="fas fa-building mr-2"></i>${escapeHTML(launchProvider(launch))}</span>
              <span><i class="fas fa-rocket mr-2"></i>${escapeHTML(launchRocket(launch))}</span>
            </div>
            <div class="inline-flex items-center gap-3 px-5 py-3 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6">
              <i class="fas fa-clock text-2xl text-blue-400"></i><div><p class="text-2xl font-bold text-blue-400">${escapeHTML(countdown)}</p><p class="text-xs text-slate-400">${countdown === "Today" ? "Launch day" : "Days until launch"}</p></div>
            </div>
            <div class="grid sm:grid-cols-2 gap-3 mb-6">
              <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1"><i class="fas fa-calendar mr-2"></i>Launch Date</p><p class="font-semibold">${escapeHTML(dateText(launchDate))}</p></div>
              <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1"><i class="fas fa-clock mr-2"></i>Launch Time</p><p class="font-semibold">${escapeHTML(dateTimeText(launchDate))}</p></div>
              <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1"><i class="fas fa-map-marker-alt mr-2"></i>Location</p><p class="font-semibold text-sm">${escapeHTML(launchLocation(launch))}</p></div>
              <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1"><i class="fas fa-globe mr-2"></i>Country</p><p class="font-semibold">${escapeHTML(country)}</p></div>
            </div>
            <p class="text-slate-300 leading-relaxed mb-2">${escapeHTML(mission)}</p>
          </div>
          <a href="${escapeHTML(destination)}" target="_blank" rel="noopener noreferrer" class="self-start px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold"><i class="fas fa-external-link-alt mr-2"></i>View Full Details</a>
        </div>
        <div class="relative min-h-[250px] lg:min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50">${launchImageMarkup(launch, true)}<div class="absolute inset-0 pointer-events-none bg-linear-to-t from-slate-900/70 via-transparent to-transparent"></div></div>
      </div>
    </article>`;
}

function renderLaunchCard(launch) {
  const launchDate = launch.net || launch.window_start;
  const status = launchStatusText(launch);
  const url = launch.url || "https://thespacedevs.com/llapi";
  return `<article class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all group">
    <div class="relative h-48 bg-slate-900/50 overflow-hidden">${launchImageMarkup(launch)}<span class="absolute top-3 right-3 px-3 py-1 bg-slate-900/90 text-blue-300 backdrop-blur-sm rounded-full text-xs font-semibold">${escapeHTML(status)}</span></div>
    <div class="p-5"><h4 class="font-bold text-lg mb-2 group-hover:text-blue-400 transition-colors">${escapeHTML(launch.name || "Upcoming launch")}</h4>
      <p class="text-sm text-slate-400 mb-4"><i class="fas fa-building text-xs mr-2"></i>${escapeHTML(launchProvider(launch))}</p>
      <div class="space-y-2 mb-4">
        <div class="flex items-start gap-2 text-sm"><i class="fas fa-calendar text-slate-500 w-4 mt-1"></i><span class="text-slate-300">${escapeHTML(dateText(launchDate))}</span></div>
        <div class="flex items-start gap-2 text-sm"><i class="fas fa-clock text-slate-500 w-4 mt-1"></i><span class="text-slate-300">${escapeHTML(dateTimeText(launchDate))}</span></div>
        <div class="flex items-start gap-2 text-sm"><i class="fas fa-rocket text-slate-500 w-4 mt-1"></i><span class="text-slate-300">${escapeHTML(launchRocket(launch))}</span></div>
        <div class="flex items-start gap-2 text-sm"><i class="fas fa-map-marker-alt text-slate-500 w-4 mt-1"></i><span class="text-slate-300">${escapeHTML(launchLocation(launch))}</span></div>
      </div>
      <a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" class="block text-center px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold">Mission Details <i class="fas fa-arrow-up-right-from-square ml-1"></i></a>
    </div></article>`;
}

async function loadLaunches() {
  const grid = getElement("#launches-grid");
  const feature = getElement("#featured-launch");
  if (grid) grid.innerHTML = '<p class="col-span-full text-slate-400">Loading upcoming launches…</p>';
  try {
    const data = await fetchJSON(LAUNCHES_URL);
    const launches = (data.results || []).filter(function (launch) {
      const launchDate = launch.net || launch.window_start;
      return launchDate && new Date(launchDate).getTime() > Date.now();
    });
    const sorted = launches.sort(function (a, b) {
      return new Date(a.net || a.window_start) - new Date(b.net || b.window_start);
    });
    setText("launches-count", `${sorted.length} Launches`);
    setText("launches-count-mobile", String(sorted.length));
    if (!sorted.length) {
      if (feature) feature.innerHTML = '<p class="text-slate-400 p-4">No upcoming launches were returned by the API. Please try again later.</p>';
      if (grid) grid.innerHTML = "";
      return;
    }
    renderFeaturedLaunch(sorted[0]);

    if (grid) grid.innerHTML = sorted.slice(0, 10).map(renderLaunchCard).join("");
  } catch (error) {
    console.error("Space Devs launches error:", error);
    if (feature) feature.innerHTML = `<p class="text-red-300 bg-slate-800/50 rounded-xl p-5">Could not load launch data (${escapeHTML(error.message)}). Check your connection or try again later.</p>`;
    if (grid) grid.innerHTML = "";
  } finally {

    console.log("Finished loading launch data.");
  }
}

//solar
const PLANET_ORDER = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];
const PLANET_COLORS = {
  mercury: "#eab308", venus: "#f97316", earth: "#3b82f6", mars: "#ef4444",
  jupiter: "#fb923c", saturn: "#facc15", uranus: "#06b6d4", neptune: "#2563eb"
};
const PLANET_IMAGES = {
  mercury: "./assets/images/mercury.png", venus: "./assets/images/venus.png", earth: "./assets/images/earth.png",
  mars: "./assets/images/mars.png", jupiter: "./assets/images/jupiter.png", saturn: "./assets/images/saturn.png",
  uranus: "./assets/images/uranus.png", neptune: "./assets/images/neptune.png"
};
let planetData = [];

const planetDistanceAU = planet => Number(planet.semimajorAxis) / 149597870.7;
const planetMassKg = planet => planet.mass ? Number(planet.mass.massValue) * Math.pow(10, Number(planet.mass.massExponent)) : NaN;
const earthMass = 5.9722e24;
const periodDays = planet => Number(planet.sideralOrbit);
const rotationHours = planet => Number(planet.sideralRotation);
const kmMillions = value => Number.isFinite(Number(value)) ? `${number(Number(value) / 1e6, 2)}M km` : "N/A";
const prettyMass = planet => {
  if (!planet.mass) return "N/A";
  return `${number(planet.mass.massValue, 3)} × 10${String(planet.mass.massExponent).sup()} kg`;
};
const bodyName = planet => planet.englishName || planet.name || "Unknown planet";

function renderPlanetCards(planets) {
  const grid = getElement("#planets-grid");
  if (!grid) return;
  grid.innerHTML = planets.map(planet => {
    const id = (planet.id || bodyName(planet)).toLowerCase();
    const name = bodyName(planet);
    const color = PLANET_COLORS[id] || "#60a5fa";
    const image = planet.image || PLANET_IMAGES[id] || "";
    return `<button type="button" class="planet-card text-left bg-slate-800/50 border border-slate-700 rounded-2xl p-4 transition-all cursor-pointer group hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400" data-planet-id="${escapeHTML(id)}" style="--planet-color:${color}">
      <div class="relative mb-3 h-24 flex items-center justify-center"><img class="planet-card-image w-20 h-20 object-contain group-hover:scale-110 transition-transform" src="${escapeHTML(image)}" alt="${escapeHTML(name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')"><span class="hidden text-5xl" aria-hidden="true">🪐</span></div>
      <h4 class="font-semibold text-center text-sm">${escapeHTML(name)}</h4><p class="text-xs text-slate-400 text-center">${number(planetDistanceAU(planet), 2)} AU</p>
    </button>`;
  }).join("");
  getElements(".planet-card", grid).forEach(card => card.addEventListener("click", () => {
    const selected = planets.find(item => (item.id || bodyName(item)).toLowerCase() === card.dataset.planetId);
    if (selected) renderPlanetDetails(selected);
  }));
}

function renderPlanetDetails(planet) {
  const name = bodyName(planet);
  const id = (planet.id || name).toLowerCase();
  const image = getElement("#planet-detail-image");
  if (image) {
    image.src = planet.image || PLANET_IMAGES[id] || "";
    image.alt = `${name} planet`;
    image.onerror = () => { image.onerror = null; image.style.display = "none"; };
    image.style.display = "";
  }
  setText("planet-detail-name", name);
  setText("planet-detail-description", planet.description || `${name} is a planet in our Solar System. The data below is retrieved from Solar System OpenData. Some discovery and physical values may be unavailable in the source API.`);
  setText("planet-distance", `${number(planet.semimajorAxis, 0)} km (${number(planetDistanceAU(planet), 3)} AU)`);
  setText("planet-radius", Number.isFinite(Number(planet.meanRadius)) ? `${number(planet.meanRadius, 0)} km` : "N/A");
  setText("planet-mass", prettyMass(planet));
  setText("planet-density", Number.isFinite(Number(planet.density)) ? `${number(planet.density, 2)} g/cm³` : "N/A");
  setText("planet-orbital-period", Number.isFinite(periodDays(planet)) ? `${number(periodDays(planet), 2)} days` : "N/A");
  setText("planet-rotation", Number.isFinite(rotationHours(planet)) ? `${number(rotationHours(planet), 2)} hours` : "N/A");
  setText("planet-moons", Array.isArray(planet.moons) ? String(planet.moons.length) : "0");
  setText("planet-gravity", Number.isFinite(Number(planet.gravity)) ? `${number(planet.gravity, 2)} m/s²` : "N/A");
  setText("planet-discoverer", planet.discoveredBy || "Known since antiquity");
  setText("planet-discovery-date", planet.discoveryDate || "Ancient / unknown");
  setText("planet-body-type", planet.type || planet.bodyType || "Planet");
  setText("planet-volume", planet.vol ? `${number(planet.vol.volValue, 3)} × 10${String(planet.vol.volExponent).sup()} km³` : "N/A");
  setText("planet-perihelion", kmMillions(planet.perihelion));
  setText("planet-aphelion", kmMillions(planet.aphelion));
  setText("planet-eccentricity", number(planet.eccentricity, 5));
  setText("planet-inclination", Number.isFinite(Number(planet.inclination)) ? `${number(planet.inclination, 3)}°` : "N/A");
  setText("planet-axial-tilt", Number.isFinite(Number(planet.axialTilt)) ? `${number(planet.axialTilt, 2)}°` : "N/A");
  setText("planet-temp", Number.isFinite(Number(planet.avgTemp)) ? `${number(planet.avgTemp, 1)}°C` : "N/A");
  setText("planet-escape", Number.isFinite(Number(planet.escape)) ? `${number(planet.escape, 2)} m/s` : "N/A");

  const facts = getElement("#planet-facts");
  if (facts) {
    const factItems = [
      `Mean radius: ${Number.isFinite(Number(planet.meanRadius)) ? `${number(planet.meanRadius, 0)} km` : "not available"}`,
      `Orbital period: ${Number.isFinite(periodDays(planet)) ? `${number(periodDays(planet), 2)} days` : "not available"}`,
      `Known moons: ${Array.isArray(planet.moons) ? planet.moons.length : 0}`,
      `Distance from the Sun: ${number(planetDistanceAU(planet), 3)} AU`
    ];
    facts.innerHTML = factItems.map(fact => `<li class="flex items-start"><i class="fas fa-check text-green-400 mt-1 mr-2"></i><span class="text-slate-300">${escapeHTML(fact)}</span></li>`).join("");
  }
}

function renderPlanetComparison(planets) {
  const tbody = getElement("#planet-comparison-tbody");
  if (!tbody) return;
  tbody.innerHTML = planets.map(planet => {
    const name = bodyName(planet);
    const id = (planet.id || name).toLowerCase();
    const color = PLANET_COLORS[id] || "#60a5fa";
    const massRatio = planetMassKg(planet) / earthMass;
    const type = planet.type || (id === "jupiter" || id === "saturn" ? "Gas Giant" : id === "uranus" || id === "neptune" ? "Ice Giant" : "Terrestrial");
    return `<tr class="hover:bg-slate-800/30 transition-colors">
      <td class="px-4 md:px-6 py-3 md:py-4 sticky left-0 bg-slate-800 z-10"><div class="flex items-center space-x-2 md:space-x-3"><div class="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0" style="background-color:${color}"></div><span class="font-semibold text-sm md:text-base whitespace-nowrap">${escapeHTML(name)}</span></div></td>
      <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm whitespace-nowrap">${number(planetDistanceAU(planet), 3)}</td>
      <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm whitespace-nowrap">${Number.isFinite(Number(planet.meanRadius)) ? number(Number(planet.meanRadius) * 2, 0) : "N/A"}</td>
      <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm whitespace-nowrap">${Number.isFinite(massRatio) ? number(massRatio, 4) : "N/A"}</td>
      <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm whitespace-nowrap">${Number.isFinite(periodDays(planet)) ? `${number(periodDays(planet), 2)} days` : "N/A"}</td>
      <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm whitespace-nowrap">${Array.isArray(planet.moons) ? planet.moons.length : 0}</td>
      <td class="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap"><span class="px-2 py-1 rounded text-xs" style="background:${color}33;color:${color}">${type}</span></td>
    </tr>`;
  }).join("");
}

async function loadPlanets() {
  const grid = getElement("#planets-grid");
  if (grid) grid.innerHTML = '<p class="col-span-full text-slate-400">Loading planet data…</p>';
  try {
    const data = await fetchJSON(BODIES_URL);
    const allBodies = Array.isArray(data.bodies) ? data.bodies : Array.isArray(data.planets) ? data.planets : Array.isArray(data) ? data : [];
    const byId = new Map(allBodies.map(body => [(body.id || body.englishName || "").toLowerCase(), body]));
    planetData = PLANET_ORDER.map(id => byId.get(id)).filter(Boolean);
    if (planetData.length !== 8) {
      const byName = new Map(allBodies.map(body => [(body.englishName || "").toLowerCase(), body]));
      planetData = PLANET_ORDER.map(id => byName.get(id)).filter(Boolean);
    }
    if (!planetData.length) throw new Error("No planet records were returned by the API.");
    renderPlanetCards(planetData);
    renderPlanetComparison(planetData);
    renderPlanetDetails(planetData.find(planet => (planet.id || "").toLowerCase() === "earth") || planetData[0]);
  } catch (error) {
    console.error("Solar System OpenData error:", error);
    if (grid) grid.innerHTML = `<p class="col-span-full text-red-300 bg-slate-800/50 rounded-xl p-4">Could not load planet data (${escapeHTML(error.message)}). Check your connection. The API may require a token depending on its current access policy.</p>`;
    const tbody = getElement("#planet-comparison-tbody");
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-slate-400">Planet comparison data is unavailable right now.</td></tr>';
  } finally {

    console.log("Finished loading planet data.");
  }
}


document.addEventListener("DOMContentLoaded", () => {
  loadApod(todayISO);
  loadLaunches();
  loadPlanets();
});

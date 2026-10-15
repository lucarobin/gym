(() => {
  "use strict";

  // ---------- Storage ----------
  const KEY = "gymTracker.v1";
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { saved = null; }
    const d = window.DEFAULTS;
    return Object.assign({
      targets: clone(d.targets),
      foods: clone(d.foods),
      exercises: clone(d.exercises),
      log: [],       // food entries
      runs: {},      // date -> km
      workouts: []   // exercise entries
    }, saved || {});
  }
  let S = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast("Couldn't save on this device"); }
  }

  // ---------- Helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const r0 = (n) => Math.round(n);
  const r1 = (n) => Math.round(n * 10) / 10;
  const num = (v, f = 0) => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : f; };
  const fmt = (n) => r0(n).toLocaleString();

  const iso = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
  const today = () => iso(new Date());
  const addDays = (s, n) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d); };
  const pretty = (s, long) => {
    const t = today();
    if (s === t) return "Today";
    if (s === addDays(t, -1)) return "Yesterday";
    if (s === addDays(t, 1)) return "Tomorrow";
    const d = new Date(s + "T12:00:00");
    return d.toLocaleDateString(undefined, long ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric", month: "short" });
  };

  let current = today();
  let view = "today";
  let split = "Upper";

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1800);
  }

  // ---------- Sheet ----------
  function openSheet(html, onMount) {
    $("#sheetBody").innerHTML = html;
    $("#sheet").classList.add("open"); $("#backdrop").classList.add("open");
    $("#sheet").scrollTop = 0;
    if (onMount) onMount($("#sheetBody"));
  }
  function closeSheet() { $("#sheet").classList.remove("open"); $("#backdrop").classList.remove("open"); }
  $("#backdrop").addEventListener("click", closeSheet);
  $("#sheetClose").addEventListener("click", closeSheet);

  // Generic stepper: buttons with data-step / data-target
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]"); if (!b) return;
    const input = document.getElementById(b.dataset.target); if (!input) return;
    const step = num(input.step, 1) || 1;
    const v = Math.max(num(input.min, 0), r1(num(input.value) + num(b.dataset.step) * step));
    input.value = v; input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const stepper = (id, value, step, cls = "") =>
    `<div class="stepper ${cls}"><button type="button" data-step="-1" data-target="${id}">−</button>` +
    `<input id="${id}" type="number" inputmode="decimal" min="0" step="${step}" value="${value}">` +
    `<button type="button" data-step="1" data-target="${id}">+</button></div>`;

  // ---------- Totals ----------
  function dayTotals(date) {
    const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, n: 0 };
    S.log.forEach((e) => { if (e.date === date) { t.kcal += e.kcal; t.protein += e.protein; t.carbs += e.carbs; t.fat += e.fat; t.n++; } });
    return t;
  }
  const kcalTarget = (date) => S.targets.kcal + num(S.runs[date]) * S.targets.kcalPerKm;

  // ---------- Food view ----------
  function renderToday() {
    const t = dayTotals(current), target = kcalTarget(current);
    const left = target - t.kcal, pct = target ? (t.kcal / target) * 100 : 0;
    $("#kcalLeft").textContent = fmt(Math.abs(left));
    $("#kcalLeftLabel").textContent = left >= 0 ? `kcal left of ${fmt(target)}` : `kcal over ${fmt(target)}`;
    const ring = $("#kcalRing");
    ring.style.setProperty("--p", Math.min(100, pct));
    ring.style.setProperty("--c", pct >= 100 ? "var(--ok)" : "var(--accent)");
    $("#kcalPct").textContent = r0(pct) + "%";

    $("#macroBars").innerHTML = [["Protein", "protein"], ["Carbs", "carbs"], ["Fat", "fat"]].map(([label, k]) => {
      const goal = S.targets[k], v = t[k], p = goal ? Math.min(100, (v / goal) * 100) : 0;
      return `<div><div class="bar-top"><span>${label}</span><span><b>${r0(v)}</b> / ${goal} g</span></div>` +
        `<div class="bar"><i style="width:${p}%;background:var(--${k})"></i></div></div>`;
    }).join("");

    const run = $("#runKm"); if (document.activeElement !== run) run.value = num(S.runs[current]);

    const entries = S.log.filter((e) => e.date === current);
    $("#mealEmpty").style.display = entries.length ? "none" : "block";
    const order = window.DEFAULTS.meals;
    const groups = {};
    entries.forEach((e) => (groups[e.meal] = groups[e.meal] || []).push(e));
    const names = Object.keys(groups).sort((a, b) => (order.indexOf(a) + 99 * (order.indexOf(a) < 0)) - (order.indexOf(b) + 99 * (order.indexOf(b) < 0)));
    $("#mealList").innerHTML = names.map((m) => {
      const list = groups[m], kcal = list.reduce((s, e) => s + e.kcal, 0);
      return `<div class="group-title"><span>${esc(m)}</span><span>${fmt(kcal)} kcal</span></div><div class="card">` +
        list.map((e) => `<div class="item" data-edit="${e.id}"><div class="grow"><div class="name">${esc(e.food)}</div>` +
          `<div class="sub">${r1(e.servings)} × ${esc(e.serving || "serving")} · P ${r0(e.protein)} · C ${r0(e.carbs)} · F ${r0(e.fat)}</div></div>` +
          `<div class="num">${fmt(e.kcal)}</div></div>`).join("") + `</div>`;
    }).join("");
  }
  $("#runKm").addEventListener("input", (e) => {
    const v = num(e.target.value);
    if (v > 0) S.runs[current] = v; else delete S.runs[current];
    save(); renderToday();
  });
  $("#mealList").addEventListener("click", (e) => {
    const it = e.target.closest("[data-edit]"); if (it) editEntry(it.dataset.edit);
  });

  function defaultMeal() {
    const h = new Date().getHours();
    if (h < 10) return "Breakfast";
    if (h < 14) return "Lunch";
    if (h < 18) return "Snack";
    return "Dinner";
  }
  function recentFoods() {
    const seen = new Set(), out = [];
    for (let i = S.log.length - 1; i >= 0 && out.length < 6; i--) {
      const n = S.log[i].food; if (!seen.has(n) && S.foods.some((f) => f.name === n)) { seen.add(n); out.push(n); }
    }
    return out;
  }

  function addFoodSheet() {
    const recent = recentFoods();
    openSheet(
      `<h3>Add food</h3><input class="search" id="foodSearch" placeholder="Search your foods…" autocomplete="off">` +
      (recent.length ? `<div class="chips" id="recentChips">${recent.map((n) => `<button class="chip" data-food="${esc(n)}">${esc(n)}</button>`).join("")}</div>` : "") +
      `<div id="foodResults"></div><button class="btn ghost full" style="margin-top:14px" id="customFood">+ Something else (type the numbers)</button>`,
      (root) => {
        const draw = (q) => {
          q = q.trim().toLowerCase();
          const list = S.foods.filter((f) => !q || f.name.toLowerCase().includes(q));
          $("#foodResults", root).innerHTML = list.map((f) =>
            `<button class="pick" data-food="${esc(f.name)}"><span>${esc(f.name)}<br><small>${esc(f.serving)}</small></span><span>${fmt(f.kcal)} kcal</span></button>`).join("") ||
            `<p class="empty">No match. Use “Something else” below.</p>`;
        };
        draw("");
        $("#foodSearch", root).addEventListener("input", (e) => draw(e.target.value));
        root.addEventListener("click", (e) => {
          const b = e.target.closest("[data-food]");
          if (b) amountSheet(S.foods.find((f) => f.name === b.dataset.food));
        });
        $("#customFood", root).addEventListener("click", () => customFoodSheet());
      });
  }

  function mealSeg(selected) {
    return `<div class="chips" id="mealPick">${window.DEFAULTS.meals.map((m) =>
      `<button type="button" class="chip ${m === selected ? "on" : ""}" data-meal="${m}">${m}</button>`).join("")}</div>`;
  }
  function wireMealSeg(root) {
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-meal]"); if (!b) return;
      $$("[data-meal]", root).forEach((x) => x.classList.toggle("on", x === b));
    });
  }
  const pickedMeal = (root) => ($("[data-meal].on", root) || {}).dataset?.meal || defaultMeal();

  function amountSheet(food, entry) {
    if (!food) return;
    const servings = entry ? entry.servings : 1;
    openSheet(
      `<h3>${esc(food.name)}</h3>` +
      `<div class="field"><label>How many servings? (1 serving = ${esc(food.serving)})</label>${stepper("servings", servings, 0.5)}</div>` +
      `<div class="preview" id="prev"></div>` +
      `<div class="field"><label>Meal</label>${mealSeg(entry ? entry.meal : defaultMeal())}</div>` +
      `<button class="btn full" id="saveEntry">${entry ? "Save" : "Add"}</button>` +
      (entry ? `<button class="btn danger full" id="delEntry">Remove</button>` : ""),
      (root) => {
        const upd = () => {
          const k = num($("#servings").value);
          $("#prev", root).innerHTML = [["kcal", food.kcal], ["Protein", food.protein], ["Carbs", food.carbs], ["Fat", food.fat]]
            .map(([l, v]) => `<div><b>${r0(v * k)}</b><span>${l}${l === "kcal" ? "" : " g"}</span></div>`).join("");
        };
        upd(); $("#servings").addEventListener("input", upd);
        wireMealSeg(root);
        $("#saveEntry", root).addEventListener("click", () => {
          const k = num($("#servings").value);
          if (k <= 0) return toast("Enter an amount");
          const e = entry || { id: uid(), date: current };
          Object.assign(e, {
            meal: pickedMeal(root), food: food.name, serving: food.serving, servings: k,
            kcal: food.kcal * k, protein: food.protein * k, carbs: food.carbs * k, fat: food.fat * k, per: food
          });
          if (!entry) S.log.push(e);
          save(); closeSheet(); render(); toast(entry ? "Saved" : `Added ${food.name}`);
        });
        if (entry) $("#delEntry", root).addEventListener("click", () => {
          S.log = S.log.filter((x) => x.id !== entry.id); save(); closeSheet(); render(); toast("Removed");
        });
      });
  }

  function editEntry(id) {
    const e = S.log.find((x) => x.id === id); if (!e) return;
    const food = e.per || { name: e.food, serving: e.serving, kcal: e.kcal / e.servings, protein: e.protein / e.servings, carbs: e.carbs / e.servings, fat: e.fat / e.servings };
    amountSheet(food, e);
  }

  function foodFields(f = {}) {
    const n = (id, label, v) => `<div class="field"><label>${label}</label><input class="text-in" id="${id}" type="number" inputmode="decimal" value="${v ?? ""}" placeholder="0"></div>`;
    return `<div class="field"><label>Name</label><input class="text-in" id="fName" value="${esc(f.name || "")}" placeholder="e.g. Pizza Margherita"></div>` +
      `<div class="field"><label>Serving</label><input class="text-in" id="fServing" value="${esc(f.serving || "")}" placeholder="e.g. 1 plate, 100 g"></div>` +
      `<div class="grid2">${n("fKcal", "kcal", f.kcal)}${n("fP", "Protein (g)", f.protein)}${n("fC", "Carbs (g)", f.carbs)}${n("fF", "Fat (g)", f.fat)}</div>`;
  }
  const readFood = () => ({
    name: $("#fName").value.trim(), serving: $("#fServing").value.trim() || "1 serving",
    kcal: num($("#fKcal").value), protein: num($("#fP").value), carbs: num($("#fC").value), fat: num($("#fF").value)
  });

  function customFoodSheet() {
    openSheet(`<h3>Something else</h3>${foodFields()}` +
      `<div class="field"><label>Meal</label>${mealSeg(defaultMeal())}</div>` +
      `<label class="form-row"><span>Save to my foods for next time</span><input type="checkbox" id="fKeep" checked style="width:24px;height:24px"></label>` +
      `<button class="btn full" id="saveCustom">Add</button>`,
      (root) => {
        wireMealSeg(root);
        $("#saveCustom", root).addEventListener("click", () => {
          const f = readFood();
          if (!f.name) return toast("Give it a name");
          if ($("#fKeep").checked && !S.foods.some((x) => x.name.toLowerCase() === f.name.toLowerCase())) S.foods.push(f);
          S.log.push({ id: uid(), date: current, meal: pickedMeal(root), food: f.name, serving: f.serving, servings: 1, ...pick(f), per: f });
          save(); closeSheet(); render(); toast(`Added ${f.name}`);
        });
      });
  }
  const pick = (f) => ({ kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat });

  // ---------- Workout view ----------
  const splits = () => [...new Set(S.exercises.map((e) => e.split || "Other"))];
  function renderWorkout() {
    const sp = splits(); if (!sp.includes(split)) split = sp[0] || "Upper";
    $("#splitSeg").innerHTML = sp.map((s) => `<button class="${s === split ? "on" : ""}" data-split="${esc(s)}">${esc(s)}</button>`).join("");
    const doneToday = new Set(S.workouts.filter((w) => w.date === current).map((w) => w.exercise));
    $("#exerciseChips").innerHTML = S.exercises.filter((e) => (e.split || "Other") === split)
      .map((e) => `<button class="chip ${doneToday.has(e.name) ? "on" : ""}" data-ex="${esc(e.name)}">${doneToday.has(e.name) ? "✓ " : ""}${esc(e.name)}</button>`).join("");

    const list = S.workouts.filter((w) => w.date === current);
    $("#workoutEmpty").style.display = list.length ? "none" : "block";
    $("#workoutList").innerHTML = list.length ? `<div class="card">` + list.map((w) =>
      `<div class="item" data-wedit="${w.id}"><div class="grow"><div class="name">${esc(w.exercise)} ${w.next ? `<span class="muted">${esc(w.next)}</span>` : ""}</div>` +
      `<div class="sub">${w.sets} × ${w.reps} @ ${r1(w.weight)} kg${w.note ? " · " + esc(w.note) : ""}</div></div>` +
      `<div class="num">${fmt(w.sets * w.reps * w.weight)} kg</div></div>`).join("") + `</div>` : "";
  }
  $("#splitSeg").addEventListener("click", (e) => { const b = e.target.closest("[data-split]"); if (b) { split = b.dataset.split; renderWorkout(); } });
  $("#exerciseChips").addEventListener("click", (e) => { const b = e.target.closest("[data-ex]"); if (b) workoutSheet(b.dataset.ex); });
  $("#workoutList").addEventListener("click", (e) => {
    const it = e.target.closest("[data-wedit]"); if (!it) return;
    const w = S.workouts.find((x) => x.id === it.dataset.wedit); if (w) workoutSheet(w.exercise, w);
  });

  function lastFor(ex, beforeDate) {
    const l = S.workouts.filter((w) => w.exercise === ex && w.date < beforeDate).sort((a, b) => (a.date < b.date ? 1 : -1));
    return l[0];
  }
  const bestFor = (ex) => S.workouts.filter((w) => w.exercise === ex).reduce((m, w) => Math.max(m, w.weight), 0);

  function workoutSheet(ex, entry) {
    const last = lastFor(ex, entry ? entry.date : current);
    const base = entry || last || { sets: 3, reps: 10, weight: 20 };
    let weight = base.weight;
    if (!entry && last && last.next === "↑") weight = r1(last.weight + 2.5);
    if (!entry && last && last.next === "↓") weight = Math.max(0, r1(last.weight - 2.5));
    const best = bestFor(ex);
    const info = last
      ? `Last time (${pretty(last.date)}): <b>${last.sets} × ${last.reps} @ ${r1(last.weight)} kg</b>${last.next ? " " + esc(last.next) : ""}${best ? ` · Best ${r1(best)} kg` : ""}` +
        (!entry && last.next === "↑" ? `<br>You marked ↑ so the weight is already raised by 2.5 kg.` : "")
      : "First time logging this exercise.";
    const nexts = [["↑", "Go up"], ["=", "Same"], ["↓", "Go down"], [":/", "Bad day"]];
    openSheet(
      `<h3>${esc(ex)}</h3><div class="last-info">${info}</div>` +
      `<div class="field"><label>Weight (kg)</label>${stepper("wWeight", weight, 2.5)}</div>` +
      `<div class="row3"><div class="field"><label>Sets</label>${stepper("wSets", base.sets, 1, "small")}</div>` +
      `<div class="field"><label>Reps</label>${stepper("wReps", base.reps, 1, "small")}</div></div>` +
      `<div class="field"><label>Next time</label><div class="chips" id="nextPick">${nexts.map(([v, l]) =>
        `<button type="button" class="chip ${entry && entry.next === v ? "on" : ""}" data-next="${v}">${v} ${l}</button>`).join("")}</div></div>` +
      `<div class="field"><label>Note (optional)</label><input class="text-in" id="wNote" value="${esc(entry?.note || "")}" placeholder="e.g. seat at 4"></div>` +
      `<button class="btn full" id="saveW">${entry ? "Save" : "Log it"}</button>` +
      (entry ? `<button class="btn danger full" id="delW">Remove</button>` : ""),
      (root) => {
        root.addEventListener("click", (e) => {
          const b = e.target.closest("[data-next]"); if (!b) return;
          const was = b.classList.contains("on");
          $$("[data-next]", root).forEach((x) => x.classList.remove("on"));
          if (!was) b.classList.add("on");
        });
        $("#saveW", root).addEventListener("click", () => {
          const w = entry || { id: uid(), date: current, exercise: ex };
          Object.assign(w, {
            split: (S.exercises.find((x) => x.name === ex) || {}).split || "Other",
            sets: r0(num($("#wSets").value)), reps: r0(num($("#wReps").value)), weight: r1(num($("#wWeight").value)),
            next: ($("[data-next].on", root) || {}).dataset?.next || "", note: $("#wNote").value.trim()
          });
          if (!entry) S.workouts.push(w);
          save(); closeSheet(); render(); toast(entry ? "Saved" : `Logged ${ex}`);
        });
        if (entry) $("#delW", root).addEventListener("click", () => {
          S.workouts = S.workouts.filter((x) => x.id !== entry.id); save(); closeSheet(); render(); toast("Removed");
        });
      });
  }

  // ---------- History ----------
  function renderHistory() {
    const t = today(), rows = [];
    for (let i = 0; i < 14; i++) {
      const d = addDays(t, -i), tot = dayTotals(d), goal = kcalTarget(d), p = goal ? (tot.kcal / goal) * 100 : 0;
      const col = !tot.n ? "var(--line)" : p >= 100 ? "var(--ok)" : p >= 90 ? "var(--warn)" : "var(--bad)";
      rows.push(`<div class="hist-row" data-day="${d}"><span>${pretty(d, true)}</span>` +
        `<div class="bar"><i style="width:${Math.min(100, p)}%;background:${col}"></i></div>` +
        `<span class="muted" style="text-align:right">${tot.n ? fmt(tot.kcal) : "–"}</span></div>`);
    }
    $("#historyDays").innerHTML = rows.join("") + `<p class="muted small-note" style="margin:8px 0 0">Green = hit target, orange = within 10%, red = under. Tap a day to open it.</p>`;

    const byEx = {};
    S.workouts.forEach((w) => (byEx[w.exercise] = byEx[w.exercise] || []).push(w));
    const names = S.exercises.map((e) => e.name).filter((n) => byEx[n]).concat(Object.keys(byEx).filter((n) => !S.exercises.some((e) => e.name === n)));
    $("#historyExercises").innerHTML = names.length ? names.map((n) => {
      const l = byEx[n].slice().sort((a, b) => (a.date < b.date ? -1 : 1));
      const best = Math.max(...l.map((w) => w.weight)), lastW = l[l.length - 1];
      return `<details class="card ex-card"><summary><span>${esc(n)}</span><span class="muted">${r1(lastW.weight)} kg · best ${r1(best)}</span></summary>` +
        spark(l.map((w) => w.weight)) +
        `<table>${l.slice().reverse().slice(0, 20).map((w) => `<tr><td>${pretty(w.date, true)}</td><td>${w.sets} × ${w.reps} @ ${r1(w.weight)} kg ${esc(w.next || "")}</td></tr>`).join("")}</table></details>`;
    }).join("") : `<p class="empty">Log a workout and your progress shows up here.</p>`;
  }
  $("#historyDays").addEventListener("click", (e) => {
    const r = e.target.closest("[data-day]"); if (r) { current = r.dataset.day; setView("today"); }
  });
  function spark(vals) {
    if (vals.length < 2) return "";
    const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1, W = 300, H = 48;
    const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * W},${H - 6 - ((v - min) / span) * (H - 12)}`).join(" ");
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>`;
  }

  // ---------- Settings ----------
  function renderSettings() {
    const fields = [["kcal", "Calories (kcal)"], ["kcalPerKm", "Extra kcal per km run"], ["protein", "Protein (g)"], ["carbs", "Carbs (g)"], ["fat", "Fat (g)"]];
    $("#targetsForm").innerHTML = fields.map(([k, l]) =>
      `<label class="form-row"><span>${l}</span><input class="text-in" data-target-key="${k}" type="number" inputmode="decimal" value="${S.targets[k]}"></label>`).join("");
    $("#foodsList").innerHTML = S.foods.map((f, i) =>
      `<div class="item" data-food-i="${i}"><div class="grow"><div class="name">${esc(f.name)}</div><div class="sub">${esc(f.serving)} · P ${r1(f.protein)} · C ${r1(f.carbs)} · F ${r1(f.fat)}</div></div><div class="num">${fmt(f.kcal)}</div></div>`).join("");
    $("#exList").innerHTML = S.exercises.map((e, i) =>
      `<div class="item"><div class="grow"><div class="name">${esc(e.name)}</div><div class="sub">${esc(e.split || "Other")}</div></div><button class="del" data-ex-del="${i}" aria-label="Remove">✕</button></div>`).join("");
  }
  $("#targetsForm").addEventListener("change", (e) => {
    const k = e.target.dataset.targetKey; if (!k) return;
    S.targets[k] = num(e.target.value, S.targets[k]); save(); toast("Target saved");
  });
  $("#foodsList").addEventListener("click", (e) => {
    const it = e.target.closest("[data-food-i]"); if (it) foodDefSheet(+it.dataset.foodI);
  });
  $("#addFoodDef").addEventListener("click", () => foodDefSheet(-1));
  function foodDefSheet(i) {
    const f = i >= 0 ? S.foods[i] : {};
    openSheet(`<h3>${i >= 0 ? "Edit food" : "New food"}</h3>${foodFields(f)}<button class="btn full" id="saveFD">Save</button>` +
      (i >= 0 ? `<button class="btn danger full" id="delFD">Delete food</button>` : ""), (root) => {
      $("#saveFD", root).addEventListener("click", () => {
        const nf = readFood(); if (!nf.name) return toast("Give it a name");
        if (i >= 0) S.foods[i] = nf; else S.foods.push(nf);
        save(); closeSheet(); renderSettings(); toast("Saved");
      });
      if (i >= 0) $("#delFD", root).addEventListener("click", () => {
        S.foods.splice(i, 1); save(); closeSheet(); renderSettings(); toast("Deleted");
      });
    });
  }
  $("#exList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ex-del]"); if (!b) return;
    const ex = S.exercises[+b.dataset.exDel];
    if (confirm(`Remove ${ex.name} from the list? Logged workouts stay.`)) { S.exercises.splice(+b.dataset.exDel, 1); save(); renderSettings(); }
  });
  $("#addExDef").addEventListener("click", () => {
    const sp = [...new Set(splits().concat(["Upper", "Lower", "Full body"]))];
    openSheet(`<h3>New exercise</h3><div class="field"><label>Name</label><input class="text-in" id="exName" placeholder="e.g. Bench Press"></div>` +
      `<div class="field"><label>Group</label><div class="chips" id="exSplit">${sp.map((s, i) => `<button type="button" class="chip ${i === 0 ? "on" : ""}" data-sp="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>` +
      `<button class="btn full" id="saveEx">Save</button>`, (root) => {
      root.addEventListener("click", (e) => {
        const b = e.target.closest("[data-sp]"); if (b) $$("[data-sp]", root).forEach((x) => x.classList.toggle("on", x === b));
      });
      $("#saveEx", root).addEventListener("click", () => {
        const name = $("#exName").value.trim(); if (!name) return toast("Give it a name");
        S.exercises.push({ name, split: $("[data-sp].on", root).dataset.sp }); save(); closeSheet(); renderSettings(); toast("Added");
      });
    });
  });

  // Backup
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  $("#exportJson").addEventListener("click", () => download(`gym-tracker-${today()}.json`, JSON.stringify(S, null, 2), "application/json"));
  $("#exportCsv").addEventListener("click", () => {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const meals = [["type", "date", "meal", "food", "servings", "kcal", "protein", "carbs", "fat"].join(",")]
      .concat(S.log.map((e) => ["meal", e.date, q(e.meal), q(e.food), e.servings, r0(e.kcal), r1(e.protein), r1(e.carbs), r1(e.fat)].join(",")));
    const wo = [["type", "date", "split", "exercise", "sets", "reps", "weight_kg", "next", "note"].join(",")]
      .concat(S.workouts.map((w) => ["workout", w.date, q(w.split), q(w.exercise), w.sets, w.reps, w.weight, q(w.next), q(w.note)].join(",")));
    const runs = ["type,date,km"].concat(Object.entries(S.runs).map(([d, k]) => `run,${d},${k}`));
    download(`gym-tracker-${today()}.csv`, meals.concat([""], wo, [""], runs).join("\n"), "text/csv");
  });
  $("#importJson").addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.log) || !Array.isArray(data.workouts)) throw new Error("bad file");
      if (!confirm("Replace everything on this phone with the backup?")) return;
      S = Object.assign(load(), data); save(); render(); toast("Backup restored");
    } catch (err) { toast("That file isn't a Gym Tracker backup"); }
    e.target.value = "";
  });

  // ---------- Navigation ----------
  function setView(v) {
    view = v;
    $$(".view").forEach((s) => s.classList.toggle("active", s.id === "view-" + v));
    $$(".tabs button").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
    const fab = $("#fab");
    fab.classList.toggle("hidden", v === "history" || v === "settings");
    fab.textContent = v === "workout" ? "+ Exercise" : "+ Food";
    window.scrollTo(0, 0);
    render();
  }
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  $("#fab").addEventListener("click", () => {
    if (view === "workout") {
      const all = S.exercises;
      openSheet(`<h3>Pick an exercise</h3>${all.map((e) => `<button class="pick" data-pick-ex="${esc(e.name)}"><span>${esc(e.name)}</span><small>${esc(e.split || "")}</small></button>`).join("")}`,
        (root) => root.addEventListener("click", (e) => { const b = e.target.closest("[data-pick-ex]"); if (b) workoutSheet(b.dataset.pickEx); }));
    } else addFoodSheet();
  });
  $("#prevDay").addEventListener("click", () => { current = addDays(current, -1); render(); });
  $("#nextDay").addEventListener("click", () => { current = addDays(current, 1); render(); });
  $("#dateBtn").addEventListener("click", () => {
    const di = $("#dateInput"); di.value = current;
    if (di.showPicker) { try { di.showPicker(); return; } catch (e) { /* fall through */ } }
    di.click();
  });
  $("#dateInput").addEventListener("change", (e) => { if (e.target.value) { current = e.target.value; render(); } });

  function render() {
    $("#dateLabel").textContent = pretty(current, true);
    $(".top").style.display = view === "history" || view === "settings" ? "none" : "flex";
    if (view === "today") renderToday();
    if (view === "workout") renderWorkout();
    if (view === "history") renderHistory();
    if (view === "settings") renderSettings();
  }

  // Jump back to today when the app is reopened on a new day
  let lastSeen = today();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && today() !== lastSeen) { if (current === lastSeen) current = today(); lastSeen = today(); render(); }
  });

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  render();
})();

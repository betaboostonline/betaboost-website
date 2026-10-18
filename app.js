// Bètavonk website: hash router, lessen + aanmelden via de formulierservice, oefenmateriaal.
// De formulierservice is een Google Apps Script-webapp die in een afgeschermd Google-spreadsheet schrijft
// (zie backend/Code.gs en INSTALLATIE.md). Zonder ENDPOINT draait de site in voorbeeldmodus:
// er wordt dan niets verstuurd en alleen de plekkentelling in deze browser bijgehouden.
(function () {
  "use strict";

  // Plak hier de URL van je Apps Script-webapp (eindigt op /exec). Leeg = voorbeeldmodus.
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbyv4u58pmJarVCkCVGCcAWAshGH6k9iTraefe0Csw7Gny2DQsTHMyh5akDk1Gtr5pd_sw/exec";
  var CONSENT_VERSION = "2026-10-v1";
  var DEMO_KEY = "betaboost-demo-v2";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------- router ----------
  var views = Array.prototype.slice.call(document.querySelectorAll("[data-view]"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav a"));
  var nav = document.getElementById("site-nav");
  var toggle = document.getElementById("menu-toggle");
  var TITLES = { home: "Bètavonk", how: "Zo werkt het", sessions: "Lessen", register: "Aanmelden",
    resources: "Oefenen", explore: "Ontdek bèta", schools: "Voor scholen", about: "Over ons",
    contact: "Contact", feedback: "Feedback op de les", policies: "Privacy en veiligheid",
    voorwaarden: "Algemene voorwaarden", artikel: "Ontdek bèta",
    "ontdek-algebra": "Algebra", "ontdek-krachten": "Krachten", "ontdek-elektriciteit": "Elektriciteit" };

  function route() {
    var name = (location.hash || "#home").slice(1);
    var articleId = "";
    if (name.indexOf("artikel-") === 0) { articleId = name.slice(8); name = "artikel"; }
    if (!views.some(function (v) { return v.dataset.view === name; })) name = "home";
    views.forEach(function (v) { v.hidden = v.dataset.view !== name; });
    navLinks.forEach(function (a) {
      var navName = name === "artikel" || name.indexOf("ontdek-") === 0 ? "explore" : name;
      if (a.getAttribute("href") === "#" + navName) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    document.title = name === "home" ? "Bètavonk" : TITLES[name] + " · Bètavonk";
    if (name === "sessions" || name === "register") loadSessions();
    if (name === "artikel") currentArticle = articleId;
    if (name === "resources" || name === "explore" || name === "artikel") loadContent();
  }
  window.addEventListener("hashchange", route);
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // ---------- formulierservice ----------
  // POST zonder Content-Type-header (text/plain), zodat de browser geen CORS-preflight doet die Apps Script niet ondersteunt.
  function send(payload) {
    return fetch(ENDPOINT, { method: "POST", body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (res) { if (!res.ok) throw new Error(res.fout || "Onbekende fout"); return res; });
  }

  // ---------- lessen ----------
  // Voorbeeldlessen voor de voorbeeldmodus. Live komen de lessen uit het tabblad "Lessen" van het spreadsheet.
  var SAMPLE = [
    { id: "W1", vak: "Wiskunde", soort: "Uitlegles", onderwerp: "Breuken en verhoudingen", klas: "Klas 1", datum: "2026-11-23", tijd: "15.30–16.30", max: 10, bezet: 6 },
    { id: "N1", vak: "Natuurkunde", soort: "Uitlegles", onderwerp: "Snelheid en grafieken", klas: "Klas 2", datum: "2026-11-24", tijd: "15.30–16.30", max: 10, bezet: 4 },
    { id: "H1", vak: "Wiskunde", soort: "Huiswerkhulp", onderwerp: "Wiskunde, alle onderwerpen", klas: "Klas 1–2", datum: "2026-11-25", tijd: "13.30–15.00", max: 10, bezet: 10 },
    { id: "W2", vak: "Wiskunde", soort: "Uitlegles", onderwerp: "Lineaire vergelijkingen oplossen", klas: "Klas 2", datum: "2026-11-25", tijd: "19.00–20.00", max: 10, bezet: 9 },
    { id: "N2", vak: "Natuurkunde", soort: "Uitlegles", onderwerp: "Dichtheid", klas: "Klas 2", datum: "2026-11-26", tijd: "19.00–20.00", max: 10, bezet: 3 },
    { id: "H2", vak: "Natuurkunde", soort: "Huiswerkhulp", onderwerp: "Natuurkunde, alle onderwerpen", klas: "Klas 1–2", datum: "2026-11-28", tijd: "10.00–11.30", max: 10, bezet: 5 },
    { id: "W3", vak: "Wiskunde", soort: "Uitlegles", onderwerp: "Negatieve getallen", klas: "Klas 1", datum: "2026-11-30", tijd: "15.30–16.30", max: 10, bezet: 10 },
    { id: "N3", vak: "Natuurkunde", soort: "Uitlegles", onderwerp: "Krachten", klas: "Klas 1", datum: "2026-12-01", tijd: "15.30–16.30", max: 10, bezet: 2 }
  ];
  function demoCounts() {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveDemoCounts(c) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(c)); } catch (e) { /* ignore */ } }

  var sessions = [];
  var loadState = "idle"; // idle | loading | live | demo | error
  var loadError = "";
  var dateFmt = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short" });
  // De datum kan uit het spreadsheet komen als "2026-11-23" of als volledige datumtekst; toon de ruwe tekst als hij niet te lezen is.
  function when(s) {
    var raw = String(s.datum || "");
    var d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(raw + "T12:00:00") : new Date(raw);
    return (isNaN(d.getTime()) ? raw : dateFmt.format(d)) + " · " + String(s.tijd || "");
  }
  function free(s) { return Math.max(0, s.max - s.bezet); }

  function loadSessions() {
    if (!ENDPOINT) {
      var extra = demoCounts();
      sessions = SAMPLE.map(function (s) { var c = Object.assign({}, s); c.bezet = Math.min(c.max, c.bezet + (extra[s.id] || 0)); return c; });
      loadState = "demo";
      renderAll();
      return Promise.resolve();
    }
    loadState = sessions.length ? loadState : "loading";
    renderAll();
    return fetch(ENDPOINT + "?actie=lessen")
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.fout);
        if (!Array.isArray(res.lessen)) throw new Error("onverwacht antwoord van de formulierservice");
        sessions = res.lessen.map(function (l) {
          return { id: String(l.id), vak: String(l.vak || ""), soort: /^huiswerk/i.test(String(l.soort || "").trim()) ? "Huiswerkhulp" : "Uitlegles", onderwerp: String(l.onderwerp || ""),
            klas: String(l.klas || ""), datum: l.datum, tijd: l.tijd, max: Number(l.max) || 10, bezet: Number(l.bezet) || 0 };
        });
        loadState = "live";
        renderAll();
      })
      .catch(function (err) {
        loadError = err && err.message ? err.message : "geen verbinding";
        sessions = [];
        loadState = "error";
        try { renderAll(); } catch (e) { /* niets meer te tonen */ }
      });
  }

  var filter = "all";
  var list = document.getElementById("session-list");
  var sourceHint = document.getElementById("sessions-source");

  function renderSessions() {
    sourceHint.textContent = {
      idle: "", loading: "Lessen laden…",
      live: "Het aantal vrije plekken is bijgewerkt tot nu.",
      demo: "Voorbeeldmodus: dit zijn voorbeeldlessen en er wordt niets verstuurd.",
      error: "De lessen konden niet worden geladen. Probeer het later opnieuw. (Technische melding: " + loadError + ")"
    }[loadState];
    var shown = sessions.filter(function (s) {
      if (filter === "all") return true;
      if (filter === "Huiswerkhulp") return s.soort === "Huiswerkhulp";
      return s.soort === "Uitlegles" && s.vak === filter;
    });
    if (!shown.length && (loadState === "live" || loadState === "demo")) {
      list.innerHTML = '<p class="hint">Er staan op dit moment geen lessen gepland.</p>';
      return;
    }
    list.innerHTML = shown.map(function (s) {
      var f = free(s), full = f === 0, hw = s.soort === "Huiswerkhulp";
      var seats = "";
      for (var i = 0; i < s.max; i++) seats += '<i class="' + (i < s.bezet ? "taken" : "") + '"></i>';
      return '<article class="session">' +
        '<div class="session-top"><span class="tag subj">' + esc(hw ? "Huiswerkhulp" : s.vak) + '</span><span class="tag">' + esc(s.klas) + '</span></div>' +
        '<h3>' + esc(s.onderwerp) + '</h3>' +
        '<div class="meta"><span><b>' + esc(when(s)) + '</b></span><span>' + esc(s.soort) + ' · 100% online</span></div>' +
        '<div class="seats" aria-hidden="true">' + seats + '</div>' +
        '<span class="seat-label' + (full ? " full" : "") + '">' + (full ? "Vol · wachtlijst mogelijk" : f + " van " + s.max + " plekken vrij") + '</span>' +
        (hw
          ? '<p class="fine">Voor leerlingen die ook een uitlegles volgen. Kies deze les bij het aanmelden.</p>'
          : '<button class="btn ' + (full ? "btn-ghost" : "btn-lift") + '" data-pick="' + esc(s.id) + '">' + (full ? "Aanmelden voor de wachtlijst" : "Aanmelden voor deze les") + '</button>') +
        '</article>';
    }).join("");
  }

  list.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-pick]");
    if (!b) return;
    picked[b.dataset.pick] = true;
    location.hash = "register";
  });
  document.querySelectorAll("[data-filter]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      filter = chip.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(function (c) { c.classList.toggle("is-on", c === chip); });
      renderSessions();
    });
  });

  // ---------- aanmelden ----------
  var form = document.getElementById("register-form");
  var lessonBox = document.getElementById("r-lessons");
  var hwBox = document.getElementById("r-hwlessons");
  var hwHint = document.getElementById("r-hw-hint");
  var hwFieldset = document.getElementById("r-hw");
  var yearSel = document.getElementById("r-year");
  var regErr = document.getElementById("register-error");
  var submitBtn = document.getElementById("register-submit");
  var picked = {}; // les-id -> aangevinkt

  function forYear(s) {
    var y = yearSel.value; // "Klas 1" | "Klas 2" | ""
    return !y || s.klas.indexOf(y.slice(-1)) !== -1;
  }
  function pickRow(s) {
    var f = free(s);
    return '<label class="check pick"><input type="checkbox" id="r-les-' + esc(s.id) + '" data-les="' + esc(s.id) + '"' + (picked[s.id] ? " checked" : "") + '>' +
      '<span><b>' + esc(s.onderwerp) + '</b> <span class="pick-meta">' + esc(s.soort === "Uitlegles" ? s.vak + " · " : "") + esc(s.klas) + " · " + esc(when(s)) + '</span>' +
      '<span class="pick-free' + (f ? "" : " full") + '">' + (f ? f + " plekken vrij" : "Vol, je komt op de wachtlijst") + '</span></span></label>';
  }
  function renderPickers() {
    if (loadState === "loading" || loadState === "error") {
      lessonBox.innerHTML = '<p class="hint">' + (loadState === "error" ? "De lessen konden niet worden geladen. Probeer het later opnieuw. (Technische melding: " + esc(loadError) + ")" : "Lessen laden…") + '</p>';
      hwBox.innerHTML = "";
      return;
    }
    var les = sessions.filter(function (s) { return s.soort === "Uitlegles" && forYear(s); });
    var hw = sessions.filter(function (s) { return s.soort === "Huiswerkhulp" && forYear(s); });
    var noneMsg = !sessions.some(function (s) { return s.soort === "Uitlegles"; }) ? "Er zijn nog geen uitleglessen gepland." : "Er zijn nu geen uitleglessen voor " + esc(yearSel.value.toLowerCase()) + ". Kies een andere klas als je je hebt vergist.";
    lessonBox.innerHTML = les.length ? les.map(pickRow).join("") : '<p class="hint">' + noneMsg + '</p>';
    hwBox.innerHTML = hw.map(pickRow).join("");
    syncHomework();
  }
  function anyLesson() { return sessions.some(function (s) { return s.soort === "Uitlegles" && picked[s.id] && forYear(s); }); }
  function chosenIds() { return sessions.filter(function (s) { return picked[s.id] && forYear(s); }).map(function (s) { return s.id; }); }
  function chosenHomework() { return sessions.some(function (s) { return s.soort === "Huiswerkhulp" && picked[s.id] && forYear(s); }); }

  // Huiswerkhulp kan pas als er een uitlegles is gekozen; de huiswerkvraag verschijnt pas als er huiswerkhulp is gekozen.
  function syncHomework() {
    var allowed = anyLesson();
    hwBox.querySelectorAll("input").forEach(function (cb) {
      cb.disabled = !allowed;
      if (!allowed) { cb.checked = false; picked[cb.dataset.les] = false; }
    });
    hwHint.hidden = allowed;
    var show = allowed && chosenHomework();
    hwFieldset.hidden = !show;
    hwFieldset.querySelectorAll("[data-hw-required]").forEach(function (el) { el.required = show; });
  }
  form.addEventListener("change", function (e) {
    if (e.target.dataset && e.target.dataset.les) { picked[e.target.dataset.les] = e.target.checked; syncHomework(); }
    if (e.target === yearSel) renderPickers();
  });

  function checkRequired(f) {
    var bad = [];
    f.querySelectorAll("[required]").forEach(function (el) {
      if (el.closest("[hidden]")) return;
      var ok = el.type === "checkbox" ? el.checked
        : el.type === "radio" ? !!f.querySelector('input[name="' + el.name + '"]:checked')
        : el.value.trim() !== "" && el.checkValidity();
      el.classList.toggle("invalid", !ok && el.type !== "checkbox" && el.type !== "radio");
      if (!ok) bad.push(el);
    });
    return bad;
  }
  function val(id) { return document.getElementById(id).value.trim(); }
  function checked(id) { return document.getElementById(id).checked; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = checkRequired(form);
    var msg = "";
    var mailMsg = schoolmailProblem(val("r-schoolmail"));
    if (bad.length) msg = "Vul de gemarkeerde velden in en vink de verplichte vakjes aan.";
    else if (mailMsg) { msg = mailMsg; document.getElementById("r-schoolmail").classList.add("invalid"); }
    else if (!codeSentTo || codeSentTo !== val("r-schoolmail").toLowerCase()) msg = "Klik op ‘Stuur code’ en vul de code uit de mail in om je schoolmail te bevestigen.";
    else if (!noCode && !/^\d{6}$/.test(val("r-code"))) { msg = "Vul de code van 6 cijfers uit de mail in."; document.getElementById("r-code").classList.add("invalid"); }
    else if (!form.querySelector('input[name="vakken"]:checked')) msg = "Kies minstens één vak waar je hulp bij nodig hebt.";
    else if (!anyLesson()) {
      if (loadState === "error") msg = "De lessen konden niet worden geladen, daardoor kun je geen les kiezen. (Technische melding: " + loadError + ")";
      else if (!sessions.some(function (s) { return s.soort === "Uitlegles" && forYear(s); })) msg = "Er zijn nog geen uitleglessen gepland voor deze klas, daardoor kun je je nog niet aanmelden.";
      else msg = "Vink bij ‘Kies je lessen’ minstens één uitlegles aan.";
      lessonBox.scrollIntoView({ block: "center" });
    }
    if (msg) {
      regErr.textContent = msg; regErr.hidden = false;
      if (bad[0]) bad[0].focus();
      return;
    }
    if (val("r-website")) return; // honeypot: bots vullen dit verborgen veld in

    var payload = {
      type: "aanmelding",
      consentVersie: CONSENT_VERSION,
      voornaam: val("r-name"), achternaam: val("r-lastname"), leeftijd: val("r-age"), klas: yearSel.value, school: val("r-school"),
      schoolmail: val("r-schoolmail").toLowerCase(), code: noCode ? "" : val("r-code"), zonderCode: noCode,
      vakken: Array.prototype.map.call(form.querySelectorAll('input[name="vakken"]:checked'), function (c) { return c.value; }).join(", "),
      onderwerpen: val("r-topics"),
      bijles: (form.querySelector('input[name="bijles"]:checked') || {}).value || "",
      ouderNaam: val("r-pname"), ouderEmail: val("r-pemail"), ouderTelefoon: val("r-pphone"),
      toestemmingDeelname: checked("r-c-join"), toestemmingGegevens: checked("r-c-data"), toestemmingVoorwaarden: checked("r-c-terms"),
      lesregelsBesproken: checked("r-c-rules"), toestemmingOnderzoek: checked("r-c-research"),
      lessen: chosenIds(),
      huiswerk: chosenHomework() ? { vak: val("h-subject"), onderwerp: val("h-topic"), vraag: val("h-question"), geprobeerd: val("h-tried") } : null
    };

    regErr.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Bezig met versturen…";
    var done = ENDPOINT ? send(payload) : demoRegister(payload);
    done.then(function (res) {
      showRegistered(res);
      loadSessions();
    }).catch(function (err) {
      regErr.textContent = "Versturen lukte niet (" + err.message + "). Probeer het opnieuw, of mail naar hulp.betaboost@gmail.com.";
      regErr.hidden = false;
    }).then(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = "Aanmelding versturen";
    });
  });

  // Voorbeeldmodus: geen persoonsgegevens opslaan, alleen de plekkentelling in deze browser ophogen.
  function demoRegister(p) {
    // Zelfde regel als de formulierservice: huiswerkhulp alleen als er een plek in een uitlegles is.
    if (!p.zonderCode && p.code !== DEMO_CODE) return Promise.reject(new Error("De code klopt niet of is verlopen. Vraag een nieuwe code aan."));
    var counts = demoCounts(), placed = [], waiting = [], hasLesson = false;
    var chosen = sessions.filter(function (x) { return p.lessen.indexOf(x.id) !== -1; })
      .sort(function (a, b) { return (a.soort === "Huiswerkhulp") - (b.soort === "Huiswerkhulp"); });
    chosen.forEach(function (s) {
      var hw = s.soort === "Huiswerkhulp";
      if ((!hw || hasLesson) && free(s) > 0) {
        counts[s.id] = (counts[s.id] || 0) + 1; placed.push(s.id);
        if (!hw) hasLesson = true;
      } else waiting.push(s.id);
    });
    saveDemoCounts(counts);
    return Promise.resolve({ ok: true, aangevraagd: placed, wachtlijst: waiting });
  }

  function showRegistered(res) {
    function names(ids) {
      return ids.map(function (id) {
        var s = sessions.filter(function (x) { return x.id === id; })[0];
        return "<li>" + (s ? esc(s.onderwerp + " (" + when(s) + ")") : esc(id)) + "</li>";
      }).join("");
    }
    var html = "";
    if (res.aangevraagd.length) html += "<p><b>Aangevraagd, je plek wordt vastgehouden:</b></p><ul class=\"plain\">" + names(res.aangevraagd) + "</ul>";
    if (res.wachtlijst.length) html += "<p><b>Je staat op de wachtlijst voor:</b></p><ul class=\"plain\">" + names(res.wachtlijst) + "</ul>";
    document.getElementById("register-summary").innerHTML = html;
    form.reset();
    picked = {};
    resetCode();
    form.hidden = true;
    var box = document.getElementById("register-done");
    box.hidden = false;
    box.focus();
    box.scrollIntoView({ block: "start" });
  }

  // ---------- schoolmail bevestigen ----------
  // Zelfde controle als de formulierservice (die ook nog checkt of het domein mail kan ontvangen).
  var FREEMAIL = ["gmail.com", "googlemail.com", "hotmail.com", "hotmail.nl", "outlook.com", "outlook.nl", "live.com", "live.nl",
    "msn.com", "yahoo.com", "yahoo.nl", "icloud.com", "me.com", "mac.com", "aol.com", "proton.me", "protonmail.com", "gmx.com",
    "gmx.net", "ziggo.nl", "kpnmail.nl", "kpnplanet.nl", "planet.nl", "home.nl", "xs4all.nl", "hetnet.nl", "chello.nl", "upcmail.nl",
    "telfort.nl", "tele2.nl", "online.nl", "zeelandnet.nl", "caiway.nl", "solcon.nl", "quicknet.nl", "mail.com", "tutanota.com"];
  var DEMO_CODE = "123456";
  var codeSentTo = "", noCode = false;
  var noCodeWrap = document.getElementById("r-nocodewrap");
  function resetCode() {
    codeSentTo = ""; noCode = false;
    codeWrap.hidden = true; noCodeWrap.hidden = true;
    document.getElementById("r-code").required = false;
    codeBtn.textContent = "Stuur code";
  }
  function schoolmailProblem(v) {
    var email = String(v || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) return "Vul een geldige schoolmail in.";
    if (FREEMAIL.indexOf(email.split("@")[1]) !== -1) return "Vul een geldige schoolmail in. Een privé-adres zoals Gmail of Hotmail kan niet.";
    return "";
  }
  var codeBtn = document.getElementById("r-sendcode");
  var mailStatus = document.getElementById("r-mailstatus");
  var mailInput = document.getElementById("r-schoolmail");
  var codeWrap = document.getElementById("r-codewrap");
  codeBtn.addEventListener("click", function () {
    var email = mailInput.value.trim().toLowerCase();
    var problem = schoolmailProblem(email);
    mailInput.classList.toggle("invalid", !!problem);
    if (problem) { mailStatus.textContent = problem; mailStatus.className = "form-error"; mailInput.focus(); return; }
    codeBtn.disabled = true;
    mailStatus.className = "fine";
    mailStatus.textContent = "Code wordt verstuurd…";
    (ENDPOINT ? send({ type: "code", schoolmail: email }) : Promise.resolve()).then(function () {
      codeSentTo = email;
      codeWrap.hidden = false;
      document.getElementById("r-code").required = true;
      noCode = false;
      noCodeWrap.hidden = false;
      mailStatus.textContent = ENDPOINT
        ? "We hebben een code gestuurd naar " + email + ". Kijk ook bij ongewenste mail. De code is 15 minuten geldig."
        : "Voorbeeldmodus: er wordt geen mail verstuurd. Vul de code " + DEMO_CODE + " in.";
      document.getElementById("r-code").focus();
      codeBtn.textContent = "Stuur nieuwe code";
    }).catch(function (err) {
      // Een oude versie van Code.gs kent het verzoek "code" niet en antwoordt "Onbekend formulier".
      mailStatus.textContent = /onbekend formulier/i.test(err.message)
        ? "De code kan nu niet worden verstuurd: de formulierservice draait nog een oude versie. Probeer het later opnieuw of mail hulp.betaboost@gmail.com."
        : err.message;
      mailStatus.className = "form-error";
      mailInput.classList.add("invalid");
    }).then(function () { codeBtn.disabled = false; });
  });
  mailInput.addEventListener("input", function () {
    if (codeSentTo && mailInput.value.trim().toLowerCase() !== codeSentTo) resetCode();
  });
  // Uitweg als de school de code tegenhoudt: de aanmelding komt binnen als "schoolmail niet bevestigd" en jullie controleren hem zelf.
  document.getElementById("r-nocode").addEventListener("click", function () {
    noCode = true;
    codeWrap.hidden = true;
    noCodeWrap.hidden = true;
    var code = document.getElementById("r-code");
    code.required = false; code.value = ""; code.classList.remove("invalid");
    mailStatus.className = "fine";
    mailStatus.textContent = "Je meldt je aan zonder code. We controleren je schoolmail zelf voordat we je aanmelding accepteren. Dat kan iets langer duren.";
  });

  function renderAll() { renderSessions(); renderPickers(); }


  // ---------- inhoud: oefenmateriaal en Ontdek bèta (tabbladen Oefenmateriaal en Ontdek in het spreadsheet) ----------
  var SAMPLE_MATERIALS = [
    { module: "Lineaire vergelijkingen oplossen", vak: "Wiskunde", klas: "Klas 2", type: "Uitleg", titel: "Uitleg in stappen", link: "" },
    { module: "Lineaire vergelijkingen oplossen", vak: "Wiskunde", klas: "Klas 2", type: "Oefeningen", titel: "Oefenblad 1", link: "" },
    { module: "Lineaire vergelijkingen oplossen", vak: "Wiskunde", klas: "Klas 2", type: "Antwoorden", titel: "Antwoorden oefenblad 1", link: "" },
    { module: "Breuken en verhoudingen", vak: "Wiskunde", klas: "Klas 1", type: "Uitleg", titel: "Uitlegvideo", link: "" },
    { module: "Dichtheid", vak: "Natuurkunde", klas: "Klas 2", type: "Uitleg", titel: "Uitleg met voorbeelden", link: "" },
    { module: "Dichtheid", vak: "Natuurkunde", klas: "Klas 2", type: "Oefeningen", titel: "Oefenopgaven", link: "" }
  ];
  var SAMPLE_ARTICLES = [
    { id: "algebra-en-ai", titel: "Van algebra naar AI", categorie: "Wiskunde in het echt", samenvatting: "Hoe vergelijkingen computers leren denken.",
      tekst: "Dit is een voorbeeldartikel. Echte artikelen zet je in het tabblad Ontdek van het spreadsheet.\n\n## Wat is een model?\n\nEen AI-model is eigenlijk een hele grote formule met heel veel getallen erin.", bron: "" },
    { id: "bruggen-en-krachten", titel: "Waarom een brug niet instort", categorie: "Natuurkunde in het echt", samenvatting: "Krachten in balans, van de Erasmusbrug tot je fietsrek.",
      tekst: "Dit is een voorbeeldartikel.", bron: "" }
  ];
  var materials = [], articles = [], contentState = "idle", contentError = "", currentArticle = "";

  function loadContent() {
    if (contentState !== "idle" && contentState !== "error") { renderContent(); return; }
    if (!ENDPOINT) { materials = SAMPLE_MATERIALS; articles = SAMPLE_ARTICLES; contentState = "demo"; renderContent(); return; }
    contentState = "loading";
    renderContent();
    fetch(ENDPOINT + "?actie=inhoud")
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.fout);
        materials = Array.isArray(res.oefenmateriaal) ? res.oefenmateriaal : [];
        articles = Array.isArray(res.ontdek) ? res.ontdek : [];
        contentState = "live";
      })
      .catch(function (err) { contentError = err && err.message ? err.message : "geen verbinding"; contentState = "error"; })
      .then(renderContent);
  }
  function renderContent() { renderModules(); renderArticles(); renderArticle(); }

  function safeUrl(u) { return /^https?:\/\//i.test(String(u || "")) ? String(u) : ""; }

  var grid = document.getElementById("module-grid");
  var modFilter = "all";
  function renderModules() {
    document.getElementById("modules-source").textContent = {
      idle: "", loading: "Oefenmateriaal laden…", live: "",
      demo: "Voorbeeldmodus: dit is voorbeeldmateriaal.",
      error: "Het oefenmateriaal kon niet worden geladen. (Technische melding: " + contentError + ")"
    }[contentState];
    var groups = {}, order = [];
    materials.filter(function (m) { return modFilter === "all" || m.vak === modFilter; }).forEach(function (m) {
      var key = m.vak + "|" + m.module;
      if (!groups[key]) { groups[key] = { vak: m.vak, module: m.module, klas: m.klas, items: [] }; order.push(key); }
      groups[key].items.push(m);
    });
    if (!order.length) {
      grid.innerHTML = contentState === "live" || contentState === "demo" ? '<p class="hint">Hier komt binnenkort oefenmateriaal.</p>' : "";
      return;
    }
    grid.innerHTML = order.map(function (k) {
      var g = groups[k];
      return '<article class="module"><div class="session-top"><span class="tag subj">' + esc(g.vak) + '</span>' + (g.klas ? '<span class="tag">' + esc(g.klas) + '</span>' : "") + '</div>' +
        '<h3>' + esc(g.module) + '</h3><ul class="mat-list">' + g.items.map(function (m) {
          var url = safeUrl(m.link);
          var label = '<span class="mat-type">' + esc(m.type) + '</span> ' + esc(m.titel);
          return "<li>" + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + label + "</a>" : label + ' <span class="hint">(nog geen link)</span>') + "</li>";
        }).join("") + "</ul></article>";
    }).join("");
  }

  var articleGrid = document.getElementById("article-grid");
  function renderArticles() {
    if (!articles.length) {
      articleGrid.innerHTML = '<p class="hint">' + (contentState === "error" ? "De artikelen konden niet worden geladen. (Technische melding: " + esc(contentError) + ")"
        : contentState === "loading" ? "Artikelen laden…" : "Binnenkort lees je hier verhalen over bèta in het echt.") + "</p>";
      return;
    }
    articleGrid.innerHTML = articles.map(function (a) {
      return '<a class="tile" href="#artikel-' + esc(a.id) + '"><span class="eyebrow">' + esc(a.categorie) + '</span><h3>' + esc(a.titel) + '</h3><p>' + esc(a.samenvatting) + '</p><span class="tile-link">Lees verder</span></a>';
    }).join("");
  }

  // Tekst: lege regel = nieuwe alinea, regel die begint met "## " = tussenkop.
  function renderArticle() {
    if (!currentArticle) return;
    var a = articles.filter(function (x) { return x.id === currentArticle; })[0];
    var title = document.getElementById("art-title"), body = document.getElementById("art-body");
    var src = document.getElementById("art-source");
    if (!a) {
      title.textContent = contentState === "loading" || contentState === "idle" ? "Artikel laden…" : "Artikel niet gevonden";
      document.getElementById("art-lede").textContent = "";
      body.innerHTML = "";
      src.hidden = true;
      return;
    }
    document.title = a.titel + " · Bètavonk";
    document.getElementById("art-cat").textContent = a.categorie || "Ontdek bèta";
    title.textContent = a.titel;
    document.getElementById("art-lede").textContent = a.samenvatting || "";
    body.innerHTML = String(a.tekst || "").split(/\n\s*\n/).map(function (block) {
      block = block.trim();
      if (!block) return "";
      if (block.indexOf("## ") === 0) return "<h2>" + esc(block.slice(3)) + "</h2>";
      return "<p>" + esc(block).replace(/\n/g, "<br>") + "</p>";
    }).join("");
    var url = safeUrl(a.bron);
    src.hidden = !url;
    src.innerHTML = url ? 'Bron: <a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url) + "</a>" : "";
  }
  document.querySelectorAll("[data-mod]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      modFilter = chip.dataset.mod;
      document.querySelectorAll("[data-mod]").forEach(function (c) { c.classList.toggle("is-on", c === chip); });
      renderModules();
    });
  });

  // ---------- overige formulieren (school, feedback) ----------
  function wireForm(formId, errorId, doneId, type) {
    var f = document.getElementById(formId);
    var err = document.getElementById(errorId);
    var done = document.getElementById(doneId);
    var btn = f.querySelector('button[type="submit"]');
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = checkRequired(f);
      if (bad.length) {
        err.textContent = "Vul de gemarkeerde velden in.";
        err.hidden = false;
        bad[0].focus();
        return;
      }
      var data = { type: type };
      new FormData(f).forEach(function (v, k) { data[k] = typeof v === "string" ? v.trim() : ""; });
      err.hidden = true;
      btn.disabled = true;
      (ENDPOINT ? send(data) : Promise.resolve()).then(function () {
        f.hidden = true;
        done.hidden = false;
        done.scrollIntoView({ block: "start" });
      }).catch(function (x) {
        err.textContent = "Versturen lukte niet (" + x.message + "). Probeer het opnieuw.";
        err.hidden = false;
      }).then(function () { btn.disabled = false; });
    });
  }
  wireForm("school-form", "school-error", "school-done", "school");
  wireForm("feedback-form", "feedback-error", "feedback-done", "feedback");

  // ---------- kopieerknoppen ----------
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var el = document.getElementById(btn.dataset.copy);
      function selectIt() { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      try {
        navigator.clipboard.writeText(el.textContent).then(function () { btn.textContent = "Gekopieerd"; }, selectIt);
      } catch (e) { selectIt(); }
    });
  });

  route();
  if (!/^#(sessions|register)$/.test(location.hash)) loadSessions();
})();

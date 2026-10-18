/* BètaVonk Oefenbank: oefenvragen die steeds nieuwe getallen krijgen, met directe uitleg.
   Elke generator geeft een vraag terug: { q, ans, uitleg } voor een getal-antwoord (met optioneel unit, tol, frac, kb),
   of { q, opts, ans, uitleg } voor meerkeuze (ans is dan de tekst van het goede antwoord). */
(function () {
  "use strict";
  var root = document.getElementById("oefenbank");
  if (!root) return;

  // ---------- hulpjes ----------
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function clean(n) { return Math.round(n * 1e9) / 1e9; }
  // Getal in Nederlandse notatie: komma als decimaalteken, echt minteken, geen punt voor duizendtallen.
  function f(n, dec) {
    n = clean(n);
    var t = dec == null ? String(n) : n.toFixed(dec);
    return t.replace("-", "−").replace(".", ",");
  }
  function p(n) { return n < 0 ? "(" + f(n) + ")" : f(n); }
  function euro(n) { return "€ " + f(n, 2); }
  function mn(n) { return n < 0 ? "<mrow><mo>−</mo><mn>" + f(-n) + "</mn></mrow>" : "<mn>" + f(n) + "</mn>"; }
  function fr(n, d) {
    if (d === 1) return "<math>" + mn(n) + "</math>";
    return "<math><mfrac>" + mn(n) + "<mn>" + d + "</mn></mfrac></math>";
  }
  function simp(n, d) { var g = gcd(n, d); if (d < 0) g = -g; return [n / g, d / g]; }
  function frS(n, d) { var s = simp(n, d); return fr(s[0], s[1]); }
  function x(v) { return "<i>" + (v || "x") + "</i>"; }
  function coprime(d) { var n; do { n = ri(1, d - 1); } while (gcd(n, d) !== 1); return n; }
  function frac() { return { frac: true, kb: "text" }; }
  function q(o, extra) { for (var k in extra) o[k] = extra[k]; return o; }

  // ---------- onderwerpen ----------
  var TOPICS = [
    // ===== Wiskunde =====
    { id: "negatief", vak: "Wiskunde", klas: "1", naam: "Negatieve getallen", desc: "Optellen, aftrekken en vermenigvuldigen met min-getallen.", gen: function () {
      var a = ri(-12, 12) || 7, b = ri(-12, 12) || -4, op = pick(["+", "−", "×"]);
      var ans = op === "+" ? a + b : op === "−" ? a - b : a * b, u;
      if (op === "+") u = b < 0 ? "Plus een negatief getal is hetzelfde als min: " + f(a) + " + " + p(b) + " = " + f(a) + " − " + f(-b) + " = " + f(ans) + "."
        : "Begin bij " + f(a) + " op de getallenlijn en ga " + f(b) + " stappen naar rechts: " + f(ans) + ".";
      else if (op === "−") u = b < 0 ? "Min een negatief getal wordt plus: " + f(a) + " − " + p(b) + " = " + f(a) + " + " + f(-b) + " = " + f(ans) + "."
        : "Begin bij " + f(a) + " op de getallenlijn en ga " + f(b) + " stappen naar links: " + f(ans) + ".";
      else u = "Reken eerst " + f(Math.abs(a)) + " × " + f(Math.abs(b)) + " = " + f(Math.abs(ans)) + ". " +
        ((a < 0) !== (b < 0) ? "Eén min-teken geeft een negatief antwoord" : (a < 0 ? "Twee min-tekens geven een positief antwoord" : "Geen min-tekens, dus positief")) + ": " + f(ans) + ".";
      return { q: "Bereken " + f(a) + " " + op + " " + p(b) + ".", ans: ans, kb: "text", uitleg: u };
    } },
    { id: "volgorde", vak: "Wiskunde", klas: "1", naam: "Volgorde van bewerkingen", desc: "Haakjes, machten, keer en delen, plus en min.", gen: function () {
      var a = ri(2, 12), b = ri(2, 9), c = ri(2, 9), d = ri(2, 6), t = ri(0, 3);
      if (t === 0) return { q: "Bereken " + a + " + " + b + " × " + c + ".", ans: a + b * c, uitleg: "Keer gaat voor plus: eerst " + b + " × " + c + " = " + b * c + ", dan " + a + " + " + b * c + " = " + (a + b * c) + "." };
      if (t === 1) return { q: "Bereken (" + a + " + " + b + ") × " + c + ".", ans: (a + b) * c, uitleg: "Haakjes eerst: " + a + " + " + b + " = " + (a + b) + ", dan " + (a + b) + " × " + c + " = " + (a + b) * c + "." };
      if (t === 2) return { q: "Bereken " + a * 3 + " − " + b + "².", ans: a * 3 - b * b, kb: "text", uitleg: "Machten gaan voor min: " + b + "² = " + b + " × " + b + " = " + b * b + ", dan " + a * 3 + " − " + b * b + " = " + f(a * 3 - b * b) + "." };
      var e = d * ri(2, 6);
      return { q: "Bereken " + a + " × " + b + " − " + e + " ÷ " + d + ".", ans: a * b - e / d, kb: "text", uitleg: "Keer en delen gaan voor min: " + a + " × " + b + " = " + a * b + " en " + e + " ÷ " + d + " = " + e / d + ". Dan " + a * b + " − " + e / d + " = " + f(a * b - e / d) + "." };
    } },
    { id: "breuken-plus", vak: "Wiskunde", klas: "1", naam: "Breuken optellen en aftrekken", desc: "Gelijknamig maken en vereenvoudigen.", gen: function () {
      var N = [2, 3, 4, 5, 6, 8, 10, 12], b = pick(N), d = pick(N), a = coprime(b), c = coprime(d), plus = Math.random() < 0.6;
      if (!plus && a / b < c / d) { var t1 = a; a = c; c = t1; var t2 = b; b = d; d = t2; }
      if (!plus && a / b === c / d) plus = true;
      var L = lcm(b, d), A = a * L / b, C = c * L / d, R = plus ? A + C : A - C, s = simp(R, L);
      var u = "Maak de noemers gelijk. " + L + " is een veelvoud van " + b + " en van " + d + ": " + fr(a, b) + " = " + fr(A, L) + " en " + fr(c, d) + " = " + fr(C, L) + ". " +
        "Dan " + fr(A, L) + " " + (plus ? "+" : "−") + " " + fr(C, L) + " = " + fr(R, L) + (s[1] !== L ? ", en vereenvoudigd " + fr(s[0], s[1]) : "") + ".";
      return q({ q: "Bereken " + fr(a, b) + " " + (plus ? "+" : "−") + " " + fr(c, d) + ". Schrijf je antwoord als breuk, bijvoorbeeld 5/6.", ans: R / L, simple: s, uitleg: u }, frac());
    } },
    { id: "breuken-keer", vak: "Wiskunde", klas: "1", naam: "Breuken vermenigvuldigen", desc: "Breuk keer breuk, en een deel van een getal.", gen: function () {
      if (Math.random() < 0.5) {
        var b = pick([2, 3, 4, 5, 8, 10]), a = ri(1, b - 1), n = b * ri(2, 9);
        return { q: "Hoeveel is " + fr(a, b) + " van " + n + "?", ans: a * n / b, uitleg: "Deel eerst door de noemer: " + n + " ÷ " + b + " = " + n / b + ". Keer de teller: " + n / b + " × " + a + " = " + a * n / b + "." };
      }
      var B = ri(2, 9), D = ri(2, 9), A = coprime(B), C = coprime(D), s = simp(A * C, B * D);
      return q({ q: "Bereken " + fr(A, B) + " × " + fr(C, D) + ". Schrijf je antwoord als breuk, zo eenvoudig mogelijk.", ans: A * C / (B * D), simple: s,
        uitleg: "Teller keer teller en noemer keer noemer: " + fr(A * C, B * D) + (s[1] !== B * D ? ". Vereenvoudigd: " + fr(s[0], s[1]) : "") + "." }, frac());
    } },
    { id: "procenten", vak: "Wiskunde", klas: "1", naam: "Procenten", desc: "Procent van een getal, korting en hoeveel procent.", gen: function () {
      var t = ri(0, 2);
      if (t === 0) {
        var pc = pick([5, 10, 15, 20, 25, 30, 40, 50, 75]), n = 20 * ri(1, 15);
        return { q: "Hoeveel is " + pc + "% van " + n + "?", ans: pc * n / 100, uitleg: "1% van " + n + " is " + f(n / 100) + ". Dus " + pc + "% is " + pc + " × " + f(n / 100) + " = " + f(pc * n / 100) + "." };
      }
      if (t === 1) {
        var k = pick([10, 20, 25, 30, 40, 50]), pr = 5 * ri(4, 30);
        return { q: "Een hoodie kost " + euro(pr) + ". Je krijgt " + k + "% korting. Hoeveel betaal je?", ans: pr * (100 - k) / 100, unit: "€", pre: true, tol: 0.005,
          uitleg: "De korting is " + k + "% van " + euro(pr) + " = " + euro(pr * k / 100) + ". Je betaalt " + euro(pr) + " − " + euro(pr * k / 100) + " = " + euro(pr * (100 - k) / 100) + ". Sneller: je betaalt " + (100 - k) + "%, dus " + f((100 - k) / 100) + " × " + pr + "." };
      }
      var tot = pick([20, 25, 40, 50, 200]), pct = pick([10, 20, 30, 40, 60, 80]), deel = tot * pct / 100;
      return { q: "In een klas met " + tot + " leerlingen" + (tot > 50 ? " (op een hele school)" : "") + " fietsen er " + deel + " naar school. Hoeveel procent is dat?", ans: pct, unit: "%",
        uitleg: "Deel het deel door het geheel: " + deel + " ÷ " + tot + " = " + f(deel / tot) + ". Keer 100 geeft " + pct + "%." };
    } },
    { id: "verhoudingen", vak: "Wiskunde", klas: "1", naam: "Verhoudingen en schaal", desc: "Recepten omrekenen en kaartschaal.", gen: function () {
      if (Math.random() < 0.5) {
        var n = pick([2, 4, 5, 6]), per = pick([25, 40, 50, 60, 75, 100]), m = pick([3, 8, 10, 12, 15].filter(function (v) { return v !== n; }));
        var item = pick(["bloem", "pasta", "rijst", "kaas"]);
        return { q: "Voor " + n + " personen heb je " + n * per + " gram " + item + " nodig. Hoeveel gram heb je nodig voor " + m + " personen?", ans: per * m, unit: "g",
          uitleg: "Reken eerst uit wat één persoon nodig heeft: " + n * per + " ÷ " + n + " = " + per + " gram. Voor " + m + " personen: " + m + " × " + per + " = " + per * m + " gram." };
      }
      var sch = pick([10000, 25000, 50000, 100000]), cm = pick([2, 3, 4, 5, 6, 8]), km = cm * sch / 100000;
      return { q: "Op een kaart met schaal 1 : " + sch + " meet je " + cm + " cm. Hoeveel kilometer is dat in het echt?", ans: km, unit: "km",
        uitleg: "1 cm op de kaart is " + sch + " cm in het echt. " + cm + " cm is dus " + cm * sch + " cm = " + f(cm * sch / 100) + " m = " + f(km) + " km." };
    } },
    { id: "omtrek", vak: "Wiskunde", klas: "1", naam: "Omtrek en oppervlakte", desc: "Rechthoeken, vierkanten en driehoeken.", gen: function () {
      var t = ri(0, 2), l = ri(3, 15), b = ri(2, 12);
      if (t === 0) return { q: "Een rechthoek is " + l + " cm lang en " + b + " cm breed. Wat is de oppervlakte?", ans: l * b, unit: "cm²", uitleg: "Oppervlakte = lengte × breedte = " + l + " × " + b + " = " + l * b + " cm²." };
      if (t === 1) return { q: "Een rechthoek is " + l + " m lang en " + b + " m breed. Wat is de omtrek?", ans: 2 * (l + b), unit: "m", uitleg: "De omtrek is alle zijden bij elkaar: " + l + " + " + b + " + " + l + " + " + b + " = " + 2 * (l + b) + " m." };
      var bs = 2 * ri(2, 9), h = ri(3, 12);
      return { q: "Een driehoek heeft een basis van " + bs + " cm en een hoogte van " + h + " cm. Wat is de oppervlakte?", ans: bs * h / 2, unit: "cm²",
        uitleg: "Een driehoek is de helft van een rechthoek: " + fr(1, 2) + " × basis × hoogte = " + fr(1, 2) + " × " + bs + " × " + h + " = " + bs * h / 2 + " cm²." };
    } },
    { id: "formules", vak: "Wiskunde", klas: "1", naam: "Formules invullen", desc: "Getallen invullen in een formule.", gen: function () {
      if (Math.random() < 0.5) {
        var st = pick([3, 3.5, 4, 5]), pk = pick([1.5, 2, 2.25, 2.5, 3]), km = ri(3, 20);
        return { q: "Een taxirit kost " + euro(st) + " instaptarief plus " + euro(pk) + " per kilometer. De formule is: prijs = " + f(st, 2) + " + " + f(pk, 2) + " × afstand. Wat kost een rit van " + km + " km?",
          ans: st + pk * km, unit: "€", pre: true, tol: 0.005, uitleg: "Vul afstand = " + km + " in: " + f(st, 2) + " + " + f(pk, 2) + " × " + km + " = " + f(st, 2) + " + " + f(pk * km, 2) + " = " + euro(st + pk * km) + ". Eerst keer, dan plus." };
      }
      var a = ri(-5, 6) || 3, c = ri(-9, 9), xv = ri(-6, 6);
      var y = a * xv + c, formula = "<i>y</i> = " + f(a) + x() + (c < 0 ? " − " + f(-c) : " + " + c);
      return { q: "Gegeven is de formule " + formula + ". Bereken " + x("y") + " als " + x() + " = " + f(xv) + ".", ans: y, kb: "text",
        uitleg: "Vul " + x() + " = " + f(xv) + " in: " + f(a) + " × " + p(xv) + (c < 0 ? " − " + f(-c) : " + " + c) + " = " + f(a * xv) + (c < 0 ? " − " + f(-c) : " + " + c) + " = " + f(y) + "." };
    } },
    { id: "vergelijkingen", vak: "Wiskunde", klas: "2", naam: "Vergelijkingen oplossen", desc: "Met de balansmethode naar x.", gen: function () {
      var sol = ri(-8, 10), a = ri(2, 9), b = ri(-15, 15) || 6;
      if (Math.random() < 0.5) {
        var c = a * sol + b;
        return { q: "Los op: " + a + x() + (b < 0 ? " − " + f(-b) : " + " + b) + " = " + f(c) + ".", ans: sol, kb: "text",
          uitleg: (b < 0 ? "Tel aan beide kanten " + f(-b) + " op" : "Haal aan beide kanten " + b + " weg") + ": " + a + x() + " = " + f(c - b) + ". Deel beide kanten door " + a + ": " + x() + " = " + f(sol) + "." };
      }
      var cc = ri(1, 8); if (cc === a) cc = a + 1;
      var big = Math.max(a, cc), small = Math.min(a, cc), d = big * sol + b - small * sol;
      var left = big + x() + (b < 0 ? " − " + f(-b) : " + " + b), right = small + x() + (d < 0 ? " − " + f(-d) : " + " + d);
      var swap = Math.random() < 0.5;
      return { q: "Los op: " + (swap ? right + " = " + left : left + " = " + right) + ".", ans: sol, kb: "text",
        uitleg: "Haal " + small + x() + " aan beide kanten weg: " + (big - small) + x() + (b < 0 ? " − " + f(-b) : " + " + b) + " = " + f(d) + ". " +
          (b < 0 ? "Tel " + f(-b) + " op" : "Haal " + b + " weg") + ": " + (big - small) + x() + " = " + f(d - b) + ". " + (big - small === 1 ? "Dus " : "Deel door " + (big - small) + ": ") + x() + " = " + f(sol) + "." };
    } },
    { id: "haakjes", vak: "Wiskunde", klas: "2", naam: "Haakjes wegwerken", desc: "Kies de goede uitwerking.", gen: function () {
      function term(c, v, first) { if (c === 0) return ""; var s = c < 0 ? (first ? "−" : " − ") : (first ? "" : " + "); var m = Math.abs(c); return s + (v ? (m === 1 ? "" : m) + v : m); }
      function expr(a, bb, cst) { var s = term(a, "<i>x</i>²", true); var t = term(bb, "<i>x</i>", !s); s += t; s += term(cst, "", !s); return s || "0"; }
      var opts, good, u;
      if (Math.random() < 0.5) {
        var a = pick([-4, -3, -2, 2, 3, 4, 5]), b = ri(1, 6), c = pick([-7, -5, -3, -2, 2, 3, 4, 6]);
        var lhs = (a < 0 ? "−" + (-a) : a) + "(" + (b === 1 ? "" : b) + "<i>x</i>" + (c < 0 ? " − " + (-c) : " + " + c) + ")";
        good = expr(0, a * b, a * c);
        opts = [good, expr(0, a * b, c), expr(0, a * b, -a * c), expr(0, b, a * c)];
        u = "Vermenigvuldig " + (a < 0 ? "−" + (-a) : a) + " met elke term tussen de haakjes: " + (a < 0 ? "−" + (-a) : a) + " × " + (b === 1 ? "" : b) + "<i>x</i> en " + (a < 0 ? "−" + (-a) : a) + " × " + p(c) + ". Dat geeft " + good + ".";
        return { q: "Werk de haakjes weg: " + lhs, opts: uniq(opts), ans: good, uitleg: u };
      }
      var m = pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), n = pick([-6, -4, -3, -2, 1, 2, 3, 4, 5, 7]);
      var lh = "(<i>x</i>" + (m < 0 ? " − " + (-m) : " + " + m) + ")(<i>x</i>" + (n < 0 ? " − " + (-n) : " + " + n) + ")";
      good = expr(1, m + n, m * n);
      opts = [good, expr(1, 0, m * n), expr(1, m * n, m + n), expr(1, m + n, -m * n)];
      u = "Elke term uit het eerste paar haakjes keer elke term uit het tweede: <i>x</i> · <i>x</i> = <i>x</i>², <i>x</i> · " + p(n) + " + " + p(m) + " · <i>x</i> = " + expr(0, m + n, 0) + " en " + p(m) + " · " + p(n) + " = " + f(m * n) + ". Samen: " + good + ".";
      return { q: "Werk de haakjes weg: " + lh, opts: uniq(opts), ans: good, uitleg: u };
    } },
    { id: "machten", vak: "Wiskunde", klas: "2", naam: "Machten en wortels", desc: "Kwadraten, derde machten en wortels.", gen: function () {
      var t = ri(0, 3), a;
      if (t === 0) { a = ri(2, 15); return { q: "Bereken " + a + "².", ans: a * a, uitleg: a + "² = " + a + " × " + a + " = " + a * a + "." }; }
      if (t === 1) { a = ri(2, 5); return { q: "Bereken " + a + "³.", ans: a * a * a, uitleg: a + "³ = " + a + " × " + a + " × " + a + " = " + a * a * a + "." }; }
      if (t === 2) { a = ri(2, 15); return { q: "Bereken <math><msqrt><mn>" + a * a + "</mn></msqrt></math>.", ans: a, uitleg: "Welk positief getal keer zichzelf geeft " + a * a + "? " + a + " × " + a + " = " + a * a + ", dus de wortel is " + a + "." }; }
      a = ri(2, 9);
      return Math.random() < 0.5
        ? { q: "Bereken (−" + a + ")².", ans: a * a, kb: "text", uitleg: "(−" + a + ")² = (−" + a + ") × (−" + a + ") = " + a * a + ". Min keer min is plus." }
        : { q: "Bereken −" + a + "².", ans: -a * a, kb: "text", uitleg: "Zonder haakjes hoort het kwadraat alleen bij de " + a + ": −" + a + "² = −(" + a + " × " + a + ") = −" + a * a + "." };
    } },
    { id: "pythagoras", vak: "Wiskunde", klas: "2", naam: "Stelling van Pythagoras", desc: "Zijden van een rechthoekige driehoek.", gen: function () {
      var tr = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10]]), k = pick([1, 1, 2, 3]);
      var a = tr[0] * k, b = tr[1] * k, c = tr[2] * k;
      if (Math.random() < 0.5) return { q: "In een rechthoekige driehoek zijn de rechthoekszijden " + a + " cm en " + b + " cm. Hoe lang is de schuine zijde?", ans: c, unit: "cm",
        uitleg: "Schuine zijde² = " + a + "² + " + b + "² = " + a * a + " + " + b * b + " = " + c * c + ". De schuine zijde is <math><msqrt><mn>" + c * c + "</mn></msqrt></math> = " + c + " cm." };
      if (Math.random() < 0.5) return { q: "In een rechthoekige driehoek is de schuine zijde " + c + " cm en één rechthoekszijde " + a + " cm. Hoe lang is de andere rechthoekszijde?", ans: b, unit: "cm",
        uitleg: "Andere zijde² = " + c + "² − " + a + "² = " + c * c + " − " + a * a + " = " + b * b + ". De zijde is <math><msqrt><mn>" + b * b + "</mn></msqrt></math> = " + b + " cm." };
      var p1 = ri(2, 12), p2 = ri(2, 12), h = Math.sqrt(p1 * p1 + p2 * p2);
      return { q: "De rechthoekszijden zijn " + p1 + " cm en " + p2 + " cm. Hoe lang is de schuine zijde? Rond af op één decimaal.", ans: Math.round(h * 10) / 10, tol: 0.051, unit: "cm",
        uitleg: "Schuine zijde² = " + p1 * p1 + " + " + p2 * p2 + " = " + (p1 * p1 + p2 * p2) + ". <math><msqrt><mn>" + (p1 * p1 + p2 * p2) + "</mn></msqrt></math> ≈ " + f(h, 3) + ", afgerond " + f(Math.round(h * 10) / 10) + " cm." };
    } },

    // ===== Natuurkunde =====
    { id: "eenheden", vak: "Natuurkunde", klas: "1", naam: "Eenheden omrekenen", desc: "Lengte, massa, inhoud en tijd.", gen: function () {
      var sets = [
        [["mm", 0.001], ["cm", 0.01], ["m", 1], ["km", 1000]],
        [["mg", 0.001], ["g", 1], ["kg", 1000]],
        [["mL", 0.001], ["L", 1]],
        [["cm³", 0.001], ["dm³", 1], ["m³", 1000]],
        [["s", 1], ["min", 60], ["h", 3600]]
      ];
      var set, from, to, v, ans, tries = 0;
      do { // net zo lang kiezen tot het antwoord een net getal is (hoogstens 3 decimalen, niet te klein of te groot)
        set = pick(sets); var i = ri(0, set.length - 1), j = ri(0, set.length - 2); if (j >= i) j++;
        from = set[i]; to = set[j]; v = pick([0.5, 1.2, 1.5, 2, 2.5, 3, 4, 12, 25, 30, 45, 75, 90, 120, 150, 350, 600, 1500, 2500]);
        ans = clean(v * from[1] / to[1]);
      } while (tries++ < 200 && (ans < 0.01 || ans > 100000 || Math.abs(ans * 1000 - Math.round(ans * 1000)) > 1e-6));
      var fac = from[1] / to[1];
      var how = fac >= 1 ? "1 " + from[0] + " = " + f(fac) + " " + to[0] + ", dus keer " + f(fac) : "1 " + to[0] + " = " + f(1 / fac) + " " + from[0] + ", dus delen door " + f(1 / fac);
      return { q: "Reken om: " + f(v) + " " + from[0] + " = … " + to[0], ans: ans, unit: to[0], uitleg: how + ": " + f(v) + " " + from[0] + " = " + f(ans) + " " + to[0] + "." + (set[0][0] === "cm³" ? " Handig: 1 dm³ = 1 L en 1 cm³ = 1 mL." : "") };
    } },
    { id: "dichtheid", vak: "Natuurkunde", klas: "1", naam: "Dichtheid", desc: "Rekenen met ρ = m / V, en drijven of zinken.", gen: function () {
      var mats = [["water", 1.0], ["ijzer", 7.9], ["aluminium", 2.7], ["goud", 19.3], ["eikenhout", 0.8], ["ijs", 0.92], ["koper", 8.9], ["kurk", 0.25]];
      var m = pick(mats), V = ri(2, 40) * 5, mass = clean(m[1] * V), t = ri(0, 3);
      var rho = "<math><mi>ρ</mi><mo>=</mo><mfrac><mi>m</mi><mi>V</mi></mfrac></math>";
      if (t === 0) return { q: "Een blokje " + m[0] + " heeft een volume van " + V + " cm³ en een massa van " + f(mass) + " g. Wat is de dichtheid?", ans: m[1], unit: "g/cm³", tol: 0.011,
        uitleg: rho + " = " + f(mass) + " ÷ " + V + " = " + f(m[1]) + " g/cm³." };
      if (t === 1) return { q: "De dichtheid van " + m[0] + " is " + f(m[1]) + " g/cm³. Wat is de massa van " + V + " cm³ " + m[0] + "?", ans: mass, unit: "g", tol: 0.01 * mass,
        uitleg: "Omgeschreven: m = ρ × V = " + f(m[1]) + " × " + V + " = " + f(mass) + " g." };
      if (t === 2) return { q: "De dichtheid van " + m[0] + " is " + f(m[1]) + " g/cm³. Een stuk " + m[0] + " heeft een massa van " + f(mass) + " g. Wat is het volume?", ans: V, unit: "cm³", tol: 0.01 * V,
        uitleg: "Omgeschreven: V = m ÷ ρ = " + f(mass) + " ÷ " + f(m[1]) + " = " + V + " cm³." };
      var o = pick(mats.filter(function (r) { return r[0] !== "water"; })), floats = o[1] < 1;
      return { q: "De dichtheid van " + o[0] + " is " + f(o[1]) + " g/cm³. Wat doet een blok " + o[0] + " in water?", opts: ["Het drijft", "Het zinkt"], ans: floats ? "Het drijft" : "Het zinkt",
        uitleg: "Water heeft een dichtheid van 1,0 g/cm³. Een voorwerp met een " + (floats ? "kleinere" : "grotere") + " dichtheid dan water " + (floats ? "drijft" : "zinkt") + "." };
    } },
    { id: "fasen", vak: "Natuurkunde", klas: "1", naam: "Faseovergangen", desc: "Smelten, stollen, verdampen en meer.", gen: function () {
      var all = ["smelten", "stollen", "verdampen", "condenseren", "sublimeren", "rijpen"];
      var cases = [
        ["Een ijsblokje verandert in water.", "smelten", "Van vast naar vloeibaar heet smelten."],
        ["Kaarsvet dat van de kaars druipt, wordt weer hard.", "stollen", "Van vloeibaar naar vast heet stollen."],
        ["Een plas op straat droogt op in de zon.", "verdampen", "Van vloeibaar naar gas heet verdampen."],
        ["De spiegel in de badkamer beslaat na het douchen.", "condenseren", "Waterdamp (gas) wordt op de koude spiegel weer vloeibaar. Van gas naar vloeibaar heet condenseren."],
        ["Droogijs verdwijnt als nevel, zonder eerst vloeibaar te worden.", "sublimeren", "Van vast direct naar gas heet sublimeren."],
        ["Op een koude ochtend zit er een wit laagje ijs op de autoruit, zonder dat het geregend heeft.", "rijpen", "Waterdamp uit de lucht wordt direct vast. Van gas direct naar vast heet rijpen."],
        ["Een stof gaat van vast naar vloeibaar.", "smelten", "Van vast naar vloeibaar heet smelten."],
        ["Een stof gaat van gas naar vloeibaar.", "condenseren", "Van gas naar vloeibaar heet condenseren."]
      ];
      var c = pick(cases), others = shuffle(all.filter(function (w) { return w !== c[1]; })).slice(0, 3);
      return { q: c[0] + " Hoe heet deze faseovergang?", opts: shuffle([c[1]].concat(others)), ans: c[1], uitleg: c[2] };
    } },
    { id: "grootheden", vak: "Natuurkunde", klas: "1", naam: "Grootheden en eenheden", desc: "Welke eenheid hoort waarbij?", gen: function () {
      var g = [["kracht", "newton (N)"], ["massa", "kilogram (kg)"], ["tijd", "seconde (s)"], ["spanning", "volt (V)"], ["stroomsterkte", "ampère (A)"], ["vermogen", "watt (W)"],
        ["energie", "joule (J)"], ["lengte", "meter (m)"], ["temperatuur", "graden Celsius (°C)"], ["volume", "kubieke meter (m³)"], ["snelheid", "meter per seconde (m/s)"], ["dichtheid", "gram per kubieke centimeter (g/cm³)"]];
      var r = pick(g), wrong = shuffle(g.filter(function (x2) { return x2 !== r; })).slice(0, 3);
      if (Math.random() < 0.5) return { q: "In welke eenheid meet je " + r[0] + "?", opts: shuffle([r].concat(wrong)).map(function (x2) { return x2[1]; }), ans: r[1], uitleg: "De eenheid van " + r[0] + " is de " + r[1] + "." };
      return { q: "Bij welke grootheid hoort de eenheid " + r[1] + "?", opts: shuffle([r].concat(wrong)).map(function (x2) { return x2[0]; }), ans: r[0], uitleg: "De " + r[1] + " is de eenheid van " + r[0] + "." };
    } },
    { id: "snelheid", vak: "Natuurkunde", klas: "2", naam: "Snelheid", desc: "Rekenen met v = s / t en km/h naar m/s.", gen: function () {
      var t = ri(0, 3), vf = "<math><mi>v</mi><mo>=</mo><mfrac><mi>s</mi><mi>t</mi></mfrac></math>";
      if (t === 0) { var v = pick([15, 20, 30, 45, 60, 80, 100, 120]), h = pick([0.5, 1.5, 2, 3]);
        return { q: "Een bus rijdt " + f(v * h) + " km in " + f(h) + " uur. Wat is de gemiddelde snelheid?", ans: v, unit: "km/h", uitleg: vf + " = " + f(v * h) + " ÷ " + f(h) + " = " + v + " km/h." }; }
      if (t === 1) { var ms = ri(2, 12), sec = ri(5, 30);
        return { q: "Een fietser rijdt " + ms * sec + " m in " + sec + " s. Wat is de snelheid in m/s?", ans: ms, unit: "m/s", uitleg: vf + " = " + ms * sec + " ÷ " + sec + " = " + ms + " m/s." }; }
      if (t === 2) { var kmh = 18 * ri(1, 7);
        return { q: "Reken " + kmh + " km/h om naar m/s.", ans: kmh / 3.6, unit: "m/s", uitleg: "1 km/h = 1000 m per 3600 s, dus delen door 3,6: " + kmh + " ÷ 3,6 = " + f(kmh / 3.6) + " m/s." }; }
      var vv = pick([4, 5, 12, 15, 20, 25]), tt = pick([10, 20, 30, 40, 60]);
      return { q: "Een scooter rijdt " + tt + " s met een snelheid van " + vv + " m/s. Hoeveel meter legt hij af?", ans: vv * tt, unit: "m", uitleg: "Omgeschreven: s = v × t = " + vv + " × " + tt + " = " + vv * tt + " m." };
    } },
    { id: "zwaartekracht", vak: "Natuurkunde", klas: "2", naam: "Zwaartekracht", desc: "Rekenen met F<sub>z</sub> = m · g.", gen: function () {
      var t = ri(0, 2), F = "<math><msub><mi>F</mi><mi>z</mi></msub><mo>=</mo><mi>m</mi><mo>·</mo><mi>g</mi></math>";
      if (t === 0) { var m = pick([2, 5, 8, 12, 40, 55, 70]);
        return { q: "Hoe groot is de zwaartekracht op een voorwerp van " + m + " kg op aarde? Gebruik g = 9,8 N/kg.", ans: m * 9.8, unit: "N", tol: 0.01 * m * 9.8 + 0.01, uitleg: F + " = " + m + " × 9,8 = " + f(m * 9.8) + " N." }; }
      if (t === 1) { var gr = pick([200, 250, 500, 750]);
        return { q: "Een pak melk heeft een massa van " + gr + " g. Hoe groot is de zwaartekracht erop? Gebruik g = 9,8 N/kg.", ans: gr / 1000 * 9.8, unit: "N", tol: 0.02,
          uitleg: "Reken eerst om naar kilogram: " + gr + " g = " + f(gr / 1000) + " kg. Dan " + F + " = " + f(gr / 1000) + " × 9,8 = " + f(gr / 1000 * 9.8) + " N." }; }
      var mm = pick([10, 20, 30, 60, 80]);
      return { q: "Een astronaut met pak heeft een massa van " + mm * 2 + " kg. Hoe groot is de zwaartekracht op de maan? Gebruik g = 1,6 N/kg.", ans: mm * 2 * 1.6, unit: "N", tol: 0.01 * mm * 3.2,
        uitleg: F + " = " + mm * 2 + " × 1,6 = " + f(mm * 2 * 1.6) + " N. De massa blijft gelijk, alleen g is op de maan kleiner." };
    } },
    { id: "elektriciteit", vak: "Natuurkunde", klas: "2", naam: "Vermogen en energie", desc: "P = U · I en E = P · t, ook in kWh en euro's.", gen: function () {
      var t = ri(0, 3);
      if (t === 0) { var I = pick([0.5, 2, 4, 6, 8, 10]);
        return { q: "Een apparaat op het stopcontact (230 V) trekt een stroom van " + f(I) + " A. Wat is het vermogen?", ans: 230 * I, unit: "W",
          uitleg: "<math><mi>P</mi><mo>=</mo><mi>U</mi><mo>·</mo><mi>I</mi></math> = 230 × " + f(I) + " = " + f(230 * I) + " W." }; }
      if (t === 1) { var P = pick([460, 690, 1150, 2300]);
        return { q: "Een föhn van " + P + " W zit op het stopcontact (230 V). Hoe groot is de stroomsterkte?", ans: P / 230, unit: "A",
          uitleg: "Omgeschreven: I = P ÷ U = " + P + " ÷ 230 = " + f(P / 230) + " A." }; }
      if (t === 2) { var W = pick([500, 1000, 1500, 2000, 2500]), h = pick([0.5, 1, 2, 3, 4]);
        return { q: "Een kachel van " + W + " W staat " + f(h) + " uur aan. Hoeveel energie gebruikt hij in kWh?", ans: W / 1000 * h, unit: "kWh",
          uitleg: "Reken het vermogen om naar kilowatt: " + W + " W = " + f(W / 1000) + " kW. Dan <math><mi>E</mi><mo>=</mo><mi>P</mi><mo>·</mo><mi>t</mi></math> = " + f(W / 1000) + " × " + f(h) + " = " + f(W / 1000 * h) + " kWh." }; }
      var kwh = pick([2, 3, 4, 5, 8, 10]);
      return { q: "Je wasmachine gebruikt " + kwh + " kWh per week. Eén kWh kost € 0,30. Wat kost dat per week?", ans: kwh * 0.3, unit: "€", pre: true, tol: 0.005,
        uitleg: "Kosten = energie × prijs per kWh = " + kwh + " × € 0,30 = " + euro(kwh * 0.3) + "." };
    } },
    { id: "schakelingen", vak: "Natuurkunde", klas: "2", naam: "Schakelingen en geleiders", desc: "Serie, parallel, geleiders en isolatoren.", gen: function () {
      var cases = [
        ["In een serieschakeling met drie lampjes gaat één lampje kapot. Wat gebeurt er met de andere twee?", ["Ze gaan ook uit", "Ze blijven branden", "Ze gaan feller branden"], "Ze gaan ook uit", "In een serieschakeling is er maar één weg voor de stroom. Is die onderbroken, dan stopt de stroom overal."],
        ["In een parallelschakeling gaat één lampje kapot. Wat gebeurt er met de andere lampjes?", ["Ze blijven branden", "Ze gaan ook uit", "Ze gaan zwakker branden"], "Ze blijven branden", "Bij parallel heeft elk lampje een eigen weg. De andere wegen blijven gesloten."],
        ["Hoe zijn de stopcontacten in een huis geschakeld?", ["Parallel", "In serie", "Afwisselend"], "Parallel", "Parallel, zodat elk apparaat los aan en uit kan en elk apparaat de volle 230 V krijgt."],
        ["Je zet een tweede lampje in serie bij een lampje aan een batterij. Wat gebeurt er met de felheid?", ["Ze branden allebei zwakker", "Ze branden allebei even fel als eerst", "Alleen het tweede brandt"], "Ze branden allebei zwakker", "De spanning van de batterij wordt over twee lampjes verdeeld, dus elk lampje krijgt minder."]
      ];
      var mats = [["koper", "Geleider"], ["aluminiumfolie", "Geleider"], ["ijzer", "Geleider"], ["grafiet (potloodstift)", "Geleider"], ["plastic", "Isolator"], ["hout", "Isolator"], ["glas", "Isolator"], ["rubber", "Isolator"]];
      if (Math.random() < 0.5) { var c = pick(cases); return { q: c[0], opts: shuffle(c[1].slice()), ans: c[2], uitleg: c[3] }; }
      var m = pick(mats);
      return { q: "Is " + m[0] + " een geleider of een isolator?", opts: ["Geleider", "Isolator"], ans: m[1],
        uitleg: m[1] === "Geleider" ? "Stroom gaat goed door " + m[0] + ". Metalen en grafiet zijn geleiders." : "Stroom gaat bijna niet door " + m[0] + ". Daarom zitten stroomdraden in een laagje plastic of rubber." };
    } }
  ];
  function uniq(arr) { var seen = {}; return shuffle(arr.filter(function (s) { if (seen[s]) return false; seen[s] = 1; return true; })); }

  // ---------- antwoord lezen ----------
  function parse(t) {
    t = String(t).trim().replace(/[−–]/g, "-").replace(/€/g, "").replace(/\s+/g, " ").trim();
    var mixed = /^(-?)(\d+) (\d+)\s*\/\s*(\d+)$/.exec(t);
    if (mixed) { var mv = +mixed[2] + mixed[3] / mixed[4]; return { v: mixed[1] ? -mv : mv }; }
    var m = /^(-?\d+(?:[.,]\d+)?)(?:\s*\/\s*(-?\d+))?\s*[a-zA-Zµ°³²%\/·.]*$/.exec(t);
    if (!m) return null;
    var n = parseFloat(m[1].replace(",", "."));
    if (m[2] !== undefined) { var d = parseInt(m[2], 10); if (!d) return null; return { v: n / d, n: n, d: d }; }
    return { v: n };
  }

  // ---------- opslag van beste scores (alleen in deze browser) ----------
  var KEY = "betavonk-oefenbank-v1";
  function loadBest() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function saveBest(id, score) { try { var b = loadBest(); if (!(b[id] >= score)) { b[id] = score; localStorage.setItem(KEY, JSON.stringify(b)); } } catch (e) { /* geen opslag beschikbaar */ } }

  // ---------- interface ----------
  var LEN = 10;
  var topicBox = document.getElementById("ob-topics"), play = document.getElementById("ob-play"), setup = document.getElementById("ob-setup");
  var vak = "Wiskunde", state = null;

  function renderTopics() {
    var best = loadBest();
    var list = TOPICS.filter(function (t) { return t.vak === vak; });
    var mixId = "mix-" + vak;
    topicBox.innerHTML = list.map(function (t) {
      return '<button class="ob-topic" data-topic="' + t.id + '"><span class="tag">Klas ' + t.klas + '</span><b>' + t.naam + '</b><span class="ob-desc">' + t.desc + '</span>' +
        (best[t.id] != null ? '<span class="ob-best">Beste score: ' + best[t.id] + '/' + LEN + '</span>' : '') + '</button>';
    }).join("") + '<button class="ob-topic ob-mix" data-topic="' + mixId + '"><span class="tag">Klas 1 en 2</span><b>Alles door elkaar</b><span class="ob-desc">Vragen uit alle onderwerpen ' + (vak === "Wiskunde" ? "wiskunde" : "natuurkunde") + '.</span>' +
      (best[mixId] != null ? '<span class="ob-best">Beste score: ' + best[mixId] + '/' + LEN + '</span>' : '') + '</button>';
  }

  root.querySelectorAll("[data-ob-vak]").forEach(function (b) {
    b.addEventListener("click", function () {
      vak = b.dataset.obVak;
      root.querySelectorAll("[data-ob-vak]").forEach(function (o) { o.classList.toggle("is-on", o === b); o.setAttribute("aria-pressed", String(o === b)); });
      renderTopics();
    });
  });
  topicBox.addEventListener("click", function (e) {
    var b = e.target.closest("[data-topic]");
    if (b) start(b.dataset.topic);
  });

  function start(id) {
    var mix = id.indexOf("mix-") === 0;
    var pool = mix ? TOPICS.filter(function (t) { return t.vak === id.slice(4); }) : TOPICS.filter(function (t) { return t.id === id; });
    var qs = [], guard = 0;
    while (qs.length < LEN && guard++ < 200) {
      var t = pool[qs.length % pool.length]; if (mix) t = pick(pool);
      var item = t.gen(); item.topic = t.naam;
      if (qs.some(function (o) { return o.q === item.q; })) continue;
      qs.push(item);
    }
    state = { id: id, name: mix ? "Alles door elkaar" : pool[0].naam, qs: qs, i: 0, score: 0, answered: false };
    setup.hidden = true; play.hidden = false;
    show();
    play.scrollIntoView({ block: "start" });
  }

  function show() {
    var it = state.qs[state.i];
    state.answered = false;
    var input = it.opts
      ? '<div class="ob-opts">' + it.opts.map(function (o) { return '<button type="button" class="ob-opt" data-opt="' + esc(o) + '">' + o + '</button>'; }).join("") + '</div>'
      : '<form class="ob-answer" novalidate>' + (it.pre ? '<span class="ob-unit">' + it.unit + '</span>' : '') +
        '<input id="ob-input" autocomplete="off" aria-label="Jouw antwoord" ' + (it.kb === "text" ? 'inputmode="text"' : 'inputmode="decimal"') + '>' +
        (it.unit && !it.pre ? '<span class="ob-unit">' + it.unit + '</span>' : '') +
        '<button class="btn btn-lift" type="submit">Controleer</button></form>' +
        '<p class="hint">' + (it.frac ? "Typ een breuk als 3/4. " : "") + 'Een kommagetal mag met een komma of een punt.</p>';
    play.innerHTML =
      '<div class="ob-head"><button type="button" class="link-btn" data-ob-back>← Onderwerpen</button>' +
      '<span class="ob-meta">' + state.name + ' · vraag ' + (state.i + 1) + ' van ' + state.qs.length + ' · <b>' + state.score + ' goed</b></span></div>' +
      '<div class="ob-progress" aria-hidden="true"><i style="width:' + (state.i / state.qs.length * 100) + '%"></i></div>' +
      '<div class="ob-card">' + (state.id.indexOf("mix-") === 0 ? '<p class="eyebrow">' + it.topic + '</p>' : '') +
      '<p class="ob-q">' + it.q + '</p>' + input +
      '<div class="ob-fb" id="ob-fb" aria-live="polite"></div>' +
      '<div class="ob-after" id="ob-after" hidden><button type="button" class="btn btn-lift" data-ob-next>' + (state.i + 1 < state.qs.length ? "Volgende vraag" : "Bekijk je score") + '</button></div>' +
      (it.opts ? '' : '<button type="button" class="link-btn ob-giveup" data-ob-giveup>Ik weet het niet, laat de uitwerking zien</button>') +
      '</div>';
    var inp = document.getElementById("ob-input");
    if (inp) inp.focus({ preventScroll: true });
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }

  function finish(ok, note) {
    var it = state.qs[state.i];
    state.answered = true;
    if (ok) state.score++;
    var fb = document.getElementById("ob-fb");
    fb.className = "ob-fb " + (ok ? "is-ok" : "is-wrong");
    var shown = it.opts ? it.ans : (it.pre ? it.unit + " " : "") + (it.frac && it.simple ? fr(it.simple[0], it.simple[1]) : f(it.ans)) + (it.unit && !it.pre ? " " + it.unit : "");
    fb.innerHTML = '<p class="ob-verdict">' + (ok ? "Goed!" : "Helaas, het antwoord is " + shown + ".") + (note ? " " + note : "") + '</p><p class="ob-uitleg"><b>Uitwerking.</b> ' + it.uitleg + '</p>';
    play.querySelectorAll(".ob-answer input, .ob-answer button, .ob-opt").forEach(function (el) { el.disabled = true; });
    var g = play.querySelector("[data-ob-giveup]"); if (g) g.hidden = true;
    document.getElementById("ob-after").hidden = false;
    play.querySelector("[data-ob-next]").focus({ preventScroll: true });
    play.querySelector(".ob-meta b").textContent = state.score + " goed";
    play.querySelector(".ob-progress i").style.width = ((state.i + 1) / state.qs.length * 100) + "%";
  }

  play.addEventListener("submit", function (e) {
    e.preventDefault();
    if (state.answered) return;
    var it = state.qs[state.i], inp = document.getElementById("ob-input"), r = parse(inp.value), fb = document.getElementById("ob-fb");
    if (!inp.value.trim()) { fb.className = "ob-fb"; fb.textContent = "Vul eerst een antwoord in."; inp.focus(); return; }
    if (!r) { fb.className = "ob-fb"; fb.textContent = "Dit kan ik niet lezen als getal. Typ bijvoorbeeld 12, 3,5 of 3/4."; inp.focus(); return; }
    var tol = it.tol != null ? it.tol : 1e-6 * Math.max(1, Math.abs(it.ans));
    var ok = Math.abs(r.v - it.ans) <= tol, note = "";
    if (ok && it.frac && r.d && it.simple && Math.abs(r.d) !== Math.abs(it.simple[1])) note = "Je kunt het nog vereenvoudigen tot " + fr(it.simple[0], it.simple[1]) + ".";
    finish(ok, note);
  });
  play.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.hasAttribute("data-ob-back")) { backToTopics(); return; }
    if (t.hasAttribute("data-ob-giveup")) { if (!state.answered) finish(false); return; }
    if (t.hasAttribute("data-opt")) {
      if (state.answered) return;
      var it = state.qs[state.i], ok = t.dataset.opt === it.ans;
      play.querySelectorAll(".ob-opt").forEach(function (b) { if (b.dataset.opt === it.ans) b.classList.add("right"); });
      if (!ok) t.classList.add("wrong");
      finish(ok);
      return;
    }
    if (t.hasAttribute("data-ob-next")) {
      if (state.i + 1 < state.qs.length) { state.i++; show(); } else end();
      return;
    }
    if (t.hasAttribute("data-ob-again")) { start(state.id); return; }
  });

  function end() {
    saveBest(state.id, state.score);
    var s = state.score, n = state.qs.length;
    var msg = s === n ? "Alles goed. Probeer een moeilijker onderwerp of doe nog een reeks om het vast te houden."
      : s >= 7 ? "Mooi resultaat. Lees de uitwerkingen van de fouten nog eens na en doe dan nog een reeks."
      : s >= 4 ? "Je bent op weg. Doe nog een reeks: elke keer krijg je nieuwe getallen."
      : "Dit onderwerp is nog lastig. Bekijk de uitleg bij de oefensites hieronder, of stel je vraag in een les.";
    play.innerHTML = '<div class="ob-head"><button type="button" class="link-btn" data-ob-back>← Onderwerpen</button><span class="ob-meta">' + state.name + '</span></div>' +
      '<div class="ob-progress" aria-hidden="true"><i style="width:100%"></i></div>' +
      '<div class="ob-card ob-end"><p class="ob-score"><b>' + s + '</b> van de ' + n + ' goed</p><p>' + msg + '</p>' +
      '<div class="actions"><button type="button" class="btn btn-lift" data-ob-again>Nieuwe reeks</button><button type="button" class="btn btn-ghost" data-ob-back>Ander onderwerp</button></div></div>';
    play.querySelector("[data-ob-again]").focus({ preventScroll: true });
  }
  function backToTopics() {
    play.hidden = true; setup.hidden = false; play.innerHTML = "";
    renderTopics();
    root.scrollIntoView({ block: "start" });
  }

  renderTopics();
  window.BetaVonkOefenbank = { topics: TOPICS, parse: parse }; // voor testen
})();

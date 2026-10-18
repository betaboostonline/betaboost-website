/**
 * BètaVonk formulierservice en inhoud (Google Apps Script, gekoppeld aan een Google-spreadsheet).
 *
 * - Aanmeldingen komen binnen met status "te beoordelen". Jullie accepteren of wijzen af via het menu
 *   BètaVonk in het spreadsheet; de ouder krijgt daarna automatisch een mail.
 * - Bij elke aanmelding gaat een mail met de gegevens naar NOTIFY_EMAIL.
 * - De schoolmail wordt gecontroleerd (geen gratis mailadres, domein moet mail kunnen ontvangen)
 *   en bevestigd met een code die naar dat adres wordt gestuurd.
 * - De website krijgt alleen het rooster, het aantal bezette plekken, het oefenmateriaal en de
 *   Ontdek bèta-artikelen terug, nooit persoonsgegevens.
 *
 * Installatie: zie INSTALLATIE.md.
 */

var VERSIE = '4';  // controle: <web-app-URL>?actie=versie moet {"ok":true,"versie":"4"} geven
var NOTIFY_EMAIL = 'hulp.betaboost@gmail.com';   // krijgt elke aanmelding met de gegevens
var REPLY_TO = 'hulp.betaboost@gmail.com';        // antwoordadres in mails aan ouders en leerlingen
var KLASSEN = ['Klas 1', 'Klas 2'];
var CONSENT_REQUIRED = ['toestemmingDeelname', 'toestemmingGegevens', 'toestemmingVoorwaarden', 'lesregelsBesproken'];
// Statussen in Reserveringen die een plek bezet houden.
var HOLDS_PLACE = ['aangevraagd', 'geplaatst'];

// Gratis en internetprovider-mailadressen: dit zijn geen schoolmails.
var FREEMAIL = ['gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.nl', 'outlook.com', 'outlook.nl', 'live.com', 'live.nl',
  'msn.com', 'yahoo.com', 'yahoo.nl', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com',
  'gmx.net', 'ziggo.nl', 'kpnmail.nl', 'kpnplanet.nl', 'planet.nl', 'home.nl', 'xs4all.nl', 'hetnet.nl', 'chello.nl', 'upcmail.nl',
  'telfort.nl', 'tele2.nl', 'online.nl', 'zeelandnet.nl', 'caiway.nl', 'solcon.nl', 'quicknet.nl', 'mail.com', 'tutanota.com'];

var TABS = {
  Lessen: ['id', 'vak', 'soort', 'onderwerp', 'klas', 'datum', 'tijd', 'max', 'zichtbaar'],
  Aanmeldingen: ['tijdstip', 'aanmeldId', 'status', 'voornaam', 'achternaam', 'leeftijd', 'klas', 'school', 'schoolmail', 'schoolmailBevestigd',
    'vakken', 'onderwerpen', 'bijles', 'ouderNaam', 'ouderEmail', 'ouderTelefoon', 'toestemmingDeelname',
    'toestemmingGegevens', 'toestemmingVoorwaarden', 'lesregelsBesproken', 'toestemmingOnderzoek', 'consentVersie'],
  Reserveringen: ['tijdstip', 'aanmeldId', 'lesId', 'status'],
  Huiswerkvragen: ['tijdstip', 'aanmeldId', 'lesIds', 'vak', 'onderwerp', 'vraag', 'geprobeerd'],
  Scholen: ['tijdstip', 'school', 'plaats', 'naam', 'functie', 'email', 'bericht'],
  Feedback: ['tijdstip', 'nuttig', 'begrepen', 'tempo', 'onduidelijk'],
  Oefenmateriaal: ['module', 'vak', 'klas', 'type', 'titel', 'link', 'volgorde', 'zichtbaar'],
  Ontdek: ['id', 'titel', 'categorie', 'samenvatting', 'tekst', 'bron', 'volgorde', 'zichtbaar']
};

/** Eenmalig uitvoeren (en opnieuw na een update): maakt ontbrekende tabbladen en kolommen aan. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.getRange('A:Z').setNumberFormat('@');
    ensureHeaders(sh, TABS[name]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold');
  });
  if (sheet('Lessen').getLastRow() === 1) testlessen();
  if (sheet('Oefenmateriaal').getLastRow() === 1) {
    sheet('Oefenmateriaal').appendRow(['Lineaire vergelijkingen', 'Wiskunde', 'Klas 1–2', 'Uitleg', 'Uitleg in stappen (voorbeeld)', 'https://example.com', '1', 'nee']);
  }
  if (sheet('Ontdek').getLastRow() === 1) {
    sheet('Ontdek').appendRow(['voorbeeld-artikel', 'Van algebra naar AI', 'Wiskunde in het echt', 'Hoe vergelijkingen computers leren denken.',
      'Schrijf hier de tekst, of plak de link van een Google Doc.', '', '1', 'nee']);
  }
}

/** Voegt testlessen toe voor klas 1 en 2 (id's beginnen met TEST). Verwijder ze na het testen. */
function testlessen() {
  var sh = sheet('Lessen');
  sh.getRange('A:Z').setNumberFormat('@');
  [
    ['TEST-W1', 'Wiskunde', 'Uitlegles', 'Breuken en verhoudingen', 'Klas 1', '2026-11-23', '15.30–16.30', '10', 'ja'],
    ['TEST-N1', 'Natuurkunde', 'Uitlegles', 'Krachten', 'Klas 1', '2026-11-24', '15.30–16.30', '10', 'ja'],
    ['TEST-W2', 'Wiskunde', 'Uitlegles', 'Lineaire vergelijkingen oplossen', 'Klas 2', '2026-11-25', '19.00–20.00', '10', 'ja'],
    ['TEST-N2', 'Natuurkunde', 'Uitlegles', 'Dichtheid', 'Klas 2', '2026-11-26', '19.00–20.00', '10', 'ja'],
    ['TEST-H1', 'Wiskunde', 'Huiswerkhulp', 'Wiskunde, alle onderwerpen', 'Klas 1–2', '2026-11-25', '13.30–15.00', '10', 'ja'],
    ['TEST-H2', 'Natuurkunde', 'Huiswerkhulp', 'Natuurkunde, alle onderwerpen', 'Klas 1–2', '2026-11-28', '10.00–11.30', '10', 'ja']
  ].forEach(function (r) { sh.appendRow(r); });
}

// ---------- menu in het spreadsheet ----------
function onOpen() {
  SpreadsheetApp.getUi().createMenu('BètaVonk')
    .addItem('Geselecteerde aanmelding accepteren', 'acceptSelected')
    .addItem('Geselecteerde aanmelding afwijzen', 'rejectSelected')
    .addToUi();
}

function acceptSelected() { decideSelected(true); }
function rejectSelected() { decideSelected(false); }

function decideSelected(accept) {
  var ui = SpreadsheetApp.getUi();
  var sh = SpreadsheetApp.getActiveSheet();
  if (sh.getName() !== 'Aanmeldingen') { ui.alert('Ga naar het tabblad Aanmeldingen en klik op de rij van de leerling.'); return; }
  var rowNr = sh.getActiveRange().getRow();
  if (rowNr < 2) { ui.alert('Klik eerst op de rij van een leerling.'); return; }
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var row = sh.getRange(rowNr, 1, 1, head.length).getValues()[0];
  var a = {};
  head.forEach(function (h, i) { a[h] = row[i]; });
  if (!a.aanmeldId) { ui.alert('Deze rij is geen aanmelding. Klik op de rij van een leerling.'); return; }
  var naam = a.voornaam + ' ' + a.achternaam;
  var answer = ui.alert((accept ? 'Accepteren: ' : 'Afwijzen: ') + naam,
    'De status wordt aangepast en ' + a.ouderEmail + ' krijgt een mail. Doorgaan?', ui.ButtonSet.YES_NO);
  if (answer !== ui.Button.YES) return;

  sh.getRange(rowNr, head.indexOf('status') + 1).setValue(accept ? 'geaccepteerd' : 'afgewezen');
  var res = sheet('Reserveringen');
  var values = res.getDataRange().getValues();
  var rh = values[0], idCol = rh.indexOf('aanmeldId'), stCol = rh.indexOf('status'), lesCol = rh.indexOf('lesId');
  var lessons = lessonsById(), placed = [], waiting = [];
  for (var i = 1; i < values.length; i++) {
    if (values[i][idCol] !== a.aanmeldId) continue;
    var st = values[i][stCol];
    var les = lessons[values[i][lesCol]];
    var label = les ? les.onderwerp + ' (' + les.datum + ', ' + les.tijd + ')' : values[i][lesCol];
    if (accept && st === 'aangevraagd') { res.getRange(i + 1, stCol + 1).setValue('geplaatst'); placed.push(label); }
    else if (accept && st === 'wachtlijst') waiting.push(label);
    else if (!accept && (st === 'aangevraagd' || st === 'wachtlijst')) res.getRange(i + 1, stCol + 1).setValue('afgewezen');
  }

  var body = accept
    ? 'Beste ' + a.ouderNaam + ',\n\n' + a.voornaam + ' is geaccepteerd bij BètaVonk.\n\n' +
      (placed.length ? 'Lessen:\n- ' + placed.join('\n- ') + '\n\n' : '') +
      (waiting.length ? 'Op de wachtlijst voor:\n- ' + waiting.join('\n- ') + '\n\n' : '') +
      'De Zoom-links sturen we voor de eerste les.\n\nMet vriendelijke groet,\nBètaVonk'
    : 'Beste ' + a.ouderNaam + ',\n\nBedankt voor de aanmelding van ' + a.voornaam + ' bij BètaVonk. ' +
      'Helaas kunnen we ' + a.voornaam + ' op dit moment geen plek aanbieden. BètaVonk is bedoeld voor leerlingen in klas 1 en 2 ' +
      'die geen toegang hebben tot betaalde bijles. Heeft u vragen, beantwoord dan deze mail.\n\nMet vriendelijke groet,\nBètaVonk';
  MailApp.sendEmail({ to: String(a.ouderEmail), replyTo: REPLY_TO, name: 'BètaVonk',
    subject: accept ? 'Aanmelding geaccepteerd: ' + a.voornaam : 'Over de aanmelding van ' + a.voornaam, body: body });
  ui.alert('Klaar. De status is aangepast en de mail is verstuurd.');
}

// ---------- web-app ----------
function doGet(e) {
  var actie = e && e.parameter ? e.parameter.actie : '';
  try {
    if (actie === 'lessen') return json({ ok: true, lessen: publicLessons() });
    if (actie === 'versie') return json({ ok: true, versie: VERSIE });
    if (actie === 'inhoud') return json({ ok: true, oefenmateriaal: publicMaterials(), ontdek: publicArticles() });
    return json({ ok: false, fout: 'Onbekende actie' });
  } catch (err) {
    return json({ ok: false, fout: err.message });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.website) return json({ ok: true, aangevraagd: [], wachtlijst: [] }); // honeypot
    if (data.type === 'code') return json(sendCode(data));
    lock.waitLock(20000); // één inzending tegelijk, zodat een les nooit boven het maximum komt
    if (data.type === 'aanmelding') return json(register(data));
    if (data.type === 'school') return json(saveSchool(data));
    if (data.type === 'feedback') return json(saveFeedback(data));
    return json({ ok: false, fout: 'Onbekend formulier' });
  } catch (err) {
    return json({ ok: false, fout: err.message });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

// ---------- schoolmail ----------
function schoolmailProblem(email) {
  email = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) return 'Vul een geldige schoolmail in.';
  var domain = email.split('@')[1];
  if (FREEMAIL.indexOf(domain) !== -1) return 'Vul een geldige schoolmail in. Een privé-adres zoals Gmail of Hotmail kan niet.';
  if (!domainReceivesMail(domain)) return 'Vul een geldige schoolmail in. Dit domein bestaat niet of ontvangt geen mail.';
  return '';
}

/** Controleert via DNS (Google Public DNS) of het domein mail kan ontvangen. Lukt de controle niet, dan blokkeren we niet. */
function domainReceivesMail(domain) {
  var cache = CacheService.getScriptCache(), key = 'mx:' + domain, hit = cache.get(key);
  if (hit) return hit === '1';
  try {
    var r = JSON.parse(UrlFetchApp.fetch('https://dns.google/resolve?name=' + encodeURIComponent(domain) + '&type=MX',
      { muteHttpExceptions: true }).getContentText());
    var ok = r.Status === 0 && Array.isArray(r.Answer) && r.Answer.length > 0;
    cache.put(key, ok ? '1' : '0', 21600);
    return ok;
  } catch (err) {
    return true;
  }
}

function sendCode(d) {
  var email = String(d.schoolmail || '').trim().toLowerCase();
  var problem = schoolmailProblem(email);
  if (problem) return { ok: false, fout: problem };
  var cache = CacheService.getScriptCache();
  var countKey = 'codes:' + email, count = Number(cache.get(countKey) || 0);
  if (count >= 3) return { ok: false, fout: 'Er zijn al drie codes naar dit adres gestuurd. Probeer het over een kwartier opnieuw.' };
  var code = String(Math.floor(100000 + Math.random() * 900000));
  cache.put('code:' + email, code, 900);
  cache.put(countKey, String(count + 1), 900);
  MailApp.sendEmail({ to: email, replyTo: REPLY_TO, name: 'BètaVonk', subject: 'Je BètaVonk-code: ' + code,
    body: 'Hoi,\n\nJe code om je aan te melden bij BètaVonk is: ' + code + '\n\nDe code is 15 minuten geldig. ' +
      'Heb je je niet aangemeld? Dan kun je deze mail negeren.\n\nBètaVonk' });
  return { ok: true };
}

function codeMatches(email, code) {
  var stored = CacheService.getScriptCache().get('code:' + String(email || '').trim().toLowerCase());
  return !!stored && stored === String(code || '').trim();
}

// ---------- aanmelden ----------
function register(d) {
  var problem = validate(d);
  if (problem) return { ok: false, fout: problem };

  var lessons = lessonsById();
  var counts = heldCounts();
  var id = Utilities.getUuid().slice(0, 8);
  var now = new Date();
  var mail = String(d.schoolmail).trim().toLowerCase();

  appendByHeader('Aanmeldingen', {
    tijdstip: now, aanmeldId: id, status: 'te beoordelen',
    voornaam: s(d.voornaam, 60), achternaam: s(d.achternaam, 80), leeftijd: s(d.leeftijd, 3), klas: s(d.klas, 10),
    school: s(d.school, 120), schoolmail: s(mail, 120), schoolmailBevestigd: d.zonderCode === true ? 'nee, controleren' : 'ja, met code', vakken: s(d.vakken, 60), onderwerpen: s(d.onderwerpen, 600),
    bijles: s(d.bijles, 30), ouderNaam: s(d.ouderNaam, 100), ouderEmail: s(d.ouderEmail, 120), ouderTelefoon: s(d.ouderTelefoon, 20),
    toestemmingDeelname: 'ja', toestemmingGegevens: 'ja', toestemmingVoorwaarden: 'ja', lesregelsBesproken: 'ja',
    toestemmingOnderzoek: d.toestemmingOnderzoek === true ? 'ja' : 'nee', consentVersie: s(d.consentVersie, 20)
  });
  CacheService.getScriptCache().remove('code:' + mail);

  // Eerst de uitleglessen, dan huiswerkhulp: zonder plek in een uitlegles ook huiswerkhulp op de wachtlijst.
  var ordered = d.lessen.slice().sort(function (a, b) {
    return (lessons[a].soort === 'Huiswerkhulp' ? 1 : 0) - (lessons[b].soort === 'Huiswerkhulp' ? 1 : 0);
  });
  var requested = [], waiting = [], hasLesson = false;
  ordered.forEach(function (lesId) {
    var les = lessons[lesId];
    var taken = counts[lesId] || 0;
    var allowed = les.soort !== 'Huiswerkhulp' || hasLesson;
    var status = allowed && taken < les.max ? 'aangevraagd' : 'wachtlijst';
    if (status === 'aangevraagd') {
      counts[lesId] = taken + 1; requested.push(lesId);
      if (les.soort !== 'Huiswerkhulp') hasLesson = true;
    } else waiting.push(lesId);
    sheet('Reserveringen').appendRow([now, id, s(lesId, 40), status]);
  });

  var hwIds = d.lessen.filter(function (x) { return lessons[x].soort === 'Huiswerkhulp'; });
  if (hwIds.length && d.huiswerk) {
    sheet('Huiswerkvragen').appendRow([now, id, hwIds.join(', '), s(d.huiswerk.vak, 20), s(d.huiswerk.onderwerp, 120),
      s(d.huiswerk.vraag, 1500), s(d.huiswerk.geprobeerd, 1500)]);
  }

  if (NOTIFY_EMAIL) notifyTeam(d, id, requested, waiting, lessons, mail);
  return { ok: true, aangevraagd: requested, wachtlijst: waiting };
}

function notifyTeam(d, id, requested, waiting, lessons, mail) {
  function names(ids) { return ids.map(function (x) { return '- ' + lessons[x].onderwerp + ' (' + lessons[x].datum + ', ' + lessons[x].tijd + ')'; }).join('\n') || '- geen'; }
  var body = [
    'Nieuwe aanmelding (' + id + '). Beoordeel hem in het spreadsheet via het menu BètaVonk.', '',
    'Leerling: ' + d.voornaam + ' ' + d.achternaam + ', ' + d.leeftijd + ' jaar, ' + d.klas,
    'School: ' + d.school, 'Schoolmail: ' + mail + (d.zonderCode === true ? ' (NIET bevestigd: geen code ontvangen, controleer dit zelf)' : ' (bevestigd met code)'),
    'Vakken: ' + d.vakken, 'Lastige onderwerpen: ' + (d.onderwerpen || '-'), 'Bijles buiten school: ' + d.bijles, '',
    'Ouder/verzorger: ' + d.ouderNaam + ', ' + d.ouderEmail + (d.ouderTelefoon ? ', ' + d.ouderTelefoon : ''),
    'Toestemming vragenlijsten: ' + (d.toestemmingOnderzoek === true ? 'ja' : 'nee'), '',
    'Aangevraagd:', names(requested), 'Wachtlijst:', names(waiting)
  ];
  if (d.huiswerk) body.push('', 'Huiswerkvraag (' + d.huiswerk.vak + ', ' + (d.huiswerk.onderwerp || '-') + '):', d.huiswerk.vraag, 'Al geprobeerd: ' + d.huiswerk.geprobeerd);
  MailApp.sendEmail({ to: NOTIFY_EMAIL, name: 'BètaVonk website', subject: 'Nieuwe aanmelding: ' + d.voornaam + ' ' + d.achternaam + ' (' + d.klas + ')', body: body.join('\n') });
}

function validate(d) {
  if (KLASSEN.indexOf(d.klas) === -1) return 'BètaVonk is alleen voor klas 1 en 2.';
  var age = Number(d.leeftijd);
  if (!(age >= 10 && age <= 15)) return 'Controleer de leeftijd.';
  if (!d.voornaam || !d.achternaam || !d.school || !d.ouderNaam || !d.vakken || !d.bijles) return 'Niet alle verplichte velden zijn ingevuld.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.ouderEmail || '')) return 'Controleer het e-mailadres van de ouder of verzorger.';
  var mailProblem = schoolmailProblem(d.schoolmail);
  if (mailProblem) return mailProblem;
  if (d.zonderCode !== true && !codeMatches(d.schoolmail, d.code)) return 'De code klopt niet of is verlopen. Vraag een nieuwe code aan.';
  for (var c = 0; c < CONSENT_REQUIRED.length; c++) {
    if (d[CONSENT_REQUIRED[c]] !== true) return 'Toestemming van een ouder of verzorger en akkoord met de voorwaarden zijn verplicht.';
  }
  if (!Array.isArray(d.lessen) || !d.lessen.length || d.lessen.length > 20) return 'Kies minstens één uitlegles.';
  var lessons = lessonsById();
  var hasLesson = false, hasHomework = false;
  for (var i = 0; i < d.lessen.length; i++) {
    var les = lessons[d.lessen[i]];
    if (!les) return 'Een gekozen les bestaat niet meer. Vernieuw de pagina.';
    if (les.klas.indexOf(d.klas.slice(-1)) === -1) return 'Een gekozen les is niet voor deze klas.';
    if (les.soort === 'Huiswerkhulp') hasHomework = true; else hasLesson = true;
  }
  if (!hasLesson) return 'Huiswerkhulp is voor leerlingen die ook een uitlegles volgen. Kies minstens één uitlegles.';
  if (hasHomework && (!d.huiswerk || !d.huiswerk.vak || !d.huiswerk.vraag || !d.huiswerk.geprobeerd)) return 'Vul je huiswerkvraag in.';
  return '';
}

// ---------- overige formulieren ----------
function saveSchool(d) {
  if (!d.school || !d.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) return { ok: false, fout: 'Niet alle verplichte velden zijn ingevuld.' };
  sheet('Scholen').appendRow([new Date(), s(d.school, 120), s(d.city, 80), s(d.name, 100), s(d.role, 100), s(d.email, 120), s(d.message, 1500)]);
  return { ok: true };
}

function saveFeedback(d) {
  sheet('Feedback').appendRow([new Date(), s(d.helpful, 20), s(d.understand, 20), s(d.pace, 20), s(d.unclear, 1000)]);
  return { ok: true };
}

// ---------- lessen ----------
function normSoort(v) {
  var t = String(v || '').trim().toLowerCase();
  return t.indexOf('huiswerk') === 0 ? 'Huiswerkhulp' : 'Uitlegles'; // "Uitleles" uit oudere rijen telt ook als uitlegles
}

function lessonsById() {
  var out = {};
  rows('Lessen').forEach(function (r) {
    if (!r.id || String(r.zichtbaar).trim().toLowerCase() === 'nee') return;
    out[String(r.id)] = {
      id: String(r.id), vak: String(r.vak).trim(), soort: normSoort(r.soort), onderwerp: String(r.onderwerp), klas: String(r.klas),
      datum: isDate(r.datum) ? Utilities.formatDate(r.datum, 'Europe/Amsterdam', 'yyyy-MM-dd') : String(r.datum),
      tijd: isDate(r.tijd) ? Utilities.formatDate(r.tijd, 'Europe/Amsterdam', 'HH.mm') : String(r.tijd),
      max: Math.min(10, Number(r.max) || 10)
    };
  });
  return out;
}

/** Aangevraagde en geplaatste reserveringen houden een plek bezet. Afgewezen of geannuleerd geeft de plek vrij. */
function heldCounts() {
  var c = {};
  rows('Reserveringen').forEach(function (r) {
    if (HOLDS_PLACE.indexOf(String(r.status).trim()) !== -1) c[r.lesId] = (c[r.lesId] || 0) + 1;
  });
  return c;
}

function publicLessons() {
  var lessons = lessonsById(), counts = heldCounts();
  return Object.keys(lessons).map(function (id) {
    var l = lessons[id];
    l.bezet = Math.min(l.max, counts[id] || 0);
    return l;
  }).sort(function (a, b) { return (a.datum + a.tijd).localeCompare(b.datum + b.tijd); });
}

// ---------- inhoud: oefenmateriaal en Ontdek bèta ----------
function visible(r) { return String(r.zichtbaar).trim().toLowerCase() !== 'nee'; }
function safeLink(v) { var t = String(v || '').trim(); return /^https?:\/\//i.test(t) ? t : ''; }

function publicMaterials() {
  if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Oefenmateriaal')) return [];
  return rows('Oefenmateriaal').filter(function (r) { return r.module && r.titel && visible(r); }).map(function (r) {
    return { module: String(r.module), vak: String(r.vak), klas: String(r.klas), type: String(r.type), titel: String(r.titel),
      link: safeLink(r.link), volgorde: Number(r.volgorde) || 999 };
  }).sort(function (a, b) { return a.volgorde - b.volgorde; });
}

function publicArticles() {
  if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Ontdek')) return [];
  return rows('Ontdek').filter(function (r) { return r.id && r.titel && visible(r); }).map(function (r) {
    return { id: String(r.id).toLowerCase().replace(/[^a-z0-9._~-]+/g, '-'), titel: String(r.titel), categorie: String(r.categorie),
      samenvatting: String(r.samenvatting), tekst: articleText(r.tekst), bron: safeLink(r.bron), volgorde: Number(r.volgorde) || 999 };
  }).sort(function (a, b) { return a.volgorde - b.volgorde; });
}

/** Is de tekst een link naar een Google Doc, dan lezen we het document. Koppen worden "## ". Resultaat 5 minuten in de cache. */
function articleText(v) {
  var t = String(v || '').trim();
  var m = t.match(/^https:\/\/docs\.google\.com\/document\/d\/([\w-]+)/);
  if (!m) return t;
  var cache = CacheService.getScriptCache(), key = 'doc:' + m[1], hit = cache.get(key);
  if (hit) return hit;
  var out = [];
  DocumentApp.openById(m[1]).getBody().getParagraphs().forEach(function (p) {
    var text = p.getText().trim();
    if (!text) return;
    out.push(p.getHeading() !== DocumentApp.ParagraphHeading.NORMAL ? '## ' + text : text);
  });
  var result = out.join('\n\n');
  if (result.length < 90000) cache.put(key, result, 300);
  return result;
}

// ---------- hulpfuncties ----------
function isDate(v) { return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime()); }

function sheet(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('Tabblad "' + name + '" ontbreekt. Voer setup() uit.');
  return sh;
}

/** Zorgt dat alle kolommen bestaan; ontbrekende kolommen komen achteraan. Bestaande kolommen blijven staan. */
function ensureHeaders(sh, wanted) {
  var lastCol = sh.getLastColumn();
  var head = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
  if (head.length === 1 && head[0] === '') head = [];
  wanted.forEach(function (h) {
    if (head.indexOf(h) === -1) { head.push(h); sh.getRange(1, head.length).setValue(h); }
  });
  return head;
}

/** Schrijft een rij op basis van kolomnamen, zodat oudere spreadsheets met andere kolommen blijven werken. */
function appendByHeader(name, obj) {
  var sh = sheet(name);
  var head = ensureHeaders(sh, Object.keys(obj));
  sh.appendRow(head.map(function (h) { return obj.hasOwnProperty(h) ? obj[h] : ''; }));
}

function rows(name) {
  var values = sheet(name).getDataRange().getValues();
  var head = (values.shift() || []).map(function (h) { return String(h).trim(); });
  return values.map(function (v) {
    var o = {};
    head.forEach(function (h, i) { o[h] = v[i]; });
    return o;
  });
}

/** Tekst inkorten en voorkomen dat ingevulde tekst als spreadsheetformule wordt uitgevoerd. */
function s(v, max) {
  var t = String(v == null ? '' : v).trim().slice(0, max);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

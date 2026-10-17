# BetaBoost website: installatie

De website bestaat uit `index.html`, `styles.css`, `app.js` en `logo.svg`. Die kun je op elke statische host zetten (bijvoorbeeld GitHub Pages, Netlify of Cloudflare Pages). Aanmeldingen, oefenmateriaal en Ontdek bèta-artikelen lopen via een klein Google Apps Script dat aan een Google-spreadsheet hangt dat alleen jullie kunnen openen.

Zolang `ENDPOINT` in `app.js` leeg is, draait de site in **voorbeeldmodus**: er wordt niets verstuurd, de lessen en het materiaal zijn voorbeelden en de schoolmail-code is altijd `123456`.

## 1. Spreadsheet en formulierservice opzetten

1. Log in met het Google-account van BetaBoost (bij voorkeur hulp.betaboost@gmail.com, want mails aan ouders en leerlingen worden vanaf dit account verstuurd). Zet tweestapsverificatie aan.
2. Maak een nieuw Google-spreadsheet, bijvoorbeeld "BetaBoost aanmeldingen". Deel het met niemand behalve de oprichters.
3. Kies **Extensies → Apps Script**. Verwijder de voorbeeldcode en plak de inhoud van `backend/Code.gs`. Klik **Opslaan**.
4. Kies bovenaan de functie `setup` en klik **Uitvoeren**. Geef toestemming als Google daarom vraagt (zie "Toestemmingen" hieronder). Het spreadsheet krijgt de tabbladen Lessen, Aanmeldingen, Reserveringen, Huiswerkvragen, Scholen, Feedback, Oefenmateriaal en Ontdek.
5. Klik **Implementeren → Nieuwe implementatie → Web-app**, met:
   - Uitvoeren als: **Ik**
   - Wie heeft toegang: **Iedereen**
   Klik **Implementeren** en kopieer de URL (eindigt op `/exec`).
6. Plak die URL in `app.js` bij `var ENDPOINT = "...";` en zet de site online.

"Iedereen" betekent alleen dat de website de service kan aanroepen. De service geeft de website alleen het rooster, het aantal bezette plekken, het oefenmateriaal en de artikelen terug, nooit persoonsgegevens.

### Bijwerken naar een nieuwe versie van Code.gs

1. Plak de nieuwe `Code.gs` over de oude heen en klik **Opslaan**.
2. Voer `setup` opnieuw uit. Bestaande gegevens blijven staan; ontbrekende tabbladen en kolommen worden toegevoegd. Oude kolommen die niet meer gebruikt worden (zoals `niveau` en `gehoord`) mogen blijven staan.
3. Geef toestemming als Google erom vraagt.
4. Kies **Implementeren → Implementaties beheren → potloodje (bewerken) → Versie: Nieuwe versie → Implementeren**. Doe je dit niet, dan blijft de oude versie draaien. De URL blijft hetzelfde.
5. Laad de website opnieuw met **Ctrl+F5**.

### Toestemmingen

Google vraagt toestemming voor:
- het spreadsheet bewerken (aanmeldingen opslaan);
- mail versturen als jou (code naar de schoolmail, melding naar hulp.betaboost@gmail.com, mail aan ouders bij accepteren of afwijzen);
- externe diensten aanroepen (controleren of het domein van de schoolmail echt mail ontvangt, via dns.google);
- Google Docs lezen (artikelen die als Google Doc zijn geschreven);
- een menu in het spreadsheet tonen.

Krijg je "Google heeft deze app niet geverifieerd", klik dan **Geavanceerd → Ga naar ... (onveilig)**. Dat is normaal voor je eigen script.

## 2. Lessen beheren

Het rooster staat in het tabblad **Lessen**. De website leest het direct uit.

| kolom | voorbeeld | uitleg |
|---|---|---|
| id | W4 | Uniek, kort, nooit hergebruiken |
| vak | Wiskunde | Wiskunde of Natuurkunde |
| soort | Uitlegles | Uitlegles of Huiswerkhulp |
| onderwerp | Procenten | Zichtbaar op de site |
| klas | Klas 1 | Klas 1, Klas 2 of Klas 1–2 |
| datum | 2026-12-03 | Altijd jjjj-mm-dd |
| tijd | 15.30–16.30 | Platte tekst |
| max | 10 | Maximaal 10 |
| zichtbaar | ja | Zet op `nee` om een les te verbergen |

## 3. Aanmeldingen beoordelen

1. Bij elke aanmelding krijgt **hulp.betaboost@gmail.com** een mail met alle gegevens van de leerling, de gekozen lessen en een eventuele huiswerkvraag.
2. In het tabblad **Aanmeldingen** staat de leerling met status `te beoordelen`. De gekozen lessen staan in **Reserveringen** als `aangevraagd` (de plek wordt vastgehouden) of `wachtlijst` (les vol).
3. Klik op de rij van de leerling en kies in het menu **BetaBoost → Geselecteerde aanmelding accepteren** of **afwijzen**. Het menu verschijnt als je het spreadsheet opnieuw opent.
   - Accepteren: status wordt `geaccepteerd`, `aangevraagd` wordt `geplaatst`, en de ouder krijgt een mail met de lessen.
   - Afwijzen: status wordt `afgewezen`, de reserveringen worden `afgewezen` (de plekken komen vrij), en de ouder krijgt een nette afwijzingsmail.
4. Wil iemand stoppen, zet de reservering dan op `geannuleerd`. Alleen `aangevraagd` en `geplaatst` tellen mee voor de bezette plekken. Zet daarna iemand van de wachtlijst op `geplaatst` en mail de ouder.

Controleer bij twijfel (zie de algemene voorwaarden): klopt de school bij de schoolmail, klopt klas en leeftijd, heeft de leerling al betaalde bijles. Je mag de school vragen te bevestigen dat de leerling daar zit.

### Schoolmail-controle

- De site en de service weigeren gratis adressen (Gmail, Hotmail, Outlook, Ziggo enzovoort) en domeinen die geen mail kunnen ontvangen.
- De leerling krijgt een code van 6 cijfers op de schoolmail, 15 minuten geldig, maximaal 3 codes per kwartier per adres.
- Sommige scholen houden mail van buiten de school tegen. Daarom kan een leerling na het aanvragen van een code ook kiezen voor **Aanmelden zonder code**. In het tabblad Aanmeldingen staat dan bij `schoolmailBevestigd` "nee, controleren", en de meldingsmail zegt dat de schoolmail niet bevestigd is. Controleer zo'n aanmelding zelf (bijvoorbeeld via de school of de mentor) voordat je accepteert.

### Mail-limiet

Een gewoon Gmail-account mag via Apps Script ongeveer **100 mails per dag** versturen (codes, meldingen en mails aan ouders samen). Bij veel aanmeldingen op één dag kan dat op raken; de aanmelding wordt dan wel opgeslagen, maar de mail niet verstuurd. Een Google Workspace-account heeft een hogere limiet.

## 4. Oefenmateriaal toevoegen

Tabblad **Oefenmateriaal**, één rij per bestand of link. Rijen met dezelfde `vak` en `module` komen samen op één kaart.

| kolom | voorbeeld | uitleg |
|---|---|---|
| module | Breuken en verhoudingen | Titel van de kaart |
| vak | Wiskunde | Wiskunde of Natuurkunde (voor het filter) |
| klas | Klas 1 | Wordt als label getoond |
| type | Oefeningen | Bijvoorbeeld Uitleg, Oefeningen, Antwoorden, Video |
| titel | Oefenblad 1 | Tekst van de link |
| link | https://drive.google.com/... | Link naar een bestand in Google Drive, een video, enzovoort |
| volgorde | 1 | Lager getal komt eerder |
| zichtbaar | ja | `nee` om te verbergen |

Een bestand uit Google Drive delen: rechtsklik → **Delen** → "Iedereen met de link" → **Link kopiëren**. Zet nooit persoonsgegevens in gedeelde bestanden. De voorbeeldrij die `setup` maakt staat op `nee`; je mag hem verwijderen.

## 5. Ontdek bèta-artikelen toevoegen

Tabblad **Ontdek**, één rij per artikel. Het artikel krijgt een eigen pagina op de site.

| kolom | voorbeeld | uitleg |
|---|---|---|
| id | bruggen-en-krachten | Kleine letters en streepjes, wordt het webadres (`#artikel-bruggen-en-krachten`) |
| titel | Waarom een brug niet instort | |
| categorie | Natuurkunde in het echt | Klein label boven de titel |
| samenvatting | Krachten in balans... | Eén zin, op de tegel en onder de titel |
| tekst | (tekst of link) | Zie hieronder |
| bron | https://... | Optioneel |
| volgorde | 1 | Lager getal komt eerder |
| zichtbaar | ja | `nee` om te verbergen (handig voor concepten) |

Voor `tekst` heb je twee mogelijkheden:
- **Direct in de cel.** Een lege regel (Ctrl+Enter twee keer) maakt een nieuwe alinea; een regel die begint met `## ` wordt een tussenkop.
- **Een Google Doc.** Schrijf het artikel in Google Docs en plak de link van het document in de cel. Koppen in het document worden tussenkoppen op de site. Wijzigingen in het document staan binnen 5 minuten op de site. Het document hoeft niet gedeeld te worden, zolang het van hetzelfde Google-account is als het script.

## 6. Privacy: wat jullie zelf nog moeten regelen

- Vul in de privacyverklaring de officiële naam en rechtsvorm in.
- Gebruik **hulp.betaboost@gmail.com** voor privacyvragen en aanmeldingen en **informatie.betaboost@gmail.com** voor contact met scholen en leerlingen (staat zo op de site).
- Gratis Gmail heeft geen verwerkersovereenkomst. Overweeg Google Workspace (bijvoorbeeld via Google for Nonprofits) zodra het project groeit. Sluit ook een verwerkersovereenkomst met Zoom.
- De meldingsmails bevatten persoonsgegevens en blijven in de Gmail-inbox staan. Verwijder ze samen met de rijen in het spreadsheet bij de jaarlijkse opschoning na de zomer.
- Laat de privacyverklaring, de algemene voorwaarden en de lesregels lezen door een partnerschool of iemand met verstand van de AVG voordat de aanmelding opengaat.

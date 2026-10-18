# BètaVonk op betavonk.nl zetten (GitHub Pages + TransIP)

Je doet dit één keer. Daarna zet Claude aanpassingen direct in GitHub en staat de nieuwe versie binnen een paar minuten op betavonk.nl.

## 1. GitHub-account en repository

1. Maak een gratis account op https://github.com (bij voorkeur met hulp.betaboost@gmail.com).
2. Klik rechtsboven op **+ → New repository**.
   - Repository name: `betaboost-website`
   - Zet hem op **Public**. GitHub Pages is alleen gratis voor openbare repositories. Er staan geen wachtwoorden of persoonsgegevens in de code; de aanmeldingen blijven in je privé-spreadsheet.
   - Vink niets anders aan en klik **Create repository**.

## 2. Claude toegang geven

1. Ga naar https://claude.ai/connect-github en koppel je GitHub-account.
2. Installeer de Claude GitHub-app op de repository `betaboost-website` via https://github.com/apps/claude/installations/select_target (kies **Only select repositories** en selecteer `betaboost-website`).
3. Laat Claude in deze thread weten dat het klaar is, met je GitHub-gebruikersnaam. Claude zet dan alle bestanden in de repository.

## 3. GitHub Pages aanzetten (nadat Claude de bestanden heeft geplaatst)

1. Open de repository op GitHub en ga naar **Settings → Pages**.
2. Bij **Source** kies je **Deploy from a branch**, branch **main**, map **/ (root)**, en klik **Save**.
3. Bij **Custom domain** vul je `betavonk.nl` in (zo staat het ook in het bestand `CNAME`) en klik **Save**. Stond hier nog `betaboost.online`, vervang dat dan.

## 4. DNS instellen bij TransIP

1. Log in op TransIP en ga naar **Domeinen → betavonk.nl → DNS**.
2. Staat **TransIP-instellingen** aan, zet die dan uit, zodat je de records zelf kunt aanpassen.
3. Verwijder alleen records met naam `@` of `www` én type **A**, **AAAA** of **CNAME**. Records van type **MX** en **TXT** zijn voor e-mail: die laat je precies zoals ze zijn, niets aan veranderen.
4. Voeg deze records toe:

| Naam | Type | Waarde |
|---|---|---|
| @ | A | 185.199.108.153 |
| @ | A | 185.199.109.153 |
| @ | A | 185.199.110.153 |
| @ | A | 185.199.111.153 |
| @ | AAAA | 2606:50c0:8000::153 |
| @ | AAAA | 2606:50c0:8001::153 |
| @ | AAAA | 2606:50c0:8002::153 |
| @ | AAAA | 2606:50c0:8003::153 |
| www | CNAME | betaboostonline.github.io. |

   Let op de punt aan het eind van `betaboostonline.github.io.`.
5. Klik **Opslaan**. Het kan een paar minuten tot een paar uur duren voordat dit overal werkt.

## 5. HTTPS aanzetten

1. Ga terug naar **Settings → Pages** op GitHub. Zodra de domeincontrole groen is, vink je **Enforce HTTPS** aan.
2. Open https://betavonk.nl. Klaar.

## 6. Het oude domein betaboost.online

GitHub Pages kan maar één eigen domein hebben. Laat betaboost.online doorsturen naar de nieuwe site:

1. Ga in TransIP naar **Domeinen → betaboost.online**.
2. Zet bij **Doorsturen** (of "Webforwarding") een doorverwijzing naar `https://betavonk.nl`. Haal daarvoor eerst de GitHub-records (A, AAAA en www) bij betaboost.online weg, anders werkt de doorverwijzing niet.
3. Verleng betaboost.online niet als het verloopt.

## Daarna

- **Website aanpassen**: vraag het in de thread. Claude zet de wijziging in GitHub; na 1 à 2 minuten staat hij online (Ctrl+F5).
- **Lessen, oefenmateriaal en artikelen**: blijven in het spreadsheet. Daarvoor hoeft er niets in GitHub te veranderen.
- **Nog niet openbaar maken?** De site is te vinden zodra de DNS werkt. Deel de link pas als de privacyverklaring en voorwaarden zijn nagelezen, en haal de testlessen weg (of zet ze op `zichtbaar: nee`) zodat niemand zich daarvoor aanmeldt.

# Produktkonzept RetteMeineStadt

Stand: 22. November 2026. Zur gemeinsamen Schärfung mit Marcel Braun.

So sind die Aussagen zu lesen:

- **Festgelegt** gilt, bis wir es gemeinsam ändern.
- **Vorschlag** ist eine Ergänzung. Sie ist keine Entscheidung und steht nur in Kapitel 16.
- **Offen** ist bewusst nicht ausgestaltet. Die Liste steht in Kapitel 17.

Kapitel 1 bis 15 enthalten nur Festlegungen. Kapitel 15 ist der festgelegte Technikvorschlag, ohne Vergleich mit anderen Stapeln. Jedes Kapitel ist in sich abgeschlossen, damit es sich einzeln kommentieren lässt.

---

## 1. Gegenstand

Festgelegt.

RetteMeineStadt ist ein regionaler Marktplatz für kleine Läden in Dörfern. Käufer entdecken diese Läden und kaufen dort ein. Der erste Stand bedient eine Pilotregion und führt einen echten Kauf von der Entdeckung bis zur Zahlung durch.

Die Plattform betreibt den Marktplatz. Sie führt den Warenkorb, kassiert den Kauf und zahlt an die Läden aus.

---

## 2. Rollen

Festgelegt.

Vier Rollen:

- **Käufer.** Sucht Läden, füllt den Warenkorb, zahlt.
- **Mandant.** Ein Laden auf der Plattform, mit eigenem Sortiment, eigenen Versandwegen und eigenem Geschäftskonto.
- **Inhaber.** Pflegt Sortiment und Versandwege seines Mandanten.
- **Admin.** Legt Mandanten an, gibt Läden frei, pflegt Provision, Auszahlungsrhythmus, Lieferzonen und Versandpreise, liest die Statistik.

Der Admin legt jeden Mandanten an. Es gibt keine Selbstregistrierung von Läden.

---

## 3. Pilot und Kaufweg

Festgelegt.

Der erste Stand ist eine Pilotregion. Der Kauf ist echt: von der Entdeckung auf der Karte bis zur Zahlung an die Plattform. Branchen und ihre Filter sind erweiterbar. Der Kern wird dafür nicht umgebaut. Das Modell dafür steht in Kapitel 13.

Kaufweg:

1. Der Käufer sieht die Läden der Pilotregion auf der Karte und grenzt sie über einen Umkreis ein.
2. Er filtert nach Entfernung und Lieferzone. Branchenfilter erscheinen nur dort, wo die Branche sie mitbringt.
3. Er legt Waren aus einem oder mehreren Läden in einen Warenkorb.
4. Der Warenkorb nennt den günstigsten Versandweg, den alle beteiligten Läden können, und eine Versandgebühr. Bei Abholung entfällt die Gebühr.
5. Der Käufer gibt seine E-Mail an und zahlt an die Plattform. Ein Konto ist dafür nicht nötig.
6. Die Plattform teilt Zahlung und Erfüllung je Laden auf. Jeder Laden liefert oder gibt seinen Teil aus.
7. Die Plattform zahlt den Warenwert abzüglich Provision auf das Geschäftskonto des Mandanten aus.

Sichtbar sind nur Läden, die der Admin freigegeben hat.

Im Pilot enthalten und damit abgeschlossen: eine Region, die Branchen aus Kapitel 4, eine Variantenachse, die vier Erfüllungsarten, Gastkauf, die Admin-Statistik aus Kapitel 12. Bewertungen gibt es im Pilot nicht.

---

## 4. Branchen im Pilot

Festgelegt.

Diese Branchen sind im Pilot enthalten:

- Lebensmittel und Hofladen
- Bäckerei
- Metzgerei
- Getränke
- Blumen und Pflanzen
- Handwerk und Geschenke
- Drogerie und Haushalt
- Fertiggerichte und Imbiss

Weitere Branchen kommen über das Branchenmodell dazu. Kategorien, Pflichtfelder und Suchfilter bringt die jeweilige Branche mit. Allergene und Kühlung sind Beispiele für solche Filter. Welche Pilotbranche welchen Filter bekommt, steht in Kapitel 17.

---

## 5. Entdeckung und Suche

Festgelegt.

Die Entdeckung läuft über die Karte und einen Umkreis. Der Käufer setzt einen Mittelpunkt. Angezeigt werden die Läden in diesem Umkreis. Die Entfernung des Umkreises ist in Kilometern.

Die Suche filtert nach Entfernung und nach Lieferzone. Die Entfernung ist in Kilometern.

Branchenfilter erscheinen nur bei einer Branche, die solche Filter definiert. Beispiele sind Allergene und Kühlung.

---

## 6. Warenkorb

Festgelegt.

Es gibt einen Warenkorb über mehrere Läden. Der Käufer zahlt einmal. Die Plattform splittet diese Zahlung je Laden auf den Warenwert des jeweiligen Ladens.

Die Erfüllung wird je Laden gesplittet. Jeder Laden erfüllt seinen Teil über den Weg der Bestellung. Der Käufer sieht eine Bestellung mit einer Versandregel für den ganzen Warenkorb.

Vor der Zahlung sieht der Käufer die Positionen je Laden, die Versandgebühr oder den Hinweis auf Abholung und den Gesamtbetrag.

Der Gesamtbetrag ist die Summe der Warenwerte aller Läden plus die Versandgebühr. Bei Abholung ist die Versandgebühr null.

---

## 7. Erfüllung und Versandgebühr

Festgelegt.

Vier Erfüllungsarten. Drei davon haben einen bepreisten Versandweg. Abholung hat keinen.

| Erfüllungsart | Versandweg im Admin | Gebühr für den Käufer |
| --- | --- | --- |
| Abholung im Laden | keiner | keine |
| Eigene Lieferung des Ladens im Umkreis | Eigenes Fahrzeug | fest je Lieferzone |
| Versand über einen Dienstleister | DHL | fest je Lieferzone |
| Gemeinsamer regionaler Lieferservice der Plattform | Kleiner Lieferservice | fest je Lieferzone |

Die vier Erfüllungsarten und die drei Versandwege sind dasselbe Modell. Die Tabelle ist die Zuordnung.

Es gibt eine Versandgebühr pro Bestellung, auch wenn mehrere Läden im Warenkorb liegen. Der Preis ist fest je Lieferzone und Versandweg. Der Admin pflegt diese Preise.

Jeder Laden gibt frei, welche der drei Wege er in einer Zone bedient. Die Reichweite der eigenen Lieferung ist die Menge der Zonen, in denen der Laden „Eigenes Fahrzeug“ freigibt. Entsprechend gibt er DHL und den kleinen Lieferservice nur in den Zonen frei, die er darüber bedient.

Im Warenkorb gilt ein Weg für die ganze Bestellung: der günstigste Weg, den alle beteiligten Läden in der Zone des Käufers freigegeben haben. Die Gebühr ist der vom Admin gepflegte Preis dieser Zone für diesen Weg. Sie wird nicht je Laden addiert.

Abholung trägt diese Gebühr nicht. Liegen mehrere Läden im Warenkorb und der Käufer holt ab, holt er je Laden am Abholort dieses Ladens ab.

---

## 8. Zahlung, Provision, Auszahlung

Festgelegt.

Die Plattform kassiert den Gesamtbetrag aus Kapitel 6.

Die Provision bezieht sich auf den Warenwert. Die Versandgebühr bleibt außen vor.

Der Provisionssatz eines Mandanten ist die Summe aus zwei Sätzen:

- dem globalen Prozentsatz
- dem individuellen Satz dieses Mandanten

Der Admin pflegt beide. Der individuelle Satz steht am neuen Mandanten auf 0. Dann gilt der globale Prozentsatz allein.

Rechnung je Mandant und je Bestellung:

- Provision = Warenwert dieses Mandanten × (globaler Satz + individueller Satz)
- Auszahlung = Warenwert dieses Mandanten − Provision

Rechenbeispiel, keine festgelegte Höhe: Globaler Satz 10 Prozent, individueller Satz 0, Warenwert 40 Euro. Provision 4 Euro, Auszahlung 36 Euro. Globaler Satz 10 Prozent, individueller Satz 2 Prozentpunkte, Warenwert 40 Euro. Provision 4,80 Euro, Auszahlung 35,20 Euro.

Die Auszahlung geht auf das Geschäftskonto des Mandanten. Der Standardrhythmus ist wöchentlich. Der Admin kann den Rhythmus dieses Mandanten auf monatlich stellen. Der Inhaber stellt den Rhythmus nicht um.

---

## 9. Gastkauf und Konto

Festgelegt.

Der Kauf braucht eine E-Mail und kein Konto. Das ist der Gastkauf.

Ein Konto ist freiwillig. Es dient dem Bestellverlauf. Der Kaufweg kommt ohne Konto aus.

---

## 10. Sortiment

Festgelegt.

Der Inhaber pflegt das Sortiment auf zwei Wegen: im Formular und per CSV. Beide Wege schreiben dieselben Produktdaten.

Die Spalten kommen von der Branche des Ladens. Formular und CSV einer Bäckerei fragen andere Pflichtfelder ab als Formular und CSV von Handwerk und Geschenke. Die Pflichtfelder liefert die Branche, siehe Kapitel 13.

Ein Produkt kann Varianten entlang genau einer Achse führen, zum Beispiel Größe oder Gewicht. Jede Variante hat einen eigenen Preis und einen eigenen Bestand. Mehrere Achsen gleichzeitig sind nicht Teil des Pilots.

---

## 11. Freigabe und Vertrauen

Festgelegt.

Der Admin gibt den Laden frei. Erst danach ist er für Käufer sichtbar.

Sichtbar sind drei Angaben:

- Öffnungszeiten
- Abholort
- eine kurze Ladengeschichte

Bewertungen sind im Pilot nicht enthalten. Es gibt keine Sterne, keine Kommentare von Käufern und keine öffentliche Bewertung durch die Plattform.

---

## 12. Statistik

Festgelegt.

Der Admin sieht im Pilot drei Werte: Warenumsatz, Provision und Auszahlung. Jeder Wert je Mandant und als Summe über alle Mandanten.

Der Warenumsatz ist die Summe der Warenwerte. Die Provision ist die Summe der einbehaltenen Provision. Die Auszahlung ist die Summe der Beträge, die an die Geschäftskonten gehen. Die Versandgebühr ist in keinem der drei Werte enthalten.

Weitere Kennzahlen sind im Pilot nicht enthalten.

---

## 13. Branchenmodell

Festgelegt.

Das Branchenmodell ist erweiterbar. Neue Branchen kommen dazu, ohne dass der Kern umgebaut wird.

Der Kern kennt Mandant, Produkt, Variante, Warenkorb, Bestellung, Zahlung, Provision, Auszahlung, Lieferzone und Versandweg. Pflichtfelder, Kategorien und Suchfilter liegen bei der Branche.

Jede Branche ist eine eigene Einheit und bringt drei Dinge mit:

- ihre Kategorien
- ihre Pflichtfelder für Formular und CSV
- ihre Suchfilter

Die Anbindung läuft über Interfaces und Abstraktion. Der Kern ruft die Branche auf. Die Branche liefert Kategorien, Felder und Filter. Entdeckung, Warenkorb, Zahlung und Auszahlung bleiben davon unberührt.

Eine neue Branche bedeutet: eine weitere Einheit, die diese drei Dinge liefert. Kein Eingriff in den Kaufweg, die Splittung oder die Auszahlung.

---

## 14. Usability

Festgelegt.

Für Käufer ist der Stand der heutige übliche Kaufablauf. Konkret heißt das:

- Karte, Umkreis und Filter sind ohne Anleitung bedienbar.
- Vor der Zahlung zeigt der Warenkorb die Läden, die Versandgebühr und die Abholung.
- Der Gastkauf endet bei E-Mail und Zahlung. Der Kaufweg kommt ohne Konto aus.
- Preise und Gebühr stehen fest, bevor der Käufer zahlt.

Für den Inhaber ist die Pflege so einfach wie möglich. Er tut zwei Dinge: das Sortiment per Formular oder CSV pflegen und die Versandwege je Zone freigeben. Die Preise der Versandwege setzt der Admin.

---

## 15. Technik

Festgelegt. Das ist der technische Vorschlag für die Umsetzung. Ein Vergleich mit anderen Stapeln gehört nicht hierher.

Vier Bausteine:

- **TypeScript.** Eine typisierte Sprache für die Käuferflächen, das Formular des Inhabers, den Admin und die Interfaces der Branchen. Die Pflichtfelder einer Branche bleiben an der Branche prüfbar.
- **Next.js.** Eine Anwendung für Entdeckung, Kasse, Inhaberpflege und Admin. Der Kaufweg von der Karte bis zur Zahlung bleibt in einem System.
- **Postgres.** Mandanten, Sortiment, Bestände, Bestellungen, Lieferzonen, Versandpreise und Auszahlungsbeträge liegen transaktional in Postgres. Die branchenspezifischen Felder validiert die jeweilige Branche.
- **Stripe Connect.** Die Plattform kassiert. Je Mandant hängt ein verbundenes Konto am Geschäftskonto. Connect zahlt je Laden den Warenwert abzüglich Provision aus. Der eine Warenkorb mit mehreren Läden ist der Grund für Connect: eine Zahlung des Käufers, Aufteilung auf mehrere Mandanten.

---

## 16. Vorschläge

Keine Entscheidung. Jeder Punkt lässt sich einzeln streichen oder übernehmen.

### 16.1 Produkt ohne Variante

Betrifft Kapitel 10.

Ein Produkt ohne Variantenachse trägt Preis und Bestand am Produkt selbst. Sobald es Varianten nutzt, liegen Preis und Bestand nur noch an den Varianten.

### 16.2 Sprache und Währung im Pilot

Betrifft Kapitel 3.

Die Oberfläche ist Deutsch. Die Währung ist Euro.

### 16.3 Gastbestellung und späteres Konto

Betrifft Kapitel 9.

Legt der Käufer später ein Konto mit derselben E-Mail an, erscheinen die Gastbestellungen in seinem Bestellverlauf.

### 16.4 Wer die drei Vertrauensangaben pflegt

Betrifft Kapitel 11.

Der Inhaber pflegt Öffnungszeiten, Abholort und Ladengeschichte. Der Admin sieht die drei Angaben, bevor er den Laden freigibt.

### 16.5 Bestand bei Zahlung

Betrifft Kapitel 10.

Eine erfolgreiche Zahlung verringert den Bestand der gekauften Variante um die gekaufte Menge. Schlägt die Zahlung fehl, bleibt der Bestand unverändert.

### 16.6 Festhalten von Gebühr und Satz

Betrifft Kapitel 7 und 8.

Versandgebühr und Provisionssatz werden zum Zeitpunkt der Zahlung an der Bestellung gespeichert. Eine spätere Änderung im Admin gilt für diese Bestellung nicht.

### 16.7 CSV mit fehlerhaften Zeilen

Betrifft Kapitel 10.

Der Import prüft jede Zeile gegen die Spalten der Branche. Fehlerhafte Zeilen werden mit Grund gemeldet und nicht übernommen. Gültige Zeilen derselben Datei können übernommen werden.

### 16.8 Eine Bestellnummer, je Laden ein Teil

Betrifft Kapitel 6.

Der Käufer erhält eine Bestellnummer. Darunter hängt je beteiligtem Laden ein eigener Teil mit den Waren dieses Ladens. Die Versandregel der Bestellung gilt für alle Teile.

### 16.9 Filter Lieferzone und Abholung

Betrifft Kapitel 5.

Der Filter Lieferzone zeigt Läden, die in dieser Zone mindestens einen bepreisten Versandweg freigegeben haben. Läden, die nur Abholung anbieten, bleiben über Karte und Entfernung sichtbar, auch wenn sie die gewählte Zone nicht beliefern.

### 16.10 Entfernung und Umkreis als ein Regler

Betrifft Kapitel 5.

Entfernung und Umkreis sind derselbe Regler: ein Mittelpunkt und eine Entfernung in Kilometern, auf der Karte und in der Suche.

---

## 17. Offen für die nächste Runde

Nicht ausgestaltet. Die ersten beiden Punkte bleiben auf Wunsch offen. Die übrigen sind Lücken in den Festlegungen.

1. Benachrichtigungen an Käufer und Läden. Ob sie laufen und worüber, ist offen.
2. Steuern, Rechnungen und die Kleinunternehmerregelung.
3. Welche Region der Pilot ist.
4. Die Höhe des globalen Provisionssatzes, die konkreten individuellen Sätze und ob ein individueller Satz negativ sein darf.
5. Der Stichtag der wöchentlichen und der monatlichen Auszahlung, und ob ein Betrag ausgezahlt wird, sobald die Zahlung da ist, oder erst nach der Erfüllung.
6. Wohin die Versandgebühr fließt, und wer die Durchführung des Wegs bezahlt. Sie ist nicht Teil der Auszahlung an den Mandanten und nicht provisionspflichtig. Der Empfänger der Gebühr ist damit noch nicht benannt.
7. Der Zuschnitt einer Lieferzone und die konkreten Preise der Pilotregion.
8. Was gilt, wenn die Läden im Warenkorb keinen gemeinsamen bepreisten Weg haben, und ob Abholung und ein bepreister Weg in demselben Warenkorb mischbar sind.
9. Storno, Teilausfall eines Ladens und Retoure.
10. Welche Suchfilter die einzelnen Pilotbranchen konkret mitbringen. Allergene und Kühlung bleiben Beispiele.
11. Welche Zahlarten im Pilot an sind.
12. Rechtstexte der Plattform: Impressum, Datenschutz, AGB.

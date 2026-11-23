# RetteDeineStadt

Regionaler Marktplatz für kleine Läden. Ein Warenkorb über mehrere Läden, die Plattform kassiert, die Auszahlung geht aufs Geschäftskonto.

Die Festlegungen stehen in [docs/produktkonzept.md](docs/produktkonzept.md).

## Start

```bash
docker compose up --build
```

App und Postgres starten zusammen. Danach liegt die Anwendung auf [http://localhost:3000](http://localhost:3000). Der erste Start legt Beispieldaten an. `docker compose down -v` setzt die Daten zurück.

## Was der Pilot kann

- Auf der Startseite ein Kundenkonto anlegen oder einen Laden anmelden. Der Laden wartet auf Freigabe.
- Läden auf der Karte entdecken, nach Laden- oder Produktname suchen und nach Entfernung und Lieferzone filtern. Filter einer Branche erscheinen nur, wenn die Branche sie mitbringt.
- Waren mehrerer Läden in einen Warenkorb legen. Angezeigt wird der günstigste Versandweg, den alle Läden der Bestellung in der Zone können. Abholung ist kostenlos.
- Als Gast mit E-Mail bestellen. Ein Konto ist freiwillig und zeigt den Bestellverlauf.
- Dieselbe HTTP-API bedient die Oberfläche und kann von Android und iOS genutzt werden. Die Beschreibung liegt in [docs/openapi.yaml](docs/openapi.yaml) und unter `/api/openapi`.
- Als Verwaltung Mandanten anlegen, Läden freigeben, Provision und Auszahlungsrhythmus pflegen, Lieferzonen und Versandpreise setzen und Warenumsatz, Provision und Auszahlung lesen.
- Als Inhaber Produkte im Formular und per CSV pflegen und Versandwege je Zone freigeben.

Stripe Connect ist als Schnittstelle vorbereitet. Es fließt kein echtes Geld, und es werden keine Schlüssel erwartet.

## Beispielzugänge

| Rolle | E-Mail | Passwort |
| --- | --- | --- |
| Verwaltung | admin@pilot.local | pilot-admin |
| Inhaber | hofladen@pilot.local | pilot-inhaber |
| Käufer | kaeufer@pilot.local | pilot-kaeufer |

Dasselbe Inhaberpasswort gilt für baeckerei@, metzgerei@, getraenke@, blumen@, werkstatt@, seife@ und imbiss@pilot.local. Region, Sätze und Preise im Seed sind Beispiele.

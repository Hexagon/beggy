# 🛒 Beggy

En svensk begagnatmarknad som den borde vara - enkel, gratis och med öppen källkod.

## Om projektet

Beggy är en modern begagnatmarknad byggd med Deno 2.5 och Oak-ramverket. Inspirerad av hur Blocket fungerade förr i tiden - enkelt och användarvänligt.

## Funktioner

- ✅ Skapa och hantera annonser gratis
- ✅ Ladda upp bilder (max 5 per annons)
- ✅ Sök och filtrera på kategori och ort
- ✅ Användarkonton med säker autentisering
- ✅ GDPR-kompatibel (radera all din data när som helst)
- ✅ Ingen reklam eller spårning

## Teknisk stack

- **Runtime:** [Deno](https://deno.land/) 2.5+
- **Ramverk:** [Oak](https://jsr.io/@oak/oak)
- **Databas:** SQLite
- **Deploy:** Deno Deploy

## Kom igång

### Krav

- Deno 2.5 eller senare

### Starta lokalt

```bash
# Klona projektet
git clone https://github.com/Hexagon/beggy.git
cd beggy

# Starta utvecklingsserver
deno task dev
```

Besök `http://localhost:8000`

### Kommandon

```bash
deno task dev    # Starta utvecklingsserver med auto-reload
deno task start  # Starta produktionsserver
deno task test   # Kör tester
deno task lint   # Linting
deno task fmt    # Formatera kod
deno task check  # Typkontroll
```

## Deploy

### Deno Deploy

Projektet är konfigurerat för [Deno Deploy](https://deno.com/deploy):

1. Skapa ett nytt projekt på Deno Deploy
2. Koppla till detta GitHub-repo
3. Sätt entry point till `main.ts`
4. Konfigurera custom domain till `beggy.se`

## Struktur

```
beggy/
├── main.ts              # Entry point
├── deno.json            # Konfiguration och beroenden
├── src/
│   ├── routes/          # API och sidrouter
│   ├── db/              # Databashantering
│   ├── models/          # Typdefinitioner
│   ├── middleware/      # Oak middleware
│   └── utils/           # Hjälpfunktioner
├── static/              # CSS, JS och uppladdade bilder
└── templates/           # HTML-mallar
```

## GDPR och juridiskt

- Fullständig [integritetspolicy](/integritetspolicy) i enlighet med GDPR
- Svenska [användarvillkor](/villkor)
- Användare kan radera all sin data när som helst
- Inga tredjepartscookies eller spårning

## Bidra

Bidrag välkomnas! Skapa en pull request eller rapportera buggar via [Issues](https://github.com/Hexagon/beggy/issues).

## Licens

MIT License - se [LICENSE](LICENSE)

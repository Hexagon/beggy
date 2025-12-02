# 🛒 Beggy

En svensk begagnatmarknad som den borde vara - enkel, gratis och med öppen källkod.

## Om projektet

Beggy är en modern begagnatmarknad byggd med Deno 2.5 och Oak-ramverket. Inspirerad av hur Blocket
fungerade förr i tiden - enkelt och användarvänligt.

## Funktioner

- ✅ Skapa och hantera annonser gratis
- ✅ Ladda upp bilder (max 5 per annons)
- ✅ Sök och filtrera på kategori och ort
- ✅ Användarkonton med säker autentisering (Supabase Auth)
- ✅ GDPR-kompatibel (radera och exportera all din data)
- ✅ BBS-lagen: Rapportera olämpliga annonser
- ✅ Ingen reklam eller spårning
- ✅ Fungerar fullt ut utan inloggning (bara för att annonsera behövs konto)

## Dokumentation

- 📖 [Installationsguide](docs/INSTALL.md) - Kom igång med lokal utveckling
- 🤝 [Bidra till projektet](docs/CONTRIBUTING.md) - Riktlinjer för bidrag
- ⚖️ [Juridiska krav](docs/legal.md) - BBS-lagen, GDPR och cookies
- 🤖 [AI-agentinstruktioner](docs/agents.md) - För AI-assisterad utveckling

## Teknisk stack

- **Runtime:** [Deno](https://deno.land/) 2.5+
- **Ramverk:** [Oak](https://jsr.io/@oak/oak)
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
- **Deploy:** Deno Deploy

## Kom igång

### Krav

- Deno 2.5 eller senare
- Supabase-projekt (gratis på [supabase.com](https://supabase.com))

### Supabase Setup

1. Skapa ett nytt projekt på [supabase.com](https://supabase.com)
2. Kör SQL från `src/db/migrations/001_initial_schema.sql` i SQL Editor för att skapa tabeller
3. Kör eventuella efterföljande migrationer (002_xxx.sql, 003_xxx.sql, etc.) i ordning
4. Skapa en Storage bucket med namnet `ad-images` (public)
5. Kopiera URL och anon key från Project Settings > API

### Databasändringar

Databasschema finns i `src/db/migrations/`:

- **`001_initial_schema.sql`** - Det ursprungliga schemat (ändra INTE denna fil)
- Nya migrationer skapas med sekventiella nummer (002_xxx.sql, 003_xxx.sql, etc.)

**Viktigt:** Gör aldrig ändringar i `001_initial_schema.sql`. Skapa istället en ny migrationsfil för
alla databasändringar.

### Starta lokalt

```bash
# Klona projektet
git clone https://github.com/Hexagon/beggy.git
cd beggy

# Sätt miljövariabler
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

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
4. Lägg till miljövariabler:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. Konfigurera custom domain till `beggy.se`

## Struktur

```
beggy/
├── main.ts              # Entry point
├── deno.json            # Konfiguration och beroenden
├── docs/                # Dokumentation
│   ├── INSTALL.md       # Installationsguide
│   ├── CONTRIBUTING.md  # Bidragsriktlinjer
│   ├── legal.md         # Juridiska krav
│   └── agents.md        # AI-agentinstruktioner
├── src/
│   ├── routes/          # API och sidrouter
│   ├── db/              # Supabase-klient och schema
│   │   └── migrations/  # Databasmigrationer (SQL-filer)
│   ├── models/          # Typdefinitioner
│   ├── middleware/      # Oak middleware
│   └── utils/           # Hjälpfunktioner
├── static/              # CSS, JS
└── templates/           # HTML-mallar
```

## GDPR och juridiskt

- Fullständig [integritetspolicy](/integritetspolicy) i enlighet med GDPR
- Svenska [användarvillkor](/villkor)
- Användare kan exportera all sin data (GDPR artikel 20)
- Användare kan radera all sin data när som helst (GDPR artikel 17)
- Rapportera-funktion på alla annonser (BBS-lagen)
- Endast nödvändiga cookies för autentisering

Se [docs/legal.md](docs/legal.md) för fullständig juridisk dokumentation.

## Bidra

Bidrag välkomnas! Läs [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) för riktlinjer, eller skapa en
pull request direkt. Rapportera buggar via [Issues](https://github.com/Hexagon/beggy/issues).

## Licens

MIT License - se [LICENSE](LICENSE)

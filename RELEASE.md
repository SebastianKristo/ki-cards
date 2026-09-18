# ki-cards 4.11.0

## `ki-homelab-card` oppdatert

Erstattet med den nye fila du sendte. 318 linjer endret mot forrige utgave.

Det nye er en femte visning, **`vis: nedlasting`**, med `_nedlasting()`, `_hentHistorikk()`
og `_tegnGraf()` — qBittorrent med historikk hentet fra Home Assistant og tegnet som graf,
i tillegg til `scene`, `gjester`, `nettverk` og `lagring`.

```yaml
type: custom:ki-homelab-card
vis: nedlasting
```

### Kontrollert

Alle fem visningene tegner mot et sett med Proxmox-, Unraid-, qBittorrent- og
UniFi-entiteter uten å kaste, og nedlastingsvisningen kaller historikk-API-et som den
skal. Byggeskrittet leser `styles` på alle 100 kort.

README-raden nevner nå nedlastingsgrafen.

**Husk:** har du `ki-homelab-card.js` som egen Lovelace-ressurs, vinner den over
bundelens kopi, og da får du ikke denne oppdateringen. Fjern den under Innstillinger →
Dashbord → Ressurser.

# ki-cards 5.79.1

## Veggpanelet beholder dashbordets farger

5.79.0 ga veggpanelet både **formen** og **fargene** fra iPad-skissen, og fargene ble standard: ravgul
aksent i stedet for rosa, nesten svarte kort, egne grånyanser. Det skal ikke skje uten at du ber om det.

Temaet er nå delt i to:

- **Formen** — størrelser, avrundinger, avstander og oppsett fra skissen — gjelder som før (`tema: varm`).
- **Fargene** gjelder bare med `farger: varm`. Standard er `farger: dashbord`: panelet bruker dashbordets
  egne `--gray*` og `--active-big`, nøyaktig som før 5.79.0 — også i prosa-, familie- og mediekortet, som
  ikke lenger får fargene overstyrt.

Skillelinjene mellom varmesonene, rammen rundt kortene og tonene i scener, lysrader og brytere hører til
fargene og følger dermed dashbordet. Pæreikonet, hintet under lysene, «Aktiv: …» over scenene og pila i
Plex-hodet er form og står der uansett.

Vil du ha skissens palett likevel:

```yaml
type: custom:ki-veggpanel-card
farger: varm
```

### Kontrollert

Begge byggesjekkene kjørt. Panelet tegnes med `tema-varm farger-dashbord` uten oppsett; formdelen av
stilen har ingen fargeverdier (ingen hex, `oklch`, `rgba`, `--gray` eller `--active-big`), og fargereglene
gjelder bare sammen med `farger-varm`. Med `farger: varm` får rammen `farger-varm`. Bygget oppå 5.79.0 slik
den ligger på GitHub.

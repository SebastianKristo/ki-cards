## Rettet

**ki-fjernkontroll-card 1.4.0**
- Hold inne på hjem-knappen gjorde ingenting. Nå sendes `home_hold` etter et halvt sekund – kommandoen som åpner appbytteren på Apple TV. Meny og Siri har fått de samme lange variantene, og et vanlig trykk virker som før
- Dempeknappen sendte en `mute`-kommando fjernkontrollen ikke kjenner. Nå brukes `media_player.volume_mute` når spilleren støtter det, med fjernkontrollkommandoen som reserve

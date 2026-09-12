## Rettet

**ki-prosa-card 2.12.0 – editoren**
- Profilvelgeren lot seg ikke bruke. Menyen ligger inne i en dialog og ble klippet bort; nå settes `fixedMenuPosition`, og valget leses både fra `selected` og `change`, så det virker med mus og tastatur
- Feltene sto tomme fordi verdiene ble satt før `ha-textfield`, `ha-entity-picker` og `ha-select` var ferdig lastet i frontend. Nå fylles de inn på nytt når elementene er klare – testet med elementer som først dukker opp 150 ms etter at skjemaet er bygget: alle 15 entitetsfeltene og profilvalget kom på plass
- Entitets- og ikonvelgerne får `hass` på nytt ved hver oppdatering, så lista over entiteter ikke blir stående tom

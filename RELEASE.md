# ki-cards 3.36.0

## `ki-strompris-card`: Norgespris var en flat strek

Med Norgespris er energiprisen fast. Det eneste som varierer gjennom døgnet er nettleia —
den er lavere om natta, i helgene og på helligdager. Kortet kunne allerede tegne den
trappa, men bare hvis du hadde skrevet inn `nettleie_dag` og `nettleie_natt` manuelt.
Uten dem returnerte `_nettleie()` null, og Norgespris ble én vannrett linje.

Satsene finnes nå automatisk blant energiledd-sensorene — Elvia-integrasjonen lager
`sensor.nettleie_elvia_energiledd_dag` og `..._energiledd_natt_helg`, og de plukkes opp
uten oppsett. Kurven får dermed trinnet ved kl. 06 og 22, og flat sats i helgene.

Satsene kan også settes som entitets-id-er i stedet for tall, hvis nettselskapet ditt
heter noe annet. `nettleie_auto: false` slår av søket.

## «Du betaler nå» ligger øverst

Tittelraden over kortet er av som standard, og dagvelgeren (I dag / I morgen) er flyttet
inn i kortet på samme rad som prisen. Heroen har mistet toppmargen på 12 px, så
«Du betaler nå» står helt øverst uten luft over.

`vis_tittel: true` gir den gamle raden tilbake.

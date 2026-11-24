# Plán a zadanie hry Zubák

Tento súbor prenáša zadanie z konverzácie do projektu. Hra je samostatná v priečinku `zubak`; `NG` sa nemení. Všetky používateľské texty sú v slovenčine.

## Postavy

- NG: hlavná hrdinka, hrá na klavíri, je dobrá v matematike a zúčastnila sa matematickej olympiády. Bojí sa psov. Obľúbeným miestom je rozhľadňa.
- Mama a tato: rodičia NG, fajčia cigarety. Tato pochádza z Breznice a má SUV. Či ide o Hornú alebo Dolnú Breznicu, nie je určené, preto to hra nespresňuje.
- Fifko: malý braček a začínajúci detektív, ktorý si zakresľuje stopy.
- Miešačka: mamina známa, požičiava miešačku.
- Lyda, kamarátky Betka, Simona a Kika, pani učiteľka, starosta.
- Tatova sesternica s manželom: bývajú v časti Malušinec, na kopci oproti NG; v dielni majú náhradný diel do miešačky. Presná poloha domu zatiaľ nie je mapovo overená.
- Peter: býva v Zubáku, sníva o živote v Brne.
- Lesník a colník pri závore aj po telefóne.

## Mapa

Neďaleko domu NG je v lese malá stará opustená chatka. Podľa používateľa tam NG kedysi pila alkohol s kamarátmi; v hre ide o spomienku, nie úlohu, odmenu ani novú aktivitu. Chatka je samostatná preskúmateľná lokácia, zatiaľ bez overených súradníc. NG si ju prezerá zvonka.

COOP Jednota je doložená v OMA/OpenStreetMap na adrese Zubák 168 (https://poi.oma.sk/n11211864858). Oficiálna adresa obecného úradu je Zubák 164. Používateľ upresnil, že obchod je pri obecnom úrade, kúsok od NG; v hernej mape preto tvoria blízku skupinu. Presné GPS súradnice a orientácia budov ešte nie sú overené; čísla domov samy osebe neurčujú vzdialenosť.

Sirková voda leží v lese až za horným koncom Zubáka, nie v centre ani medzi domami. Používateľ výslovne upresnil jej polohu na konci obce. Verejný miestopis ju opisuje približne 1,5 km od horného konca obce pri lesnej škôlke; tú nezamieňať s materskou školou pri dome NG. Herná mapa vzdialenosť skracuje; presnú mapovú orientáciu ešte treba overiť.

NG býva v dome označenom NG hneď vedľa materskej školy; studňa je za domom a občas vysychá. Susedstvo materskej školy upresnil používateľ; presná mapová poloha zatiaľ nie je overená. Stará bytovka je hneď vedľa školy a pri ihrisku. Festival guláša je na ihrisku. Ďalej obchod, úrad, zatvorená krčma, kostol sv. Vendelína, krížová cesta nad ním, les, Sirková voda, obľúbená rozhľadňa, protiľahlý kopec so sesternicou, zastávka s autobusom do Púchova a hrebeň Žrnová/Kýčera.

Skutočné miestopisné názvy sú doplnené z verejných zdrojov uvedených v README. Mapa vzdialenosti skracuje; presná poloha súkromných domov a rozhľadne nie je overená. Rozhľadňa nad obcou Dohňany je doložený výletný cieľ, nie overená rozhľadňa priamo v obci Zubák. Lokalizácia nemení súradnice miest ani grafiku mapy.

## Prvý prípad

1. Zistiť, že studňa vysychá a na gulášfeste chýba naberačka.
2. Fifko poskytne teóriu od začiatku. Preveriť plot škôlky, až potom svedectvo Lydy o neznámom mužovi a blate v kopcoch. Prezrieť stopy v lese, pri pulte zistiť, že sadru kúpila Kika, získať ju a urobiť odliatok.
3. Pri Sirkovej vode stojí NG bez pohybu pred zatvorenou závorou pri colníkovi. Rozhovor spomenie pohraničnú zónu a Petra. Po pomoci s Brnom Peter zavolá colníkovi, zaručí sa za NG a vybaví povolenie. Brno možno dokončiť skôr; odliatok ani Fifkov záver nie sú bránou telefonátu.
4. Po povolení colník zmizne a závora sa zdvihne. Porovnať odliatok s lesníkom a opýtať sa ho na opravu. Až keď povie, že nepozná presný postup, odomkne sa otázka na Kalusov plán u mamy a tata. Starosta vysvetlí zámok, učiteľka hádanku; kód dverí 225 dá zápisník aj plán. Otázka u rodičov zmizne po nájdení plánu. Skrinka ani kľúč nemajú samostatnú úlohu. Oprava nezávisí od hudby ani od papiera pri rozhľadni.
5. Spoločný helper `scene(state)` určuje skutočné postavy, objekty, blokovanie pohybu a pozície colníka/NG pre core, UI aj kresbu. Odliatok možno porovnať aj s colníkom pred otvorením závory. Starý kontakt/telefonát neobíde bránu. `bearSafe` ostáva povolením; restore ho zachová alebo doplní pri `waterFixed`/`finished`, nie iba pri `brnoReady`.
6. Miešačka potrebuje náhradný ozubený remeň. Tato môže odporučiť sesternicu, ktorá má diel v dielni. Po súhlase a zaistení psa NG vezme remeň a odnesie ho Miešačke. Tá miešačku opraví a požičia; potom tato zabezpečí SUV a pomoc.
7. Tato s lesníkom opravia povrchový žliabok. Vráti sa vyčistená naberačka, NG znovu skontroluje studňu a s Fifkom uzavrie preverenie teórie.
8. Pripraviť NG ako náhradnú klaviristku, skontrolovať studňu a odovzdať naberačku Fifkovi. Tým sa prípad skončí a starosta oznámi, že namiesto krčmy sa otvorí hipsterská kaviareň. NG zahrá s kapelou.

## Záhada zatvorenej krčmy

- Krčma je jednoducho zatvorená. Dôvod zostáva tajomstvom až do festivalového oznámenia; starostov kľúč, evidencia náradia ani krčmárov zápisník ho neprezrádzajú. Strecha nie je vysvetlením zatvorenia.
- Objekt `matcha` má neutrálny názov Zelený prášok. NG ho môže prezrieť pred odomknutím a rozpozná matchu; jednorazová stopa nastaví `matchaSeen`, bez nového predmetu v inventári.
- Káva nemá samostatný objekt ani tlačidlo. NG pri prvom vstupe automaticky okomentuje výberovú kávu a nastaví `coffeeSeen`. Opakovaný vstup neduplikuje dôkazy. Staré otvorené uloženie bez tohto príznaku umožní objav pri opätovnom použití kľúča na dvere.
- Finále sa spustí odovzdaním naberačky Fifkovi po kontrole studne a príprave na vystúpenie. Nepovinné úlohy nie sú ďalšou podmienkou finále.
- Starosta oznámi hipsterskú kaviareň namiesto krčmy. NG spätne spojí iba stopy s príslušnými príznakmi `matchaSeen` a `coffeeSeen`: obe, jednu alebo žiadnu. Bez stôp reaguje všeobecným prekvapením. Stopy nie sú podmienkou úspechu a nemenia počet štyroch úloh. Ostatné uzavreté príbehy aj vystúpenie s kapelou zostávajú.

## Náhradná klaviristka

- Kapele vypadla klaviristka; naposledy ju videli bežať cez kopec smerom na Dohňany. Nejde o nové pátranie ani lokalitu. NG sa ponúkne, ale nepozná skladbu. NG: „A prečo ju nezastúpiš ty?“ Simona: „Ja hrám hádzanú. Ty hráš na klavíri.“
- Pri chatke je od začiatku samostatný objekt `phone`, oddelený od `cabinMemory`. Dá položku `phone`. Pred rozhovorom so Simonou je majiteľ neznámy, NG obsah neotvára. Spomienka na chatku nedáva predmet ani program skúšky.
- Simonina téma `recording` nastaví `recordingAsked`. Téma `returnPhone` je dostupná s telefónom po tomto rozhovore a nastaví `phoneReturned`. Telefón zostáva v uloženom inventári, ale `activeInventory` ho po vrátení skryje. UI skryje hotspot pri vlastníctve `phone` alebo pri `phoneReturned`.
- Betkina téma `consent` vyžaduje `recordingAsked` a nastaví `audioConsent`. Súhlas možno vybaviť pred nájdením alebo vrátením telefónu aj po ňom. Video s Betkiným pádom zostane súkromné a nikto iný ho neuvidí.
- Simonina téma `edit` vyžaduje `recordingAsked`, `phoneReturned` a `audioConsent`; pridá položku `audioTrack` a nastaví `recording`. ID nie je `audio`, aby nekolidovalo s audio kontextom. Opakovanie neduplikuje položku ani dôkaz.
- Papier pri rozhľadni má čitateľné iba E–G; posledná nota je rozmazaná a NG ju neprečíta. Pridá `notes`, ale nie je podmienkou hudby ani opravy. Tlačidlo Skúsiť na festival sa zobrazí až s `audioTrack`. Popis nahrávky ani úvod skladbu neprezrádzajú. `audioTrack` a `notes` zostávajú v aktívnom inventári aj po úspechu; starý `rehearsal` je vždy skrytý.
- Klavír je vždy dostupný na voľnú hru. Core vyhodnocuje len objektovú akciu `{ type: "object", target: "piano", answer: "EGA", festivalAttempt: true }` doma, s položkou `audioTrack`. Správny pokus nastaví iba `festivalReady`; nepoužíva `musicSolved` a nikdy nedáva plán. Iný výsledok vypíše „To nebolo ono. Skúsim to znova.“ Bez presného booleovského príznaku sa ani EGA nehodnotí. Opakovaný úspech nepridáva dôkazy.
- UI vlastní režim pokusu: tlačidlo „Skúsiť na festival“ až s nahrávkou, vymazanie vstupu, presne tri nasledujúce hráčove tóny a stabilný indikátor 0/3 až 3/3. Replay sa nepočíta; nesprávny pokus, zatvorenie či znovuotvorenie vrátia voľnú hru. Core neprijíma jednotlivé stlačenia ani neudržiava rozpracovaný pokus. Po úspechu zostáva voľná hra a replay.
- Audio/UI fáza prehrá E4–G4–A4 (329,63 / 392 / 440 Hz) z batoha aj klavíra aj pri vypnutých efektoch, bez zapnutia hudby na pozadí. Nový replay zastaví predošlý; zavretie modalu či odchod zastaví zvuk. Stabilné biele aj čierne klávesy majú správne frekvencie a tlmený klavírny zvuk.
- Existujúca nahrávková úloha je nahradená úlohou „Náhradná klaviristka“, dokončenou až cez `festivalReady`; počet úloh zostáva štyri. Finále tento príznak vyžaduje popri pôvodných podmienkach opravy a vyšetrovania.
- Obnova starého uloženia doplní `plan` k `journal`, ak oprava ešte čaká. Staré `recording` doplní `audioTrack`, `recordingAsked`, `phoneReturned` a `audioConsent`. Staré `musicSolved` sa nikdy neprekladá na `festivalReady`. Dokončené uloženie zostane dokončené.

Táto implementačná fáza mení iba `core.js`, `core.test.js` a tento plán. UI, audio, kresby, štýly a návod v hre rieši samostatná nadväzujúca fáza.

## Ďalšie rozšírenia

Prvé vydanie je kompletná uzavretá kapitola, nie dlhá niekoľkohodinová hra. Ďalšie kapitoly môžu využiť cestu do Púchova, tatove spomienky na Breznicu a príbehy jednotlivých priateľov. Súčasný autobus je interaktívna kulisa, nie samostatné mesto. Dobové zvony slúžia ako historická atmosféra, nie údajne nájdený poklad.

## Overenie

Automatické testy: celý priechod s opravou pred hudobným úspechom, podmienky odomykania, skorý neznámy telefón, obe poradia súhlasu a vrátenia, zvuk bez videa, neduplikovanie inventára, voľné EGA oproti explicitnému pokusu, nesprávne a opakované pokusy, voliteľné noty, nezávislý plán, obnova starých kombinácií `journal`/`recording`/`musicSolved` a zachovanie dokončených hier. Zachované sú aj testy bezpečného psa a lesa, kontroly studne, slovenských názvov a rodinných detailov.

Regresie krčmy: matcha pred otvorením, žiadny samostatný objekt kávy, automatický objav pri prvom odomknutí, neduplikovanie stôp, objav kávy cez dvere v starom otvorenom uložení, každá chýbajúca finálová podmienka bez odhalenia a všetky štyri kombinácie voliteľných stôp pri úspechu. Kľúč a evidencia nesmú predčasne vysvetliť zatvorenie.

Ak Node nie je dostupný, testy sa spúšťajú v izolovanom browserovom kontexte s adaptérom pre použité `node:test` a `node:assert/strict` funkcie. Core sa načíta cez `Function('globalThis', 'module', source)` s vlastným objektom globálu a `undefined` modulom, bez zmeny globálu živej hry a bez čítania či zápisu jej uloženia. Nadväzujúca UI fáza musí ručne overiť počuteľnosť replayu pri vypnutých efektoch, správne klávesy, rušenie pokusov a prehrávania, mobilné/desktopové rozloženie a miznutie telefónu aj papiera. Identifikátory a príznaky vyššie sú kontraktom pre túto fázu.
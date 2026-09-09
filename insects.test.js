const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=__dirname;
const expansion=fs.readFileSync(path.join(root,'engine-expansion.js'),'utf8');
const insects=fs.readFileSync(path.join(root,'engine-insects.js'),'utf8');
const ui=fs.readFileSync(path.join(root,'engine-ui.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const styles=fs.readFileSync(path.join(root,'styles-responsive.css'),'utf8');
const network=fs.readFileSync(path.join(root,'network.js'),'utf8');
const schema=fs.readFileSync(path.join(root,'supabase','schema.sql'),'utf8');
const migration=fs.readFileSync(path.join(root,'supabase','migration-222-insects.sql'),'utf8');

for(const key of ['amberTragedy','direLadybug','direCockroach','direCaterpillar','direAnt','direCentipede','volcanicLadybug','radiantCockroach','stormButterfly','vastAnt','ruinCentipede'])assert.match(expansion,new RegExp(`${key}:\\{`),`peão ausente: ${key}`);
for(const key of ['calamityEruption','calamityNuclear','calamityHurricane','calamityTsunami','calamityQuake','volcanicHeat','nuclearWinter','unstableTyphoon','endlessOcean','tremblingEarth','badOmen','wildCage'])assert.match(expansion,new RegExp(`${key}:\\{`),`efeito ausente: ${key}`);
assert.match(expansion,/registerArchetype\('insects'/);
assert.match(expansion,/delete archetypes\.celestial/);
assert.doesNotMatch(html,/data-deck="celestial"/);
assert.equal((html.match(/data-deck="insects"/g)||[]).length,2);
assert.match(insects,/previous===key[^\n]+as duas Arenas se anularam/);
assert.match(ui,/applyArenaState\(key,player\)/);
assert.match(expansion,/flameTemple:[^\n]+6 turnos/);
assert.match(styles,/\.cell\.flame-temple-range::after\{background:#bd241c35/);
assert.match(network,/packet\.type==='rematch-ready'/);
assert.match(network,/state\.matchId!==previousMatchId\)resetRematchState/);
assert.match(schema,/egyptian','insects'/);
assert.match(migration,/migration-222-insects|insects/i);

const newIcons=['algae','amber-mosquito','ant','big-wave','bird-cage','butterfly','caterpillar','centipede','death-note','earth-crack','earth-spit','fire-zone','ladybug','long-antennae-bug','mushroom-cloud','nuclear','stomp-tornado','tornado','volcano'];
for(const name of newIcons){const svg=fs.readFileSync(path.join(root,'assets','icons',`${name}.svg`),'utf8');assert.doesNotMatch(svg,/<path\s+d="M0 0h512v512H0z"/i,`${name}.svg ainda possui fundo sólido`);assert.match(svg,/<svg\b/i,`${name}.svg inválido`)}

console.log('Insetos Calamitosos, Arenas e ícones transparentes tests passed');

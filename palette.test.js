const assert = require('assert');
const fs = require('fs');
const path = require('path');

const endesga64 = new Set(`ff0040 131313 1b1b1b 272727 3d3d3d 5d5d5d 858585 b4b4b4 ffffff c7cfdd 92a1b9 657392 424c6e 2a2f4e 1a1932 0e071b 1c121c 391f21 5d2c28 8a4836 bf6f4a e69c69 f6ca9f f9e6cf edab50 e07438 c64524 8e251d ff5000 ed7614 ffa214 ffc825 ffeb57 d3fc7e 99e65f 5ac54f 33984b 1e6f50 134c4c 0c2e44 00396d 0069aa 0098dc 00cdf9 0cf1ff 94fdff fdd2ed f389f5 db3ffd 7a09fa 3003d9 0c0293 03193f 3b1443 622461 93388f ca52c9 c85086 f68187 f5555d ea323c c42430 891e2b 571c27`.split(' '));
const colorPattern = /(?<![\w-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g;
const files = [
  'styles-core.css',
  'styles-game.css',
  'styles-responsive.css',
  ...fs.readdirSync(path.join('assets', 'icons')).filter(file => file.endsWith('.svg')).map(file => path.join('assets', 'icons', file))
];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(colorPattern)) {
    let value = match[0].slice(1).toLowerCase();
    if (value.length === 3 || value.length === 4) value = [...value].map(char => char + char).join('');
    assert.ok(endesga64.has(value.slice(0, 6)), `${file}: ${match[0]} não pertence à Endesga 64`);
  }
}

console.log('Endesga 64 palette test passed');

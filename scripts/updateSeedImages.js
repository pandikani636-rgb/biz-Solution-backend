import fs from 'fs';

const seedPath = 'backend/src/seed/seed.js';
let content = fs.readFileSync(seedPath, 'utf8');

const replacements = [
  ['name: \'PIX SPC 2360 Wedge Belt\',', "mainImage: '/belts/PIX SPC 2360 Wedge Belt.jpg',"],
  ['name: \'PIX 8V-1900 Heavy Duty V-Belt\',', "mainImage: '/belts/PIX 8V-1900 Heavy Duty V-Belt.jpg',"],
  ['name: \'PIX SPC PT 3150 Power Transmission Belt\',', "mainImage: '/belts/PIX SPC PT 3150 Power Transmission.jpg',"],
  ['name: \'PIX C 70 Classical V-Belt\',', "mainImage: '/belts/PIX C 70 Classical V-Belt.jpg',"],
  ['name: \'NBC 6405ZZ C3 Bearing\',', "mainImage: '/bearings/img10.jpg',"],
  ['name: \'HCH 6203 Deep Groove Ball Bearing\',', "mainImage: '/bearings/imgg14.jpg',"],
  ['name: \'HCH 6204 Deep Groove Ball Bearing\',', "mainImage: '/bearings/img6.jpg',"],
  ['name: \'HCH 6205 Deep Groove Ball Bearing\',', "mainImage: '/bearings/img11.jpg',"],
  ['name: \'HCH 6305 Deep Groove Ball Bearing\',', "mainImage: '/bearings/img8.jpg',"],
  ['name: \'HCH 6201_6202 Matched Set\',', "mainImage: '/bearings/img5.jpg',"],
  ['name: \'HCH 6203ZZ Shielded Bearing\',', "mainImage: '/bearings/image12.jpg',"],
  ['name: \'HCH 6204ZZ Shielded Bearing\',', "mainImage: '/bearings/img7.jpg',"],
  ['name: \'HCH 6205ZZ Shielded Bearing\',', "mainImage: '/bearings/img4.jpg',"],
  ['name: \'HCH 6305ZZ Shielded Bearing\',', "mainImage: '/bearings/img4.jpg',"],
  ['name: \'HCH 6307 Deep Groove Ball Bearing\',', "mainImage: '/bearings/img15.jpg',"],
  ['name: \'HCH 6306 Deep Groove Ball Bearing\',', "mainImage: '/bearings/img9.jpg',"],
  ['name: \'HCH 6309 Deep Groove Ball Bearing\',', "mainImage: '/bearings/imgg14.jpg',"],
  ['name: \'HCH 6306ZZ Shielded Bearing\',', "mainImage: '/bearings/img9.jpg',"],
  ['name: \'Fenner C 70 Classical V-Belt\',', "mainImage: '/belts/Fenner C 70 Classical V-Belt.jpg',"],
  ['name: \'Fenner SPC PT 3150 Power Transmission Belt\',', "mainImage: '/belts/Fenner SPC PT 3150 Power Transmissio.jpg',"],
  ['name: \'Timken 6313 Open Type Bearing\',', "mainImage: '/bearings/img3.jpg',"],
  ['name: \'SKF 7322 2X Angular Contact Ball Bearing Matched Set\',', "mainImage: '/bearings/img1.jpg',"],
  ['name: \'SKF 7322 Angular Contact Ball Bearing\',', "mainImage: '/bearings/img2.jpg',"],
];

for (const [nameKey, newMainImage] of replacements) {
  const nameIdx = content.indexOf(nameKey);
  if (nameIdx !== -1) {
    const nextMainImageIdx = content.indexOf('mainImage:', nameIdx);
    const endLineIdx = content.indexOf('\n', nextMainImageIdx);
    if (nextMainImageIdx !== -1 && endLineIdx !== -1) {
      content = content.slice(0, nextMainImageIdx) + newMainImage + content.slice(endLineIdx);
      console.log('Updated seed for:', nameKey);
    }
  } else {
    console.warn('Could not find:', nameKey);
  }
}

fs.writeFileSync(seedPath, content, 'utf8');
console.log('Seed file successfully updated.');

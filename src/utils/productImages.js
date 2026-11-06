export const INDUSTRIAL_IMAGE_CATALOG = {
  ballBearing: '/bearings/imgg14.jpg',
  angularContact: '/bearings/img1.jpg',
  rollerBearing: '/bearings/img3.jpg',
  pillowBlock: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
  vBelt: '/belts/PIX C 70 Classical V-Belt.jpg',
  timingBelt: '/belts/PIX SPC PT 3150 Power Transmission.jpg',
  pulley: '/banners/img4.jpg',
  taperBush: '/banners/img4.jpg',
  grease: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
  diagnostics: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  defaultIndustrial: '/bearings/imgg14.jpg',
};

export const PRODUCT_SPECIFIC_IMAGES = {
  // Belts
  'pix spc 2360': '/belts/PIX SPC 2360 Wedge Belt.jpg',
  'spc 2360': '/belts/PIX SPC 2360 Wedge Belt.jpg',
  '8v-1900': '/belts/PIX 8V-1900 Heavy Duty V-Belt.jpg',
  'pix 8v-1900': '/belts/PIX 8V-1900 Heavy Duty V-Belt.jpg',
  'pix spc pt 3150': '/belts/PIX SPC PT 3150 Power Transmission.jpg',
  'pix c 70': '/belts/PIX C 70 Classical V-Belt.jpg',
  'fenner c 70': '/belts/Fenner C 70 Classical V-Belt.jpg',
  'fenner spc pt 3150': '/belts/Fenner SPC PT 3150 Power Transmissio.jpg',

  // Bearings
  'nbc 6405zz': '/bearings/img10.jpg',
  '6405zz': '/bearings/img10.jpg',
  'timken': '/bearings/img3.jpg',
  '6313': '/bearings/img3.jpg',
  '7322 2x': '/bearings/img1.jpg',
  'skf 7322 2x': '/bearings/img1.jpg',
  '7322': '/bearings/img2.jpg',
  'skf 7322': '/bearings/img2.jpg',
  '6201_6202': '/bearings/img5.jpg',
  'hch 6205zz': '/bearings/img4.jpg',
  '6205zz': '/bearings/img4.jpg',
  'hch 6205': '/bearings/img11.jpg',
  '6205': '/bearings/img11.jpg',
  'hch 6306zz': '/bearings/img9.jpg',
  '6306zz': '/bearings/img9.jpg',
  'hch 6306': '/bearings/img9.jpg',
  '6306': '/bearings/img9.jpg',
  'hch 6203zz': '/bearings/image12.jpg',
  '6203zz': '/bearings/image12.jpg',
  'hch 6204zz': '/bearings/img7.jpg',
  '6204zz': '/bearings/img7.jpg',
  'hch 6203': '/bearings/imgg14.jpg',
  '6203': '/bearings/imgg14.jpg',
  'hch 6204': '/bearings/img6.jpg',
  '6204': '/bearings/img6.jpg',
  'hch 6305zz': '/bearings/img4.jpg',
  'hch 6305': '/bearings/img8.jpg',
  '6305zz': '/bearings/img4.jpg',
  '6305': '/bearings/img8.jpg',
  'hch 6307': '/bearings/img15.jpg',
  '6307': '/bearings/img15.jpg',
  'hch 6309': '/bearings/imgg14.jpg',
  '6309': '/bearings/imgg14.jpg',
};

export const getProductImageUrl = (name = '', partNumber = '', brand = '', categoryName = '') => {
  const pNorm = (partNumber || '').trim().toLowerCase();
  const nNorm = (name || '').trim().toLowerCase();
  const bNorm = (brand || '').trim().toLowerCase();
  const combined = `${bNorm} ${pNorm} ${nNorm}`.toLowerCase();

  for (const [key, imagePath] of Object.entries(PRODUCT_SPECIFIC_IMAGES)) {
    if (pNorm === key || nNorm.includes(key) || combined.includes(key)) {
      return imagePath;
    }
  }

  const query = `${name} ${partNumber} ${brand} ${categoryName}`.toLowerCase();

  if (query.includes('belt') || query.includes('spz') || query.includes('spa') || query.includes('spb') || query.includes('spc') || query.includes('wedge') || query.includes('fenner') || query.includes('pix')) {
    if (query.includes('timing') || query.includes('cogged')) return INDUSTRIAL_IMAGE_CATALOG.timingBelt;
    return INDUSTRIAL_IMAGE_CATALOG.vBelt;
  }
  if (query.includes('pulley') || query.includes('groove')) return INDUSTRIAL_IMAGE_CATALOG.pulley;
  if (query.includes('bush') || query.includes('taper-lock')) return INDUSTRIAL_IMAGE_CATALOG.taperBush;
  if (query.includes('angular') || query.includes('7322')) return INDUSTRIAL_IMAGE_CATALOG.angularContact;
  if (query.includes('nbc')) return '/bearings/img10.jpg';
  if (query.includes('timken')) return '/bearings/img3.jpg';
  if (query.includes('skf')) return '/bearings/img1.jpg';
  if (query.includes('hch')) return '/bearings/imgg14.jpg';

  return INDUSTRIAL_IMAGE_CATALOG.ballBearing;
};

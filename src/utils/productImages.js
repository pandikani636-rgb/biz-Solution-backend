export const INDUSTRIAL_IMAGE_CATALOG = {
  ballBearing: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
  angularContact: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80',
  rollerBearing: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  pillowBlock: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
  vBelt: 'https://cobrel.co.za/wp-content/uploads/2019/10/Classical-V-Belts-copy3.png',
  timingBelt: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80',
  pulley: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80',
  taperBush: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  grease: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
  diagnostics: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  defaultIndustrial: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
};

export const getProductImageUrl = (name = '', partNumber = '', brand = '', categoryName = '') => {
  const query = `${name} ${partNumber} ${brand} ${categoryName}`.toLowerCase();

  if (query.includes('belt') || query.includes('spz') || query.includes('spa') || query.includes('spb') || query.includes('spc') || query.includes('wedge') || query.includes('fenner') || query.includes('pix')) {
    if (query.includes('timing') || query.includes('cogged')) return INDUSTRIAL_IMAGE_CATALOG.timingBelt;
    return INDUSTRIAL_IMAGE_CATALOG.vBelt;
  }
  if (query.includes('pulley') || query.includes('groove')) return INDUSTRIAL_IMAGE_CATALOG.pulley;
  if (query.includes('bush') || query.includes('taper-lock')) return INDUSTRIAL_IMAGE_CATALOG.taperBush;
  if (query.includes('angular') || query.includes('7322')) return INDUSTRIAL_IMAGE_CATALOG.angularContact;
  if (query.includes('pillow') || query.includes('ucp') || query.includes('plummer')) return INDUSTRIAL_IMAGE_CATALOG.pillowBlock;
  if (query.includes('spherical') || query.includes('taper') || query.includes('roller') || query.includes('22220') || query.includes('22218') || query.includes('30206')) return INDUSTRIAL_IMAGE_CATALOG.rollerBearing;
  if (query.includes('grease') || query.includes('lgmt')) return INDUSTRIAL_IMAGE_CATALOG.grease;
  if (query.includes('laser') || query.includes('alignment') || query.includes('vibration')) return INDUSTRIAL_IMAGE_CATALOG.diagnostics;

  return INDUSTRIAL_IMAGE_CATALOG.ballBearing;
};

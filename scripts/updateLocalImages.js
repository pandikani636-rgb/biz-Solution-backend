import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/biz_zolution';

async function updateImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Update Script] Connected to MongoDB.');

    const Banner = mongoose.model('Banner', new mongoose.Schema({}, { strict: false }));
    const Service = mongoose.model('Service', new mongoose.Schema({}, { strict: false }));

    // 1. Update Banners with images from Banner folder
    await Banner.deleteMany({});
    const bannerDocs = [
      {
        title: "Grander's Belts & Power Transmission",
        badgeText: "GRANDER'S BELTS & V-BELTS",
        subtitle: 'High-tensile industrial Grander belts, angle grinder drive belts, and classical wedge belts. Oil, heat, and vibration resistant for heavy workshop and factory operations.',
        image: '/banners/img2.png',
        ctaText: "Browse Grander's Belts",
        ctaLink: '/services?brand=PIX',
        secondaryCtaText: 'Request Bulk RFQ',
        secondaryCtaLink: '/rfq',
        displayOrder: 1,
        isActive: true,
      },
      {
        title: 'Fenner B 36 Wet Grinder Belts',
        badgeText: 'GENUINE FENNER GRINDER SERIES',
        subtitle: 'Original Fenner B 36 precision wet grinder drive belts. Engineered for whisper-quiet vibration damping and maximum drive efficiency.',
        image: '/banners/img5.jpg',
        ctaText: 'Explore Fenner Belts',
        ctaLink: '/services?brand=Fenner',
        secondaryCtaText: 'View Discount Matrix',
        secondaryCtaLink: '/mrp-pricing',
        displayOrder: 2,
        isActive: true,
      },
      {
        title: 'Fenner A 48 Wet Grinder Belts',
        badgeText: 'INDUSTRIAL & COMMERCIAL DRIVES',
        subtitle: 'Heavy-duty Fenner A 48 wet grinder and machine transmission belts. Oil-resistant and heat-stable for rigorous wet grinding environments.',
        image: '/banners/img4.jpg',
        ctaText: 'Explore Wet Grinder Belts',
        ctaLink: '/services?brand=Fenner',
        secondaryCtaText: 'Download Price List',
        secondaryCtaLink: '/mrp-pricing',
        displayOrder: 3,
        isActive: true,
      },
      {
        title: 'Veegrip Grind Power Industrial V-Belts',
        badgeText: 'IS 2494 HEAVY DUTY CERTIFIED',
        subtitle: 'Veegrip Grind Power transmission belts engineered to IS 2494 standards. Exceptional tensile cord reinforcement and minimal elongation under load.',
        image: '/banners/img3.jpg',
        ctaText: 'Browse Grind Power Belts',
        ctaLink: '/services?section=Belt',
        secondaryCtaText: 'Custom RFQ',
        secondaryCtaLink: '/rfq',
        displayOrder: 4,
        isActive: true,
      },
      {
        title: 'Classical Industrial V-Belts — Section A & C',
        badgeText: 'HIGH-TORQUE DRIVE SOLUTIONS',
        subtitle: 'Complete range of industrial wrapped classical V-belts including A 951 Lp / A36A and C Section belts for industrial machinery and machine tools.',
        image: '/banners/img1.jpg',
        ctaText: 'Explore Classical Belts',
        ctaLink: '/services?section=Belt',
        secondaryCtaText: 'Technical Inquiry',
        secondaryCtaLink: '/contact',
        displayOrder: 5,
        isActive: true,
      },
      {
        title: 'Veehold Domestic & Heavy Industrial Belts',
        badgeText: 'DOMESTIC & HEAVY PLANT LINEUP',
        subtitle: 'Veehold Domestic WG 341 and heavy-duty transmission belts for domestic machinery, mill drives, and workshop machinery.',
        image: '/banners/img6.jpg',
        ctaText: 'Browse Veehold Lineup',
        ctaLink: '/services?section=Belt',
        secondaryCtaText: 'Request Bulk Quote',
        secondaryCtaLink: '/rfq',
        displayOrder: 6,
        isActive: true,
      },
    ];
    await Banner.insertMany(bannerDocs);
    console.log(`[Update Script] Inserted ${bannerDocs.length} banners into DB.`);

    // 2. Update Belts with images from Belts folder
    const beltUpdates = [
      {
        query: { name: 'PIX SPC 2360 Wedge Belt' },
        mainImage: '/belts/PIX SPC 2360 Wedge Belt.jpg',
        galleryImages: ['/belts/pix-spc-2360.jpg', '/belts/PIX SPC PT 3150 Power Transmission.jpg'],
      },
      {
        query: { name: 'PIX 8V-1900 Heavy Duty V-Belt' },
        mainImage: '/belts/PIX 8V-1900 Heavy Duty V-Belt.jpg',
        galleryImages: ['/belts/pix-8v-1900.jpg', '/belts/PIX C 70 Classical V-Belt.jpg'],
      },
      {
        query: { name: 'PIX SPC PT 3150 Power Transmission Belt' },
        mainImage: '/belts/PIX SPC PT 3150 Power Transmission.jpg',
        galleryImages: ['/belts/pix-spc-pt-3150.jpg', '/belts/PIX SPC 2360 Wedge Belt.jpg'],
      },
      {
        query: { name: 'PIX C 70 Classical V-Belt' },
        mainImage: '/belts/PIX C 70 Classical V-Belt.jpg',
        galleryImages: ['/belts/pix-c-70.jpg', '/belts/Fenner C 70 Classical V-Belt.jpg'],
      },
      {
        query: { name: 'Fenner C 70 Classical V-Belt' },
        mainImage: '/belts/Fenner C 70 Classical V-Belt.jpg',
        galleryImages: ['/belts/fenner-c-70.jpg', '/belts/PIX C 70 Classical V-Belt.jpg'],
      },
      {
        query: { name: 'Fenner SPC PT 3150 Power Transmission Belt' },
        mainImage: '/belts/Fenner SPC PT 3150 Power Transmissio.jpg',
        galleryImages: ['/belts/fenner-spc-pt-3150.jpg', '/belts/PIX SPC PT 3150 Power Transmission.jpg'],
      },
    ];

    for (const b of beltUpdates) {
      const res = await Service.updateOne(b.query, { $set: { mainImage: b.mainImage, galleryImages: b.galleryImages } });
      console.log(`[Update Script] Belt "${b.query.name}" matched: ${res.matchedCount}`);
    }

    // 3. Update Bearings with images from Bearings folder
    const bearingUpdates = [
      {
        query: { name: 'NBC 6405ZZ C3 Bearing' },
        mainImage: '/bearings/img10.jpg',
        galleryImages: ['/bearings/img4.jpg', '/bearings/imgg14.jpg'],
      },
      {
        query: { name: 'HCH 6203 Deep Groove Ball Bearing' },
        mainImage: '/bearings/imgg14.jpg',
        galleryImages: ['/bearings/img6.jpg', '/bearings/image12.jpg'],
      },
      {
        query: { name: 'HCH 6204 Deep Groove Ball Bearing' },
        mainImage: '/bearings/img6.jpg',
        galleryImages: ['/bearings/imgg14.jpg', '/bearings/img7.jpg'],
      },
      {
        query: { name: 'HCH 6205 Deep Groove Ball Bearing' },
        mainImage: '/bearings/img11.jpg',
        galleryImages: ['/bearings/img4.jpg', '/bearings/imgg14.jpg'],
      },
      {
        query: { name: 'HCH 6305 Deep Groove Ball Bearing' },
        mainImage: '/bearings/img8.jpg',
        galleryImages: ['/bearings/imgg14.jpg', '/bearings/img9.jpg'],
      },
      {
        query: { name: 'HCH 6201_6202 Matched Set' },
        mainImage: '/bearings/img5.jpg',
        galleryImages: ['/bearings/image12.jpg', '/bearings/img7.jpg'],
      },
      {
        query: { name: 'HCH 6203ZZ Shielded Bearing' },
        mainImage: '/bearings/image12.jpg',
        galleryImages: ['/bearings/imgg14.jpg', '/bearings/img7.jpg'],
      },
      {
        query: { name: 'HCH 6204ZZ Shielded Bearing' },
        mainImage: '/bearings/img7.jpg',
        galleryImages: ['/bearings/image12.jpg', '/bearings/img4.jpg'],
      },
      {
        query: { name: 'HCH 6205ZZ Shielded Bearing' },
        mainImage: '/bearings/img4.jpg',
        galleryImages: ['/bearings/img11.jpg', '/bearings/image12.jpg'],
      },
      {
        query: { name: 'HCH 6305ZZ Shielded Bearing' },
        mainImage: '/bearings/img4.jpg',
        galleryImages: ['/bearings/image12.jpg', '/bearings/img8.jpg'],
      },
      {
        query: { name: 'HCH 6307 Deep Groove Ball Bearing' },
        mainImage: '/bearings/img15.jpg',
        galleryImages: ['/bearings/imgg14.jpg', '/bearings/img9.jpg'],
      },
      {
        query: { name: 'HCH 6306 Deep Groove Ball Bearing' },
        mainImage: '/bearings/img9.jpg',
        galleryImages: ['/bearings/imgg14.jpg', '/bearings/img4.jpg'],
      },
      {
        query: { name: 'HCH 6309 Deep Groove Ball Bearing' },
        mainImage: '/bearings/imgg14.jpg',
        galleryImages: ['/bearings/img6.jpg', '/bearings/img15.jpg'],
      },
      {
        query: { name: 'HCH 6306ZZ Shielded Bearing' },
        mainImage: '/bearings/img9.jpg',
        galleryImages: ['/bearings/img4.jpg', '/bearings/image12.jpg'],
      },
      {
        query: { name: 'Timken 6313 Open Type Bearing' },
        mainImage: '/bearings/img3.jpg',
        galleryImages: ['/bearings/imgg14.jpg', '/bearings/img15.jpg'],
      },
      {
        query: { name: 'SKF 7322 2X Angular Contact Ball Bearing Matched Set' },
        mainImage: '/bearings/img1.jpg',
        galleryImages: ['/bearings/img2.jpg', '/bearings/imgg14.jpg'],
      },
      {
        query: { name: 'SKF 7322 Angular Contact Ball Bearing' },
        mainImage: '/bearings/img2.jpg',
        galleryImages: ['/bearings/img1.jpg', '/bearings/imgg14.jpg'],
      },
    ];

    for (const b of bearingUpdates) {
      const res = await Service.updateOne(b.query, { $set: { mainImage: b.mainImage, galleryImages: b.galleryImages } });
      console.log(`[Update Script] Bearing "${b.query.name}" matched: ${res.matchedCount}`);
    }

    console.log('[Update Script] All images updated in MongoDB successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Update Script Error]', err);
    process.exit(1);
  }
}

updateImages();

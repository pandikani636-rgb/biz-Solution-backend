import { Service } from '../models/Service.js';
import { ServiceCategory } from '../models/ServiceCategory.js';
import { SiteSetting } from '../models/SiteSetting.js';

export const handleChatbotQuery = async (req, res, next) => {
  try {
    const { query = '', history = [], language = 'en' } = req.body;
    const cleanQuery = query.toLowerCase().trim();

    if (!cleanQuery) {
      return res.json({
        success: true,
        reply: language === 'ta'
          ? 'வணக்கம்! நான் பாலுமுனி அண்ட் அசோசியேட்ஸ் (BizZolution) உதவியாளர். தயாரிப்புகள், விலைகள் அல்லது ஆர்டர்கள் பற்றி நீங்கள் என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்?'
          : 'Hello! I am your BizZolution & Balumuni Associates AI Assistant. How can I help you today with bearings, belts, wholesale pricing, or order placement?',
        suggestions: ['Show Product Discounts', 'Available Brands', 'Contact Details', 'How to Order RFQ'],
      });
    }

    // Fetch live website data from database
    const [settings, categories, popularProducts] = await Promise.all([
      SiteSetting.findOne().lean(),
      ServiceCategory.find({ isActive: true }).select('name description').lean(),
      Service.find({ isActive: true }).select('name brand partNumber basePrice discountPrice discountPercentage mrp').limit(8).lean(),
    ]);

    const isTamil = language === 'ta' || /[அ-ஹ]/.test(query);

    let reply = '';
    let suggestions = [];
    let quickLink = null;

    // 1. Tagline / Tamil Quote
    if (cleanQuery.includes('tagline') || cleanQuery.includes('quote') || cleanQuery.includes('வாசகம்') || cleanQuery.includes('பயணம்') || cleanQuery.includes('நம்பிக்கை')) {
      reply = isTamil
        ? 'எங்கள் உத்தியோகபூர்வ தமிழ் வாசகம்:\n\n**"உங்கள் நம்பிக்கையில் எங்கள் பயணம்!"**\n\nஇந்த பொன்மொழி எங்கள் அனைத்து இன்வாய்ஸ்களிலும் அச்சிடப்பட்டுள்ளது.'
        : 'Our official brand motto printed at the bottom of every invoice is:\n\n**"உங்கள் நம்பிக்கையில் எங்கள் பயணம்!"**\n*(In Your Trust Lies Our Journey!)*';
      suggestions = ['Company Information', 'View Price List', 'Contact Us'];
    }

    // 2. Company Info / About Us
    else if (
      cleanQuery.includes('about') ||
      cleanQuery.includes('who are you') ||
      cleanQuery.includes('company') ||
      cleanQuery.includes('balumuni') ||
      cleanQuery.includes('bizzolution') ||
      cleanQuery.includes('பற்றி') ||
      cleanQuery.includes('நிறுவனம்')
    ) {
      reply = isTamil
        ? `**பாலுமுனி அண்ட் அசோசியேட்ஸ் (BizZolution)**\n\nநாங்கள் 18+ ஆண்டுகளுக்கும் மேலாக இந்தியாவில் இயங்கும் அங்கீகரிக்கப்பட்ட தொழில்துறை ஸ்டாக்கிஸ்ட் மற்றும் விநியோகஸ்தர். பிஐஎக்ஸ் (PIX), என்.பி.சி (NBC), எச்.சி.எச் (HCH), பென்னர் (Fenner), டிம்கென் (Timken) மற்றும் எஸ்.கே.எஃப் (SKF) ஆகிய புகழ்பெற்ற தயாரிப்புகளுக்கு 100% உண்மையான உதிரிபாகங்கள், இலவச டெல்லிவரி (Delhivery) சரக்கு போக்குவரத்து மற்றும் ஜிஎஸ்டி இன்வாய்ஸ் வழங்குகிறோம்.\n\n📍 முகவரி: 45B/16 நூருல்லா மால், ஊத்துமலை பரதேசிமடம் தெரு, ஸ்ரீவில்லிபுத்தூர் - 626125.`
        : `**Balumuni and Associates (BizZolution)** is an authorized industrial stockist and distributor with over 18 years of engineering legacy.\n\nWe specialize in mechanical power transmission and bearings: Industrial V-Belts, Deep Groove Ball Bearings, Angular Contact Bearings, and Taper Lock Bush Pulleys. Direct factory wholesale pricing (45%-48% off MRP) on PIX, NBC, HCH, Fenner, Timken, and SKF with pan-India insured Delhivery shipping included.\n\n📍 Headquarters: 45B/16 Noorullah Mall, Oothumalai Paradesimadam Street, Srivilliputtur, Virudhunagar Dist, Tamilnadu – 626125.`;
      suggestions = ['Available Brands', 'Wholesale Pricing', 'Contact Us'];
      quickLink = { label: 'About Us Page', url: '/about' };
    }

    // 3. Brands & Makes
    else if (
      cleanQuery.includes('brand') ||
      cleanQuery.includes('make') ||
      cleanQuery.includes('skf') ||
      cleanQuery.includes('pix') ||
      cleanQuery.includes('nbc') ||
      cleanQuery.includes('hch') ||
      cleanQuery.includes('fenner') ||
      cleanQuery.includes('timken') ||
      cleanQuery.includes('பிராண்ட்')
    ) {
      reply = isTamil
        ? `நாங்கள் 6 முன்னணி பிராண்டுகளை அதிகாரப்பூர்வமாக விநியோகிக்கிறோம்:\n\n1. **PIX** - இண்டஸ்ட்ரியல் பெல்ட்கள் (SPC, 8V, C 70) • 46% தள்ளுபடி\n2. **NBC** - ஹெவி சீரிஸ் பேரிங்ஸ் (6405ZZ C3) • 46% தள்ளுபடி\n3. **HCH** - எலக்ட்ரிக் மோட்டார் பால் பேரிங்ஸ் (6200/6300) • 46% தள்ளுபடி\n4. **Fenner** - புஷ் புல்லிகள் (200X3C) & PB பெல்ட்கள் • 46% தள்ளுபடி\n5. **Timken** - அனைத்து வகை இண்டஸ்ட்ரியல் பேரிங்ஸ் • 46% தள்ளுபடி\n6. **SKF** - ஆங்குலர் காண்டாக்ட் & பால் பேரிங்ஸ் (நேஷனல் & இம்போர்ட்டட்) • நேரடி 10% தள்ளுபடி`
        : `We stock and distribute 6 authorized industrial makes:\n\n1. **PIX Transmissions**: Narrow Wedge (SPC, 8V) & Classical V-Belts (45%-48% Off)\n2. **NBC Bearings**: Heavy Deep Groove (6405ZZ C3) (45%-48% Off)\n3. **HCH Bearings**: Deep Groove Ball Bearings & Matched Sets (6203, 6204, 6205, 6305) (45%-48% Off)\n4. **Fenner India**: Taper Lock Pulleys & PB Belts (45%-48% Off)\n5. **Timken**: Heavy Industrial Roller & Ball Bearings (45%-48% Off)\n6. **SKF Group**: Angular Contact (7322) & High-Precision Bearings (Flat 10% Off with QR code validation)`;
      suggestions = ['View MRP Price List', 'Request RFQ', 'Calculate Net Price'];
      quickLink = { label: 'Price List', url: '/price-list' };
    }

    // 4. Pricing, MRP Discounts & Percentage-Based Pricing
    else if (
      cleanQuery.includes('price') ||
      cleanQuery.includes('discount') ||
      cleanQuery.includes('rate') ||
      cleanQuery.includes('cost') ||
      cleanQuery.includes('mrp') ||
      cleanQuery.includes('percentage') ||
      cleanQuery.includes('விலை') ||
      cleanQuery.includes('தள்ளுபடி')
    ) {
      reply = isTamil
        ? `**எங்கள் மொத்த விலை தள்ளுபடி கொள்கை:**\n\n• **PIX, NBC, HCH, Fenner & Timken**: அதிகாரப்பூர்வ MRP பட்டியலிலிருந்து **45% - 48% நேரடி தள்ளுபடி**.\n• **SKF**: உலகளாவிய கடுமையான தரத்துடன் **10% நேரடி தள்ளுபடி**.\n• **டெல்லிவரி சரக்குக் கட்டணம்**: 100% இலவசம் (Free Delhivery Freight).\n• **புதிய வாடிக்கையாளர் விலை முறை**: புதிதாகப் பதிவு செய்யும் வாடிக்கையாளர்களுக்கு பிரத்யேக சதவீத விகித முறை பொருந்தும், ஏற்கனவே உள்ள பழைய வாடிக்கையாளர்களுக்கு இந்த கூடுதல் கட்டணம் விதிக்கப்படாது!`
        : `**Wholesale Pricing & Discount Policy:**\n\n• **Standard Makes (PIX, NBC, HCH, Fenner, Timken)**: Massive **45% - 48% OFF MRP List** with Free Delhivery freight included.\n• **SKF Genuine**: Strictly **Flat 10% OFF MRP** with factory authentication.\n• **GST Tax Invoices**: 18% Input Tax Credit provided on every purchase.\n• **New User Pricing Rate**: Newly registered clients receive an onboarding percentage-based rate, whereas existing users continue at standard wholesale rates without any surcharge!`;
      suggestions = ['Calculate Net Price', 'Request Bulk RFQ', 'Delhivery Shipping'];
      quickLink = { label: 'Live MRP Calculator', url: '/price-list' };
    }

    // 5. Contact, Address, Phone, Email
    else if (
      cleanQuery.includes('contact') ||
      cleanQuery.includes('phone') ||
      cleanQuery.includes('mobile') ||
      cleanQuery.includes('email') ||
      cleanQuery.includes('address') ||
      cleanQuery.includes('location') ||
      cleanQuery.includes('தொடர்பு') ||
      cleanQuery.includes('முகவரி') ||
      cleanQuery.includes('போன்')
    ) {
      const phone = settings?.contactPhone || '7418423238 / 9842670320';
      const email = settings?.contactEmail || 'balumuniandassociates@gmail.com';
      const address = '45B/16 Noorullah Mall, Oothumalai Paradesimadam Street, Srivilliputtur, Virudhunagar Dist, Tamilnadu – 626125';

      reply = isTamil
        ? `**எங்களை தொடர்பு கொள்ள:**\n\n📞 தொலைபேசி: **7418423238 / 9842670320**\n✉️ மின்னஞ்சல்: **${email}**\n📍 தலைமை அலுவலகம்: ${address}\n⏰ வேலை நேரம்: திங்கள் - சனி (9:00 AM - 7:00 PM IST)\n\nGSTIN: 33HONPK5547G2Z`
        : `**Contact Balumuni and Associates:**\n\n📞 Technical & Sales Desk: **7418423238 / 9842670320**\n✉️ Direct Email: **${email}**\n📍 Headquarters: ${address}\n⏰ Working Hours: Monday - Saturday (9:00 AM - 7:00 PM IST)\n\nGSTIN: 33HONPK5547G2Z`;
      suggestions = ['Contact Page', 'Submit Message', 'Request RFQ'];
      quickLink = { label: 'Contact Us', url: '/contact' };
    }

    // 6. Ordering Process & RFQ
    else if (
      cleanQuery.includes('order') ||
      cleanQuery.includes('rfq') ||
      cleanQuery.includes('quote') ||
      cleanQuery.includes('how to buy') ||
      cleanQuery.includes('ஆர்டர்') ||
      cleanQuery.includes('கொள்முதல்')
    ) {
      reply = isTamil
        ? `**ஆர்டர் செய்யும் எளிய முறைகள்:**\n\n1. **நேரடி ஆன்லைன் ஆர்டர்**: தயாரிப்புகள் பக்கத்தில் உங்கள் பகுதி எண் அல்லது உதிரிபாகத்தைத் தேர்வு செய்து உடனடியாக கார்டில் சேர்த்து புக் செய்யலாம்.\n2. **மொத்த விலைப்புள்ளி (RFQ)**: எங்கள் RFQ பக்கத்தில் தேவையான பகுதி எண்கள் (Part Numbers) மற்றும் அளவுகளைச் சமர்ப்பித்தால் 1 மணி நேரத்தில் அங்கீகரிக்கப்பட்ட அதிகாரப்பூர்வ ஜிஎஸ்டி கொட்டேஷன் அனுப்பி வைக்கப்படும்.\n3. **படத்தை பதிவேற்றுதல்**: உங்களிடம் உள்ள பேரிங் அல்லது பெல்ட்டின் புகைப்படத்தை (20 மெகாபிக்சல் வரை) முகப்பு பக்கத்தில் பதிவேற்றி விரைவான விலை பெறலாம்!`
        : `**How to Order & Request Quotations:**\n\n1. **Direct Catalog Booking**: Select your required part number on the Products page, choose specifications, and place your order.\n2. **Bulk RFQ Desk**: Submit your Bill of Materials (BOM) on our RFQ Desk for multi-brand volume orders. Formal quotation is issued within 1 hour.\n3. **High-Res Image Upload**: You can upload a photo of your required bearing, pulley, or worn belt (up to 20 Megapixels) directly on the Home page for rapid engineering assessment!`;
      suggestions = ['Request Bulk RFQ', 'Browse Catalog', 'Upload Part Image'];
      quickLink = { label: 'RFQ Desk', url: '/rfq' };
    }

    // 7. Fallback Intelligent Help
    else {
      reply = isTamil
        ? `உங்கள் கேள்விக்கு உதவ மகிழ்ச்சி அடைகிறேன். BizZolution / Balumuni & Associates மூலம் நீங்கள்:\n\n• PIX, NBC, HCH, Fenner, Timken, SKF பேரிங்ஸ் & பெல்ட்களை 45%-48% தள்ளுபடியில் பெறலாம்.\n• இலவச டெல்லிவரி போக்குவரத்து பெறலாம்.\n• உங்கள் உதிரிபாக படங்களை (20 MP வரை) பதிவேற்றி விலை பெறலாம்.\n• எங்களை 7418423238 என்ற எண்ணில் நேரடியாக அழைக்கலாம்.`
        : `I'd be glad to help with that. At Balumuni and Associates (BizZolution), we supply:\n\n• Genuine industrial bearings and belts from PIX, NBC, HCH, Fenner, Timken, and SKF at 45%-48% off MRP with free Delhivery freight.\n• Instant RFQ quotations within 1 hour.\n• High-resolution specification photo upload (up to 20 MP) on the Home page.\n• Direct technical assistance at 7418423238.`;
      suggestions = ['Browse Products', 'MRP Price List', 'Request RFQ', 'Contact Support'];
      quickLink = { label: 'Explore Products', url: '/services' };
    }

    res.json({
      success: true,
      reply,
      suggestions,
      quickLink,
    });
  } catch (error) {
    next(error);
  }
};

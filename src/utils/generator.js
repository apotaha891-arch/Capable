// generator.js

// Keyword matching helper
function matchesKeywords(text, keywords) {
  const lowercaseText = text.toLowerCase();
  return keywords.some(keyword => lowercaseText.includes(keyword));
}

// Extract name/detail from prompt to embed in title
function extractContextDetail(prompt, keywordsToStrip, lang) {
  let cleaned = prompt;
  keywordsToStrip.forEach(keyword => {
    cleaned = cleaned.replace(new RegExp(keyword, 'gi'), '');
  });
  cleaned = cleaned.trim();
  // Limit length
  if (cleaned.length > 0 && cleaned.length < 35) {
    return cleaned;
  }
  return lang === "ar" ? "مشروعك المتميز" : "Your Premium Space";
}

export function generateSiteFromPrompt(prompt, options = {}) {
  const lang = options.language || "ar";
  
  // 1. Detect Category
  let category = options.category || "business";
  if (category === "auto" || !options.category) {
    if (matchesKeywords(prompt, ["مطعم", "قهوة", "مقهى", "أكل", "وجبات", "برجر", "شاورما", "كوفي", "restaurant", "cafe", "food", "burger", "coffee", "bakery", "حلويات"])) {
      category = "restaurant";
    } else if (matchesKeywords(prompt, ["شخصي", "معرض أعمال", "سيرة", "مصمم", "مهندس", "مطور", "كاتب", "portfolio", "cv", "resume", "designer", "developer", "writer", "photographer"])) {
      category = "portfolio";
    } else if (matchesKeywords(prompt, ["تطبيق", "برنامج", "منصة", "تقنية", "سحابي", "app", "saas", "software", "platform", "tech", "startup"])) {
      category = "saas";
    } else {
      category = "business"; // fallback
    }
  }

  // 2. Detect Color Theme
  let theme = options.theme || "theme-corporate";
  if (theme === "auto" || !options.theme) {
    if (matchesKeywords(prompt, ["أحمر", "برتقالي", "دافئ", "غروب", "شمس", "red", "orange", "warm", "sunset", "burger", "grill", "مشاوي"])) {
      theme = "theme-sunset";
    } else if (matchesKeywords(prompt, ["أخضر", "زمرد", "بيج", "طبيعي", "قهوة", "كوفي", "green", "emerald", "beige", "natural", "coffee", "eco"])) {
      theme = "theme-emerald";
    } else if (matchesKeywords(prompt, ["مظلم", "بنفسجي", "غامق", "تقني", "مستقبل", "dark", "violet", "purple", "midnight", "tech", "cyber", "neon"])) {
      theme = "theme-midnight";
    } else {
      theme = "theme-corporate";
    }
  }

  // Define site typography based on language
  const font = lang === "ar" ? "font-arabic" : "font-english";

  // 3. Custom copywriting based on detected category
  let sections = [];
  
  if (lang === "ar") {
    // ARABIC GENERATOR
    const detail = extractContextDetail(prompt, ["موقع", "إنشاء", "أريد", "تصميم", "شركة", "مطعم", "مقهى", "معرض أعمال", "باللون", "الأحمر", "الأخضر", "الأزرق"], "ar");
    
    if (category === "restaurant") {
      sections = [
        {
          id: "hero",
          type: "hero",
          content: {
            title: `أهلاً بكم في ${detail !== "مشروعك المتميز" ? detail : "مذاق الأصالة"}`,
            subtitle: `نقدم لكم أشهى الوجبات والمشروبات المحضرة بعناية فائقة ووصفاتنا الفريدة لتستمتعوا بكل لقمة.`,
            ctaText: "احجز طاولتك الآن",
            ctaLink: "#contact"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "سر الجودة في مطبخنا",
            subtitle: "كل طبق نقدمه يحمل قصة حب وشغف بالطهي الأصيل",
            items: [
              { icon: "✨", title: "طازج وصحي", desc: "نحرص على استخدام أفضل المكونات الطازجة يومياً لسلامتكم ولذة طعامكم." },
              { icon: "🌶️", title: "نكهات مبتكرة", desc: "خلطات بهارات سرية وأساليب طهي حديثة تمنح أطباقنا مذاقاً لا ينسى." },
              { icon: "🛵", title: "توصيل سريع", desc: "نضمن وصول وجبتك ساخنة وطازجة لباب منزلك في أسرع وقت ممكن." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "أطباق ننصحك بتجربتها",
            subtitle: "قائمة مصغرة لأكثر الأطباق طلباً هذا الأسبوع",
            items: [
              { url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80", caption: "الوجبة الرئيسية الخاصة" },
              { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80", caption: "مقبلات مقرمشة طازجة" },
              { url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80", caption: "الحلوى المميزة بنكهة الكراميل" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "حجز طاولة أو طلب استفسار",
            subtitle: "يرجى ترك بياناتك وسيقوم فريق الضيافة لدينا بالتأكيد الفوري لحجزك.",
            fields: ["name", "phone", "date", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: `جميع الحقوق محفوظة © ${detail !== "مشروعك المتميز" ? detail : "مطعم المذاق الفاخر"} 2026`,
            links: "فيسبوك | إنستغرام | خرائط جوجل"
          }
        }
      ];
    } else if (category === "portfolio") {
      sections = [
        {
          id: "hero",
          type: "hero",
          content: {
            title: `معرض أعمال | ${detail !== "مشروعك المتميز" ? detail : "المصمم المبدع"}`,
            subtitle: "أحلم، أصمم، وأبني تجارب رقمية ذكية تبسط حياة المستخدمين وتساهم في نمو الشركات الناشئة.",
            ctaText: "شاهد معرض المشاريع",
            ctaLink: "#gallery"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "مجالات شغفي وعملي",
            subtitle: "المهارات الإبداعية التي أقدمها لمساعدتك في نجاح فكرتك الرقمية",
            items: [
              { icon: "💡", title: "مفهوم وتخطيط التصميم", desc: "أحلل متطلبات مشروعك وأبني خرائط تدفق المستخدم والهيكلية المبدئية." },
              { icon: "📐", title: "تصميم واجهات احترافية", desc: "تصميم عصري متناسق الألوان والخطوط متوافق تماماً مع جميع الشاشات." },
              { icon: "⚡", title: "بناء النماذج التفاعلية", desc: "صناعة نماذج سريعة ومتحركة تتيح لك تجربة موقعك قبل البدء بالبرمجة." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "نماذج من مشاريعي الأخيرة",
            subtitle: "معرض للأعمال التي تفخر روحي بإنجازها مؤخراً لعملائي",
            items: [
              { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80", caption: "منصة لوجستية وتتبع السائقين" },
              { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80", caption: "تطبيق تنظيم المواعيد الطبية" },
              { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80", caption: "صفحة هبوط تسويقية لشركة طيران" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "هل يعجبك عملي؟ لنتعاون معاً!",
            subtitle: "أنا متاح حالياً للمشاريع الحرة والاستشارات التقنية. تواصل معي الآن.",
            fields: ["name", "email", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: `© 2026 ${detail !== "مشروعك المتميز" ? detail : "المصمم المبدع"}. صنع بشغف ودقة.`,
            links: "لينكد إن | جيت هاب | تويتر"
          }
        }
      ];
    } else if (category === "saas") {
      sections = [
        {
          id: "hero",
          type: "hero",
          content: {
            title: detail !== "مشروعك المتميز" ? detail : "منصة ذكية لأتمتة أعمالك",
            subtitle: "نظام برمجي متكامل ومؤمن بالكامل يتيح لفريقك إدارة المهام، جدولة التقارير، وزيادة الإنتاجية بنسبة تصل إلى 40%.",
            ctaText: "ابدأ تجربتك المجانية الآن",
            ctaLink: "#contact"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "تقنيات تميز منصتنا",
            subtitle: "وفرنا لك كافة الأدوات لتسهيل إدارة أعمالك من مكان واحد",
            items: [
              { icon: "🛡️", title: "أمان بمستوى بنكي", desc: "تشفير كامل لكافة البيانات والملفات الحساسة لضمان سرية معلوماتك." },
              { icon: "📊", title: "لوحات تحكم ذكية", desc: "تقارير بيانية وتحليلات دقيقة يتم تحديثها تلقائياً لمساعدتك في اتخاذ القرار." },
              { icon: "🤝", title: "تكامل مع أدواتك المفضلة", desc: "ربط مباشر وسلس مع Slack, Gmail, Google Drive وغيرها في ثوانٍ." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "واجهات لوحة التحكم والتحليلات",
            subtitle: "تصميم بسيط وجذاب يسهل مهمة أعضاء فريقك يومياً",
            items: [
              { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80", caption: "شاشة الإحصائيات العامة للمتجر" },
              { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80", caption: "إدارة المهام وتوزيعها على الأعضاء" },
              { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80", caption: "منشئ التقارير التلقائية الأسبوعية" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "احجز جلسة عرض توضيحي (Demo)",
            subtitle: "املأ طلبك وسيقوم أحد مهندسي الحلول لدينا بالتواصل معك لجدولة اتصال وبث شاشة مباشر.",
            fields: ["name", "email", "phone", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: `حقوق النشر © 2026 منصة ${detail !== "مشروعك المتميز" ? detail : "الذكاء البرمجي"} لتطوير الأعمال`,
            links: "الشروط والأحكام | سياسة الخصوصية | المساعدة"
          }
        }
      ];
    } else {
      // Business corporate
      sections = [
        {
          id: "hero",
          type: "hero",
          content: {
            title: detail !== "مشروعك المتميز" ? detail : "حلول استشارية متكاملة لنمو شركتك",
            subtitle: "نساعد الشركات الكبرى والناشئة في تحقيق أهدافها المالية والتشغيلية عن طريق دراسات سوق وحلول استراتيجية مبتكرة.",
            ctaText: "تواصل مع مستشار أعمال",
            ctaLink: "#contact"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "لماذا يثق بنا كبار الشركاء؟",
            subtitle: "نلتزم بتقديم قيمة تشغيلية ملموسة ونتائج مبنية على أرقام دقيقة",
            items: [
              { icon: "🎯", title: "تخطيط استراتيجي دقيق", desc: "نضع خطط عمل واقعية وقابلة للتطبيق تضمن استدامة نشاطك التجاري." },
              { icon: "👥", title: "خبراء استشاريون", desc: "فريق استشاري بخبرة دولية ومحلية تمتد لأكثر من 15 عاماً في قطاعات متنوعة." },
              { icon: "💡", title: "ابتكار وحلول مرنة", desc: "نبتكر أساليب جديدة للتغلب على التحديات الاقتصادية والتشغيلية بكفاءة." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "من إنجازاتنا الاستشارية",
            subtitle: "لقطات من اجتماعات استراتيجية ومؤتمرات تطوير الأعمال التي أقمناها",
            items: [
              { url: "https://images.unsplash.com/photo-1542744094-2ab25be78b90?auto=format&fit=crop&w=400&q=80", caption: "منتدى قادة الأعمال وتطوير الشركات" },
              { url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80", caption: "ورشة عمل إعادة هيكلة الميزانية المالية" },
              { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80", caption: "تقديم التقرير السنوي لمجلس الإدارة" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "اطلب استشارتك الأولية مجاناً",
            subtitle: "يرجى تعبئة النموذج وسيقوم مستشار العلاقات لدينا بالتواصل معك لترتيب اللقاء الأول.",
            fields: ["name", "phone", "email", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: `جميع الحقوق محفوظة © ${detail !== "مشروعك المتميز" ? detail : "المستشار الوطني للأعمال"} 2026`,
            links: "خدماتنا | اتصل بنا | فروعنا"
          }
        }
      ];
    }
  } else {
    // ENGLISH GENERATOR
    const detail = extractContextDetail(prompt, ["website", "create", "i want", "design", "company", "restaurant", "cafe", "portfolio", "with", "color", "red", "green", "blue"], "en");
    
    if (category === "restaurant") {
      sections = [
        {
          id: "hero",
          type: "hero",
          content: {
            title: `Welcome to ${detail !== "Your Premium Space" ? detail : "The Taste Bistro"}`,
            subtitle: "We cook unique recipes and prepare delicious fresh meals using organic herbs and seasonal local ingredients.",
            ctaText: "Book Your Table",
            ctaLink: "#contact"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "Our Culinary Commitments",
            subtitle: "What makes our dishes taste extraordinarily rich and fresh",
            items: [
              { icon: "🥗", title: "Farm-to-Table Fresh", desc: "We receive fresh greens, organic vegetables, and premium meats from certified growers daily." },
              { icon: "👨‍🍳", title: "Master Craft Chefs", desc: "Our award winning kitchen staff blends traditional and contemporary recipes with pure love." },
              { icon: "🛵", title: "Express Hot Delivery", desc: "Specially packaged warm boxes shipped directly to your house in under 30 minutes." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "Popular Dining Selections",
            subtitle: "Browse the visual previews of our customer-favorite dishes this week",
            items: [
              { url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80", caption: "Herb Crusted Signature Ribeye" },
              { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80", caption: "Wood Fired Pizza Caprese" },
              { url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80", caption: "Signature Chocolate Lava Melt" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "Reserve a table with us",
            subtitle: "Input your name, phone, and time slot. Our hospitality host will text you confirmation in minutes.",
            fields: ["name", "phone", "date", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: `© 2026 ${detail !== "Your Premium Space" ? detail : "Taste Bistro"}. All rights reserved.`,
            links: "Instagram | Facebook | Google Maps"
          }
        }
      ];
    } else if (category === "portfolio") {
      sections = [
        {
          id: "hero",
          type: "hero",
          content: {
            title: `Creative Portfolio | ${detail !== "Your Premium Space" ? detail : "Designer Profile"}`,
            subtitle: "I design intuitive visual systems and build highly responsive interactive interfaces that solve real user needs.",
            ctaText: "Browse My Work",
            ctaLink: "#gallery"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "My Creative Services",
            subtitle: "High-value digital services tailored for your product success",
            items: [
              { icon: "💡", title: "Product Strategy & UX", desc: "Formulating user flow charts, wireframes, and validating accessibility requirements." },
              { icon: "📐", title: "Modern Brand & Web UI", desc: "Polished high-fidelity desktop and mobile layouts using tailored color systems." },
              { icon: "⚡", title: "Prototyping & Interactions", desc: "Creating clickable, responsive dynamic UI prototypes before moving to development." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "Recent Project Deliverables",
            subtitle: "A selected showcases of clients and startups I collaborated with",
            items: [
              { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80", caption: "SaaS Analytics Dashboard UI" },
              { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80", caption: "Cryptocurrency Exchange Interface" },
              { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80", caption: "Medical Appointment Application" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "Let's work together!",
            subtitle: "I am currently accepting freelance contracts and consulting bookings. Let's arrange a call.",
            fields: ["name", "email", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: `© 2026 ${detail !== "Your Premium Space" ? detail : "Designer Profile"}. Crafted with precision.`,
            links: "LinkedIn | GitHub | Twitter / X"
          }
        }
      ];
    } else if (category === "saas") {
      sections = [
        {
          id: "hero",
          type: "hero",
          content: {
            title: detail !== "Your Premium Space" ? detail : "Automate Your Workflow Seamlessly",
            subtitle: "An all-in-one secure cloud system designed to help teams schedule actions, compile analytics, and boost output by 40%.",
            ctaText: "Start Free Trial",
            ctaLink: "#contact"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "Supercharged Product Features",
            subtitle: "Everything you need to collaborate and monitor progress from one workspace",
            items: [
              { icon: "🛡️", title: "Enterprise Grade Security", desc: "Fully encrypted AES-256 data protection ensuring absolute privacy for your files." },
              { icon: "📊", title: "Real-Time Visual Graphs", desc: "Instantly compiled dashboard reports tracking active leads, conversions, and speed." },
              { icon: "🤝", title: "Native API Integrations", desc: "Connect smoothly with your current Slack, Google Drive, and Notion sheets in clicks." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "Inside the Workspace UI",
            subtitle: "Clean, minimal user interface designed for distraction-free performance",
            items: [
              { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80", caption: "Global Admin Reporting screen" },
              { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80", caption: "Team Sprint and Task boards" },
              { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80", caption: "Auto Report Compiler setup" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "Request a custom product Demo",
            subtitle: "Submit your corporate email, and one of our solutions engineers will reach out to schedule a live call.",
            fields: ["name", "email", "phone", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: `© 2026 ${detail !== "Your Premium Space" ? detail : "SaaS Automation"}. All rights reserved.`,
            links: "Terms | Privacy | Help Desk"
          }
        }
      ];
    } else {
      // Business/Corporate
      sections = [
        {
          id: "hero",
          type: "hero",
          content: {
            title: detail !== "Your Premium Space" ? detail : "Strategic Business Solutions for Success",
            subtitle: "We help brands and modern enterprises scale operations, structure finance, and implement profitable marketing plans.",
            ctaText: "Request Free Consulting",
            ctaLink: "#contact"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "Why Elite Partners Rely on Us",
            subtitle: "We focus on deliverable operations metrics and data-driven analysis",
            items: [
              { icon: "🎯", title: "Targeted Strategy", desc: "Custom strategic roadmaps built around realistic KPIs and market growth metrics." },
              { icon: "👥", title: "Veteran Advisors", desc: "A team of executive business consultants with 15+ years of cross-industry success." },
              { icon: "💡", title: "Adaptive Planning", desc: "Helping companies navigate shifts in regulatory, financial, and digital landscapes." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "Our Corporate Milestones",
            subtitle: "Glimpses from leadership summits, training workshops, and advisory boards",
            items: [
              { url: "https://images.unsplash.com/photo-1542744094-2ab25be78b90?auto=format&fit=crop&w=400&q=80", caption: "Strategic Board Alignment Summit" },
              { url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80", caption: "Corporate Restructuring Workshop" },
              { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80", caption: "Annual Performance Briefing" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "Schedule your initial audit",
            subtitle: "Fill out the contact form below, and our relations lead will email you to set up our introductory meeting.",
            fields: ["name", "phone", "email", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: `© 2026 ${detail !== "Your Premium Space" ? detail : "Corporate Advisory Group"}. All rights reserved.`,
            links: "Services | Contacts | Offices"
          }
        }
      ];
    }
  }

  // Compile final project model
  return {
    name: lang === "ar" ? `موقع ${detail !== "مشروعك المتميز" ? detail : "ذكي جديد"}` : `${detail !== "Your Premium Space" ? detail : "Smart Site"}`,
    description: lang === "ar" 
      ? `موقع ويب تم توليده تلقائياً بالذكاء الاصطناعي بناءً على وصف: "${prompt.slice(0, 30)}..."` 
      : `AI generated website configured from prompt: "${prompt.slice(0, 30)}..."`,
    theme: theme,
    font: font,
    language: lang,
    sections: sections
  };
}

// templates.js

export const templates = {
  ar: [
    {
      id: "tpl_portfolio",
      name: "معرض أعمال شخصي",
      description: "قالب نظيف وأنيق للمصممين والمطورين لعرض أعمالهم وخبراتهم.",
      theme: "theme-midnight",
      font: "font-arabic",
      sections: [
        {
          id: "hero",
          type: "hero",
          content: {
            title: "أصمم تجارب رقمية تترك أثراً باقياً",
            subtitle: "مرحباً، أنا مصمم واجهات ومطور مستقل. أساعد الشركات الناشئة في تحويل أفكارهم البرمجية إلى تصاميم وتطبيقات سريعة وجذابة.",
            ctaText: "تصفح أعمالي",
            ctaLink: "#gallery"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "خدماتي المتميزة",
            subtitle: "أقدم خدمات احترافية متكاملة تضمن تفوق منتجك الرقمي",
            items: [
              { icon: "🎨", title: "تصميم واجهات المستخدم (UI)", desc: "رسم واجهات جميلة وسهلة الاستخدام تناسب هويتك التجارية وتجذب عملائك." },
              { icon: "💻", title: "تطوير واجهات الويب (Frontend)", desc: "كتابة كود نظيف وسريع باستخدام أحدث التقنيات مثل React وVite." },
              { icon: "⚙️", title: "تحسين الأداء وتجربة المستخدم", desc: "تسريع تحميل الصفحات وتوفير تجربة سلسة للمستخدمين على جميع الأجهزة." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "معرض مشاريعي الأخيرة",
            subtitle: "مجموعة من التطبيقات والمواقع التي قمت بتصميمها وتطويرها مؤخراً",
            items: [
              { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80", caption: "تطبيق إدارة المهام والشركات" },
              { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80", caption: "منصة تداول العملات الرقمية" },
              { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80", caption: "موقع حجز خدمات وعيادات" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "هل لديك مشروع جديد؟ دعنا نتحدث!",
            subtitle: "املأ النموذج أدناه وسأقوم بالرد عليك خلال أقل من 24 ساعة لبدء التعاون.",
            fields: ["name", "email", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: "جميع الحقوق محفوظة © معرض أعمالي 2026",
            links: "تويتر | لينكد إن | جيت هاب"
          }
        }
      ]
    },
    {
      id: "tpl_resto",
      name: "مطعم ومقهى فاخر",
      description: "قالب مخصص للمطاعم يعرض الوجبات، الأسعار ونظام حجز الطاولات.",
      theme: "theme-sunset",
      font: "font-arabic",
      sections: [
        {
          id: "hero",
          type: "hero",
          content: {
            title: "مذاق فريد محضر بشغف وإتقان",
            subtitle: "نرحب بكم في مطعمنا حيث تلتقي النكهات الطازجة والمكونات الممتازة مع فن الطهي العصري لتجربة لا تنسى.",
            ctaText: "استكشف قائمة الطعام",
            ctaLink: "#gallery"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "مميزاتنا الفريدة",
            subtitle: "لماذا يفضلنا محبو النكهات الأصيلة دائماً؟",
            items: [
              { icon: "🥬", title: "مكونات طازجة 100%", desc: "نحصل على خضرواتنا ولحومنا يومياً من المزارع المحلية المعتمدة مباشرة." },
              { icon: "👨‍🍳", title: "طهاة محترفون", desc: "طهاة يمتلكون خبرة طويلة في تحضير الأطباق الشرقية والغربية المبتكرة." },
              { icon: "⭐", title: "أجواء عائلية مريحة", desc: "جلسات داخلية وخارجية هادئة مصممة لتوفر الخصوصية والراحة التامة لعائلتك." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "من أطباقنا الشهية",
            subtitle: "تصفح أحدث الوجبات والمشروبات المميزة لدينا",
            items: [
              { url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80", caption: "شرائح اللحم المشوية مع الأعشاب" },
              { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80", caption: "بيتزا نابولي بالفرن الحجري" },
              { url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80", caption: "كعكة الشوكولاتة الذائبة الفاخرة" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "احجز طاولتك الآن بسهولة",
            subtitle: "يرجى تحديد الاسم والهاتف والوقت لتأكيد الحجز وضمان طاولتك فور وصولك.",
            fields: ["name", "phone", "date", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: "جميع الحقوق محفوظة © مطعم المذاق الفاخر 2026",
            links: "إنستغرام | فيسبوك | خرائط جوجل"
          }
        }
      ]
    },
    {
      id: "tpl_agency",
      name: "وكالة تسويق رقمية",
      description: "تصميم متكامل للشركات لعرض الخدمات، آراء العملاء وباقات الأسعار.",
      theme: "theme-corporate",
      font: "font-arabic",
      sections: [
        {
          id: "hero",
          type: "hero",
          content: {
            title: "ننمي مشروعك التجاري ونضاعف مبيعاتك",
            subtitle: "وكالة تسويق رقمي متكاملة تساعدك في بناء هويتك والوصول لعملائك المستهدفين من خلال حملات إعلانية ذكية وتحليلات متقدمة.",
            ctaText: "احصل على استشارة مجانية",
            ctaLink: "#contact"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "خدماتنا الإستراتيجية",
            subtitle: "حلول تسويقية متكاملة مصممة خصيصاً لزيادة أرباحك وتوسيع نشاطك",
            items: [
              { icon: "📢", title: "إعلانات وسائل التواصل", desc: "إطلاق حملات إعلانية ممولة ومستهدفة بدقة على سناب شات، تيك توك، وإنستغرام." },
              { icon: "🎨", title: "صناعة المحتوى الإبداعي", desc: "كتابة نصوص تسويقية مقنعة وتصميم منشورات بصرية تعكس احترافية شركتك." },
              { icon: "📈", title: "تحسين محركات البحث SEO", desc: "تهيئة موقعك الإلكتروني ليتصدر النتائج الأولى في محرك بحث جوجل مجاناً." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "نجاحات نفخر بها",
            subtitle: "لقطات من حملاتنا التسويقية والشركات التي ساعدناها في النمو",
            items: [
              { url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80", caption: "ورشة عمل تحليل الأداء الاستراتيجي" },
              { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80", caption: "زيادة مبيعات متجر إلكتروني بنسبة 200%" },
              { url: "https://images.unsplash.com/photo-1542744094-2ab25be78b90?auto=format&fit=crop&w=400&q=80", caption: "إطلاق حملة ترويجية لمنتج وطني" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "ابدأ رحلة نمو مبيعاتك اليوم",
            subtitle: "دع فريق الخبراء لدينا يدرس موقعك الحالي ويقترح عليك حملة تجريبية مجانية.",
            fields: ["name", "phone", "email", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: "جميع الحقوق محفوظة © وكالة ريادة التسويقية 2026",
            links: "اتصل بنا | المدونة | وظائف شاغرة"
          }
        }
      ]
    }
  ],
  en: [
    {
      id: "tpl_portfolio",
      name: "Personal Portfolio",
      description: "A sleek, modern design for designers and developers to show their works and skills.",
      theme: "theme-midnight",
      font: "font-english",
      sections: [
        {
          id: "hero",
          type: "hero",
          content: {
            title: "I craft digital experiences that last",
            subtitle: "Hello, I am a product designer and frontend engineer. I help startups build scalable SaaS tools and interactive consumer apps.",
            ctaText: "View My Works",
            ctaLink: "#gallery"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "Expertise Services",
            subtitle: "High quality professional services for modern digital solutions",
            items: [
              { icon: "🎨", title: "UI/UX Design", desc: "Translating complex functional ideas into interactive, visually appealing design screens." },
              { icon: "💻", title: "Frontend Engineering", desc: "Writing accessible, high-performance web code using modern tools like Vite and Tailwind." },
              { icon: "⚙️", title: "Technical Consulting", desc: "Auditing page load times, responsive UI patterns, and core SEO structure configurations." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "Featured Case Studies",
            subtitle: "Recent projects delivered to global clients and brands",
            items: [
              { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80", caption: "FinTech Cloud Platform" },
              { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80", caption: "Mobile Delivery Wallet App" },
              { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80", caption: "Healthcare Telemedicine App" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "Let's collaborate on your project",
            subtitle: "Fill out the contact sheet below and I'll get back to you within 24 hours to schedule a discovery call.",
            fields: ["name", "email", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: "© 2026 Portfolio Core. All rights reserved.",
            links: "Twitter / X | LinkedIn | GitHub"
          }
        }
      ]
    },
    {
      id: "tpl_resto",
      name: "Gourmet Restaurant & Cafe",
      description: "Custom template for diners showcasing menus, pricing grids, and table reservation booking.",
      theme: "theme-sunset",
      font: "font-english",
      sections: [
        {
          id: "hero",
          type: "hero",
          content: {
            title: "Delicious flavors crafted with passion",
            subtitle: "Indulge in a premium dining experience where fresh ingredients, fine spices, and contemporary cooking meet in harmony.",
            ctaText: "Browse Culinary Menu",
            ctaLink: "#gallery"
          }
        },
        {
          id: "features",
          type: "features",
          content: {
            title: "Our Fine Attributes",
            subtitle: "What sets our kitchen apart from typical dining spots",
            items: [
              { icon: "🥬", title: "100% Organic Produce", desc: "Sourcing crisp greens and premium meat cuts directly from certified local farms." },
              { icon: "👨‍🍳", title: "World-Class Chefs", desc: "Our award-winning culinary team specializes in blending global spices and techniques." },
              { icon: "⭐", title: "Cozy Dining Ambience", desc: "Warm lighting, soft jazz, and private lounge options to ensure a relaxing family lunch or date." }
            ]
          }
        },
        {
          id: "gallery",
          type: "gallery",
          content: {
            title: "Our Signature Selections",
            subtitle: "A quick glimpse into our customer-favorite dishes",
            items: [
              { url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80", caption: "Rosemary Infused Ribeye Steak" },
              { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80", caption: "Stone Oven Neapolitan Pizza" },
              { url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80", caption: "Molten Lava Chocolate Cake" }
            ]
          }
        },
        {
          id: "contact",
          type: "contact",
          content: {
            title: "Reserve your dining table",
            subtitle: "Specify your arrival details and party size, and we'll secure the best table for your group.",
            fields: ["name", "phone", "date", "notes"]
          }
        },
        {
          id: "footer",
          type: "footer",
          content: {
            text: "© 2026 Gourmet Grill Bistro. All rights reserved.",
            links: "Instagram | Facebook | Google Maps"
          }
        }
      ]
    }
  ]
};

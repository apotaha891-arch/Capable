// storage.js

// Generate a random UUID
function generateUUID() {
  return 'site_' + Math.random().toString(36).substr(2, 9);
}

// Initial default system projects (for a stunning dashboard right out of the box)
const DEFAULT_SYSTEM_PROJECTS = [
  {
    id: "sys_resto_sunset",
    name: "مطعم مشاوي البركة | Baraka Grill",
    description: "موقع مطعم مشويات فاخر بلون الغروب الدافئ، يحتوي على قائمة أطباق وتواصل مباشر ونظام حجز.",
    theme: "theme-sunset",
    font: "font-arabic",
    isPublic: true,
    isSystem: true,
    clones: 34,
    language: "ar",
    sections: [
      {
        id: "hero",
        type: "hero",
        content: {
          title: "أشهى المشويات الحلبية على الفحم الأصيل",
          subtitle: "نقدم لكم تشكيلة واسعة من الكباب، الأوصال، والريش المتبلة بخلطتنا السرية، لتجربة طعم لا تُنسى.",
          ctaText: "حجز طاولة الآن",
          ctaLink: "#contact"
        }
      },
      {
        id: "features",
        type: "features",
        content: {
          title: "لماذا تختار مشاوي البركة؟",
          subtitle: "سر الجودة والتميز في أطباقنا اليومية الطازجة",
          items: [
            { icon: "🥩", title: "لحوم محلية طازجة", desc: "نستخدم اللحوم البلدية المعتمدة والمنتقاة بعناية فائقة يومياً." },
            { icon: "🔥", title: "شواء على الفحم", desc: "نطهو بالطرق التقليدية على فحم طبيعي لنكهة دخانية لا تقاوم." },
            { icon: "🥗", title: "مقبلات شهية", desc: "تشكيلة من حمص بيروتي، متبل، وسلطات شامية منعشة مجاناً مع الوجبات." }
          ]
        }
      },
      {
        id: "gallery",
        type: "gallery",
        content: {
          title: "من أطباقنا المميزة",
          subtitle: "شاهد المعرض لتفتح شهيتك وتختار وجبتك القادمة",
          items: [
            { url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80", caption: "مشاوي مشكلة فاخرة" },
            { url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80", caption: "ريش متبلة على الجمر" },
            { url: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=400&q=80", caption: "مقبلات وسلطات مشكلة" }
          ]
        }
      },
      {
        id: "contact",
        type: "contact",
        content: {
          title: "حجز طاولة وتواصل مباشر",
          subtitle: "يسعدنا استقبالكم أو حجز طلباتكم الخارجية بكل سرور",
          fields: ["name", "phone", "date", "notes"]
        }
      },
      {
        id: "footer",
        type: "footer",
        content: {
          text: "جميع الحقوق محفوظة © مطعم مشاوي البركة 2026",
          links: "اتفاقية الاستخدام | سياسة الخصوصية"
        }
      }
    ],
    deployed: {
      isDeployed: true,
      subdomain: "baraka-grill",
      customDomain: "www.barakagrill.com",
      dnsVerified: true,
      webhookUrl: "https://hook.us1.make.com/mockresto123"
    }
  },
  {
    id: "sys_portfolio_agency",
    name: "PixelCraft Creative Agency",
    description: "A futuristic digital design agency template featuring neon gradients, modern features list, and interactive leads webhook form.",
    theme: "theme-midnight",
    font: "font-english",
    isPublic: true,
    isSystem: true,
    clones: 89,
    language: "en",
    sections: [
      {
        id: "hero",
        type: "hero",
        content: {
          title: "We craft futuristic digital interfaces",
          subtitle: "High-performance websites, premium application design, and modern brand development to help your product dominate the market.",
          ctaText: "Get in Touch",
          ctaLink: "#contact"
        }
      },
      {
        id: "features",
        type: "features",
        content: {
          title: "Our Core Capabilities",
          subtitle: "Explore how we help tech companies scale and stand out",
          items: [
            { icon: "✨", title: "Premium UI/UX Design", desc: "Stunning visual mockups, wireframes, and production-ready component code bases." },
            { icon: "🚀", title: "Vite & React Engineering", desc: "Supercharged fast frontend frameworks with highly secure architecture." },
            { icon: "📈", title: "SEO Optimization", desc: "Boost organic discovery and conversion rates using structure markup models." }
          ]
        }
      },
      {
        id: "gallery",
        type: "gallery",
        content: {
          title: "Recent Case Studies",
          subtitle: "Selected client deliverables built from scratch",
          items: [
            { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80", caption: "SaaS Analytics Dashboard" },
            { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80", caption: "Cryptocurrency Exchange App" },
            { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80", caption: "E-Commerce Experience Design" }
          ]
        }
      },
      {
        id: "contact",
        type: "contact",
        content: {
          title: "Let's work together",
          subtitle: "Tell us about your project and we'll schedule a discovery workshop",
          fields: ["name", "email", "notes"]
        }
      },
      {
        id: "footer",
        type: "footer",
        content: {
          text: "© 2026 PixelCraft Digital Agency. All rights reserved.",
          links: "Terms of Service | Privacy Policy"
        }
      }
    ],
    deployed: {
      isDeployed: true,
      subdomain: "pixelcraft",
      customDomain: "",
      dnsVerified: false,
      webhookUrl: "https://n8n.myagency.io/webhooks/pixelcraft"
    }
  }
];

export const storage = {
  // Lang manager
  getLang() {
    return localStorage.getItem("cabable_lang") || "ar";
  },
  
  setLang(lang) {
    localStorage.setItem("cabable_lang", lang);
  },

  // Projects list manager
  getProjects() {
    let projects = localStorage.getItem("cabable_projects");
    if (!projects) {
      // First run: populate with system defaults
      localStorage.setItem("cabable_projects", JSON.stringify(DEFAULT_SYSTEM_PROJECTS));
      return DEFAULT_SYSTEM_PROJECTS;
    }
    try {
      const parsed = JSON.parse(projects);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return DEFAULT_SYSTEM_PROJECTS;
    } catch (e) {
      return DEFAULT_SYSTEM_PROJECTS;
    }
  },

  saveProjects(projects) {
    localStorage.setItem("cabable_projects", JSON.stringify(projects));
  },

  getProjectById(id) {
    const projects = this.getProjects();
    return projects.find(p => p.id === id);
  },

  saveProject(project) {
    const projects = this.getProjects();
    const idx = projects.findIndex(p => p.id === project.id);
    
    if (idx !== -1) {
      projects[idx] = project;
    } else {
      projects.push(project);
    }
    
    this.saveProjects(projects);
  },

  createProject(name, description, theme, font, language, sections = []) {
    const newProj = {
      id: generateUUID(),
      name: name || "My New Project",
      description: description || "",
      theme: theme || "theme-corporate",
      font: font || (language === "ar" ? "font-arabic" : "font-english"),
      isPublic: false,
      clones: 0,
      language: language || "ar",
      sections: sections,
      deployed: {
        isDeployed: false,
        subdomain: "",
        customDomain: "",
        dnsVerified: false,
        webhookUrl: ""
      }
    };
    
    this.saveProject(newProj);
    return newProj;
  },

  cloneProject(projectId) {
    const projects = this.getProjects();
    const target = projects.find(p => p.id === projectId);
    if (!target) return null;

    // Increment clone counter on the original if it's stored in local
    target.clones = (target.clones || 0) + 1;
    
    // Create new clone project copy
    const cloned = JSON.parse(JSON.stringify(target));
    cloned.id = generateUUID();
    cloned.name = `${cloned.name} (Copy / نسخة)`;
    cloned.isPublic = false;
    cloned.clones = 0;
    cloned.isSystem = false; // Mark user copy
    cloned.deployed = {
      isDeployed: false,
      subdomain: "",
      customDomain: "",
      dnsVerified: false,
      webhookUrl: target.deployed?.webhookUrl || ""
    };

    projects.push(cloned);
    this.saveProjects(projects);
    return cloned;
  },

  deleteProject(id) {
    let projects = this.getProjects();
    projects = projects.filter(p => p.id !== id);
    this.saveProjects(projects);
  },

  getPublicProjects() {
    return this.getProjects().filter(p => p.isPublic);
  }
};

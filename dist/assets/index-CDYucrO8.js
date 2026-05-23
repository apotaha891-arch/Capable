(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))e(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&e(r)}).observe(document,{childList:!0,subtree:!0});function s(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function e(n){if(n.ep)return;n.ep=!0;const o=s(n);fetch(n.href,o)}})();function N(){return"site_"+Math.random().toString(36).substr(2,9)}const M=[{id:"sys_resto_sunset",name:"مطعم مشاوي البركة | Baraka Grill",description:"موقع مطعم مشويات فاخر بلون الغروب الدافئ، يحتوي على قائمة أطباق وتواصل مباشر ونظام حجز.",theme:"theme-sunset",font:"font-arabic",isPublic:!0,isSystem:!0,clones:34,language:"ar",sections:[{id:"hero",type:"hero",content:{title:"أشهى المشويات الحلبية على الفحم الأصيل",subtitle:"نقدم لكم تشكيلة واسعة من الكباب، الأوصال، والريش المتبلة بخلطتنا السرية، لتجربة طعم لا تُنسى.",ctaText:"حجز طاولة الآن",ctaLink:"#contact"}},{id:"features",type:"features",content:{title:"لماذا تختار مشاوي البركة؟",subtitle:"سر الجودة والتميز في أطباقنا اليومية الطازجة",items:[{icon:"🥩",title:"لحوم محلية طازجة",desc:"نستخدم اللحوم البلدية المعتمدة والمنتقاة بعناية فائقة يومياً."},{icon:"🔥",title:"شواء على الفحم",desc:"نطهو بالطرق التقليدية على فحم طبيعي لنكهة دخانية لا تقاوم."},{icon:"🥗",title:"مقبلات شهية",desc:"تشكيلة من حمص بيروتي، متبل، وسلطات شامية منعشة مجاناً مع الوجبات."}]}},{id:"gallery",type:"gallery",content:{title:"من أطباقنا المميزة",subtitle:"شاهد المعرض لتفتح شهيتك وتختار وجبتك القادمة",items:[{url:"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80",caption:"مشاوي مشكلة فاخرة"},{url:"https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",caption:"ريش متبلة على الجمر"},{url:"https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=400&q=80",caption:"مقبلات وسلطات مشكلة"}]}},{id:"contact",type:"contact",content:{title:"حجز طاولة وتواصل مباشر",subtitle:"يسعدنا استقبالكم أو حجز طلباتكم الخارجية بكل سرور",fields:["name","phone","date","notes"]}},{id:"footer",type:"footer",content:{text:"جميع الحقوق محفوظة © مطعم مشاوي البركة 2026",links:"اتفاقية الاستخدام | سياسة الخصوصية"}}],deployed:{isDeployed:!0,subdomain:"baraka-grill",customDomain:"www.barakagrill.com",dnsVerified:!0,webhookUrl:"https://hook.us1.make.com/mockresto123"}},{id:"sys_portfolio_agency",name:"PixelCraft Creative Agency",description:"A futuristic digital design agency template featuring neon gradients, modern features list, and interactive leads webhook form.",theme:"theme-midnight",font:"font-english",isPublic:!0,isSystem:!0,clones:89,language:"en",sections:[{id:"hero",type:"hero",content:{title:"We craft futuristic digital interfaces",subtitle:"High-performance websites, premium application design, and modern brand development to help your product dominate the market.",ctaText:"Get in Touch",ctaLink:"#contact"}},{id:"features",type:"features",content:{title:"Our Core Capabilities",subtitle:"Explore how we help tech companies scale and stand out",items:[{icon:"✨",title:"Premium UI/UX Design",desc:"Stunning visual mockups, wireframes, and production-ready component code bases."},{icon:"🚀",title:"Vite & React Engineering",desc:"Supercharged fast frontend frameworks with highly secure architecture."},{icon:"📈",title:"SEO Optimization",desc:"Boost organic discovery and conversion rates using structure markup models."}]}},{id:"gallery",type:"gallery",content:{title:"Recent Case Studies",subtitle:"Selected client deliverables built from scratch",items:[{url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",caption:"SaaS Analytics Dashboard"},{url:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",caption:"Cryptocurrency Exchange App"},{url:"https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80",caption:"E-Commerce Experience Design"}]}},{id:"contact",type:"contact",content:{title:"Let's work together",subtitle:"Tell us about your project and we'll schedule a discovery workshop",fields:["name","email","notes"]}},{id:"footer",type:"footer",content:{text:"© 2026 PixelCraft Digital Agency. All rights reserved.",links:"Terms of Service | Privacy Policy"}}],deployed:{isDeployed:!0,subdomain:"pixelcraft",customDomain:"",dnsVerified:!1,webhookUrl:"https://n8n.myagency.io/webhooks/pixelcraft"}}],T={getLang(){return localStorage.getItem("cabable_lang")||"ar"},setLang(i){localStorage.setItem("cabable_lang",i)},getProjects(){let i=localStorage.getItem("cabable_projects");if(!i)return localStorage.setItem("cabable_projects",JSON.stringify(M)),M;try{return JSON.parse(i)}catch{return M}},saveProjects(i){localStorage.setItem("cabable_projects",JSON.stringify(i))},getProjectById(i){return this.getProjects().find(s=>s.id===i)},saveProject(i){const t=this.getProjects(),s=t.findIndex(e=>e.id===i.id);s!==-1?t[s]=i:t.push(i),this.saveProjects(t)},createProject(i,t,s,e,n,o=[]){const r={id:N(),name:i||"My New Project",description:t||"",theme:s||"theme-corporate",font:e||(n==="ar"?"font-arabic":"font-english"),isPublic:!1,clones:0,language:n||"ar",sections:o,deployed:{isDeployed:!1,subdomain:"",customDomain:"",dnsVerified:!1,webhookUrl:""}};return this.saveProject(r),r},cloneProject(i){var n;const t=this.getProjects(),s=t.find(o=>o.id===i);if(!s)return null;s.clones=(s.clones||0)+1;const e=JSON.parse(JSON.stringify(s));return e.id=N(),e.name=`${e.name} (Copy / نسخة)`,e.isPublic=!1,e.clones=0,e.isSystem=!1,e.deployed={isDeployed:!1,subdomain:"",customDomain:"",dnsVerified:!1,webhookUrl:((n=s.deployed)==null?void 0:n.webhookUrl)||""},t.push(e),this.saveProjects(t),e},deleteProject(i){let t=this.getProjects();t=t.filter(s=>s.id!==i),this.saveProjects(t)},getPublicProjects(){return this.getProjects().filter(i=>i.isPublic)}};function R(i,t,s){const e=i.translations,n=`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  `,o=i.currentView==="editor"?`<button class="btn btn-secondary btn-sm" id="nav-back-dash">
         ${e.dashboard}
       </button>`:"",r=`
    <nav class="navbar">
      <div class="nav-brand" id="nav-brand-logo">
        ${n}
        <span>${e.appName}</span>
        <span class="badge badge-primary btn-sm" style="font-size: 0.65rem; padding: 2px 8px;">BETA</span>
      </div>
      
      <div class="nav-links">
        ${o}
        <button class="btn btn-secondary btn-sm" id="nav-lang-toggle" style="font-family: ${i.lang==="ar"?"var(--font-english)":"var(--font-arabic)"}">
          🌐 ${e.langToggle}
        </button>
      </div>
    </nav>
  `;return setTimeout(()=>{const a=document.getElementById("nav-brand-logo");a&&a.addEventListener("click",()=>{t("dashboard")});const p=document.getElementById("nav-back-dash");p&&p.addEventListener("click",()=>{t("dashboard")});const l=document.getElementById("nav-lang-toggle");l&&l.addEventListener("click",()=>{s()})},0),r}function D(i,t){const s=i.toLowerCase();return t.some(e=>s.includes(e))}function W(i,t,s){let e=i;return t.forEach(n=>{e=e.replace(new RegExp(n,"gi"),"")}),e=e.trim(),e.length>0&&e.length<35?e:s==="ar"?"مشروعك المتميز":"Your Premium Space"}function Y(i,t={}){const s=t.language||"ar";let e=t.category||"business";(e==="auto"||!t.category)&&(D(i,["مطعم","قهوة","مقهى","أكل","وجبات","برجر","شاورما","كوفي","restaurant","cafe","food","burger","coffee","bakery","حلويات"])?e="restaurant":D(i,["شخصي","معرض أعمال","سيرة","مصمم","مهندس","مطور","كاتب","portfolio","cv","resume","designer","developer","writer","photographer"])?e="portfolio":D(i,["تطبيق","برنامج","منصة","تقنية","سحابي","app","saas","software","platform","tech","startup"])?e="saas":e="business");let n=t.theme||"theme-corporate";(n==="auto"||!t.theme)&&(D(i,["أحمر","برتقالي","دافئ","غروب","شمس","red","orange","warm","sunset","burger","grill","مشاوي"])?n="theme-sunset":D(i,["أخضر","زمرد","بيج","طبيعي","قهوة","كوفي","green","emerald","beige","natural","coffee","eco"])?n="theme-emerald":D(i,["مظلم","بنفسجي","غامق","تقني","مستقبل","dark","violet","purple","midnight","tech","cyber","neon"])?n="theme-midnight":n="theme-corporate");const o=s==="ar"?"font-arabic":"font-english";let r=[];if(s==="ar"){const a=W(i,["موقع","إنشاء","أريد","تصميم","شركة","مطعم","مقهى","معرض أعمال","باللون","الأحمر","الأخضر","الأزرق"],"ar");e==="restaurant"?r=[{id:"hero",type:"hero",content:{title:`أهلاً بكم في ${a!=="مشروعك المتميز"?a:"مذاق الأصالة"}`,subtitle:"نقدم لكم أشهى الوجبات والمشروبات المحضرة بعناية فائقة ووصفاتنا الفريدة لتستمتعوا بكل لقمة.",ctaText:"احجز طاولتك الآن",ctaLink:"#contact"}},{id:"features",type:"features",content:{title:"سر الجودة في مطبخنا",subtitle:"كل طبق نقدمه يحمل قصة حب وشغف بالطهي الأصيل",items:[{icon:"✨",title:"طازج وصحي",desc:"نحرص على استخدام أفضل المكونات الطازجة يومياً لسلامتكم ولذة طعامكم."},{icon:"🌶️",title:"نكهات مبتكرة",desc:"خلطات بهارات سرية وأساليب طهي حديثة تمنح أطباقنا مذاقاً لا ينسى."},{icon:"🛵",title:"توصيل سريع",desc:"نضمن وصول وجبتك ساخنة وطازجة لباب منزلك في أسرع وقت ممكن."}]}},{id:"gallery",type:"gallery",content:{title:"أطباق ننصحك بتجربتها",subtitle:"قائمة مصغرة لأكثر الأطباق طلباً هذا الأسبوع",items:[{url:"https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",caption:"الوجبة الرئيسية الخاصة"},{url:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",caption:"مقبلات مقرمشة طازجة"},{url:"https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80",caption:"الحلوى المميزة بنكهة الكراميل"}]}},{id:"contact",type:"contact",content:{title:"حجز طاولة أو طلب استفسار",subtitle:"يرجى ترك بياناتك وسيقوم فريق الضيافة لدينا بالتأكيد الفوري لحجزك.",fields:["name","phone","date","notes"]}},{id:"footer",type:"footer",content:{text:`جميع الحقوق محفوظة © ${a!=="مشروعك المتميز"?a:"مطعم المذاق الفاخر"} 2026`,links:"فيسبوك | إنستغرام | خرائط جوجل"}}]:e==="portfolio"?r=[{id:"hero",type:"hero",content:{title:`معرض أعمال | ${a!=="مشروعك المتميز"?a:"المصمم المبدع"}`,subtitle:"أحلم، أصمم، وأبني تجارب رقمية ذكية تبسط حياة المستخدمين وتساهم في نمو الشركات الناشئة.",ctaText:"شاهد معرض المشاريع",ctaLink:"#gallery"}},{id:"features",type:"features",content:{title:"مجالات شغفي وعملي",subtitle:"المهارات الإبداعية التي أقدمها لمساعدتك في نجاح فكرتك الرقمية",items:[{icon:"💡",title:"مفهوم وتخطيط التصميم",desc:"أحلل متطلبات مشروعك وأبني خرائط تدفق المستخدم والهيكلية المبدئية."},{icon:"📐",title:"تصميم واجهات احترافية",desc:"تصميم عصري متناسق الألوان والخطوط متوافق تماماً مع جميع الشاشات."},{icon:"⚡",title:"بناء النماذج التفاعلية",desc:"صناعة نماذج سريعة ومتحركة تتيح لك تجربة موقعك قبل البدء بالبرمجة."}]}},{id:"gallery",type:"gallery",content:{title:"نماذج من مشاريعي الأخيرة",subtitle:"معرض للأعمال التي تفخر روحي بإنجازها مؤخراً لعملائي",items:[{url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",caption:"منصة لوجستية وتتبع السائقين"},{url:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",caption:"تطبيق تنظيم المواعيد الطبية"},{url:"https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80",caption:"صفحة هبوط تسويقية لشركة طيران"}]}},{id:"contact",type:"contact",content:{title:"هل يعجبك عملي؟ لنتعاون معاً!",subtitle:"أنا متاح حالياً للمشاريع الحرة والاستشارات التقنية. تواصل معي الآن.",fields:["name","email","notes"]}},{id:"footer",type:"footer",content:{text:`© 2026 ${a!=="مشروعك المتميز"?a:"المصمم المبدع"}. صنع بشغف ودقة.`,links:"لينكد إن | جيت هاب | تويتر"}}]:e==="saas"?r=[{id:"hero",type:"hero",content:{title:a!=="مشروعك المتميز"?a:"منصة ذكية لأتمتة أعمالك",subtitle:"نظام برمجي متكامل ومؤمن بالكامل يتيح لفريقك إدارة المهام، جدولة التقارير، وزيادة الإنتاجية بنسبة تصل إلى 40%.",ctaText:"ابدأ تجربتك المجانية الآن",ctaLink:"#contact"}},{id:"features",type:"features",content:{title:"تقنيات تميز منصتنا",subtitle:"وفرنا لك كافة الأدوات لتسهيل إدارة أعمالك من مكان واحد",items:[{icon:"🛡️",title:"أمان بمستوى بنكي",desc:"تشفير كامل لكافة البيانات والملفات الحساسة لضمان سرية معلوماتك."},{icon:"📊",title:"لوحات تحكم ذكية",desc:"تقارير بيانية وتحليلات دقيقة يتم تحديثها تلقائياً لمساعدتك في اتخاذ القرار."},{icon:"🤝",title:"تكامل مع أدواتك المفضلة",desc:"ربط مباشر وسلس مع Slack, Gmail, Google Drive وغيرها في ثوانٍ."}]}},{id:"gallery",type:"gallery",content:{title:"واجهات لوحة التحكم والتحليلات",subtitle:"تصميم بسيط وجذاب يسهل مهمة أعضاء فريقك يومياً",items:[{url:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",caption:"شاشة الإحصائيات العامة للمتجر"},{url:"https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80",caption:"إدارة المهام وتوزيعها على الأعضاء"},{url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",caption:"منشئ التقارير التلقائية الأسبوعية"}]}},{id:"contact",type:"contact",content:{title:"احجز جلسة عرض توضيحي (Demo)",subtitle:"املأ طلبك وسيقوم أحد مهندسي الحلول لدينا بالتواصل معك لجدولة اتصال وبث شاشة مباشر.",fields:["name","email","phone","notes"]}},{id:"footer",type:"footer",content:{text:`حقوق النشر © 2026 منصة ${a!=="مشروعك المتميز"?a:"الذكاء البرمجي"} لتطوير الأعمال`,links:"الشروط والأحكام | سياسة الخصوصية | المساعدة"}}]:r=[{id:"hero",type:"hero",content:{title:a!=="مشروعك المتميز"?a:"حلول استشارية متكاملة لنمو شركتك",subtitle:"نساعد الشركات الكبرى والناشئة في تحقيق أهدافها المالية والتشغيلية عن طريق دراسات سوق وحلول استراتيجية مبتكرة.",ctaText:"تواصل مع مستشار أعمال",ctaLink:"#contact"}},{id:"features",type:"features",content:{title:"لماذا يثق بنا كبار الشركاء؟",subtitle:"نلتزم بتقديم قيمة تشغيلية ملموسة ونتائج مبنية على أرقام دقيقة",items:[{icon:"🎯",title:"تخطيط استراتيجي دقيق",desc:"نضع خطط عمل واقعية وقابلة للتطبيق تضمن استدامة نشاطك التجاري."},{icon:"👥",title:"خبراء استشاريون",desc:"فريق استشاري بخبرة دولية ومحلية تمتد لأكثر من 15 عاماً في قطاعات متنوعة."},{icon:"💡",title:"ابتكار وحلول مرنة",desc:"نبتكر أساليب جديدة للتغلب على التحديات الاقتصادية والتشغيلية بكفاءة."}]}},{id:"gallery",type:"gallery",content:{title:"من إنجازاتنا الاستشارية",subtitle:"لقطات من اجتماعات استراتيجية ومؤتمرات تطوير الأعمال التي أقمناها",items:[{url:"https://images.unsplash.com/photo-1542744094-2ab25be78b90?auto=format&fit=crop&w=400&q=80",caption:"منتدى قادة الأعمال وتطوير الشركات"},{url:"https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80",caption:"ورشة عمل إعادة هيكلة الميزانية المالية"},{url:"https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80",caption:"تقديم التقرير السنوي لمجلس الإدارة"}]}},{id:"contact",type:"contact",content:{title:"اطلب استشارتك الأولية مجاناً",subtitle:"يرجى تعبئة النموذج وسيقوم مستشار العلاقات لدينا بالتواصل معك لترتيب اللقاء الأول.",fields:["name","phone","email","notes"]}},{id:"footer",type:"footer",content:{text:`جميع الحقوق محفوظة © ${a!=="مشروعك المتميز"?a:"المستشار الوطني للأعمال"} 2026`,links:"خدماتنا | اتصل بنا | فروعنا"}}]}else{const a=W(i,["website","create","i want","design","company","restaurant","cafe","portfolio","with","color","red","green","blue"],"en");e==="restaurant"?r=[{id:"hero",type:"hero",content:{title:`Welcome to ${a!=="Your Premium Space"?a:"The Taste Bistro"}`,subtitle:"We cook unique recipes and prepare delicious fresh meals using organic herbs and seasonal local ingredients.",ctaText:"Book Your Table",ctaLink:"#contact"}},{id:"features",type:"features",content:{title:"Our Culinary Commitments",subtitle:"What makes our dishes taste extraordinarily rich and fresh",items:[{icon:"🥗",title:"Farm-to-Table Fresh",desc:"We receive fresh greens, organic vegetables, and premium meats from certified growers daily."},{icon:"👨‍🍳",title:"Master Craft Chefs",desc:"Our award winning kitchen staff blends traditional and contemporary recipes with pure love."},{icon:"🛵",title:"Express Hot Delivery",desc:"Specially packaged warm boxes shipped directly to your house in under 30 minutes."}]}},{id:"gallery",type:"gallery",content:{title:"Popular Dining Selections",subtitle:"Browse the visual previews of our customer-favorite dishes this week",items:[{url:"https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",caption:"Herb Crusted Signature Ribeye"},{url:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",caption:"Wood Fired Pizza Caprese"},{url:"https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80",caption:"Signature Chocolate Lava Melt"}]}},{id:"contact",type:"contact",content:{title:"Reserve a table with us",subtitle:"Input your name, phone, and time slot. Our hospitality host will text you confirmation in minutes.",fields:["name","phone","date","notes"]}},{id:"footer",type:"footer",content:{text:`© 2026 ${a!=="Your Premium Space"?a:"Taste Bistro"}. All rights reserved.`,links:"Instagram | Facebook | Google Maps"}}]:e==="portfolio"?r=[{id:"hero",type:"hero",content:{title:`Creative Portfolio | ${a!=="Your Premium Space"?a:"Designer Profile"}`,subtitle:"I design intuitive visual systems and build highly responsive interactive interfaces that solve real user needs.",ctaText:"Browse My Work",ctaLink:"#gallery"}},{id:"features",type:"features",content:{title:"My Creative Services",subtitle:"High-value digital services tailored for your product success",items:[{icon:"💡",title:"Product Strategy & UX",desc:"Formulating user flow charts, wireframes, and validating accessibility requirements."},{icon:"📐",title:"Modern Brand & Web UI",desc:"Polished high-fidelity desktop and mobile layouts using tailored color systems."},{icon:"⚡",title:"Prototyping & Interactions",desc:"Creating clickable, responsive dynamic UI prototypes before moving to development."}]}},{id:"gallery",type:"gallery",content:{title:"Recent Project Deliverables",subtitle:"A selected showcases of clients and startups I collaborated with",items:[{url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",caption:"SaaS Analytics Dashboard UI"},{url:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",caption:"Cryptocurrency Exchange Interface"},{url:"https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80",caption:"Medical Appointment Application"}]}},{id:"contact",type:"contact",content:{title:"Let's work together!",subtitle:"I am currently accepting freelance contracts and consulting bookings. Let's arrange a call.",fields:["name","email","notes"]}},{id:"footer",type:"footer",content:{text:`© 2026 ${a!=="Your Premium Space"?a:"Designer Profile"}. Crafted with precision.`,links:"LinkedIn | GitHub | Twitter / X"}}]:e==="saas"?r=[{id:"hero",type:"hero",content:{title:a!=="Your Premium Space"?a:"Automate Your Workflow Seamlessly",subtitle:"An all-in-one secure cloud system designed to help teams schedule actions, compile analytics, and boost output by 40%.",ctaText:"Start Free Trial",ctaLink:"#contact"}},{id:"features",type:"features",content:{title:"Supercharged Product Features",subtitle:"Everything you need to collaborate and monitor progress from one workspace",items:[{icon:"🛡️",title:"Enterprise Grade Security",desc:"Fully encrypted AES-256 data protection ensuring absolute privacy for your files."},{icon:"📊",title:"Real-Time Visual Graphs",desc:"Instantly compiled dashboard reports tracking active leads, conversions, and speed."},{icon:"🤝",title:"Native API Integrations",desc:"Connect smoothly with your current Slack, Google Drive, and Notion sheets in clicks."}]}},{id:"gallery",type:"gallery",content:{title:"Inside the Workspace UI",subtitle:"Clean, minimal user interface designed for distraction-free performance",items:[{url:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",caption:"Global Admin Reporting screen"},{url:"https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80",caption:"Team Sprint and Task boards"},{url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",caption:"Auto Report Compiler setup"}]}},{id:"contact",type:"contact",content:{title:"Request a custom product Demo",subtitle:"Submit your corporate email, and one of our solutions engineers will reach out to schedule a live call.",fields:["name","email","phone","notes"]}},{id:"footer",type:"footer",content:{text:`© 2026 ${a!=="Your Premium Space"?a:"SaaS Automation"}. All rights reserved.`,links:"Terms | Privacy | Help Desk"}}]:r=[{id:"hero",type:"hero",content:{title:a!=="Your Premium Space"?a:"Strategic Business Solutions for Success",subtitle:"We help brands and modern enterprises scale operations, structure finance, and implement profitable marketing plans.",ctaText:"Request Free Consulting",ctaLink:"#contact"}},{id:"features",type:"features",content:{title:"Why Elite Partners Rely on Us",subtitle:"We focus on deliverable operations metrics and data-driven analysis",items:[{icon:"🎯",title:"Targeted Strategy",desc:"Custom strategic roadmaps built around realistic KPIs and market growth metrics."},{icon:"👥",title:"Veteran Advisors",desc:"A team of executive business consultants with 15+ years of cross-industry success."},{icon:"💡",title:"Adaptive Planning",desc:"Helping companies navigate shifts in regulatory, financial, and digital landscapes."}]}},{id:"gallery",type:"gallery",content:{title:"Our Corporate Milestones",subtitle:"Glimpses from leadership summits, training workshops, and advisory boards",items:[{url:"https://images.unsplash.com/photo-1542744094-2ab25be78b90?auto=format&fit=crop&w=400&q=80",caption:"Strategic Board Alignment Summit"},{url:"https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80",caption:"Corporate Restructuring Workshop"},{url:"https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80",caption:"Annual Performance Briefing"}]}},{id:"contact",type:"contact",content:{title:"Schedule your initial audit",subtitle:"Fill out the contact form below, and our relations lead will email you to set up our introductory meeting.",fields:["name","phone","email","notes"]}},{id:"footer",type:"footer",content:{text:`© 2026 ${a!=="Your Premium Space"?a:"Corporate Advisory Group"}. All rights reserved.`,links:"Services | Contacts | Offices"}}]}return{name:s==="ar"?`موقع ${detail!=="مشروعك المتميز"?detail:"ذكي جديد"}`:`${detail!=="Your Premium Space"?detail:"Smart Site"}`,description:s==="ar"?`موقع ويب تم توليده تلقائياً بالذكاء الاصطناعي بناءً على وصف: "${i.slice(0,30)}..."`:`AI generated website configured from prompt: "${i.slice(0,30)}..."`,theme:n,font:o,language:s,sections:r}}function G(i,t,s){const e=i.translations,n=document.createElement("div");n.className="modal-overlay",n.id="ai-dialog-modal";const o=t||"";n.innerHTML=`
    <div class="modal-content" style="max-width: 650px;">
      <div class="modal-header">
        <h3 class="modal-title">✨ ${e.aiModalTitle}</h3>
        <button class="modal-close-btn" id="ai-modal-close">&times;</button>
      </div>
      <div class="modal-body" id="ai-modal-body">
        <form id="ai-generation-form" style="display: flex; flex-direction: column; gap: 16px;">
          
          <div class="input-group">
            <label class="input-label" for="ai-prompt-area">${e.aiPromptLabel}</label>
            <textarea class="input-field" id="ai-prompt-area" rows="4" required style="resize: none; font-size: 1rem;" placeholder="${e.promptPlaceholder}">${o}</textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="input-group">
              <label class="input-label" for="ai-category">${e.aiCategoryLabel}</label>
              <select class="input-field" id="ai-category">
                <option value="auto">🔍 Auto-detect</option>
                <option value="restaurant">${e.aiCatRestaurant}</option>
                <option value="portfolio">${e.aiCatPortfolio}</option>
                <option value="business">${e.aiCatBusiness}</option>
                <option value="saas">${e.aiCatSaaS}</option>
              </select>
            </div>
            
            <div class="input-group">
              <label class="input-label" for="ai-color">${e.aiColorLabel}</label>
              <select class="input-field" id="ai-color">
                <option value="auto">🎨 Auto-detect</option>
                <option value="theme-sunset">${e.aiColorSunset}</option>
                <option value="theme-emerald">${e.aiColorEmerald}</option>
                <option value="theme-midnight">${e.aiColorMidnight}</option>
                <option value="theme-corporate">${e.aiColorCorporate}</option>
              </select>
            </div>
          </div>

          <div class="input-group">
            <label class="input-label" for="ai-tone">${e.aiToneLabel}</label>
            <select class="input-field" id="ai-tone">
              <option value="professional">${e.aiToneProfessional}</option>
              <option value="creative" selected>${e.aiToneCreative}</option>
              <option value="friendly">${e.aiToneFriendly}</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top: 10px; width: 100%; font-size: 1.1rem; padding: 12px;">
            ${e.aiBtnGenerate}
          </button>
        </form>
      </div>
    </div>
  `,document.body.appendChild(n),document.getElementById("ai-modal-close").addEventListener("click",()=>{n.remove()}),document.getElementById("ai-generation-form").addEventListener("submit",p=>{p.preventDefault();const l=document.getElementById("ai-prompt-area").value,b=document.getElementById("ai-category").value,w=document.getElementById("ai-color").value;document.getElementById("ai-tone").value,_(i,l,{category:b,theme:w},s,n)})}function _(i,t,s,e,n){const o=i.translations,r=document.getElementById("ai-modal-body"),a=document.getElementById("ai-modal-close");a&&(a.style.display="none"),r.innerHTML=`
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 10px; gap: 24px;">
      <div class="spinner" style="width: 50px; height: 50px; border-width: 5px;"></div>
      
      <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 400px;" id="generator-steps-box">
        <div class="gen-step" id="step-1" style="display: flex; align-items: center; gap: 10px; opacity: 0.5; transition: opacity 0.3s;">
          <span class="step-bullet">⏳</span>
          <span class="step-text">${o.aiGeneratingStep1}</span>
        </div>
        <div class="gen-step" id="step-2" style="display: flex; align-items: center; gap: 10px; opacity: 0.5; transition: opacity 0.3s;">
          <span class="step-bullet">⏳</span>
          <span class="step-text">${o.aiGeneratingStep2}</span>
        </div>
        <div class="gen-step" id="step-3" style="display: flex; align-items: center; gap: 10px; opacity: 0.5; transition: opacity 0.3s;">
          <span class="step-bullet">⏳</span>
          <span class="step-text">${o.aiGeneratingStep3}</span>
        </div>
        <div class="gen-step" id="step-4" style="display: flex; align-items: center; gap: 10px; opacity: 0.5; transition: opacity 0.3s;">
          <span class="step-bullet">⏳</span>
          <span class="step-text">${o.aiGeneratingStep4}</span>
        </div>
      </div>
    </div>
  `;const p=[{id:"step-1",duration:1200},{id:"step-2",duration:1200},{id:"step-3",duration:1e3},{id:"step-4",duration:1e3}];let l=0;function b(){if(l<p.length){const w=p[l],g=document.getElementById(w.id);if(l>0){const v=document.getElementById(p[l-1].id);v.querySelector(".step-bullet").innerHTML="✅",v.style.opacity="0.9",v.style.color="#10b981"}g.style.opacity="1",g.querySelector(".step-bullet").innerHTML="⚡",g.style.fontWeight="bold",setTimeout(()=>{l++,b()},w.duration)}else{const w=document.getElementById(p[p.length-1].id);w.querySelector(".step-bullet").innerHTML="✅",w.style.opacity="0.9",w.style.color="#10b981",setTimeout(()=>{const g=Y(t,{language:i.lang,category:s.category,theme:s.theme}),v=T.createProject(g.name,g.description,g.theme,g.font,g.language,g.sections);n.remove(),e(v)},500)}}b()}const J={ar:[{id:"tpl_portfolio",name:"معرض أعمال شخصي",description:"قالب نظيف وأنيق للمصممين والمطورين لعرض أعمالهم وخبراتهم.",theme:"theme-midnight",font:"font-arabic",sections:[{id:"hero",type:"hero",content:{title:"أصمم تجارب رقمية تترك أثراً باقياً",subtitle:"مرحباً، أنا مصمم واجهات ومطور مستقل. أساعد الشركات الناشئة في تحويل أفكارهم البرمجية إلى تصاميم وتطبيقات سريعة وجذابة.",ctaText:"تصفح أعمالي",ctaLink:"#gallery"}},{id:"features",type:"features",content:{title:"خدماتي المتميزة",subtitle:"أقدم خدمات احترافية متكاملة تضمن تفوق منتجك الرقمي",items:[{icon:"🎨",title:"تصميم واجهات المستخدم (UI)",desc:"رسم واجهات جميلة وسهلة الاستخدام تناسب هويتك التجارية وتجذب عملائك."},{icon:"💻",title:"تطوير واجهات الويب (Frontend)",desc:"كتابة كود نظيف وسريع باستخدام أحدث التقنيات مثل React وVite."},{icon:"⚙️",title:"تحسين الأداء وتجربة المستخدم",desc:"تسريع تحميل الصفحات وتوفير تجربة سلسة للمستخدمين على جميع الأجهزة."}]}},{id:"gallery",type:"gallery",content:{title:"معرض مشاريعي الأخيرة",subtitle:"مجموعة من التطبيقات والمواقع التي قمت بتصميمها وتطويرها مؤخراً",items:[{url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",caption:"تطبيق إدارة المهام والشركات"},{url:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",caption:"منصة تداول العملات الرقمية"},{url:"https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80",caption:"موقع حجز خدمات وعيادات"}]}},{id:"contact",type:"contact",content:{title:"هل لديك مشروع جديد؟ دعنا نتحدث!",subtitle:"املأ النموذج أدناه وسأقوم بالرد عليك خلال أقل من 24 ساعة لبدء التعاون.",fields:["name","email","notes"]}},{id:"footer",type:"footer",content:{text:"جميع الحقوق محفوظة © معرض أعمالي 2026",links:"تويتر | لينكد إن | جيت هاب"}}]},{id:"tpl_resto",name:"مطعم ومقهى فاخر",description:"قالب مخصص للمطاعم يعرض الوجبات، الأسعار ونظام حجز الطاولات.",theme:"theme-sunset",font:"font-arabic",sections:[{id:"hero",type:"hero",content:{title:"مذاق فريد محضر بشغف وإتقان",subtitle:"نرحب بكم في مطعمنا حيث تلتقي النكهات الطازجة والمكونات الممتازة مع فن الطهي العصري لتجربة لا تنسى.",ctaText:"استكشف قائمة الطعام",ctaLink:"#gallery"}},{id:"features",type:"features",content:{title:"مميزاتنا الفريدة",subtitle:"لماذا يفضلنا محبو النكهات الأصيلة دائماً؟",items:[{icon:"🥬",title:"مكونات طازجة 100%",desc:"نحصل على خضرواتنا ولحومنا يومياً من المزارع المحلية المعتمدة مباشرة."},{icon:"👨‍🍳",title:"طهاة محترفون",desc:"طهاة يمتلكون خبرة طويلة في تحضير الأطباق الشرقية والغربية المبتكرة."},{icon:"⭐",title:"أجواء عائلية مريحة",desc:"جلسات داخلية وخارجية هادئة مصممة لتوفر الخصوصية والراحة التامة لعائلتك."}]}},{id:"gallery",type:"gallery",content:{title:"من أطباقنا الشهية",subtitle:"تصفح أحدث الوجبات والمشروبات المميزة لدينا",items:[{url:"https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",caption:"شرائح اللحم المشوية مع الأعشاب"},{url:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",caption:"بيتزا نابولي بالفرن الحجري"},{url:"https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80",caption:"كعكة الشوكولاتة الذائبة الفاخرة"}]}},{id:"contact",type:"contact",content:{title:"احجز طاولتك الآن بسهولة",subtitle:"يرجى تحديد الاسم والهاتف والوقت لتأكيد الحجز وضمان طاولتك فور وصولك.",fields:["name","phone","date","notes"]}},{id:"footer",type:"footer",content:{text:"جميع الحقوق محفوظة © مطعم المذاق الفاخر 2026",links:"إنستغرام | فيسبوك | خرائط جوجل"}}]},{id:"tpl_agency",name:"وكالة تسويق رقمية",description:"تصميم متكامل للشركات لعرض الخدمات، آراء العملاء وباقات الأسعار.",theme:"theme-corporate",font:"font-arabic",sections:[{id:"hero",type:"hero",content:{title:"ننمي مشروعك التجاري ونضاعف مبيعاتك",subtitle:"وكالة تسويق رقمي متكاملة تساعدك في بناء هويتك والوصول لعملائك المستهدفين من خلال حملات إعلانية ذكية وتحليلات متقدمة.",ctaText:"احصل على استشارة مجانية",ctaLink:"#contact"}},{id:"features",type:"features",content:{title:"خدماتنا الإستراتيجية",subtitle:"حلول تسويقية متكاملة مصممة خصيصاً لزيادة أرباحك وتوسيع نشاطك",items:[{icon:"📢",title:"إعلانات وسائل التواصل",desc:"إطلاق حملات إعلانية ممولة ومستهدفة بدقة على سناب شات، تيك توك، وإنستغرام."},{icon:"🎨",title:"صناعة المحتوى الإبداعي",desc:"كتابة نصوص تسويقية مقنعة وتصميم منشورات بصرية تعكس احترافية شركتك."},{icon:"📈",title:"تحسين محركات البحث SEO",desc:"تهيئة موقعك الإلكتروني ليتصدر النتائج الأولى في محرك بحث جوجل مجاناً."}]}},{id:"gallery",type:"gallery",content:{title:"نجاحات نفخر بها",subtitle:"لقطات من حملاتنا التسويقية والشركات التي ساعدناها في النمو",items:[{url:"https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80",caption:"ورشة عمل تحليل الأداء الاستراتيجي"},{url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",caption:"زيادة مبيعات متجر إلكتروني بنسبة 200%"},{url:"https://images.unsplash.com/photo-1542744094-2ab25be78b90?auto=format&fit=crop&w=400&q=80",caption:"إطلاق حملة ترويجية لمنتج وطني"}]}},{id:"contact",type:"contact",content:{title:"ابدأ رحلة نمو مبيعاتك اليوم",subtitle:"دع فريق الخبراء لدينا يدرس موقعك الحالي ويقترح عليك حملة تجريبية مجانية.",fields:["name","phone","email","notes"]}},{id:"footer",type:"footer",content:{text:"جميع الحقوق محفوظة © وكالة ريادة التسويقية 2026",links:"اتصل بنا | المدونة | وظائف شاغرة"}}]}],en:[{id:"tpl_portfolio",name:"Personal Portfolio",description:"A sleek, modern design for designers and developers to show their works and skills.",theme:"theme-midnight",font:"font-english",sections:[{id:"hero",type:"hero",content:{title:"I craft digital experiences that last",subtitle:"Hello, I am a product designer and frontend engineer. I help startups build scalable SaaS tools and interactive consumer apps.",ctaText:"View My Works",ctaLink:"#gallery"}},{id:"features",type:"features",content:{title:"Expertise Services",subtitle:"High quality professional services for modern digital solutions",items:[{icon:"🎨",title:"UI/UX Design",desc:"Translating complex functional ideas into interactive, visually appealing design screens."},{icon:"💻",title:"Frontend Engineering",desc:"Writing accessible, high-performance web code using modern tools like Vite and Tailwind."},{icon:"⚙️",title:"Technical Consulting",desc:"Auditing page load times, responsive UI patterns, and core SEO structure configurations."}]}},{id:"gallery",type:"gallery",content:{title:"Featured Case Studies",subtitle:"Recent projects delivered to global clients and brands",items:[{url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",caption:"FinTech Cloud Platform"},{url:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",caption:"Mobile Delivery Wallet App"},{url:"https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80",caption:"Healthcare Telemedicine App"}]}},{id:"contact",type:"contact",content:{title:"Let's collaborate on your project",subtitle:"Fill out the contact sheet below and I'll get back to you within 24 hours to schedule a discovery call.",fields:["name","email","notes"]}},{id:"footer",type:"footer",content:{text:"© 2026 Portfolio Core. All rights reserved.",links:"Twitter / X | LinkedIn | GitHub"}}]},{id:"tpl_resto",name:"Gourmet Restaurant & Cafe",description:"Custom template for diners showcasing menus, pricing grids, and table reservation booking.",theme:"theme-sunset",font:"font-english",sections:[{id:"hero",type:"hero",content:{title:"Delicious flavors crafted with passion",subtitle:"Indulge in a premium dining experience where fresh ingredients, fine spices, and contemporary cooking meet in harmony.",ctaText:"Browse Culinary Menu",ctaLink:"#gallery"}},{id:"features",type:"features",content:{title:"Our Fine Attributes",subtitle:"What sets our kitchen apart from typical dining spots",items:[{icon:"🥬",title:"100% Organic Produce",desc:"Sourcing crisp greens and premium meat cuts directly from certified local farms."},{icon:"👨‍🍳",title:"World-Class Chefs",desc:"Our award-winning culinary team specializes in blending global spices and techniques."},{icon:"⭐",title:"Cozy Dining Ambience",desc:"Warm lighting, soft jazz, and private lounge options to ensure a relaxing family lunch or date."}]}},{id:"gallery",type:"gallery",content:{title:"Our Signature Selections",subtitle:"A quick glimpse into our customer-favorite dishes",items:[{url:"https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",caption:"Rosemary Infused Ribeye Steak"},{url:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",caption:"Stone Oven Neapolitan Pizza"},{url:"https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80",caption:"Molten Lava Chocolate Cake"}]}},{id:"contact",type:"contact",content:{title:"Reserve your dining table",subtitle:"Specify your arrival details and party size, and we'll secure the best table for your group.",fields:["name","phone","date","notes"]}},{id:"footer",type:"footer",content:{text:"© 2026 Gourmet Grill Bistro. All rights reserved.",links:"Instagram | Facebook | Google Maps"}}]}]};function X(i,t){const s=i.translations,e=J[i.lang]||[];if(e.length===0)return`<div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <p>No templates loaded for this language.</p>
    </div>`;let n='<div class="projects-grid">';return e.forEach(o=>{let r="💻";o.id.includes("resto")?r="🍕":o.id.includes("portfolio")?r="📐":o.id.includes("agency")&&(r="🚀");let a=o.name,p=o.description;o.id.includes("resto")?(a=s.tplRestoName,p=s.tplRestoDesc):o.id.includes("portfolio")?(a=s.tplPortfolioName,p=s.tplPortfolioDesc):o.id.includes("agency")&&(a=s.tplAgencyName,p=s.tplAgencyDesc);let l=s.aiColorCorporate;o.theme==="theme-sunset"&&(l=s.aiColorSunset),o.theme==="theme-emerald"&&(l=s.aiColorEmerald),o.theme==="theme-midnight"&&(l=s.aiColorMidnight),n+=`
      <div class="project-card" data-template-id="${o.id}">
        <div class="card-thumbnail">
          <div class="card-thumbnail-pattern">${r}</div>
          <div class="thumbnail-overlay">
            <button class="btn btn-primary btn-sm use-template-btn" data-tpl-id="${o.id}">
              ✨ ${s.create}
            </button>
          </div>
        </div>
        
        <div class="card-body">
          <div class="card-header-row">
            <h4 class="card-title">${a}</h4>
            <span class="badge badge-secondary">${l}</span>
          </div>
          <p class="card-description">${p}</p>
          <div class="card-meta">
            <span>⚙️ ${o.sections.length} ${i.lang==="ar"?"أقسام":"sections"}</span>
            <span>⭐ Template</span>
          </div>
        </div>
      </div>
    `}),n+="</div>",setTimeout(()=>{document.querySelectorAll(".use-template-btn").forEach(r=>{r.addEventListener("click",a=>{a.stopPropagation();const p=a.target.getAttribute("data-tpl-id"),l=e.find(b=>b.id===p);if(l){const b=T.createProject(l.name,l.description,l.theme,l.font,i.lang,JSON.parse(JSON.stringify(l.sections)));t(b)}})})},0),n}function F(i,t,s,e){var g,v;const n=i.translations,o=(g=t.deployed)!=null&&g.isDeployed?'<span class="badge badge-primary">🌐 Published</span>':'<span class="badge badge-secondary">📝 Draft</span>',r=t.isPublic?`<span class="badge badge-primary" title="${n.publicBadgeLabel}">🔓 ${n.public}</span>`:`<span class="badge badge-secondary" title="${n.privateBadgeLabel}">🔒 ${n.private}</span>`;let a="📱";t.theme==="theme-sunset"&&(a="🌅"),t.theme==="theme-emerald"&&(a="🌿"),t.theme==="theme-midnight"&&(a="⚡");const p=(v=t.deployed)!=null&&v.isDeployed?`<button class="btn btn-secondary btn-sm preview-live-btn" data-proj-id="${t.id}">
         👀 ${n.preview}
       </button>`:`<button class="btn btn-secondary btn-sm edit-proj-btn" data-proj-id="${t.id}">
         ✏️ ${n.edit}
       </button>`,l=s?`<button class="btn btn-primary btn-sm clone-proj-btn" data-proj-id="${t.id}">
         📥 ${n.clone}
       </button>`:`<button class="btn btn-primary btn-sm edit-proj-btn" data-proj-id="${t.id}">
         🛠️ ${n.edit}
       </button>`,b=!s&&!t.isSystem?`<button class="btn btn-secondary btn-sm delete-proj-btn" data-proj-id="${t.id}" style="border-color: rgba(239, 68, 68, 0.2); color: #ef4444;" title="${n.delete}">
         🗑️
       </button>`:"",w=s?"":`<button class="btn btn-secondary btn-sm clone-proj-btn" data-proj-id="${t.id}" title="${n.clone}">
         📋
       </button>`;return`
    <div class="project-card" data-card-id="${t.id}">
      <div class="card-thumbnail">
        <div class="card-thumbnail-pattern">${a}</div>
        <div class="thumbnail-overlay">
          ${l}
          ${p}
        </div>
      </div>
      
      <div class="card-body">
        <div class="card-header-row">
          <h4 class="card-title">${t.name}</h4>
          <div style="display: flex; gap: 4px;">
            ${o}
            ${s?"":r}
          </div>
        </div>
        <p class="card-description">${t.description||"No description provided."}</p>
        <div class="card-meta">
          <span>🎨 ${t.theme.split("-")[1].toUpperCase()}</span>
          <span>👥 ${t.clones||0} ${n.cloneCount}</span>
        </div>
      </div>
      <div class="card-actions" style="border-top: 1px solid var(--border-light); padding-top: 14px; margin-top: 0;">
        ${l}
        ${w}
        ${b}
      </div>
    </div>
  `}function z(i,t,s,e,n){document.querySelectorAll(".edit-proj-btn").forEach(o=>{o.addEventListener("click",r=>{r.stopPropagation();const a=o.getAttribute("data-proj-id");t(a)})}),document.querySelectorAll(".clone-proj-btn").forEach(o=>{o.addEventListener("click",r=>{r.stopPropagation();const a=o.getAttribute("data-proj-id"),p=T.cloneProject(a);p&&(alert(i.translations.alertClonedSuccess),s(p))})}),document.querySelectorAll(".delete-proj-btn").forEach(o=>{o.addEventListener("click",r=>{r.stopPropagation();const a=o.getAttribute("data-proj-id");confirm(i.lang==="ar"?"هل أنت متأكد من حذف هذا المشروع؟":"Are you sure you want to delete this project?")&&(T.deleteProject(a),e())})}),document.querySelectorAll(".preview-live-btn").forEach(o=>{o.addEventListener("click",r=>{r.stopPropagation();const a=o.getAttribute("data-proj-id");n(a)})})}function K(i,t,s){const e=i.translations,n=document.createElement("div");n.className="modal-overlay",n.id="deployment-wizard-modal";const o=t.deployed||{subdomain:"",customDomain:"",dnsVerified:!1,webhookUrl:""},r=o.subdomain||t.id.replace("site_",""),a=o.customDomain||"",p=o.webhookUrl||"",l=o.dnsVerified||!1;n.innerHTML=`
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">🚀 ${e.deployTitle}</h3>
        <button class="modal-close-btn" id="deploy-modal-close">&times;</button>
      </div>
      <div class="modal-body" id="deploy-modal-body">
        
        <!-- Tabs for Domain Config -->
        <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
          <button class="btn btn-secondary btn-sm active" id="tab-subdomain-btn" style="flex: 1;">
            🌐 ${e.domainTabSubdomain}
          </button>
          <button class="btn btn-secondary btn-sm" id="tab-custom-domain-btn" style="flex: 1;">
            🔑 ${e.domainTabCustom}
          </button>
        </div>

        <!-- Tab 1: Subdomain Content -->
        <div id="panel-subdomain" style="display: block;">
          <div class="input-group">
            <label class="input-label" for="deploy-subdomain-input">${e.domainSubdomainInputLabel}</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="text" class="input-field" id="deploy-subdomain-input" value="${r}" placeholder="${e.domainSubdomainPlaceholder}" style="direction: ltr;" required />
              <span style="font-weight: 600; color: var(--text-muted); font-size: 0.95rem;">.cabable.me</span>
            </div>
            <span class="input-label" style="font-weight: normal; margin-top: 4px; font-size: 0.8rem; color: var(--secondary);">
              ${e.domainSubdomainHelp} <a href="#" id="subdomain-preview-link" target="_blank" style="color: var(--secondary); text-decoration: underline; font-family: monospace;">https://${r}.cabable.me</a>
            </span>
          </div>
        </div>

        <!-- Tab 2: Custom Domain Content -->
        <div id="panel-custom-domain" style="display: none; flex-direction: column; gap: 14px;">
          <div class="input-group">
            <label class="input-label" for="deploy-custom-input">${e.domainCustomInputLabel}</label>
            <input type="text" class="input-field" id="deploy-custom-input" value="${a}" placeholder="${e.domainCustomPlaceholder}" style="direction: ltr;" />
          </div>

          <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">🛡️ ${e.domainDnsInstructions}</p>
            <table class="dns-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Host</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>A</td>
                  <td>@</td>
                  <td>76.76.21.21 <span class="copy-badge" data-copy="76.76.21.21">Copy</span></td>
                </tr>
                <tr>
                  <td>CNAME</td>
                  <td>www</td>
                  <td>domains.cabable.me <span class="copy-badge" data-copy="domains.cabable.me">Copy</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="display: flex; gap: 12px; align-items: center; justify-content: space-between;">
            <button type="button" class="btn btn-secondary btn-sm" id="dns-verify-btn">
              🔍 ${e.domainDnsVerifyBtn}
            </button>
            <span id="dns-status-badge" class="badge ${l?"badge-primary":"badge-secondary"}">
              ${l?e.domainDnsStatusActive:e.private}
            </span>
          </div>
        </div>

        <!-- Divider -->
        <hr style="border: 0; border-top: 1px solid var(--border-light); margin: 24px 0;" />

        <!-- Webhook Config Row -->
        <div class="input-group">
          <label class="input-label" for="deploy-webhook-input">${e.intWebhookLabel}</label>
          <input type="url" class="input-field" id="deploy-webhook-input" value="${p}" placeholder="${e.intWebhookPlaceholder}" style="direction: ltr;" />
          <span style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${e.intWebhookHelp}</span>
          <button type="button" class="btn btn-secondary btn-sm" id="webhook-test-btn" style="margin-top: 10px; align-self: flex-start;">
            🔌 ${e.intWebhookTestBtn}
          </button>
          <span id="webhook-test-status" style="font-size: 0.85rem; margin-top: 6px; font-weight: 550;"></span>
        </div>

      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="deploy-cancel">${e.cancel}</button>
        <button class="btn btn-primary" id="deploy-submit-btn">🚀 ${e.deploy}</button>
      </div>
    </div>
  `,document.body.appendChild(n);const b=document.getElementById("deploy-modal-close"),w=document.getElementById("deploy-cancel"),g=document.getElementById("deploy-submit-btn"),v=document.getElementById("tab-subdomain-btn"),P=document.getElementById("tab-custom-domain-btn"),I=document.getElementById("panel-subdomain"),d=document.getElementById("panel-custom-domain"),m=document.getElementById("deploy-subdomain-input"),x=document.getElementById("deploy-custom-input"),y=document.getElementById("deploy-webhook-input"),f=document.getElementById("dns-verify-btn"),c=document.getElementById("dns-status-badge"),h=document.getElementById("webhook-test-btn"),S=document.getElementById("webhook-test-status");let $=l;function E(){n.remove()}b.addEventListener("click",E),w.addEventListener("click",E),v.addEventListener("click",()=>{v.classList.add("active"),P.classList.remove("active"),I.style.display="block",d.style.display="none"}),P.addEventListener("click",()=>{v.classList.remove("active"),P.classList.add("active"),I.style.display="none",d.style.display="flex"}),m.addEventListener("input",()=>{const k=m.value.replace(/[^a-zA-Z0-9-]/g,"").toLowerCase();m.value=k;const B=document.getElementById("subdomain-preview-link");B.href="#",B.innerHTML=`https://${k||"yoursite"}.cabable.me`}),document.querySelectorAll(".copy-badge").forEach(k=>{k.addEventListener("click",B=>{const C=k.getAttribute("data-copy");navigator.clipboard.writeText(C).then(()=>{const A=k.innerHTML;k.innerHTML=e.copied,setTimeout(()=>k.innerHTML=A,1e3)})})}),f.addEventListener("click",()=>{if(!x.value.trim()){alert(i.lang==="ar"?"يرجى إدخال نطاق مخصص أولاً!":"Please enter a custom domain first!");return}f.disabled=!0,c.className="badge badge-secondary",c.innerHTML=`⏳ ${e.domainDnsStatusChecking}`,setTimeout(()=>{$=!0,c.className="badge badge-primary",c.innerHTML=`✅ ${e.domainDnsStatusActive}`,f.disabled=!1},1500)}),h.addEventListener("click",()=>{const k=y.value.trim();if(!k){alert(i.lang==="ar"?"يرجى إدخال رابط Webhook أولاً!":"Please enter a Webhook URL first!");return}h.disabled=!0,S.style.color="var(--text-muted)",S.innerHTML=`⏳ ${e.loading}`;const B={test:!0,platform:"Cabable.me",timestamp:new Date().toISOString(),project:{id:t.id,name:t.name}};fetch(k,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(B),mode:"no-cors"}).then(()=>{S.style.color="#10b981",S.innerHTML=`✅ ${e.intWebhookTestSuccess}`,h.disabled=!1}).catch(C=>{console.warn("Webhook test error: ",C),k.startsWith("http://")||k.startsWith("https://")?(S.style.color="#10b981",S.innerHTML=`✅ ${e.intWebhookTestSuccess} (Simulated Response)`):(S.style.color="#ef4444",S.innerHTML=`❌ ${e.intWebhookTestError}`),h.disabled=!1})}),g.addEventListener("click",()=>{const k=m.value.trim();if(!k){alert(i.lang==="ar"?"يرجى تحديد النطاق الفرعي للموقع!":"Please provide a subdomain!");return}Q(i,t,{subdomain:k,customDomain:x.value.trim(),dnsVerified:$,webhookUrl:y.value.trim()},s)})}function Q(i,t,s,e){const n=i.translations,o=document.getElementById("deploy-modal-body"),r=document.querySelector(".modal-footer");r&&(r.style.display="none");const a=document.getElementById("deploy-modal-close");a&&(a.style.display="none"),o.innerHTML=`
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 10px; gap: 24px;">
      <div class="spinner" style="width: 50px; height: 50px; border-width: 5px; border-top-color: var(--secondary);"></div>
      
      <div style="display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 400px;">
        <div class="dep-step" id="dep-step-1" style="display: flex; align-items: center; gap: 10px; opacity: 0.5; transition: opacity 0.3s;">
          <span class="dep-bullet">⏳</span>
          <span class="dep-text">${n.deployStep1}</span>
        </div>
        <div class="dep-step" id="dep-step-2" style="display: flex; align-items: center; gap: 10px; opacity: 0.5; transition: opacity 0.3s;">
          <span class="dep-bullet">⏳</span>
          <span class="dep-text">${n.deployStep2}</span>
        </div>
        <div class="dep-step" id="dep-step-3" style="display: flex; align-items: center; gap: 10px; opacity: 0.5; transition: opacity 0.3s;">
          <span class="dep-bullet">⏳</span>
          <span class="dep-text">${n.deployStep3}</span>
        </div>
      </div>
    </div>
  `;const p=[{id:"dep-step-1",duration:1e3},{id:"dep-step-2",duration:1e3},{id:"dep-step-3",duration:800}];let l=0;function b(){if(l<p.length){const w=p[l],g=document.getElementById(w.id);if(l>0){const v=document.getElementById(p[l-1].id);v.querySelector(".dep-bullet").innerHTML="✅",v.style.opacity="0.9",v.style.color="#10b981"}g.style.opacity="1",g.querySelector(".dep-bullet").innerHTML="⚡",g.style.fontWeight="bold",setTimeout(()=>{l++,b()},w.duration)}else{const w=document.getElementById(p[p.length-1].id);w.querySelector(".dep-bullet").innerHTML="✅",w.style.opacity="0.9",w.style.color="#10b981",setTimeout(()=>{t.deployed={isDeployed:!0,subdomain:s.subdomain,customDomain:s.customDomain,dnsVerified:s.dnsVerified,webhookUrl:s.webhookUrl},T.saveProject(t),Z(i,t,e)},500)}}b()}function Z(i,t,s){const e=i.translations,n=document.getElementById("deploy-modal-body"),o=`https://${t.deployed.subdomain}.cabable.me`;n.innerHTML=`
    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 20px; padding: 10px 0;">
      <span style="font-size: 4rem;">🎉</span>
      <h3 style="font-size: 1.5rem; color: #10b981;">${e.deploySuccess}</h3>
      
      <div style="background: var(--bg-base); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-light); width: 100%; max-width: 450px;">
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">${e.domainSubdomainHelp}</p>
        <div style="display: flex; gap: 8px; width: 100%;">
          <input type="text" class="input-field" readonly value="${o}" style="text-align: center; direction: ltr; font-family: monospace;" id="final-link-input" />
          <button class="btn btn-secondary btn-sm" id="final-copy-btn">${e.copied.replace("!","")}</button>
        </div>
        
        ${t.deployed.customDomain&&t.deployed.dnsVerified?`
          <div style="margin-top: 14px; border-top: 1px solid var(--border-light); padding-top: 12px;">
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 4px;">Custom Domain Connection:</p>
            <a href="#" class="preview-custom-link" target="_blank" style="color: var(--secondary); font-family: monospace; font-size: 0.95rem; text-decoration: underline;">
              http://${t.deployed.customDomain}
            </a>
          </div>
        `:""}
      </div>

      <!-- Public Showcase toggle -->
      <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
        <input type="checkbox" id="public-showcase-checkbox" style="width: 18px; height: 18px; cursor: pointer;" ${t.isPublic?"checked":""} />
        <label for="public-showcase-checkbox" style="font-size: 0.95rem; color: var(--text-secondary); cursor: pointer;">
          ${e.deploySharePublic}
        </label>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 10px; width: 100%; max-width: 450px;">
        <button class="btn btn-primary" id="final-visit-btn" style="flex: 1;">🌐 ${e.deployVisitSite}</button>
        <button class="btn btn-secondary" id="final-close-btn" style="flex: 1;">${e.cancel}</button>
      </div>
    </div>
  `;const r=document.getElementById("final-copy-btn");r.addEventListener("click",()=>{const b=document.getElementById("final-link-input");navigator.clipboard.writeText(b.value).then(()=>{r.innerHTML="✔️",setTimeout(()=>r.innerHTML=e.copied.replace("!",""),1500)})});const a=document.getElementById("public-showcase-checkbox");a.addEventListener("change",()=>{t.isPublic=a.checked,T.saveProject(t)}),document.getElementById("final-visit-btn").addEventListener("click",()=>{document.getElementById("deployment-wizard-modal").remove(),s(t)}),document.getElementById("final-close-btn").addEventListener("click",()=>{document.getElementById("deployment-wizard-modal").remove(),s(null)})}function ee(i,t,s){const e=i.translations,n=i.lang==="ar";let o="sections";const r=`
    <div class="editor-container">
      
      <!-- Editor Header -->
      <header class="editor-header">
        <div class="editor-header-left">
          <button class="btn btn-secondary btn-sm" id="editor-back-btn">
            ${n?"⬅️":"➡️"} ${e.back}
          </button>
          <div style="display: flex; flex-direction: column;">
            <strong id="editor-project-title">${t.name}</strong>
            <span style="font-size: 0.75rem; color: var(--text-muted);" id="save-status-indicator">Saved ✔️</span>
          </div>
        </div>
        
        <div class="editor-header-right">
          <!-- Viewport Simulator Controls -->
          <div class="device-toggle-group">
            <button class="device-btn active" data-device="desktop" title="Desktop View">🖥️</button>
            <button class="device-btn" data-device="tablet" title="Tablet View">📱</button>
            <button class="device-btn" data-device="mobile" title="Mobile View">🤳</button>
          </div>
          
          <button class="btn btn-accent btn-sm" id="editor-deploy-btn">
            🚀 ${e.deploy}
          </button>
        </div>
      </header>

      <!-- Main Editor Workspace -->
      <div class="editor-workspace">
        
        <!-- Left Sidebar Panel -->
        <aside class="editor-sidebar">
          <div class="sidebar-tabs">
            <button class="sidebar-tab-btn" data-tab="styles">${e.editorTabStyles}</button>
            <button class="sidebar-tab-btn active" data-tab="sections">${e.editorTabSections}</button>
            <button class="sidebar-tab-btn" data-tab="integrations">${e.editorTabIntegrations}</button>
          </div>
          
          <div class="sidebar-content" id="sidebar-content-area">
            <!-- Dynamic Sidebar content gets injected here -->
          </div>
        </aside>

        <!-- Live Preview Canvas -->
        <main class="editor-canvas-container">
          <div class="viewport-simulator" id="canvas-simulator">
            <!-- Simulated site layout content gets injected here -->
          </div>
        </main>

      </div>
    </div>

    <!-- Inline Editor Dialog (Overlay hidden by default) -->
    <div class="inline-edit-panel" id="inline-edit-panel" style="display: none;">
      <div class="inline-edit-bubble">
        <h4 style="font-size: 1rem; border-bottom: 1px solid var(--border-light); padding-bottom: 8px;">
          📝 ${e.editElementTitle}
        </h4>
        <div class="input-group">
          <label class="input-label" id="inline-label">${e.editElementLabel}</label>
          <textarea class="input-field" id="inline-text-textarea" rows="4" style="resize: none;"></textarea>
        </div>
        <div class="input-group" id="inline-image-group" style="display: none;">
          <label class="input-label">${e.editElementImageLabel}</label>
          <input type="text" class="input-field" id="inline-image-url" />
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm" id="inline-edit-cancel">${e.cancel}</button>
          <button class="btn btn-primary btn-sm" id="inline-edit-save">${e.editElementBtnSave}</button>
        </div>
      </div>
    </div>
  `;setTimeout(()=>{a(),b(),document.getElementById("editor-back-btn").addEventListener("click",()=>{s()}),document.querySelectorAll(".device-btn").forEach(d=>{d.addEventListener("click",m=>{document.querySelectorAll(".device-btn").forEach(f=>f.classList.remove("active")),d.classList.add("active");const x=d.getAttribute("data-device"),y=document.getElementById("canvas-simulator");y.className="viewport-simulator",x==="tablet"&&y.classList.add("tablet"),x==="mobile"&&y.classList.add("mobile")})}),document.querySelectorAll(".sidebar-tab-btn").forEach(d=>{d.addEventListener("click",()=>{document.querySelectorAll(".sidebar-tab-btn").forEach(m=>m.classList.remove("active")),d.classList.add("active"),o=d.getAttribute("data-tab"),a()})}),document.getElementById("editor-deploy-btn").addEventListener("click",()=>{K(i,t,d=>{d&&(t=d,document.getElementById("editor-project-title").innerText=t.name,b())})})},0);function a(){var m;const d=document.getElementById("sidebar-content-area");if(d){if(o==="styles")d.innerHTML=`
        <div class="sidebar-group">
          <label class="sidebar-group-title">${e.styleFontLabel}</label>
          <select class="input-field" id="style-font-select">
            <option value="font-arabic" ${t.font==="font-arabic"?"selected":""}>Cairo (Arabic First)</option>
            <option value="font-english" ${t.font==="font-english"?"selected":""}>Outfit (English First)</option>
          </select>
        </div>

        <div class="sidebar-group">
          <label class="sidebar-group-title">${e.styleColorLabel}</label>
          <div class="theme-swatches">
            <div class="theme-swatch ${t.theme==="theme-sunset"?"active":""}" data-theme="theme-sunset">
              <span class="swatch-name">${e.aiColorSunset}</span>
              <div class="swatch-colors">
                <div class="swatch-color" style="background-color: #f97316;"></div>
                <div class="swatch-color" style="background-color: #18181b;"></div>
              </div>
            </div>
            
            <div class="theme-swatch ${t.theme==="theme-emerald"?"active":""}" data-theme="theme-emerald">
              <span class="swatch-name">${e.aiColorEmerald}</span>
              <div class="swatch-colors">
                <div class="swatch-color" style="background-color: #10b981;"></div>
                <div class="swatch-color" style="background-color: #f4f6f4;"></div>
              </div>
            </div>

            <div class="theme-swatch ${t.theme==="theme-midnight"?"active":""}" data-theme="theme-midnight">
              <span class="swatch-name">${e.aiColorMidnight}</span>
              <div class="swatch-colors">
                <div class="swatch-color" style="background-color: #8b5cf6;"></div>
                <div class="swatch-color" style="background-color: #0f172a;"></div>
              </div>
            </div>

            <div class="theme-swatch ${t.theme==="theme-corporate"?"active":""}" data-theme="theme-corporate">
              <span class="swatch-name">${e.aiColorCorporate}</span>
              <div class="swatch-colors">
                <div class="swatch-color" style="background-color: #1e3a8a;"></div>
                <div class="swatch-color" style="background-color: #ffffff;"></div>
              </div>
            </div>
          </div>
        </div>
      `,document.getElementById("style-font-select").addEventListener("change",x=>{t.font=x.target.value,l(),b()}),document.querySelectorAll(".theme-swatch").forEach(x=>{x.addEventListener("click",()=>{document.querySelectorAll(".theme-swatch").forEach(y=>y.classList.remove("active")),x.classList.add("active"),t.theme=x.getAttribute("data-theme"),l(),b()})});else if(o==="sections"){let x="";t.sections.forEach((y,f)=>{let c=e.secHero;y.type==="features"&&(c=e.secFeatures),y.type==="gallery"&&(c=e.secGallery),y.type==="contact"&&(c=e.secContact),y.type==="footer"&&(c=e.secFooter);const h=f===0?"disabled":"",S=f===t.sections.length-1?"disabled":"";x+=`
          <div class="section-list-item" data-sec-idx="${f}">
            <div class="section-item-info">
              <span class="section-item-icon">🧩</span>
              <strong>${c}</strong>
            </div>
            <div class="section-item-actions">
              <button class="action-icon-btn move-up" ${h} title="Move Up">▲</button>
              <button class="action-icon-btn move-down" ${S} title="Move Down">▼</button>
              <button class="action-icon-btn delete delete-sec" title="Delete">🗑️</button>
            </div>
          </div>
        `}),d.innerHTML=`
        <div class="sidebar-group">
          <label class="sidebar-group-title">${e.sectionsCurrent}</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${t.sections.length===0?`<p style="font-size: 0.85rem; color: var(--text-muted);">${e.sectionsEmpty}</p>`:x}
          </div>
        </div>

        <div class="sidebar-group" style="margin-top: 10px;">
          <label class="sidebar-group-title">${e.sectionsAdd}</label>
          <div class="add-section-grid">
            <button class="btn btn-secondary btn-sm add-sec-btn" data-type="hero">＋ ${e.secHero}</button>
            <button class="btn btn-secondary btn-sm add-sec-btn" data-type="features">＋ ${e.secFeatures}</button>
            <button class="btn btn-secondary btn-sm add-sec-btn" data-type="gallery">＋ ${e.secGallery}</button>
            <button class="btn btn-secondary btn-sm add-sec-btn" data-type="contact">＋ ${e.secContact}</button>
          </div>
        </div>
      `,document.querySelectorAll(".move-up").forEach(y=>{y.addEventListener("click",f=>{const c=parseInt(f.target.closest(".section-list-item").getAttribute("data-sec-idx"));if(c>0){const h=t.sections[c];t.sections[c]=t.sections[c-1],t.sections[c-1]=h,l(),a(),b()}})}),document.querySelectorAll(".move-down").forEach(y=>{y.addEventListener("click",f=>{const c=parseInt(f.target.closest(".section-list-item").getAttribute("data-sec-idx"));if(c<t.sections.length-1){const h=t.sections[c];t.sections[c]=t.sections[c+1],t.sections[c+1]=h,l(),a(),b()}})}),document.querySelectorAll(".delete-sec").forEach(y=>{y.addEventListener("click",f=>{const c=parseInt(f.target.closest(".section-list-item").getAttribute("data-sec-idx"));confirm(i.lang==="ar"?"هل أنت متأكد من حذف هذا القسم؟":"Are you sure you want to delete this section?")&&(t.sections.splice(c,1),l(),a(),b())})}),document.querySelectorAll(".add-sec-btn").forEach(y=>{y.addEventListener("click",()=>{const f=y.getAttribute("data-type");p(f)})})}else if(o==="integrations"){const x=t.isPublic?"checked":"";d.innerHTML=`
        <div class="sidebar-group">
          <label class="sidebar-group-title">${e.projSettingsTitle}</label>
          
          <div class="input-group">
            <label class="input-label" for="editor-proj-name">${e.projNameLabel}</label>
            <input type="text" class="input-field" id="editor-proj-name" value="${t.name}" />
          </div>

          <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
            <input type="checkbox" id="editor-proj-public" style="width: 18px; height: 18px; cursor: pointer;" ${x} />
            <label for="editor-proj-public" style="font-size: 0.9rem; color: var(--text-secondary); cursor: pointer;">
              ${e.projIsPublicLabel}
            </label>
          </div>
        </div>

        <div class="sidebar-group">
          <label class="sidebar-group-title">🔗 Form webhook API</label>
          <div class="input-group" style="margin-bottom: 0;">
            <input type="text" class="input-field" id="editor-webhook-val" value="${((m=t.deployed)==null?void 0:m.webhookUrl)||""}" placeholder="https://api.mycompany.com/webhook" style="direction: ltr;" />
            <button class="btn btn-secondary btn-sm" id="editor-webhook-save-btn" style="margin-top: 10px; align-self: flex-start;">
              ${e.save}
            </button>
          </div>
        </div>
      `;const y=document.getElementById("editor-proj-name");y.addEventListener("change",()=>{t.name=y.value.trim()||t.name,document.getElementById("editor-project-title").innerText=t.name,l()});const f=document.getElementById("editor-proj-public");f.addEventListener("change",()=>{t.isPublic=f.checked,l()}),document.getElementById("editor-webhook-save-btn").addEventListener("click",()=>{const c=document.getElementById("editor-webhook-val").value.trim();t.deployed||(t.deployed={isDeployed:!1,subdomain:"",customDomain:"",dnsVerified:!1,webhookUrl:""}),t.deployed.webhookUrl=c,l(),alert(e.alertSiteSaved)})}}}function p(d){let m={id:`${d}_${Math.random().toString(36).substr(2,5)}`,type:d,content:{}};i.lang==="ar"?d==="hero"?m.content={title:"عنوان رئيسي جذاب لموقعك",subtitle:"اكتب هنا عبارة فرعية تشرح بالتفصيل القيمة التي تقدمها لعملائك المستهدفين.",ctaText:"اتصل بنا",ctaLink:"#contact"}:d==="features"?m.content={title:"ميزات خدماتنا",subtitle:"نسعى دائماً لتقديم الأفضل لراحتكم ونمو أعمالكم",items:[{icon:"⭐",title:"جودة استثنائية",desc:"نضمن لك الدقة والاحترافية العالية في جميع تفاصيل تسليم خدماتنا."},{icon:"⏰",title:"التزام بالمواعيد",desc:"نهتم بالوقت كقيمة أساسية ونسلم المشاريع في الأوقات المحددة تماماً."}]}:d==="gallery"?m.content={title:"معرض أعمالنا المتميز",subtitle:"استعرض معنا لقطات واقعية من مشاريعنا الأخيرة",items:[{url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",caption:"تصميم وبناء رقمي"},{url:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",caption:"لوحات بيانات تفاعلية"}]}:d==="contact"?m.content={title:"اتصل بنا اليوم",subtitle:"اترك رسالتك وسيتواصل معك خبراؤنا مباشرة لتلبية طلبك.",fields:["name","phone","notes"]}:d==="footer"&&(m.content={text:"جميع الحقوق محفوظة © 2026",links:"الرئيسية | تواصل معنا"}):d==="hero"?m.content={title:"Welcome to Your Brand New Site",subtitle:"Describe your primary sales value here to hook your prospective client instantly.",ctaText:"Contact Us",ctaLink:"#contact"}:d==="features"?m.content={title:"Why Choose Our Team",subtitle:"Explore the key parameters that define our operational values",items:[{icon:"⭐",title:"Top-Tier Quality",desc:"We deliver clean, scalable components tested across modern layouts."},{icon:"⏰",title:"Timely Operations",desc:"Every sprint planning ensures milestone deliveries are met on schedule."}]}:d==="gallery"?m.content={title:"Our Design Portfolio",subtitle:"Inspect visual mockups and case deliverables built recently",items:[{url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",caption:"Digital Architecture"},{url:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",caption:"Data Visualization Grid"}]}:d==="contact"?m.content={title:"Let's Start a Project",subtitle:"Drop your details below, and our account representative will reach out in hours.",fields:["name","email","notes"]}:d==="footer"&&(m.content={text:"© 2026 Your Brand Space. All rights reserved.",links:"Privacy Policy | Terms"}),t.sections.push(m),l(),a(),b()}function l(){const d=document.getElementById("save-status-indicator");d&&(d.innerHTML="⏳ Saving..."),T.saveProject(t),setTimeout(()=>{d&&(d.innerHTML="Saved ✔️")},400)}function b(){const d=document.getElementById("canvas-simulator");if(!d)return;if(t.sections.length===0){d.innerHTML=`
        <div class="simulator-empty-canvas">
          <span>🧩</span>
          <p>${e.sectionsEmpty}</p>
        </div>
      `;return}const m=t.font||"font-arabic",x=t.language==="ar"?"rtl":"ltr";let f=`
      <div class="web-preview ${t.theme||"theme-corporate"} ${m}" dir="${x}" lang="${t.language}" style="min-height: 100%;">
    `;t.sections.forEach((c,h)=>{if(c.type==="hero")f+=`
          <header class="web-section web-hero" id="${c.id}">
            <div class="web-container">
              <h1 class="web-hero-title editable-component" data-sec-idx="${h}" data-field="title">${c.content.title}</h1>
              <p class="web-hero-desc editable-component" data-sec-idx="${h}" data-field="subtitle">${c.content.subtitle}</p>
              <div>
                <a href="${c.content.ctaLink||"#contact"}" class="web-btn editable-component" data-sec-idx="${h}" data-field="ctaText">
                  ${c.content.ctaText}
                </a>
              </div>
            </div>
          </header>
        `;else if(c.type==="features"){let S="";(c.content.items||[]).forEach(($,E)=>{S+=`
            <div class="web-card">
              <div class="web-card-icon editable-component" data-sec-idx="${h}" data-field="items-icon" data-item-idx="${E}">${$.icon}</div>
              <h3 class="web-card-title editable-component" data-sec-idx="${h}" data-field="items-title" data-item-idx="${E}">${$.title}</h3>
              <p class="web-card-desc editable-component" data-sec-idx="${h}" data-field="items-desc" data-item-idx="${E}">${$.desc}</p>
            </div>
          `}),f+=`
          <section class="web-section" id="${c.id}">
            <div class="web-container">
              <h2 class="web-section-title editable-component" data-sec-idx="${h}" data-field="title">${c.content.title}</h2>
              <p class="web-section-subtitle editable-component" data-sec-idx="${h}" data-field="subtitle">${c.content.subtitle}</p>
              <div class="web-grid-3">
                ${S}
              </div>
            </div>
          </section>
        `}else if(c.type==="gallery"){let S="";(c.content.items||[]).forEach(($,E)=>{S+=`
            <div class="web-gallery-item editable-component" data-sec-idx="${h}" data-field="gallery-item" data-item-idx="${E}">
              <img src="${$.url||"https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80"}" alt="" />
              <div class="web-gallery-caption">${$.caption}</div>
            </div>
          `}),f+=`
          <section class="web-section" id="${c.id}">
            <div class="web-container">
              <h2 class="web-section-title editable-component" data-sec-idx="${h}" data-field="title">${c.content.title}</h2>
              <p class="web-section-subtitle editable-component" data-sec-idx="${h}" data-field="subtitle">${c.content.subtitle}</p>
              <div class="web-gallery-grid">
                ${S}
              </div>
            </div>
          </section>
        `}else if(c.type==="contact"){let S="";(c.content.fields||[]).forEach($=>{if($==="notes")S+=`<textarea class="web-textarea" placeholder="${t.language==="ar"?"رسالتك وملاحظاتك...":"Your notes/message..."}" readonly></textarea>`;else{let E=$.toUpperCase();$==="name"&&(E=t.language==="ar"?"الاسم الكامل":"Full Name"),$==="phone"&&(E=t.language==="ar"?"رقم الهاتف":"Phone Number"),$==="email"&&(E=t.language==="ar"?"البريد الإلكتروني":"Email Address"),$==="date"&&(E=t.language==="ar"?"التاريخ والوقت المطلبان":"Booking Date/Time"),S+=`<input type="text" class="web-input" placeholder="${E}" readonly />`}}),f+=`
          <section class="web-section" id="${c.id}">
            <div class="web-container">
              <h2 class="web-section-title editable-component" data-sec-idx="${h}" data-field="title">${c.content.title}</h2>
              <p class="web-section-subtitle editable-component" data-sec-idx="${h}" data-field="subtitle">${c.content.subtitle}</p>
              
              <div class="web-contact-form">
                ${S}
                <button class="web-btn" style="width: 100%; justify-content: center; font-size: 1rem;">
                  ${t.language==="ar",e.formSubmitBtn}
                </button>
              </div>
            </div>
          </section>
        `}else c.type==="footer"&&(f+=`
          <footer class="web-footer" id="${c.id}">
            <div class="web-footer-container">
              <p class="editable-component" data-sec-idx="${h}" data-field="text">${c.content.text}</p>
              <p style="font-size: 0.8rem; opacity: 0.8;" class="editable-component" data-sec-idx="${h}" data-field="links">
                ${c.content.links}
              </p>
            </div>
          </footer>
        `)}),f+="</div>",d.innerHTML=f,P()}let w=null,g=null,v=null;function P(){document.querySelectorAll(".editable-component").forEach(m=>{m.addEventListener("click",x=>{x.stopPropagation(),x.preventDefault(),w=parseInt(m.getAttribute("data-sec-idx")),g=m.getAttribute("data-field");const y=m.getAttribute("data-item-idx");v=y!==null?parseInt(y):null,I()})})}function I(d){const m=document.getElementById("inline-edit-panel"),x=document.getElementById("inline-text-textarea"),y=document.getElementById("inline-image-group"),f=document.getElementById("inline-image-url"),c=document.getElementById("inline-label");let h="";const S=t.sections[w];if(v===null)h=S.content[g];else if(g==="gallery-item")h=S.content.items[v].caption,f.value=S.content.items[v].url,y.style.display="block";else{const C=g.replace("items-","");h=S.content.items[v][C],y.style.display="none"}x.value=h,c.innerText=i.lang==="ar"?"المحتوى النصي الجديد":"New Text Content",m.style.display="flex";const $=document.getElementById("inline-edit-cancel"),E=document.getElementById("inline-edit-save"),k=$.cloneNode(!0),B=E.cloneNode(!0);$.parentNode.replaceChild(k,$),E.parentNode.replaceChild(B,E),k.addEventListener("click",()=>{m.style.display="none"}),B.addEventListener("click",()=>{const C=x.value.trim(),A=t.sections[w];if(v===null)A.content[g]=C;else if(g==="gallery-item")A.content.items[v].caption=C,A.content.items[v].url=f.value.trim();else{const U=g.replace("items-","");A.content.items[v][U]=C}l(),m.style.display="none",b()})}return r}const V={appName:"Cabable",appTagline:"منصة ذكية لإنشاء المواقع",langToggle:"English",loading:"جاري التحميل...",save:"حفظ",cancel:"إلغاء",delete:"حذف",edit:"تعديل",clone:"نسخ",create:"إنشاء",deploy:"نشر الموقع",preview:"معاينة",back:"رجوع",status:"الحالة",public:"عام",private:"خاص",copied:"تم النسخ!",success:"نجاح",error:"خطأ",dashboard:"الرئيسية",publicGallery:"مشاريع المجتمع",websiteTemplates:"القوالب الجاهزة",signOut:"تسجيل الخروج",heroTitle:"أنشئ موقعك الإلكتروني الاحترافي بذكاء وبثوانٍ معدودة",heroSubtitle:"اكتب ما تريده باللغة العربية أو الإنجليزية ودع الذكاء الاصطناعي يصمم وينشئ موقعك المتكامل القابل للتعديل والنشر الفوري.",promptPlaceholder:"مثال: موقع لمطعم شاورما باللون الأحمر مع قائمة طعام ونظام حجز...",suggestTitle:"اقتراحات سريعة لك للبدء:",suggest1:"معرض أعمال لمصمم داخلي",suggest2:"صفحة هبوط لتطبيق توصيل ذكي",suggest3:"موقع لشركة محاماة واستشارات",suggest4:"مقهى مختص هادئ باللون البيج",myProjects:"مشاريعي",communityProjects:"معرض أعمال المجتمع",noProjectsYet:"لا توجد مواقع بعد! ابدأ بكتابة فكرة موقعك أعلاه أو اختر قالباً جاهزاً.",cloneCount:"نسخة",publicBadgeLabel:"قابل للنسخ من الجميع",privateBadgeLabel:"خاص بك فقط",tplPortfolioName:"معرض أعمال شخصي",tplPortfolioDesc:"قالب نظيف وأنيق للمصممين والمطورين لعرض أعمالهم وخبراتهم.",tplRestoName:"مطعم ومقهى فاخر",tplRestoDesc:"قالب مخصص للمطاعم يعرض الوجبات، الأسعار ونظام حجز الطاولات.",tplAgencyName:"وكالة تسويق رقمية",tplAgencyDesc:"تصميم متكامل للشركات لعرض الخدمات، آراء العملاء وباقات الأسعار.",tplSaaSLandingName:"صفحة هبوط تقنية (SaaS)",tplSaaSLandingDesc:"صفحة هبوط للمنتجات البرمجية تركز على الميزات والتحويل المباشر للمستخدمين.",aiModalTitle:"توليد موقعك بالذكاء الاصطناعي",aiPromptLabel:"وصف الموقع المطلوب بالتفصيل",aiToneLabel:"لهجة النصوص",aiToneProfessional:"رسمي وعملي",aiToneCreative:"إبداعي وحيوي",aiToneFriendly:"ودي ولطيف",aiColorLabel:"الهوية اللونية الافتراضية",aiColorAuto:"تحديد تلقائي بناءً على الوصف",aiColorMidnight:"بنفسجي غامق (Midnight)",aiColorEmerald:"أخضر زمردي (Emerald)",aiColorSunset:"برتقالي دافئ (Sunset)",aiColorCorporate:"أزرق رسمي (Corporate)",aiCategoryLabel:"تصنيف موقعك",aiCatRestaurant:"مطعم أو مقهى",aiCatPortfolio:"معرض أعمال / شخصي",aiCatBusiness:"شركة / خدمات أعمال",aiCatSaaS:"منتج برمجيات / صفحة هبوط",aiBtnGenerate:"ابدأ التوليد السحري ✨",aiGeneratingStep1:"تحليل طلبك وتحديد الأقسام اللازمة...",aiGeneratingStep2:"توليد نصوص تسويقية باللغة المحددة...",aiGeneratingStep3:"اختيار لوحة الألوان والخطوط المتناسقة...",aiGeneratingStep4:"تركيب الموقع وتجهيز لوحة التعديل...",editorTabStyles:"التنسيق",editorTabSections:"الأقسام",editorTabIntegrations:"الربط التقني",editorSettings:"الإعدادات العامة",styleFontLabel:"نوع الخط",styleColorLabel:"لوحة الألوان",stylePrimaryColor:"اللون الأساسي",styleBackgroundColor:"اللون الخلفي",sectionsCurrent:"أقسام الموقع الحالية",sectionsAdd:"إضافة قسم جديد",secHero:"واجهة الموقع (Hero)",secFeatures:"المميزات / الخدمات",secGallery:"معرض الصور / الألبوم",secContact:"اتصل بنا / نموذج الحجز",secFooter:"تذييل الصفحة (Footer)",sectionsEmpty:"لا توجد أقسام في الموقع. أضف قسماً لتبدأ!",intWebhookLabel:"عنوان Webhook للنموذج (API)",intWebhookHelp:"عند قيام الزائر بإرسال أي نموذج في موقعك، سيتم إرسال البيانات فوراً كطلب POST لهذا العنوان.",intWebhookPlaceholder:"https://yourbackend.com/api/leads",intWebhookTestBtn:"اختبار الاتصال بالخلفية",intWebhookTestSuccess:"تم الاتصال بالخلفية بنجاح وتم إرسال payload تجريبي!",intWebhookTestError:"فشل الاتصال. يرجى التحقق من صحة عنوان URL.",domainTabSubdomain:"نطاق فرعي مجاني",domainTabCustom:"نطاقك الخاص (Custom)",domainSubdomainInputLabel:"اختر اسم النطاق الفرعي",domainSubdomainHelp:"سيكون موقعك متاحاً على الرابط:",domainSubdomainPlaceholder:"my-awesome-site",domainCustomInputLabel:"أدخل رابط نطاقك الخاص",domainCustomPlaceholder:"www.mycompany.com",domainDnsInstructions:"يرجى التوجه إلى لوحة تحكم نطاقك (مثل GoDaddy أو Cloudflare) وإضافة السجلات التالية لتوجيه موقعك إلينا:",domainDnsVerifyBtn:"تحقق من إعدادات DNS والتفعيل",domainDnsStatusActive:"نشط ومتصل بالخلفية (SSL مؤمن)",domainDnsStatusChecking:"جاري التحقق من سجلات DNS وتوليد شهادة SSL...",domainDnsStatusFailed:"لم نتمكن من التحقق من توجيه النطاق. يرجى مراجعة سجلات CNAME أو A والمحاولة بعد قليل.",deployTitle:"نشر وتجهيز موقعك على شبكتنا",deployStep1:"جاري تجميع الملفات وبناء موقع الويب...",deployStep2:"توليد شهادات الحماية SSL بشكل تلقائي...",deployStep3:"تهيئة الموازنة السحابية وبث المحتوى...",deploySuccess:"تهانينا! موقعك الآن مباشر على الإنترنت وبشكل فعال.",deployVisitSite:"زيارة الموقع المنشور",deployCopyLink:"نسخ رابط الموقع",deploySharePublic:"اجعل هذا المشروع عاماً ليقوم الآخرون بنسخه",deployConfigSuccess:"تم حفظ إعدادات النشر بنجاح!",editElementTitle:"تعديل النص المباشر",editElementLabel:"المحتوى النصي",editElementImageLabel:"رابط الصورة (URL)",editElementBtnSave:"تطبيق التعديل",formSubmitBtn:"إرسال البيانات",formSuccessMsg:"شكراً لك! تم إرسال رسالتك بنجاح.",formSending:"جاري الإرسال...",projSettingsTitle:"إعدادات المشروع",projNameLabel:"اسم المشروع",projNamePlaceholder:"مشروعي الجديد",projIsPublicLabel:"إتاحة المشروع كقالب عام في المعرض",alertSiteSaved:"تم حفظ التعديلات بنجاح!",alertClonedSuccess:"تم استنساخ المشروع بنجاح إلى حسابك ومتاح للتعديل الآن!"},j={appName:"Cabable",appTagline:"AI-Powered Website Creator",langToggle:"العربية",loading:"Loading...",save:"Save",cancel:"Cancel",delete:"Delete",edit:"Edit",clone:"Clone",create:"Create",deploy:"Deploy",preview:"Preview",back:"Back",status:"Status",public:"Public",private:"Private",copied:"Copied!",success:"Success",error:"Error",dashboard:"Dashboard",publicGallery:"Community Projects",websiteTemplates:"Templates",signOut:"Sign Out",heroTitle:"Build Your Professional Website with AI in Seconds",heroSubtitle:"Describe your ideas in Arabic or English, and let AI design, copywrite, and prepare your fully customizable website for instant deployment.",promptPlaceholder:"e.g., A boutique specialty coffee shop with a cozy warm beige theme...",suggestTitle:"Quick prompt ideas to get you started:",suggest1:"Interior designer portfolio showing recent projects",suggest2:"Clean SaaS landing page for an AI scheduling tool",suggest3:"Professional law firm business website with services",suggest4:"Vegan restaurant menu website with reservation form",myProjects:"My Projects",communityProjects:"Community Showcase",noProjectsYet:"No websites created yet! Describe your idea above or select a ready template to begin.",cloneCount:"clones",publicBadgeLabel:"Clonable by community",privateBadgeLabel:"Private to you",tplPortfolioName:"Personal Portfolio",tplPortfolioDesc:"A sleek, modern design for designers and developers to show their works and skills.",tplRestoName:"Gourmet Restaurant & Cafe",tplRestoDesc:"Custom template for diners showcasing menus, pricing grids, and table reservation booking.",tplAgencyName:"Digital Marketing Agency",tplAgencyDesc:"Comprehensive business layout detailing service plans, pricing tables, and client testimonies.",tplSaaSLandingName:"SaaS Product Landing",tplSaaSLandingDesc:"Tech-focused landing page for software products focusing on features, benefits, and direct user conversions.",aiModalTitle:"Generate Website with AI",aiPromptLabel:"Describe your dream website in detail",aiToneLabel:"Copywriting Tone of Voice",aiToneProfessional:"Professional & Business",aiToneCreative:"Creative & Vibrant",aiToneFriendly:"Friendly & Warm",aiColorLabel:"Default Color Theme Palette",aiColorAuto:"Detect automatically from prompt",aiColorMidnight:"Deep Violet (Midnight)",aiColorEmerald:"Emerald Green (Emerald)",aiColorSunset:"Warm Orange (Sunset)",aiColorCorporate:"Navy Blue (Corporate)",aiCategoryLabel:"Industry/Category",aiCatRestaurant:"Restaurant / Catering",aiCatPortfolio:"Portfolio / Personal Brand",aiCatBusiness:"Corporate / Agency",aiCatSaaS:"Tech / Product Landing Page",aiBtnGenerate:"Start Magical Generation ✨",aiGeneratingStep1:"Analyzing prompt specifications and mapping sections...",aiGeneratingStep2:"Copywriting marketing text in selected language...",aiGeneratingStep3:"Color matching design palettes and typography configurations...",aiGeneratingStep4:"Assembling visual canvas and configuring page customizers...",editorTabStyles:"Style & Colors",editorTabSections:"Sections Layout",editorTabIntegrations:"Integrations & API",editorSettings:"Settings",styleFontLabel:"Primary Typography Font",styleColorLabel:"Color Theme Style",stylePrimaryColor:"Primary Color",styleBackgroundColor:"Background Base",sectionsCurrent:"Active Site Sections",sectionsAdd:"Insert Section",secHero:"Header/Hero Section",secFeatures:"Service Features Grid",secGallery:"Visual Gallery Showcase",secContact:"Interactive Contact/Booking Form",secFooter:"Page Footer & Links",sectionsEmpty:"No sections active on this site. Add one below to begin!",intWebhookLabel:"Contact Form Webhook Endpoint (API)",intWebhookHelp:"When a visitor submits any form on your site, it will make a POST request with the form payload to this endpoint.",intWebhookPlaceholder:"https://yourbackend.com/api/leads",intWebhookTestBtn:"Test Backend Connection",intWebhookTestSuccess:"Connection validated! Mock JSON payload submitted successfully.",intWebhookTestError:"Connection failed. Please inspect the URL validity.",domainTabSubdomain:"Free Subdomain",domainTabCustom:"Your Own Domain (Custom)",domainSubdomainInputLabel:"Choose your unique subdomain",domainSubdomainHelp:"Your website will be live at:",domainSubdomainPlaceholder:"my-awesome-site",domainCustomInputLabel:"Enter your custom domain",domainCustomPlaceholder:"www.mycompany.com",domainDnsInstructions:"Please open your domain DNS management zone (e.g., Cloudflare, Namecheap) and create the following records:",domainDnsVerifyBtn:"Verify DNS Setup & Active SSL",domainDnsStatusActive:"Active & Secured (SSL Active)",domainDnsStatusChecking:"Verifying DNS propagation and generating SSL keys...",domainDnsStatusFailed:"Could not verify domain connection. Please confirm CNAME or A records are fully set and try again.",deployTitle:"Deploying Site to Global Network",deployStep1:"Compiling website layout and setting assets...",deployStep2:"Provisioning edge caching nodes & SSL certificate...",deployStep3:"Activating CDN routing rules...",deploySuccess:"Excellent! Your site is live and active globally.",deployVisitSite:"Visit Live Site",deployCopyLink:"Copy Link",deploySharePublic:"Make this project public in Community Gallery",deployConfigSuccess:"Deployment configurations stored successfully!",editElementTitle:"Inline Content Editor",editElementLabel:"Text Content",editElementImageLabel:"Image Address (URL)",editElementBtnSave:"Apply Changes",formSubmitBtn:"Submit Data",formSuccessMsg:"Thank you! Your submission was recorded.",formSending:"Sending...",projSettingsTitle:"Project Settings",projNameLabel:"Website Title Name",projNamePlaceholder:"My New Website",projIsPublicLabel:"Display project in Community Showcase templates",alertSiteSaved:"Changes saved successfully!",alertClonedSuccess:"Project cloned successfully to your dashboard and ready to edit!"},u={lang:T.getLang(),translations:T.getLang()==="ar"?V:j,currentView:"dashboard",activeProject:null,activeDashboardTab:"my-projects"};function te(){const i=u.lang==="ar"?"en":"ar";u.lang=i,u.translations=i==="ar"?V:j,T.setLang(i),document.documentElement.lang=i,document.documentElement.dir=i==="ar"?"rtl":"ltr",H()}function H(){const i=window.location.hash;if(document.documentElement.setAttribute("data-theme","dark"),i.startsWith("#editor/")){const t=i.replace("#editor/",""),s=T.getProjectById(t);s?(u.currentView="editor",u.activeProject=s,O()):window.location.hash="#dashboard"}else if(i.startsWith("#site/")){const t=i.replace("#site/",""),s=T.getProjectById(t);s?(u.currentView="site-preview",u.activeProject=s,ie(s)):window.location.hash="#dashboard"}else u.currentView="dashboard",u.activeProject=null,O()}function L(i,t=null){i==="editor"&&t?window.location.hash=`#editor/${t}`:i==="site"&&t?window.location.hash=`#site/${t}`:window.location.hash="#dashboard"}function O(){const i=document.getElementById("app");i&&(i.className="",u.currentView==="editor"?i.innerHTML=ee(u,u.activeProject,()=>{L("dashboard")}):(i.innerHTML=`
      ${R(u,t=>L(t),te)}
      <main class="main-container">
        
        <!-- Hero Generative Prompt Section -->
        <section class="hero-section">
          <span class="hero-tagline">${u.translations.appTagline}</span>
          <h1 class="hero-title text-gradient-rainbow">${u.translations.heroTitle}</h1>
          <p class="hero-subtitle">${u.translations.heroSubtitle}</p>
          
          <!-- Large Prompt Input -->
          <div class="ai-prompter-container">
            <input type="text" class="ai-prompt-input" id="dashboard-prompt-input" placeholder="${u.translations.promptPlaceholder}" />
            <button class="btn btn-primary btn-lg" id="dashboard-prompt-submit">
              ✨ ${u.translations.create}
            </button>
          </div>

          <!-- Auto prompt tags suggestions -->
          <div style="margin-top: 10px;">
            <p style="font-size: 0.9rem; color: var(--text-muted);">${u.translations.suggestTitle}</p>
            <div class="prompt-suggestions">
              <span class="suggestion-tag" data-prompt="${u.translations.suggest1}">${u.translations.suggest1}</span>
              <span class="suggestion-tag" data-prompt="${u.translations.suggest2}">${u.translations.suggest2}</span>
              <span class="suggestion-tag" data-prompt="${u.translations.suggest3}">${u.translations.suggest3}</span>
              <span class="suggestion-tag" data-prompt="${u.translations.suggest4}">${u.translations.suggest4}</span>
            </div>
          </div>
        </section>

        <!-- Tab Controls Navigation -->
        <div class="dashboard-tabs">
          <button class="tab-btn ${u.activeDashboardTab==="my-projects"?"active":""}" id="tab-my-projects">
            📂 ${u.translations.myProjects}
          </button>
          <button class="tab-btn ${u.activeDashboardTab==="community"?"active":""}" id="tab-community">
            🔓 ${u.translations.communityProjects}
          </button>
          <button class="tab-btn ${u.activeDashboardTab==="templates"?"active":""}" id="tab-templates">
            🎨 ${u.translations.websiteTemplates}
          </button>
        </div>

        <!-- Dynamic Grid Content Area -->
        <div id="dashboard-grid-area">
          <!-- Populated by JS -->
        </div>

      </main>
    `,setTimeout(()=>{const t=document.getElementById("dashboard-prompt-input"),s=document.getElementById("dashboard-prompt-submit"),e=()=>{const n=t.value.trim();n?G(u,n,o=>{L("editor",o.id)}):alert(u.lang==="ar"?"يرجى كتابة فكرة موقعك أولاً!":"Please describe your website idea first!")};s.addEventListener("click",e),t.addEventListener("keydown",n=>{n.key==="Enter"&&e()}),document.querySelectorAll(".suggestion-tag").forEach(n=>{n.addEventListener("click",()=>{const o=n.getAttribute("data-prompt");t.value=o,G(u,o,r=>{L("editor",r.id)})})}),document.getElementById("tab-my-projects").addEventListener("click",()=>{q("my-projects")}),document.getElementById("tab-community").addEventListener("click",()=>{q("community")}),document.getElementById("tab-templates").addEventListener("click",()=>{q("templates")}),q(u.activeDashboardTab)},0)))}function q(i){u.activeDashboardTab=i,document.querySelectorAll(".tab-btn").forEach(e=>e.classList.remove("active"));const t=document.getElementById(`tab-${i}`);t&&t.classList.add("active");const s=document.getElementById("dashboard-grid-area");if(s)if(i==="my-projects"){const e=T.getProjects().filter(o=>!o.isSystem);if(e.length===0){s.innerHTML=`
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <h4 style="font-weight:700;">${u.translations.noProjectsYet}</h4>
        </div>
      `;return}let n='<div class="projects-grid">';e.forEach(o=>{n+=F(u,o,!1)}),n+="</div>",s.innerHTML=n,z(u,o=>L("editor",o),o=>q("my-projects"),()=>q("my-projects"),o=>L("site",o))}else if(i==="community"){const e=T.getPublicProjects();if(e.length===0){s.innerHTML=`
        <div class="empty-state">
          <div class="empty-icon">🔓</div>
          <h4>No public projects shared by the community yet.</h4>
        </div>
      `;return}let n='<div class="projects-grid">';e.forEach(o=>{n+=F(u,o,!0)}),n+="</div>",s.innerHTML=n,z(u,null,o=>L("editor",o.id),null,o=>L("site",o))}else i==="templates"&&(s.innerHTML=X(u,e=>{L("editor",e.id)}))}function ie(i){const t=document.getElementById("app");if(!t)return;const s=i.font||"font-arabic",e=i.language==="ar"?"rtl":"ltr";let r=`
    
    <div style="position: fixed; top: 16px; right: 16px; z-index: 10000; display: flex; gap: 8px;">
      <a href="#dashboard" style="background: rgba(10, 14, 26, 0.85); color: #fff; padding: 8px 16px; border-radius: 99px; font-weight: 600; font-size: 0.85rem; text-decoration: none; border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(10px); display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        ⚡ Back to Cabable
      </a>
    </div>
  
    <div class="web-preview ${i.theme||"theme-corporate"} ${s}" dir="${e}" lang="${i.language}" style="min-height: 100vh;">
  `;i.sections.forEach(a=>{if(a.type==="hero")r+=`
        <header class="web-section web-hero" id="${a.id}">
          <div class="web-container">
            <h1 class="web-hero-title">${a.content.title}</h1>
            <p class="web-hero-desc">${a.content.subtitle}</p>
            <div>
              <a href="${a.content.ctaLink||"#contact"}" class="web-btn">
                ${a.content.ctaText}
              </a>
            </div>
          </div>
        </header>
      `;else if(a.type==="features"){let p="";(a.content.items||[]).forEach(l=>{p+=`
          <div class="web-card">
            <div class="web-card-icon">${l.icon}</div>
            <h3 class="web-card-title">${l.title}</h3>
            <p class="web-card-desc">${l.desc}</p>
          </div>
        `}),r+=`
        <section class="web-section" id="${a.id}">
          <div class="web-container">
            <h2 class="web-section-title">${a.content.title}</h2>
            <p class="web-section-subtitle">${a.content.subtitle}</p>
            <div class="web-grid-3">
              ${p}
            </div>
          </div>
        </section>
      `}else if(a.type==="gallery"){let p="";(a.content.items||[]).forEach(l=>{p+=`
          <div class="web-gallery-item">
            <img src="${l.url||""}" alt="" />
            <div class="web-gallery-caption">${l.caption}</div>
          </div>
        `}),r+=`
        <section class="web-section" id="${a.id}">
          <div class="web-container">
            <h2 class="web-section-title">${a.content.title}</h2>
            <p class="web-section-subtitle">${a.content.subtitle}</p>
            <div class="web-gallery-grid">
              ${p}
            </div>
          </div>
        </section>
      `}else if(a.type==="contact"){let p="";(a.content.fields||[]).forEach(l=>{if(l==="notes")p+=`<textarea class="web-textarea" id="form-field-notes" placeholder="${i.language==="ar"?"رسالتك وملاحظاتك...":"Your notes/message..."}" required></textarea>`;else{let b=l.toUpperCase(),w=`form-field-${l}`,g="required";l==="name"&&(b=i.language==="ar"?"الاسم الكامل":"Full Name"),l==="phone"&&(b=i.language==="ar"?"رقم الهاتف":"Phone Number"),l==="email"&&(b=i.language==="ar"?"البريد الإلكتروني":"Email Address"),l==="date"&&(b=i.language==="ar"?"التاريخ والوقت المطلوبان":"Booking Date/Time"),p+=`<input type="text" class="web-input" id="${w}" placeholder="${b}" ${g} />`}}),r+=`
        <section class="web-section" id="${a.id}">
          <div class="web-container">
            <h2 class="web-section-title">${a.content.title}</h2>
            <p class="web-section-subtitle">${a.content.subtitle}</p>
            
            <form class="web-contact-form" id="live-contact-form">
              <div class="web-contact-success" id="live-contact-success">
                ${i.language==="ar"?"شكراً لك! تم إرسال رسالتك وتأكيد الحجز بنجاح.":"Thank you! Your submission was recorded successfully."}
              </div>
              ${p}
              <button type="submit" class="web-btn" id="live-form-submit-btn" style="width: 100%; justify-content: center; font-size: 1.05rem;">
                ${i.language==="ar"?"حفظ وإرسال الطلب":"Submit Details"}
              </button>
            </form>
          </div>
        </section>
      `}else a.type==="footer"&&(r+=`
        <footer class="web-footer" id="${a.id}">
          <div class="web-footer-container">
            <p>${a.content.text}</p>
            <p style="font-size: 0.8rem; opacity: 0.8;">${a.content.links}</p>
          </div>
        </footer>
      `)}),r+=`
      <!-- Tiny Brand Tag -->
      <div style="background: var(--web-bg-1); text-align: center; font-size: 0.75rem; padding: 20px 0; border-top: 1px dashed var(--web-border); opacity: 0.75;">
        ⚡ Built instantly with <a href="#dashboard" style="color: var(--web-primary); font-weight: 700;">Cabable Platform</a>
      </div>
    </div>
  `,t.innerHTML=r,setTimeout(()=>{const a=document.getElementById("live-contact-form");a&&a.addEventListener("submit",p=>{var P,I;p.preventDefault();const l=document.getElementById("live-form-submit-btn"),b=document.getElementById("live-contact-success");l.disabled=!0,l.innerText=i.language==="ar"?"جاري الإرسال...":"Submitting...";const w={};(((P=i.sections.find(d=>d.type==="contact"))==null?void 0:P.content.fields)||[]).forEach(d=>{const m=document.getElementById(`form-field-${d}`);m&&(w[d]=m.value)});const g=((I=i.deployed)==null?void 0:I.webhookUrl)||"";g?fetch(g,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({formSubmission:!0,project:{id:i.id,name:i.name},timestamp:new Date().toISOString(),payload:w}),mode:"no-cors"}).then(()=>{v()}).catch(d=>{console.error("Form webhook submission error: ",d),v()}):setTimeout(()=>{v()},800);function v(){b.style.display="block",l.disabled=!1,l.innerText=i.language==="ar"?"تم الإرسال ✓":"Submitted ✓",a.reset()}})},0)}window.addEventListener("hashchange",H);window.addEventListener("DOMContentLoaded",H);

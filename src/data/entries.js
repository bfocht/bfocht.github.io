// TABLE 4: entries - the resume's spine. Positions plus the profile, education and
// credentials sections. `tl` is the chronological slot used to lay positions out
// left-to-right as a timeline; null lets an entry float on its links alone.
// `highlights` renders as the metric strip at the top of the drawer.
// `scale` multiplies an entry's node radius to give the current role visual weight.
const ENTRIES = [

/* ------------------------------------------------------------------ profile */
{ key:'profile', title:'Bryan Focht', icon:'👤', photo:'assets/bryan-focht.jpg', kind:'profile', tl:5.4, scale:3,
  tagline:'Engineering Executive · [linkedin.com/in/fochtb](https://www.linkedin.com/in/fochtb)',
   role:'Engineering Executive',
  orgs:['O_GD'],
  highlights:[
    { v:'28+ years', k:'Development & Leadership' },
    { v:'$1.4M', k:'AWS budget' },
    { v:'$6B+', k:'Driving billion dollar global growth' },
    { v:'MBA', k:'Boston University' }
  ],
  skills:['S_LEAD','S_GLOBAL','S_ROADMAP','S_ECOM','S_CATALOG','S_AWS','S_AGENTS','S_FDE'],
  md:[
"Engineering executive with **28 years** building enterprise software, currently owning technology strategy, budget and P&L for the platform behind GoDaddy's commerce stack - the systems that decide what can be sold, at what price, in which market, and how it reaches a cart.",
"",
"A consistent pattern across roles: taking on more organizational, financial and cross-functional scope at each step - from individual technical ownership to running global, multi-region engineering organizations with budget authority over infrastructure spend, vendor and contractor investment, and capital planning - while staying accountable for the business outcome, not just the delivery.",
"",
"### How I work",
"- **Buy down risk before scale.** De-risk large-scale enterprise migrations by pioneering a framework of translation seams, shadow-mode validation, and granular feature switches; eliminate systemic deployment risks and ensure zero-downtime business continuity.",
"- **Fix causes, not symptoms.** Enforce strict architectural governance by prioritizing root-cause remediation over tactical patches; structurally resolve defects at the source to eliminate technical debt across dependent systems.",
"- **Grow people into scope.** Scale organizational capacity through proactive talent cultivation; empower engineering managers and staff engineers with complete delivery ownership while maximizing executive leverage via architectural governance, strategic staffing, and systemic unblocking.",
"",
"### Currently accountable for",
"Directly spearheading the enterprise-wide modernization of core commerce infrastructure, overseeing the architectural migration of high-volume order and basket traffic to AWS via a next-generation product/variant/offer semantic model. Directly accountable for global engineering standards, platform resilience, and enterprise security/compliance, with an expanding executive scope driving automated revenue recovery systems, refund automation, and AI-driven credit reserve strategies.",
"",
"### AI & Agentic tools",
"`Claude Code` · `Cursor` · `Codex` · `Copilot` · `OpenClaw` · `LiteLLM` ",
"",
"### Core technology",
"`AWS` · `Kubernetes` · `Elastic/Grafana` · `Cloudwatch/trail`",
""
].join("\n")},

/* --------------------------------------------------- GoDaddy · Director */
{ key:'gd_director', title:'Director of Engineering', icon:'🧭', kind:'position', tl:4.3, scale:2,
  dates:'Oct 2020 - Present', tenure:'5 yr 11 mo', location:'Arizona · Global teams',
  orgs:['O_GD'], y0:2020, y1:2026,
  highlights:[
    { v:'$1.8B', k:'acquisition platform integration' },
    { v:'3', k:'global AWS regions' },
    { v:'10M+', k:'monthly orders & renewals' },
  ],
  skills:['S_LEAD','S_GLOBAL','S_ROADMAP','S_MENTOR','S_PARTNER','S_CONTRACT','S_BUDGET','S_RECRUIT','S_ARCH','S_AGILE','S_TEST','S_SOX',
          'S_JAVA','S_SPRING','S_AWS','S_MICRO','S_REST','S_SQL','S_MSSQL','S_DDB','S_REDIS','S_CACHE',
          'S_OBS','S_RESIL','S_MIGRATE','S_CATALOG','S_ECOM','S_AGENTS','S_MCP','S_PROMPT'],
  md:[
"## Director of Engineering · GoDaddy",
"*Oct 2020 - Present · Arizona, with teams across US, Latin America, Europe and India*",
"",
"I own the **catalog, product-creation and basket platform** behind GoDaddy's commerce stack. Three teams, roughly 25 engineers and managers from staff level to SDE I plus interns, deliberately spread globally for near-continuous delivery.",
"",
"### Selected impact",
"- Achieved cost savings integrating GoDaddy's **$1.8 Billion Host Europe Group acquisition** onto a single platform - shut down several costly e-commerce platforms, rebranding five HEG brands into GoDaddy while one kept its standalone identity.",
"- Driving **AI adoption** across the org - an intern-built agent replaced a manual SOX tax-review process for a **10x productivity** gain, and AI infrastructure other teams now build on (Catalog MCP server, Product Creation Agent and workflow orchestration).",
"- Caught two costly defects before they compounded: a pricing bug projected to hit **10-16% of 100K+ monthly orders**, and a cart bug with **~$1M exposure** - drove both fixes into the owning services rather than patching downstream.",
"- Root-caused a live catalog outage same-day and re-architected the call path so a single slow dependency can't take the platform down again.",
"",
"### Platform ownership",
"- **Catalog, product-creation and basket platform** - the pricing and offer engine behind GoDaddy's storefront. Re-architected around a variant/offer/product model behind a translation seam, so every SKU (domains, hosting, email, add-ons, payments, and the emerging AI Credit reserve) prices consistently without breaking existing callers.",
"- **Commerce-stack migration** - moved order and basket traffic onto AWS in shadow mode, cutting over only once diffs were clean (**99.6% match**), protecting revenue-critical checkout from a high-risk migration.",
"- **Resilience and standards** - circuit breakers, bounded caches, and connection-pool isolation so one slow dependency can't cascade into an outage at **10M+ monthly orders**; raised coverage requirements to 90% unit / 100% functional-API.",
"- **Team, budget and vendor ownership** - built and grew three globally distributed teams; own the AWS and AI infrastructure budget across **3 global regions**, full-cycle recruiting, and contractor/vendor management (EPAM, Tech Systems, Globant, Apex Systems, Lviv IT).",
"- **Security and compliance** - vulnerability remediation, certificate automation, attestation management, and SOX review tooling.",
"",
"### Technology",
"`Java 21` · `Spring Boot 3.x` · `SQL Server` · `DynamoDB` · `Redis` · `Github Workflows`"
].join("\n")},

/* --------------------------------------------- GoDaddy · Senior Manager */
{ key:'gd_srmgr', title:'Senior Engineering Manager', icon:'🏗', kind:'position', tl:3,
  dates:'Jan 2012 - Oct 2020', tenure:'8 yr 10 mo', location:'Arizona',
  orgs:['O_GD'], y0:2012, y1:2020,
  highlights:[
    { v:'50+', k:'markets launched' },
    { v:'$126M+', k:'revenue, 129% growth' },
    { v:'4+', k:'major partners onboarded' }
  ],
  skills:['S_LEAD','S_HIRE','S_ROADMAP','S_PARTNER','S_CONTRACT','S_RECRUIT','S_GLOBAL','S_AGILE','S_ITIL','S_TEST',
          'S_I18N','S_NODE','S_REACT','S_JS','S_PYTHON','S_DJANGO','S_WP','S_REST','S_SWAGGER',
          'S_JENKINS','S_DOCKER','S_K8S','S_CICD','S_OAUTH','S_IDENTITY','S_DOTNET','S_CSHARP','S_ECOM','S_MICRO'],
  md:[
"## Senior Engineering Manager · GoDaddy",
"*Jan 2012 - Oct 2020, Arizona*",
"",
"Bootstrapped a cross-functional agile team - software engineers, test engineers, product owner, and marketing professional. Drove the roadmap in partnership with business development. Responsible for hiring, delivery and platform direction.",
"",
"Ran full-cycle recruiting for the team - budgeting, sourcing, screening, interview loops and closing",
"",
"### Growth and reach",
"- Grew the private label reseller program from **$55M to $126M in annual revenue** under my leadership.",
"- Expanded the private label reseller program into **50+ global markets**, adding localization to the platform: multi-language, multi-currency and multi-brand support.",
"- Launched a brand-new internationalized, responsive turnkey **storefront on Node.js, React, and Bootstrap**.",
"- Onboarded recognizable partners onto the platform, including **WHMCS, Microsoft, and Amazon**.",
"- Consistently delivered roadmap commitments on time.",
"",
"### Platform and engineering",
"- Redesigned and launched a new **markup-based pricing platform**, replacing a rigid legacy pricing system - cutting cost and complexity while letting the platform scale past **25,000 resellers** with no added cost to the platform or storage.",
"- Partnered directly with **Google** to build a secure OAuth flow allowing Google Apps and Gmail customers to link a GoDaddy-purchased domain (.NET and C#). Helped author the Domain Connect whitepaper.",
"",
"- Built a **RESTful e-commerce API** for partners building their own ecommerce stores, fully documented with OpenAPI so any platform can integrate.",
"- Authored the companion **WordPress ecommerce plugin and storefront theme**.",
"- Rapidly accelerated the pace of delivery and reduced the time to market for new features by fully automated CI/CD with Jenkins, building Docker images, and deploying to Kubernetes, including automated change-order creation for new releases.",
"- Held **97% unit test coverage** plus integration tests across all core features.",
"- Lead engineer on the **Web Pro platform** (Django/Python), launching the first send-cart, shared-shopping, and customer delegation experience. Added integration for WebPro Marketplace matching website builders with customers.",
"",
"### Customer growth",
"Started a **YouTube channel, Discord Server, and Twitter account** to improve onboarding for new customers to the reseller program. Worked well enough that I expanded the team to include a marketing professional, hosting monthly livestreams and social content. We held monthly **webinars where engineers can demo directly to customers**.",
"",
"*ITIL certified since 2012.*"
].join("\n")},

/* -------------------------------------------------------- TheServicePro */
{ key:'tsp_consultant', title:'Senior Technical Consultant', icon:'🧩', kind:'position', tl:1.6, scale:1.5,
  dates:'Nov 2005 - Dec 2015', tenure:'10 yr 2 mo', location:'Remote & Onsite',
  orgs:['O_TSP'], y0:2005, y1:2015,
  highlights:[
    { v:'10 yr', k:'consulting tenure' },
    { v:'ETL', k:'System Integration & Data Migration' },
    { v:'FDE', k:'Forward-Deployed Engineer' }
  ],
  skills:['S_FDE','S_ETL','S_DOTNET','S_CSHARP','S_ASPNET','S_MSSQL','S_SQL','S_PARTNER'],
  md:[
"## Senior Technical Consultant · TheServicePro",
"*Nov 2005 - Dec 2015, Remote & Onsite*",
"",
"Software and data consulting - System Integration & Data Migration and .NET development, working as a forward-deployed engineer embedded directly at client sites.",
"",
"- Worked with 150+ clients, from Fortune 500s to small businesses, designing solutions around their specific constraints rather than a standard package.",
"- Streamlined client processes and data flow to improve operating efficiency."
].join("\n")},

/* ------------------------------------------------------------ First Data */
{ key:'fd_lead', title:'Lead Software Engineer', icon:'💳', kind:'position', tl:1, scale:.8,
  dates:'Oct 2005 - Dec 2011', tenure:'6 yr 3 mo', location:'Scottsdale, AZ',
  orgs:['O_FD'], y0:2005, y1:2011,
  highlights:[
    { v:'Architectural', k:'Real-time Transaction Inquiry & sub millisecond SLA' },
    { v:'Legacy Modernization', k:'AS/400 COBOL System to .NET and SQL Server' },
    { v:'Payments Processing', k:'High Volume & Velocity Fraud Elimination' }
  ],
  skills:['S_LEAD','S_CSHARP','S_J2EE','S_DOTNET','S_ASPNET','S_MSSQL','S_SSIS','S_COBOL','S_SQL','S_PAY','S_AGILE','S_ETL'],
  md:[
"## Lead Software Engineer · First Data",
"*Oct 2005 - Dec 2011, Scottsdale, AZ*",
"",
"Tech lead for financial-systems applications on C# and J2EE, batch-processing new-account inquiries to eliminate fraud through velocity checks, identity verification, and KYC/OFAC screening.",
"",
"Designed and built a real-time payments scoring service on C++, delivering sub-millisecond transaction inquiry for high-volume payments processing.",
"- Automated nightly failover of the scoring service, rebuilding in-memory scoring models from scratch on each cutover for fresh, consistent fraud scoring without manual intervention.",
"",
"Migrated an AS/400 COBOL system to .NET and SQL Server with zero data loss, using ASP.NET, C# and SSIS. Tech lead and ScrumMaster for the team.",

].join("\n")},

/* ------------------------------------------------------- FMC Corporation */
{ key:'fmc_swe', title:'Software Engineer', icon:'🌱', kind:'position', tl:0, scale:.6,
  dates:'May 1998 - Oct 2005', tenure:'7 yr 6 mo', location:'-',
  orgs:['O_FMC'], y0:1998, y1:2005,
  highlights:[
    { v:'7 yr', k:'Career growth to Sr Engineer' },
    { v:'C++/SQL', k:'System Integration' }
  ],
  skills:['S_ETL','S_SQL','S_MSSQL'],
  md:[
"## Software Engineer · FMC Corporation",
"*May 1998 - Oct 2005, Scottsdale, AZ*",
"",
"Built ETL processes converting legacy-system data into SQL databases for CRM, scheduling and invoicing software in the services industry.",
"",
"- Collaborated with cross-functional teams to optimize software performance and improve the user experience, reducing integration cost and streamlining new client onboarding."
].join("\n")},

/* ------------------------------------------------------------- education */
{ key:'education', title:'Education', icon:'🎓', kind:'education', tl:null,
  dates:'1998 - 2022', location:'Arizona · Boston',
  orgs:['O_BU','O_ASU','O_UOP','O_GCC'],
  highlights:[
    { v:'MBA', k:'Boston University, 2022' },
    { v:'BS', k:'Information Technology' }
  ],
  skills:[],
  md:[
"## Education",
"",
"### Boston University",
"**Master of Business Administration** · 2020 - 2022",
"Completed while running a **director-level organization**.",
"",
"### Arizona State University",
"**Engineering** · 2002 - 2005",
"",
"### University of Phoenix",
"**BS, Information Technology** · 2002 - 2004",
"",
"### Glendale Community College",
"**Associate of Arts** · 1998 - 2002",
"",
"---",
"",
"Every degree here was earned alongside full-time engineering work."
].join("\n")},

/* ----------------------------------------------------------- credentials */
{ key:'credentials', title:'Certifications', icon:'📜', kind:'credentials', tl:null,
  dates:'2011 - 2024', location:'-',
  orgs:['O_SA','O_EXIN','O_ISC2','O_VU','O_LI','O_DC','O_LF'],
  highlights:[
    { v:'3', k:'professional certifications' },
    { v:'2', k:'AI / prompt engineering' },
    { v:'2017', k:'Node.js Foundation member' }
  ],
  skills:['S_AGILE','S_ITIL','S_PROMPT','S_SOX'],
  md:[
"## Certifications, training & organizations",
"",
"### Professional certifications",
"- **Certified ScrumMaster** - Scrum Alliance, May 2011",
"- **ITIL version 3** - EXIN, Mar 2012",
"- **CSSLP**, Certified Secure Software Lifecycle Professional - (ISC)², Aug 2013 *(lapsed Jul 2020)*",
"",
"### AI & prompt engineering",
"- **Prompt Engineering for ChatGPT** - Vanderbilt University, Dec 2023",
"- **Prompt Engineering: How to Talk to the AIs** - LinkedIn, Feb 2024",
"",
"### Leadership",
"- **Step Up to Leadership** - Dale Carnegie Training",
"",
"### Organizations",
"- **Node.js Foundation**, Linux Foundation - since Jan 2017"
].join("\n")}

];

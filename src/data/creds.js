// TABLE 2: creds — degrees, certifications, training and memberships.
// `label` is what the canvas draws (kept short); `title` is the full name.
// `y0`/`y1` are the year span used to infer which position a credential was earned during.
// A null `y0` means undated: use `entries` to attach it to positions explicitly instead.
const CREDS = [
  { id:'C_MBA',    label:'MBA',            title:'Master of Business Administration',        kind:'Degree',        orgId:'O_BU',   issued:'2020 – 2022', y0:2020, y1:2022 },
  { id:'C_ASU',    label:'ASU Eng',        title:'Engineering coursework',                   kind:'Degree',        orgId:'O_ASU',  issued:'2002 – 2005', y0:2002, y1:2005 },
  { id:'C_BSIT',   label:'BS IT',          title:'BS, Information Technology',               kind:'Degree',        orgId:'O_UOP',  issued:'2002 – 2004', y0:2002, y1:2004 },
  { id:'C_AA',     label:'AA',             title:'Associate of Arts',                        kind:'Degree',        orgId:'O_GCC',  issued:'1998 – 2002', y0:1998, y1:2002 },

  { id:'C_CSM',    label:'CSM',            title:'Certified ScrumMaster',                    kind:'Certification', orgId:'O_SA',   issued:'May 2011',    y0:2011, y1:2011 },
  { id:'C_ITIL',   label:'ITIL v3',        title:'ITIL version 3',                           kind:'Certification', orgId:'O_EXIN', issued:'Mar 2012',    y0:2012, y1:2012 },
  { id:'C_CSSLP',  label:'CSSLP',          title:'Certified Secure Software Lifecycle Pro.', kind:'Certification', orgId:'O_ISC2', issued:'Aug 2013',    y0:2013, y1:2013, expired:'Jul 2020' },

  { id:'C_PE_VU',  label:'Prompt Eng',     title:'Prompt Engineering for ChatGPT',           kind:'Training',      orgId:'O_VU',   issued:'Dec 2023',    y0:2023, y1:2023, note:'Credential ID 5NYD6Q9NQTR2' },
  { id:'C_PE_LI',  label:'Prompt Eng II',  title:'Prompt Engineering: How to Talk to the AIs',kind:'Training',     orgId:'O_LI',   issued:'Feb 2024',    y0:2024, y1:2024 },
  { id:'C_DC',     label:'Leadership',     title:'Step Up to Leadership',                    kind:'Training',      orgId:'O_DC',   issued:'—',           y0:null, y1:null, note:'LIVE Online Training', entries:['gd_srmgr'] },

  { id:'C_NODEFDN',label:'Node.js Fdn',    title:'Node.js Foundation member',                kind:'Membership',    orgId:'O_LF',   issued:'Jan 2017 – present', y0:2017, y1:2026 }
];

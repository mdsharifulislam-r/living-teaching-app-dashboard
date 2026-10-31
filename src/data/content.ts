// ---------------------------------------------------------------------------
// Living Teaching — content model & seed content
// ---------------------------------------------------------------------------

export const px = (id: number, w = 800, h?: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}${
    h ? `&h=${h}&fit=crop` : ""
  }`;

export type Status = "published" | "draft" | "scheduled";

export interface Base {
  id: string;
  status: Status;
  publishAt?: string; // yyyy-mm-dd
}

export interface Prayer extends Base {
  title: string;
  desc: string;
  text: string;
  image: string;
  duration: number; // seconds
  featured?: boolean;
  audioName?: string;
}
export interface AudioItem extends Base {
  title: string;
  speaker: string;
  category: string;
  duration: number;
  image: string;
  audioName?: string;
}
export interface Encouragement extends Base {
  quote: string;
  author: string;
  date: string;
  image: string;
}
export interface Teaching extends Base {
  title: string;
  desc: string;
  category: string;
  author: string;
  minutes: number;
  mode: "Read" | "Listen";
  image: string;
  body: string;
}
export interface Verse extends Base {
  text: string;
  ref: string;
  date: string;
  image: string;
}
export interface GalleryImage extends Base {
  title: string;
  category: string;
  image: string;
  caption?: string;
}
export interface Social extends Base {
  network: string;
  label: string;
  url: string;
}

export interface Content {
  prayers: Prayer[];
  audio: AudioItem[];
  encouragements: Encouragement[];
  teachings: Teaching[];
  verses: Verse[];
  images: GalleryImage[];
  socials: Social[];
}
export type ContentKind = keyof Content;

export interface AppUser {
  id: string;
  name: string;
  email: string;
  joined: string;
  status: "active" | "suspended";
  country: string;
}

export type NotifKind = "prayer" | "audio" | "teaching" | "verse" | "encouragement" | "image" | "announcement";
export type NotifStatus = "sent" | "draft" | "scheduled";
export interface Notif {
  id: string;
  kind: NotifKind; // decides which screen opens when tapped
  title: string;
  body: string;
  image?: string; // optional rich image (URL or uploaded data URL)
  status: NotifStatus;
  sentAt?: string; // ISO date-time
  scheduleAt?: string; // ISO date-time (when status = scheduled)
  read: boolean; // per-device read state
}
export const NOTIF_KINDS: Record<NotifKind, string> = {
  announcement: "Ministry announcement",
  teaching: "New teaching",
  audio: "New audio",
  prayer: "New prayer",
  verse: "Daily verse",
  encouragement: "New encouragement",
  image: "New image",
};

export const timeAgo = (iso?: string) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
export const sameDay = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();
export const prettyDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
/** value for <input type="datetime-local"> */
export const toLocalInput = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 16);
};

export const AUDIO_CATEGORIES = ["Worship", "Teachings", "Prayers", "Encouragement", "Sermons", "Spiritual Messages"];
export const TEACHING_CATEGORIES = ["Faith", "Prayer", "Family", "Hope", "Spiritual Growth", "Christian Living"];
export const IMAGE_CATEGORIES = ["Bible Verses", "Prayer", "Faith", "Encouragement", "Christian Quotes", "Worship"];
export const NETWORKS = ["Facebook", "Instagram", "YouTube", "WhatsApp", "TikTok", "X", "Telegram"];

// ---- dates ---------------------------------------------------------------
export const isoDay = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
export const today = () => isoDay(0);
export const prettyDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const isLive = (i: Base) =>
  i.status === "published" || (i.status === "scheduled" && !!i.publishAt && i.publishAt <= today());

export const fmtTime = (s: number) => {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

// ---- seed ----------------------------------------------------------------
const ministry = "Living Teaching";

const prayers: Prayer[] = [
  {
    id: "p0",
    status: "published",
    featured: true,
    title: "A Prayer of Daily Surrender",
    desc: "Place today in God's hands and rest in His faithfulness.",
    image: px(2258251, 1000, 760),
    duration: 400,
    text: "Heavenly Father, I come to You with open hands and a grateful heart. Today I surrender my plans, my worries, and my fears into Your care.\n\nLead me in Your wisdom. Quiet the noise within me, and let Your peace be the first thing I hear. Help me to trust that You are good, that You are near, and that You are working in every detail of my life.\n\nShape my words, guide my steps, and fill my heart with Your love so that I may be a light to others.\n\nIn Jesus' name, Amen.",
  },
  {
    id: "p1",
    status: "published",
    title: "Morning Prayer",
    desc: "Begin your day with gratitude and God's guidance.",
    image: px(34742289, 600, 600),
    duration: 330,
    text: "Lord, thank You for the gift of a new morning. Your mercies are new every day, and Your faithfulness is great.\n\nAs I begin this day, go before me. Order my steps, guard my heart, and let my words and actions honor You. Give me strength for the tasks ahead and eyes to see the people You place in my path.\n\nI trust You with this day. In Jesus' name, Amen.",
  },
  {
    id: "p2",
    status: "published",
    title: "Evening Prayer",
    desc: "Rest in His peace and give thanks for the day.",
    image: px(13567729, 600, 600),
    duration: 300,
    text: "Father, as this day comes to a close, I thank You for carrying me through it. For every blessing I noticed, and every one I missed, I say thank You.\n\nForgive me where I have fallen short. Release the worries I've held today, and let me sleep in the assurance that You never slumber nor sleep. Watch over my loved ones tonight.\n\nIn Jesus' name, Amen.",
  },
  {
    id: "p3",
    status: "published",
    title: "Family Prayer",
    desc: "Cover your home and loved ones in God's love.",
    image: px(32147474, 600, 600),
    duration: 360,
    text: "Lord, we place our home in Your hands. Bind us together with love, patience, and forgiveness.\n\nProtect each one under this roof. Where there is tension, bring peace; where there is distance, bring closeness. Teach us to pray together, to listen well, and to love as You have loved us.\n\nLet our family be a place where Your presence is felt. In Jesus' name, Amen.",
  },
  {
    id: "p4",
    status: "published",
    title: "Healing Prayer",
    desc: "Ask the Healer for comfort, restoration, and hope.",
    image: px(4061215, 600, 600),
    duration: 420,
    text: "Jesus, You are the Great Physician. We bring You every pain — in body, in mind, and in spirit.\n\nTouch what is hurting. Restore what is weak. Where there is no answer, give us peace; where there is fear, give us courage. Surround those who are suffering with Your comfort and with people who love them.\n\nWe trust You with our healing. In Your name we pray, Amen.",
  },
  {
    id: "p5",
    status: "published",
    title: "Prayer for Prosperity",
    desc: "Seek God's provision and a heart of generosity.",
    image: px(19248218, 600, 600),
    duration: 340,
    text: "Provider God, You know what I need before I ask. Thank You for every good gift You have already given.\n\nBless the work of my hands, and teach me to steward well what You entrust to me. Give me a generous heart, free from greed and anxiety, so that I may bless others as You have blessed me.\n\nLet my true wealth always be found in You. Amen.",
  },
  {
    id: "p6",
    status: "published",
    title: "Prayer for Difficult Times",
    desc: "Find courage and comfort when the road is hard.",
    image: px(36915194, 600, 600),
    duration: 450,
    text: "Lord, I am weary, and this season is heavy. I don't understand everything, but I choose to trust that You are with me.\n\nBe my refuge when I feel overwhelmed. Remind me that You are close to the brokenhearted and that You do not waste my pain. Give me just enough strength for today, and the hope that morning will come.\n\nHold me close. In Jesus' name, Amen.",
  },
  {
    id: "p7",
    status: "published",
    title: "Prayer for Peace",
    desc: "Let the peace of Christ quiet every anxious thought.",
    image: px(18393066, 600, 600),
    duration: 310,
    text: "Prince of Peace, quiet my heart. I give You the thoughts that race and the worries that will not rest.\n\nLet Your peace, which surpasses all understanding, guard my heart and my mind. Teach me to breathe, to be still, and to know that You are God.\n\nFill our homes, our nations, and our hearts with Your peace. Amen.",
  },
  {
    id: "p8",
    status: "published",
    title: "Prayer for Strength",
    desc: "Be renewed by the God who never grows weary.",
    image: px(10996743, 600, 600),
    duration: 330,
    text: "Mighty God, when I am weak, You are strong. Renew my strength as I wait on You.\n\nGive me courage to face what I fear, endurance to keep going, and humility to ask for help. Let me rise up on wings like eagles, to run and not grow weary, to walk and not faint.\n\nIn Jesus' name, Amen.",
  },
];

const audio: AudioItem[] = [
  { id: "a1", status: "published", title: "The Power of Prayer", speaker: ministry, category: "Prayers", duration: 1125, image: px(267559, 700, 900) },
  { id: "a2", status: "published", title: "Walk by Faith", speaker: "Pastor Daniel Reyes", category: "Teachings", duration: 765, image: px(7273, 600, 600) },
  { id: "a3", status: "published", title: "God Is Faithful", speaker: "Pastor Ruth Allen", category: "Sermons", duration: 945, image: px(25186193, 600, 600) },
  { id: "a4", status: "published", title: "Peace of God", speaker: ministry, category: "Spiritual Messages", duration: 620, image: px(2382941, 600, 600) },
  { id: "a5", status: "published", title: "Grace That Leads Me Home", speaker: "Living Teaching Worship", category: "Worship", duration: 252, image: px(5301462, 600, 600) },
  { id: "a6", status: "published", title: "Morning Strength", speaker: "Pastor Ruth Allen", category: "Encouragement", duration: 330, image: px(19248218, 600, 600) },
  { id: "a7", status: "published", title: "Rest in His Presence", speaker: "Living Teaching Worship", category: "Worship", duration: 1380, image: px(7902981, 600, 600) },
  { id: "a8", status: "published", title: "Hope That Never Fades", speaker: "Pastor Daniel Reyes", category: "Sermons", duration: 870, image: px(39027267, 600, 600) },
  { id: "a9", status: "published", title: "Trusting God While You Wait", speaker: ministry, category: "Teachings", duration: 1010, image: px(31936555, 600, 600) },
  { id: "a10", status: "published", title: "A Prayer for Your Family", speaker: "Pastor Ruth Allen", category: "Prayers", duration: 480, image: px(33325152, 600, 600) },
];

const encouragements: Encouragement[] = [
  { id: "e1", status: "published", quote: "God is working even when you cannot see it.", author: ministry, date: isoDay(0), image: px(30439251, 900, 700) },
  { id: "e2", status: "published", quote: "You are never too far for His grace to reach you.", author: "Pastor Ruth Allen", date: isoDay(-1), image: px(33175889, 900, 700) },
  { id: "e3", status: "published", quote: "Every sunrise is a reminder that His mercies are new.", author: ministry, date: isoDay(-2), image: px(7273, 900, 700) },
  { id: "e4", status: "published", quote: "Be still. He has already gone before you.", author: "Pastor Daniel Reyes", date: isoDay(-4), image: px(629160, 900, 700) },
  { id: "e5", status: "published", quote: "Small steps of faith still move mountains.", author: ministry, date: isoDay(-6), image: px(13567729, 900, 700) },
];

const teachings: Teaching[] = [
  {
    id: "t1", status: "published", title: "Growing Stronger in Faith", category: "Faith", author: "Pastor Daniel Reyes", minutes: 8, mode: "Read",
    desc: "Discover practical ways to strengthen your relationship with God.", image: px(15382617, 700, 520),
    body: "Faith is not a feeling we wait for — it is a muscle we exercise. Every time we choose to trust God with something small, we prepare ourselves to trust Him with something great.\n\nBegin with a simple rhythm: a few quiet minutes in Scripture each morning, an honest conversation with God during the day, and gratitude before bed. Over time these small habits become deep roots.\n\nWhen doubts come, do not be discouraged. Even the disciples said, \"Lord, increase our faith.\" He delights in answering that prayer.",
  },
  {
    id: "t2", status: "published", title: "Learning to Pray with Confidence", category: "Prayer", author: "Pastor Ruth Allen", minutes: 6, mode: "Read",
    desc: "Simple steps to talk with God freely, honestly, and daily.", image: px(5418299, 700, 520),
    body: "Prayer is simply a conversation with a Father who loves you. You do not need perfect words — only an honest heart.\n\nTry this pattern: thank Him, tell Him what is on your heart, ask for what you need, and then listen quietly. Silence is not wasted time; it is where we learn His voice.\n\nPray often, pray simply, and pray believing that He hears.",
  },
  {
    id: "t3", status: "published", title: "Building a Home Centered on Christ", category: "Family", author: "Living Teaching Ministry", minutes: 10, mode: "Listen",
    desc: "Create a household where love, grace, and prayer are at the center.", image: px(5163472, 700, 520),
    body: "A Christ-centered home is not a perfect home — it is a forgiving one. It is a place where we pray together, say sorry quickly, and celebrate God's goodness often.\n\nStart with one shared habit: a meal-time blessing, a bedtime prayer, or a weekly gratitude circle. Consistency matters more than length.\n\nChildren learn faith most by watching it lived out in ordinary moments.",
  },
  {
    id: "t4", status: "published", title: "Hope in the Middle of the Storm", category: "Hope", author: "Pastor Ruth Allen", minutes: 7, mode: "Read",
    desc: "Anchor your heart in God's promises when life feels uncertain.", image: px(36915194, 700, 520),
    body: "Storms reveal what our hearts are anchored to. When everything shakes, God's promises remain steady.\n\nHope in Scripture is not wishful thinking; it is confident expectation, built on the character of God. He has been faithful before, and He will be faithful again.\n\nName one promise to hold today, and say it out loud every time worry rises.",
  },
  {
    id: "t5", status: "published", title: "Walking Daily with the Holy Spirit", category: "Spiritual Growth", author: "Pastor Daniel Reyes", minutes: 12, mode: "Listen",
    desc: "Learn to recognize His gentle guidance in everyday decisions.", image: px(18393066, 700, 520),
    body: "The Holy Spirit is not distant — He is our Helper, Teacher, and Comforter. He speaks through Scripture, through peace, and through wise counsel.\n\nGrowth happens when we slow down enough to listen and obey the small promptings. Ask each morning: \"Spirit of God, lead me today.\"\n\nObedience in little things builds trust for the big ones.",
  },
  {
    id: "t6", status: "published", title: "Living Out Your Faith at Work", category: "Christian Living", author: "Living Teaching Ministry", minutes: 9, mode: "Read",
    desc: "Shine quietly and faithfully in your daily responsibilities.", image: px(35373439, 700, 520),
    body: "Your workplace is a mission field. You do not need a pulpit — integrity, kindness, and excellence speak loudly.\n\nWork as though you are serving the Lord, not people. Pray for your colleagues by name. Be the person who brings calm into a stressful room.\n\nEvery ordinary task becomes holy when it is offered to God.",
  },
  {
    id: "t7", status: "published", title: "Faith That Moves Mountains", category: "Faith", author: "Pastor Ruth Allen", minutes: 11, mode: "Listen",
    desc: "What Jesus meant by mustard-seed faith, and how to live it.", image: px(10996743, 700, 520),
    body: "Jesus did not say we need great faith — only faith the size of a mustard seed. The power is not in us; it is in the One we trust.\n\nBring your mountain to God honestly. Then take the next obedient step, however small.\n\nMountains move one act of trust at a time.",
  },
  {
    id: "t8", status: "published", title: "A Quiet Place with God", category: "Prayer", author: "Pastor Daniel Reyes", minutes: 5, mode: "Read",
    desc: "Make room for stillness in a busy and noisy world.", image: px(14806000, 700, 520),
    body: "Jesus often withdrew to lonely places to pray. If He needed stillness, so do we.\n\nChoose a simple corner, silence your phone, and sit for five minutes. Read one verse slowly. Breathe. Let God speak.\n\nThe quiet place is not an escape from life — it is where we are strengthened for it.",
  },
];

const verses: Verse[] = [
  { id: "v1", status: "published", text: "Your word is a lamp for my feet and a light on my path.", ref: "Psalm 119:105", date: isoDay(0), image: px(34742289, 1000, 1500) },
  { id: "v2", status: "published", text: "Do not fear, for I am with you; do not be dismayed, for I am your God.", ref: "Isaiah 41:10", date: isoDay(-1), image: px(2382941, 1000, 1500) },
  { id: "v3", status: "published", text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1", date: isoDay(-2), image: px(7273, 1000, 1500) },
  { id: "v4", status: "published", text: "Be still, and know that I am God.", ref: "Psalm 46:10", date: isoDay(-3), image: px(629160, 1000, 1500) },
];

const g = (id: string, title: string, category: string, photo: number, caption?: string): GalleryImage => ({
  id, title, category, status: "published", image: px(photo, 900), caption,
});
const images: GalleryImage[] = [
  g("g1", "Lamp to my feet", "Bible Verses", 15382617, "Your word is a lamp for my feet and a light on my path."),
  g("g2", "Open Scripture", "Bible Verses", 35373439, "Thy word have I hid in mine heart."),
  g("g3", "Warm light", "Bible Verses", 29756533, "In the beginning was the Word."),
  g("g4", "Hands in prayer", "Prayer", 4061215, "Pray without ceasing."),
  g("g5", "Quiet devotion", "Prayer", 5418299, "The Lord is near to all who call on Him."),
  g("g6", "Hands on Scripture", "Prayer", 267559, "Ask, and it will be given to you."),
  g("g7", "The cross on the hill", "Faith", 10996743, "Walk by faith, not by sight."),
  g("g8", "Cross at dawn", "Faith", 25186193, "Faith can move mountains."),
  g("g9", "Misty ranges", "Faith", 7273, "Trust in the Lord with all your heart."),
  g("g10", "Morning mercy", "Encouragement", 30439251, "His mercies are new every morning."),
  g("g11", "Golden sunrise", "Encouragement", 34742289, "This is the day the Lord has made."),
  g("g12", "Together in love", "Encouragement", 33325152, "Love never fails."),
  g("g13", "Still waters", "Christian Quotes", 629160, "“Be still. He has already gone before you.”"),
  g("g14", "Breaking light", "Christian Quotes", 39027267, "“Grace is light breaking through the clouds.”"),
  g("g15", "Open sky", "Christian Quotes", 31936555, "“God is closer than the sky is wide.”"),
  g("g16", "Hands raised", "Worship", 5301462, "Let everything that has breath praise the Lord."),
  g("g17", "Dawn praise", "Worship", 7902981, "Sing to the Lord a new song."),
  g("g18", "Worship in light", "Worship", 38995524, "Enter His gates with thanksgiving."),
];

const social = (id: string, network: string, handle: string, url: string): Social => ({
  id, network, label: handle, url, status: "published",
});
const socials: Social[] = [
  social("s1", "Facebook", "Living Teaching", "https://facebook.com/livingteaching"),
  social("s2", "Instagram", "@livingteaching", "https://instagram.com/livingteaching"),
  social("s3", "YouTube", "Living Teaching TV", "https://youtube.com/@livingteaching"),
  social("s4", "WhatsApp", "Prayer Line", "https://wa.me/15551234567"),
  social("s5", "TikTok", "@livingteaching", "https://tiktok.com/@livingteaching"),
];

export const seedContent = (): Content => ({ prayers, audio, encouragements, teachings, verses, images, socials });

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();
export const seedNotifs = (): Notif[] => [
  { id: "n1", kind: "teaching", status: "sent", sentAt: ago(10), read: false, title: "New Teaching Available", body: "Discover our latest message on strengthening your faith.", image: px(15382617, 900, 520) },
  { id: "n2", kind: "verse", status: "sent", sentAt: ago(180), read: false, title: "Your Verse of the Day", body: "“Your word is a lamp for my feet and a light on my path.” — Psalm 119:105", image: px(34742289, 900, 520) },
  { id: "n3", kind: "audio", status: "sent", sentAt: ago(60 * 26), read: false, title: "New Audio: Peace of God", body: "A calming 10-minute message to quiet your heart.", image: px(2382941, 900, 520) },
  { id: "n4", kind: "prayer", status: "sent", sentAt: ago(60 * 30), read: true, title: "New Prayer: Prayer for Strength", body: "Be renewed by the God who never grows weary.", image: px(10996743, 900, 520) },
  { id: "n5", kind: "encouragement", status: "sent", sentAt: ago(60 * 50), read: true, title: "New Encouragement", body: "“God is working even when you cannot see it.”", image: px(30439251, 900, 520) },
  { id: "n6", kind: "announcement", status: "sent", sentAt: ago(60 * 72), read: true, title: "Ministry Announcement", body: "Join us this Sunday for our online prayer gathering at 6:00 PM." },
  { id: "n7", kind: "announcement", status: "draft", read: false, title: "Online Prayer Night — This Friday", body: "Gather with believers around the world for an evening of worship and prayer.", image: px(5301462, 900, 520) },
];

// ~140 sample members spread over the last 12 months, with more sign-ups recently (steady growth).
export const seedUsers = (): AppUser[] => {
  const first = ["Grace", "Samuel", "Maria", "David", "Ruth", "Joshua", "Esther", "Daniel", "Naomi", "Caleb", "Hannah", "Peter", "Rebecca", "Isaac", "Lydia", "Andrew", "Priscilla", "Mark", "Abigail", "Timothy"];
  const last = ["Thompson", "Okafor", "Fernandez", "Kim", "Mensah", "Bennett", "Silva", "Carter", "Patel", "Johnson", "Müller", "Nyambura", "Santos", "Adeyemi", "Walker", "Costa", "Reyes", "Allen", "Nguyen", "Brown"];
  const countries = ["United States", "Nigeria", "Mexico", "South Korea", "Ghana", "United Kingdom", "Brazil", "Canada", "India", "Germany", "Kenya", "Philippines", "South Africa", "Colombia"];
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rows = Array.from({ length: 142 }, (_, i) => {
    const f = first[i % 20];
    const l = last[(7 * i + 3 * Math.floor(i / 20)) % 20];
    const off = -Math.floor(364 * Math.pow(rnd(), 1.7));
    return { name: `${f} ${l}`, email: `${f}.${l}${i % 3 === 0 ? i : ""}@example.com`.toLowerCase().replace("ü", "u"), joined: isoDay(off), country: countries[(i * 5) % countries.length], i };
  });
  rows.sort((a, b) => (a.joined < b.joined ? 1 : a.joined > b.joined ? -1 : a.i - b.i));
  return rows.map((r, n) => ({
    id: `u${n + 1}`,
    name: r.name,
    email: r.email,
    joined: r.joined,
    country: r.country,
    status: r.i % 29 === 0 ? ("suspended" as const) : ("active" as const),
  }));
};

// ---------------------------------------------------------------------------
// Feature registry — makes Phase 2 (Bible) an additive change.
// To launch the Bible: flip `enabled`, add a tab / route that renders it.
// Nothing else in the app needs to be redesigned.
// ---------------------------------------------------------------------------
export const FEATURES = {
  bible: {
    enabled: false,
    phase: 2,
    label: "Holy Bible",
    items: [
      "Full Bible",
      "Bible books & chapters",
      "Bible search",
      "Verse navigation",
      "Bible reading plans",
      "Bible bookmarks",
    ],
  },
} as const;

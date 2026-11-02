export type KnowledgeTopic = 'TEMPLE' | 'FOOD' | 'PHRASES' | 'ETIQUETTE' | 'TRANSPORT' | 'TRAVEL' | 'HERITAGE';

export interface KnowledgeDoc {
  id: string;
  title: string;
  topic: KnowledgeTopic;
  destination?: string;
  content: string;
}

/**
 * Seed corpus for the Karnataka RAG indexes (pgvector). Written as general, widely-known guidance;
 * temple-specific rules change, so entries tell travellers to follow posted notices.
 * Replace / extend with curated, verified content before production.
 */
export const KNOWLEDGE: KnowledgeDoc[] = [
  { id: 'temple-dress', topic: 'TEMPLE', title: 'Temple dress code across Karnataka',
    content: 'Dress modestly at temples: cover shoulders and knees. Footwear is removed before entering the complex. Some temples have extra rules for the inner sanctum (for example men may be asked to remove shirts or wear a veshti/dhoti). Rules differ from temple to temple, so follow posted notices and staff instructions. Photography inside sanctums is often prohibited.' },
  { id: 'chamundeshwari', topic: 'TEMPLE', destination: 'Mysuru', title: 'Chamundeshwari Temple, Chamundi Hills',
    content: 'Chamundeshwari Temple sits on Chamundi Hills above Mysuru. Wear traditional or modest clothing. A stone staircase of roughly a thousand steps climbs from the foothills past a large Nandi statue; a road also reaches the top. Fridays, festival days and Dasara bring long darshan queues, so go early on weekdays.' },
  { id: 'dharmasthala', topic: 'TEMPLE', destination: 'Dharmasthala', title: 'Dharmasthala etiquette',
    content: 'Dharmasthala in Dakshina Kannada is known for its Manjunatha temple and the free daily meals offered to visitors. Dress modestly and check on-site notices for sanctum entry rules. Expect queues on weekends and festivals; rooms are commonly arranged through the temple administration.' },
  { id: 'udupi-krishna', topic: 'TEMPLE', destination: 'Udupi', title: 'Udupi Sri Krishna Matha',
    content: 'At Udupi Sri Krishna Matha the deity is traditionally viewed through a small silver-plated window. Udupi is the birthplace of the Udupi vegetarian restaurant tradition: satvik meals, dosas, idlis and filter coffee. Temple meals are vegetarian; follow the dress and footwear rules shown at the entrance.' },
  { id: 'hampi', topic: 'HERITAGE', destination: 'Hampi', title: 'Visiting Hampi',
    content: 'Hampi is a UNESCO World Heritage Site spread across a boulder-strewn landscape on the Tungabhadra river. Plan two days, start early to avoid midday heat, carry water, and hire a bicycle or e-scooter. Virupaksha Temple is a living temple, so observe temple etiquette. The best season is roughly October to February.' },
  { id: 'badami-pattadakal', topic: 'HERITAGE', destination: 'Badami', title: 'Badami, Aihole and Pattadakal',
    content: 'Badami has 6th-century Chalukyan rock-cut cave temples above Agastya Lake. Pattadakal is a UNESCO World Heritage Site of temples, and Aihole is often called a cradle of temple architecture. They combine well as a two-day circuit. Expect steps, heat and uneven stone; remove footwear at active shrines.' },
  { id: 'belur-halebidu', topic: 'HERITAGE', destination: 'Belur-Halebidu', title: 'Hoysala temples at Belur and Halebidu',
    content: 'The Chennakeshava Temple at Belur and the Hoysaleswara Temple at Halebidu showcase Hoysala soapstone carving on star-shaped platforms; the Hoysala temples were inscribed as a UNESCO World Heritage Site in 2023. Belur is an active place of worship, so dress modestly.' },
  { id: 'mysore-pak', topic: 'FOOD', destination: 'Mysuru', title: 'Mysore Pak authenticity',
    content: 'Mysore Pak is a ghee-rich sweet of gram flour, sugar and ghee credited to the royal kitchens of the Mysore Palace. Look for long-established sweet shops around Devaraja Market and Sayyaji Rao Road, and expect a rich texture that crumbles or melts. Buy fresh; it keeps only a few days.' },
  { id: 'benne-dose', topic: 'FOOD', destination: 'Davanagere', title: 'Davanagere Benne Dose',
    content: 'Benne dose is a soft-centred, crisp-edged dosa cooked with generous white butter (benne), served with potato palya and coconut chutney. It is the signature of Davanagere eateries. Eat it hot from the tawa; it is rich, so share if you plan more meals.' },
  { id: 'mangaluru-seafood', topic: 'FOOD', destination: 'Mangaluru', title: 'Mangaluru coastal food and seafood etiquette',
    content: 'Coastal Karnataka cuisine includes kori rotti with chicken curry, neer dosa, fish tawa fry, ghee roast and fish thali (bangude/mackerel, pomfret). Fresh catch is best at busy local restaurants. Meals are often served on a banana leaf and eaten by hand. Ask for less spice if needed. Vegetarians can try Udupi-style meals, goli baje and buns.' },
  { id: 'dining-etiquette', topic: 'ETIQUETTE', title: 'Dining etiquette in Karnataka',
    content: 'Wash hands before meals. Eating with the right hand is traditional; spoons are always available on request. In meals served on a banana leaf, servers keep topping up until you decline with a hand over the leaf. Do not worry about leaf-folding customs as a visitor. Tipping at small restaurants is optional.' },
  { id: 'phrases-basic', topic: 'PHRASES', title: 'Basic Kannada phrases with pronunciation',
    content: 'Namaskara (na-mas-KAA-ra): hello. Dhanyavadagalu (dhan-ya-VAA-da-ga-lu): thank you. Haudu (HOW-du): yes. Illa (IL-la): no. Chennagide (chen-NAA-gi-de): it is good. Gottilla (GOT-til-la): I do not know. Kshamisi (ksha-MI-si): sorry / excuse me. Neeru beku (NEE-ru BE-ku): I need water.' },
  { id: 'phrases-transport', topic: 'PHRASES', title: 'Kannada phrases for autos and markets',
    content: 'Idu eshtu? (i-du ESH-tu): how much is this? Meter haaki (ME-ter HAA-ki): please use the meter. Illi nillisi (IL-li nil-LI-si): stop here. Swalpa kadime maadi (SWAL-pa ka-DI-me MAA-di): reduce a little. Beda (BE-da): I do not want it. Eshtu doora? (ESH-tu DOO-ra): how far?' },
  { id: 'auto-etiquette', topic: 'TRANSPORT', title: 'Autos, cabs and buses',
    content: 'In Bengaluru and Mysuru auto-rickshaws are common; ask for the meter or agree the fare before riding, and carry small change. App-based cabs are widely available in cities. State KSRTC buses connect most towns and heritage sites cheaply. In smaller towns Kannada is preferred; a few words are appreciated.' },
  { id: 'language-etiquette', topic: 'ETIQUETTE', title: 'Language etiquette',
    content: 'Kannada is the state language. English works in Bengaluru and tourist places, but in smaller towns Kannada is preferred, so do not assume Hindi. Greet with Namaskara and smile; even a few Kannada words are warmly received.' },
  { id: 'coorg', topic: 'TRAVEL', destination: 'Coorg', title: 'Coorg (Kodagu) travel notes',
    content: 'Coorg is coffee-estate country with Kodava culture and homestays. October to March is pleasant; June to September brings heavy rain, leeches and landslide risk on ghat roads. Try Kodava dishes such as pandi curry (pork), akki otti and kadambuttu; vegetarians should ask hosts in advance. Abbey Falls and Dubare are popular outdoor stops.' },
  { id: 'chikmagalur', topic: 'TRAVEL', destination: 'Chikmagalur', title: 'Chikmagalur travel notes',
    content: 'Chikmagalur is coffee country. Mullayanagiri is the highest peak in Karnataka and is popular for sunrise; Baba Budangiri has hill views and a shrine. Roads can be foggy and narrow in the Charmadi and Baba Budangiri areas. Plantations are private, so stay in estate homestays that offer guided walks.' },
  { id: 'agumbe', topic: 'TRAVEL', destination: 'Agumbe', title: 'Agumbe rainforest',
    content: 'Agumbe is a rainforest village in the Western Ghats, nicknamed the Cherrapunji of the south for heavy rain and known for sunsets and the Agumbe Rainforest Research Station. The ghat road has 14 hairpin bends. In monsoon expect leeches, mist and slippery trails; waterfalls like Onake Abbi are best viewed from safe designated points.' },
  { id: 'gokarna', topic: 'TRAVEL', destination: 'Gokarna', title: 'Gokarna',
    content: 'Gokarna is a pilgrim town around the Mahabaleshwar Temple with quieter beaches (Om, Kudle, Half Moon, Paradise) reached by short treks or boats. Dress modestly in the town and temple. Currents are strong; do not swim in rough seas, and note that sea swimming is discouraged or restricted during monsoon.' },
  { id: 'murudeshwar', topic: 'TRAVEL', destination: 'Murudeshwar', title: 'Murudeshwar',
    content: 'Murudeshwar has a very tall Shiva statue and a Raja Gopura with a lift for views over the Arabian Sea. Follow temple dress rules. Netrani Island day trips for scuba are offered by licensed operators in the cooler season, roughly October to March; book ahead and check sea conditions.' },
  { id: 'monsoon-ghats', topic: 'TRAVEL', title: 'Western Ghats in the monsoon',
    content: 'From June to September the Western Ghats get very heavy rain. Ghat roads such as Shiradi, Charmadi, Agumbe and Sampaje can see landslides, heavy-vehicle restrictions or temporary closures. Check road and weather updates the same morning, keep a buffer day, favour indoor heritage and cultural stops when it pours, and avoid swimming below waterfalls.' },
];

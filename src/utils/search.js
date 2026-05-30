import Fuse from 'fuse.js';
import { toRomaji, toHiragana, toKatakana } from 'wanakana';

// ─── 漢字読み辞書 ────────────────────────────────────────────────
const READINGS = {

  // ── 酒類（ウイスキー） ──
  '山崎':   ['やまざき', 'ヤマザキ', 'yamazaki'],
  '響':     ['ひびき',   'ヒビキ',   'hibiki'],
  '白州':   ['はくしゅ', 'ハクシュ', 'hakushu'],
  '竹鶴':   ['たけつる', 'タケツル', 'taketsuru'],
  '余市':   ['よいち',   'ヨイチ',   'yoichi'],
  '宮城峡': ['みやぎきょう', 'ミヤギキョウ', 'miyagikyo'],
  '知多':   ['ちた', 'チタ', 'chita'],
  '富士':   ['ふじ', 'フジ', 'fuji'],
  '角瓶':   ['かくびん', 'カクビン', 'kakubin'],
  '角':     ['かく', 'カク', 'kaku'],
  '黒ラベル': ['くろらべる', 'black label', 'くろ'],
  '碧':     ['あお', 'アオ', 'ao'],
  '陸':     ['りく', 'リク', 'riku'],

  // ── 焼酎 ──
  '黒霧島': ['くろきりしま', 'クロキリシマ', 'くろきり'],
  '霧島':   ['きりしま',   'キリシマ',   'kirishima'],
  '赤霧島': ['あかきりしま', 'アカキリシマ'],
  '茜霧島': ['あかねきりしま'],
  '白霧島': ['しろきりしま'],
  '魔王':   ['まおう', 'マオウ', 'maou'],
  '森伊蔵': ['もりいぞう', 'モリイゾウ', 'moriizo'],
  '村尾':   ['むらお', 'ムラオ', 'murao'],
  '伊佐美': ['いさみ', 'イサミ', 'isami'],
  '三岳':   ['みたけ', 'ミタケ', 'mitake'],
  '屋久島': ['やくしま', 'yakushima'],
  '鳥飼':   ['とりかい', 'トリカイ', 'torikai'],
  '中々':   ['なかなか', 'nakanaka'],
  '百年の孤独': ['ひゃくねんのこどく'],
  '天使の誘惑': ['てんしのゆうわく'],

  // ── 日本酒 ──
  '獺祭':   ['だっさい', 'ダッサイ', 'dassai'],
  '十四代': ['じゅうしだい', 'ジュウシダイ', 'juyondai'],
  '飛露喜': ['ひろき', 'ヒロキ', 'hiroki'],
  '新政':   ['あらまさ', 'アラマサ', 'aramasa'],
  '久保田': ['くぼた', 'クボタ', 'kubota'],
  '八海山': ['はっかいさん', 'ハッカイサン', 'hakkaisan'],
  '越乃寒梅': ['こしのかんばい'],
  '菊水':   ['きくすい', 'kikusui'],
  '黒龍':   ['こくりゅう', 'コクリュウ', 'kokuryu'],
  '而今':   ['じこん', 'ジコン', 'jikon'],
  '鍋島':   ['なべしま', 'ナベシマ', 'nabeshima'],
  '田酒':   ['でんしゅ', 'デンシュ', 'denshu'],
  '磯自慢': ['いそじまん'],

  // ── その他 ──
  '梅酒':   ['うめしゅ', 'umeshu'],
  '日本酒': ['にほんしゅ', 'sake', 'さけ'],
  '焼酎':   ['しょうちゅう', 'shochu'],
  '白':     ['しろ', 'white'],
  '赤':     ['あか', 'red'],
  '黒':     ['くろ', 'black'],
  '金':     ['きん', 'gold'],
  '銀':     ['ぎん', 'silver'],
  '年':     ['ねん', 'year'],
  '十二':   ['じゅうに', '12'],
  '十五':   ['じゅうご', '15'],
  '十八':   ['じゅうはち', '18'],
  '二十一': ['にじゅういち', '21'],
  '三十':   ['さんじゅう', '30'],

  // ── よく使う名字 ──
  '佐藤':   ['さとう', 'sato'],
  '鈴木':   ['すずき', 'suzuki'],
  '高橋':   ['たかはし', 'takahashi'],
  '田中':   ['たなか', 'tanaka'],
  '渡辺':   ['わたなべ', 'watanabe'],
  '渡邊':   ['わたなべ', 'watanabe'],
  '伊藤':   ['いとう', 'ito'],
  '山本':   ['やまもと', 'yamamoto'],
  '中村':   ['なかむら', 'nakamura'],
  '小林':   ['こばやし', 'kobayashi'],
  '加藤':   ['かとう', 'kato'],
  '吉田':   ['よしだ', 'yoshida'],
  '山田':   ['やまだ', 'yamada'],
  '佐々木': ['ささき', 'sasaki'],
  '松本':   ['まつもと', 'matsumoto'],
  '井上':   ['いのうえ', 'inoue'],
  '木村':   ['きむら', 'kimura'],
  '林':     ['はやし', 'hayashi'],
  '清水':   ['しみず', 'shimizu'],
  '池田':   ['いけだ', 'ikeda'],
  '橋本':   ['はしもと', 'hashimoto'],
  '阿部':   ['あべ', 'abe'],
  '安部':   ['あべ', 'abe'],
  '前田':   ['まえだ', 'maeda'],
  '藤田':   ['ふじた', 'fujita'],
  '岡田':   ['おかだ', 'okada'],
  '後藤':   ['ごとう', 'goto'],
  '長谷川': ['はせがわ', 'hasegawa'],
  '村上':   ['むらかみ', 'murakami'],
  '近藤':   ['こんどう', 'kondo'],
  '坂本':   ['さかもと', 'sakamoto'],
  '遠藤':   ['えんどう', 'endo'],
  '石川':   ['いしかわ', 'ishikawa'],
  '中島':   ['なかじま', 'nakajima'],
  '山口':   ['やまぐち', 'yamaguchi'],
  '小川':   ['おがわ', 'ogawa'],
  '福田':   ['ふくだ', 'fukuda'],
  '西村':   ['にしむら', 'nishimura'],
  '藤井':   ['ふじい', 'fujii'],
  '岡本':   ['おかもと', 'okamoto'],
  '三浦':   ['みうら', 'miura'],
  '松田':   ['まつだ', 'matsuda'],
  '中川':   ['なかがわ', 'nakagawa'],
  '斎藤':   ['さいとう', 'saito'],
  '斉藤':   ['さいとう', 'saito'],
  '田村':   ['たむら', 'tamura'],
  '藤原':   ['ふじわら', 'fujiwara'],
  '松井':   ['まつい', 'matsui'],
  '中野':   ['なかの', 'nakano'],
  '上田':   ['うえだ', 'ueda'],
  '小野':   ['おの', 'ono'],
  '原田':   ['はらだ', 'harada'],
  '柴田':   ['しばた', 'shibata'],
  '工藤':   ['くどう', 'kudo'],
  '石田':   ['いしだ', 'ishida'],
  '金子':   ['かねこ', 'kaneko'],
  '和田':   ['わだ', 'wada'],
  '西川':   ['にしかわ', 'nishikawa'],
  '丸山':   ['まるやま', 'maruyama'],
  '平野':   ['ひらの', 'hirano'],
  '藤本':   ['ふじもと', 'fujimoto'],
  '木下':   ['きのした', 'kinoshita'],
  '野田':   ['のだ', 'noda'],
  '石井':   ['いしい', 'ishii'],
  '大野':   ['おおの', 'ono'],
  '竹内':   ['たけうち', 'takeuchi'],
  '内田':   ['うちだ', 'uchida'],
  '谷口':   ['たにぐち', 'taniguchi'],
  '安藤':   ['あんどう', 'ando'],
  '今井':   ['いまい', 'imai'],
  '千葉':   ['ちば', 'chiba'],
  '菊地':   ['きくち', 'kikuchi'],
  '菊池':   ['きくち', 'kikuchi'],
  '大塚':   ['おおつか', 'otsuka'],
  '横山':   ['よこやま', 'yokoyama'],
  '河野':   ['かわの', 'kawano'],
  '島田':   ['しまだ', 'shimada'],
  '山下':   ['やました', 'yamashita'],
  '吉川':   ['よしかわ', 'yoshikawa'],
  '久保':   ['くぼ', 'kubo'],
  '宮崎':   ['みやざき', 'miyazaki'],
  '野村':   ['のむら', 'nomura'],
  '松岡':   ['まつおか', 'matsuoka'],
  '青木':   ['あおき', 'aoki'],
  '中山':   ['なかやま', 'nakayama'],
  '水野':   ['みずの', 'mizuno'],
  '原':     ['はら', 'hara'],
  '村田':   ['むらた', 'murata'],
  '上野':   ['うえの', 'ueno'],
  '新井':   ['あらい', 'arai'],
  '浜田':   ['はまだ', 'hamada'],
  '小島':   ['こじま', 'kojima'],
  '田島':   ['たじま', 'tajima'],

  // ── よく使う名前（女性） ──
  '愛':     ['あい', 'まな', 'めぐみ', 'ai', 'mana'],
  '美':     ['み', 'よし', 'び', 'mi'],
  '花':     ['はな', 'か', 'hana'],
  '桜':     ['さくら', 'sakura'],
  '結':     ['ゆい', 'むすび', 'yui'],
  '心':     ['こころ', 'kokoro'],
  '凛':     ['りん', 'rin'],
  '彩':     ['あや', 'いろは', 'aya'],
  '葵':     ['あおい', 'aoi'],
  '莉':     ['り', 'ri'],
  '菜':     ['な', 'na'],
  '夏':     ['なつ', 'natsu'],
  '優':     ['ゆう', 'まさる', 'yu'],
  '美咲':   ['みさき', 'misaki'],
  '麻衣':   ['まい', 'mai'],
  '千恵':   ['ちえ', 'chie'],
  '由美':   ['ゆみ', 'yumi'],
  '恵':     ['めぐみ', 'けい', 'megumi'],
  '舞':     ['まい', 'mai'],
  '詩':     ['うた', 'し', 'uta'],
  '瑠璃':   ['るり', 'ruri'],
  '蘭':     ['らん', 'ran'],
  '月':     ['つき', 'tsuki'],
  '星':     ['ほし', 'hoshi'],
  '雪':     ['ゆき', 'yuki'],
  '空':     ['そら', 'sora'],
  '海':     ['うみ', 'umi'],
  '春':     ['はる', 'haru'],
  '秋':     ['あき', 'aki'],
  '冬':     ['ふゆ', 'fuyu'],
  '華':     ['はな', 'か', 'hana'],
  '美桜':   ['みお', 'mio'],
  '美月':   ['みつき', 'mitsuki'],
  '陽菜':   ['ひな', 'hina'],
  '奈々':   ['なな', 'nana'],
  '里奈':   ['りな', 'rina'],
  '沙耶':   ['さや', 'saya'],
  '真由':   ['まゆ', 'mayu'],
  '明日香': ['あすか', 'asuka'],
  '友美':   ['ともみ', 'tomomi'],
  '真奈美': ['まなみ', 'manami'],
  '彩香':   ['あやか', 'ayaka'],
  '奈緒':   ['なお', 'nao'],
  '亜美':   ['あみ', 'ami'],
  '百合':   ['ゆり', 'yuri'],
  '紅':     ['べに', 'くれない', 'beni'],
  '紗':     ['さ', 'sha'],
  '楓':     ['かえで', 'ふう', 'kaede'],

  // ── よく使う名前（男性） ──
  '翔':     ['しょう', 'かける', 'sho'],
  '大輔':   ['だいすけ', 'daisuke'],
  '健':     ['けん', 'たける', 'ken'],
  '誠':     ['まこと', 'makoto'],
  '拓也':   ['たくや', 'takuya'],
  '一郎':   ['いちろう', 'ichiro'],
  '太郎':   ['たろう', 'taro'],
  '浩':     ['ひろし', 'hiroshi'],
  '哲也':   ['てつや', 'tetsuya'],
  '直樹':   ['なおき', 'naoki'],
  '雄太':   ['ゆうた', 'yuta'],
  '亮':     ['りょう', 'ryo'],
  '慎一':   ['しんいち', 'shinichi'],
  '和也':   ['かずや', 'kazuya'],
  '俊介':   ['しゅんすけ', 'shunsuke'],
};

// ── ブランド別名マッピング ─────────────────────────────────────────
const ALIASES = {
  'ヤマザキ':    ['山崎', 'やまざき', 'yamazaki', 'yamzaki'],
  'ヒビキ':      ['響', 'ひびき', 'hibiki'],
  'ハクシュ':    ['白州', 'はくしゅ', 'hakushu'],
  'タケツル':    ['竹鶴', 'たけつる', 'taketsuru'],
  'ニッカ':      ['nikka', 'にっか'],
  'サントリー':  ['suntory', 'さんとりー'],
  'キリン':      ['kirin', 'きりん'],
  'シーバス':    ['chivas', 'シバス', 'chivas regal', 'しーばす'],
  'シバス':      ['chivas', 'シーバス', 'chivas regal', 'しばす'],
  'ジョニーウォーカー': ['johnnie walker', 'johnny walker', 'じょにーうぉーかー', 'ジョニ黒', 'ジョニ赤'],
  'ジョニ黒':    ['johnnie walker black', 'ジョニーウォーカー', 'black label'],
  'マッカラン':  ['macallan', 'the macallan', 'まっからん'],
  'バランタイン': ['ballantine', 'ballantines', 'ばらんたいん'],
  'グレンリベット': ['glenlivet', 'ぐれんりべっと'],
  'グレンフィディック': ['glenfiddich', 'ぐれんふぃでぃっく'],
  'ラフロイグ':  ['laphroaig', 'らふろいぐ'],
  'アードベッグ': ['ardbeg', 'あーどべっぐ'],
  'ボウモア':    ['bowmore', 'ぼうもあ'],
  'ジャックダニエル': ['jack daniel', "jack daniel's", 'jack daniels', 'ジャックダニエルズ', 'じゃっくだにえる'],
  'メーカーズマーク': ["maker's mark", 'makers mark', 'めーかーずまーく'],
  'ワイルドターキー': ['wild turkey', 'わいるどたーきー'],
  'バッファロートレース': ['buffalo trace'],
  'ヘネシー':    ['hennessy', 'hennesy', 'へねしー'],
  'レミーマルタン': ['remy martin', 'れみーまるたん'],
  'クルボアジェ': ['courvoisier', 'くるぼあじぇ'],
  'マーテル':    ['martell', 'まーてる'],
  'カミュ':      ['camus', 'かみゅ'],
  'ドンペリ':    ['dom perignon', 'dom pérignon', 'ドンペリニョン', 'どんぺり', 'dp'],
  'クリュッグ':  ['krug', 'くりゅっぐ'],
  'モエ':        ['moet', 'moët', 'モエシャンドン', 'moet chandon', 'もえ'],
  'ローランペリエ': ['laurent perrier', 'ろーらんぺりえ'],
  'テタンジェ':  ['taittinger', 'てたんじぇ'],
  'アルマンドブリニャック': ['armand de brignac', 'ace of spades', 'あるまんど'],
  'アルマンド':  ['armand de brignac', 'ace of spades', 'アルマンドブリニャック'],
  'クリスタル':  ['cristal', 'louis roederer cristal', 'くりすたる'],
  'グレイグース': ['grey goose', 'gray goose', 'ぐれいぐーす'],
  'ベルヴェデール': ['belvedere', 'べるべでーる'],
  'アブソルート': ['absolut', 'absolute', 'あぶそるーと'],
  'スミノフ':    ['smirnoff', 'すみのふ'],
  'パトロン':    ['patron', 'ぱとろん'],
  'クエルボ':    ['jose cuervo', 'cuervo', 'くえるぼ'],
  'バカルディ':  ['bacardi', 'ばかるでぃ'],
  'キリシマ':    ['霧島', 'きりしま', 'kirishima'],
  'クロキリ':    ['黒霧島', 'くろきりしま'],
  'マオウ':      ['魔王', 'まおう', 'maou'],
  'モリイゾウ':  ['森伊蔵', 'もりいぞう'],
  'ムラオ':      ['村尾', 'むらお'],
  'ダッサイ':    ['獺祭', 'だっさい', 'dassai'],
  'ジュウシダイ': ['十四代', 'じゅうしだい', 'juyondai'],
  'アラマサ':    ['新政', 'あらまさ', 'aramasa'],
  'クボタ':      ['久保田', 'くぼた', 'kubota'],
};

function buildReverseMap() {
  const map = {};
  for (const [key, vals] of Object.entries(ALIASES)) {
    const hKey = toHiragana(key);
    if (!map[hKey]) map[hKey] = [];
    map[hKey].push(key, ...vals);
    for (const v of vals) {
      const hv = toHiragana(String(v));
      if (!map[hv]) map[hv] = [];
      map[hv].push(key, ...vals);
    }
  }
  return map;
}
const REVERSE_MAP = buildReverseMap();

function expandKanji(text) {
  if (!text) return [];
  const extra = [];
  for (const [kanji, readings] of Object.entries(READINGS)) {
    if (text.includes(kanji)) extra.push(...readings);
  }
  return extra;
}

function expandText(text) {
  if (!text) return [];
  const parts = [...expandKanji(text)];
  try {
    const romaji = toRomaji(text);
    const hira   = toHiragana(text);
    const kata   = toKatakana(text);
    if (romaji !== text) parts.push(romaji);
    if (hira   !== text) parts.push(hira);
    if (kata   !== text) parts.push(kata);
  } catch { /* ignore */ }
  return parts;
}

function expandQuery(q) {
  const variants = new Set([q]);
  try {
    variants.add(toHiragana(q));
    variants.add(toKatakana(q));
    variants.add(toRomaji(q));
  } catch { /* ignore */ }

  const hq = toHiragana(q);
  for (const v of (REVERSE_MAP[hq] || [])) variants.add(v);
  for (const v of (REVERSE_MAP[q]  || [])) variants.add(v);
  for (const r of expandKanji(q))          variants.add(r);

  return [...variants].filter(Boolean);
}

function buildSearchText(bottle) {
  const name         = bottle.name         || '';
  const keepName     = bottle.keepName     || '';
  const customerName = bottle.customerName || '';
  const notes        = bottle.notes        || '';
  const castNames    = Array.isArray(bottle.castName)
    ? bottle.castName
    : (bottle.castName ? [bottle.castName] : []);

  const parts = [name, keepName, customerName, ...castNames, notes];

  parts.push(...expandText(name));
  parts.push(...expandText(keepName));
  parts.push(...expandText(customerName));
  for (const n of castNames) parts.push(...expandText(n));
  parts.push(...expandText(notes));

  parts.push(...(ALIASES[name] || []));
  for (const [key, vals] of Object.entries(ALIASES)) {
    if (name.includes(key)) parts.push(key, ...vals);
  }

  return parts.filter(Boolean).join(' ');
}

const _textCache = new Map();

export function buildSearchIndex(bottles) {
  const enriched = bottles.map(b => {
    const key = `${b.id}:${b.updatedAt ?? ''}`;
    let text = _textCache.get(key);
    if (!text) {
      text = buildSearchText(b);
      _textCache.set(key, text);
      if (_textCache.size > 6000) _textCache.delete(_textCache.keys().next().value);
    }
    return { ...b, _searchText: text };
  });

  return new Fuse(enriched, {
    keys: [
      { name: '_searchText', weight: 1 },
      { name: 'name',         weight: 0.9 },
      { name: 'keepName',     weight: 0.8 },
      { name: 'customerName', weight: 0.7 },
      { name: 'castName',     weight: 0.7 },
      { name: 'notes',        weight: 0.5 },
    ],
    threshold: 0.3,
    distance: 80,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
}

export function searchBottles(fuse, query, allBottles) {
  if (!query || !query.trim()) return allBottles;

  const variants = expandQuery(query.trim());
  let results = [];
  for (const v of variants) {
    results = dedup([...results, ...fuse.search(v).map(r => r.item)]);
  }
  return results;
}

function dedup(bottles) {
  const seen = new Set();
  return bottles.filter(b => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
}

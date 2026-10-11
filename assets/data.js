/* こどもドリルらんど：出題ロジックとデータ（DOMに触らない純粋なデータ層） */
var KD = (function () {
  'use strict';
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const dots = (n, cls, xFrom) => {
    let h = '<div class="dotgrid" aria-hidden="true">';
    for (let i = 0; i < n; i++) h += '<i class="dot ' + cls + (xFrom !== undefined && i >= xFrom ? ' x' : '') + '"></i>';
    return h + '</div>';
  };

  /* ---------- ヒント ---------- */
  function hintSum(q) {
    const a = q.a, b = q.b, ans = a + b;
    if (a < 10 && b < 10) {
      let h = '<div class="dotrow">' + dots(a, 'd1') + '<span class="plus">＋</span>' + dots(b, 'd2') + '</div>';
      if (ans >= 10) {
        const need = 10 - a;
        h += '<p>' + a + 'は あと ' + need + 'で 10。<br>' + b + 'を ' + need + 'と ' + (b - need) + 'に わけよう。<br>10と ' + (b - need) + 'で <b>' + ans + '</b></p>';
      } else {
        h += '<p>ぜんぶで いくつか、かぞえてみよう。</p>';
      }
      return h;
    }
    const ta = a - a % 10, tb = b - b % 10, oa = a % 10, ob = b % 10, os = oa + ob;
    return '<p>10のくらい：' + (tb ? ta + ' ＋ ' + tb + ' ＝ ' + (ta + tb) : ta) + '<br>' +
      '1のくらい：' + oa + ' ＋ ' + ob + ' ＝ ' + os + (os >= 10 ? '（10を こえたよ）' : '') + '<br>' +
      'あわせて ' + (ta + tb) + ' ＋ ' + os + ' ＝ <b>' + ans + '</b></p>';
  }
  function hintSub(q) {
    const a = q.a, b = q.b, ans = a - b;
    if (a <= 9) {
      return '<div class="dotrow">' + dots(a, 'd1', a - b) + '</div><p>' + a + 'こから ' + b + 'こ とると、のこりは？</p>';
    }
    const ta = a - a % 10, tb = b - b % 10, oa = a % 10, ob = b % 10;
    if (a <= 18 && b < 10 && oa < b) {
      const r = 10 - b, o = a - 10;
      return '<p>' + a + 'を 10と ' + o + 'に わけよう。<br>10から ' + b + 'を とると ' + r + '。<br>' + r + 'と ' + o + 'を たして <b>' + ans + '</b></p>';
    }
    if (oa >= ob) {
      return '<p>10のくらい：' + (tb ? ta + ' − ' + tb + ' ＝ ' + (ta - tb) : ta) + '<br>' +
        '1のくらい：' + oa + ' − ' + ob + ' ＝ ' + (oa - ob) + '<br>' +
        'あわせて <b>' + ans + '</b></p>';
    }
    return '<p>1のくらいが たりないから、10のくらいから 10 かりるよ。<br>' +
      '1のくらい：' + (10 + oa) + ' − ' + ob + ' ＝ ' + (10 + oa - ob) + '<br>' +
      '10のくらい：' + (ta - 10) + (tb ? ' − ' + tb : '') + ' ＝ ' + (ta - 10 - tb) + '<br>' +
      'あわせて <b>' + ans + '</b></p>';
  }

  /* ---------- たしざん・ひきざん ---------- */
  const sumLevels = [
    { name: 'ひとけた ＋ ひとけた', sub: 'こたえが 9まで（3＋4）', grade: '年長〜小1', gen: () => { const a = rnd(1, 8); return { a, b: rnd(1, 9 - a) }; } },
    { name: 'くりあがり', sub: 'こたえが 10〜18（8＋5）', grade: '小1', gen: () => { const a = rnd(2, 9); return { a, b: rnd(10 - a, 9) }; } },
    { name: '2けた ＋ ひとけた', sub: '（23＋5、38＋7）', grade: '小1〜小2', gen: () => { let a, b; do { a = rnd(10, 98); b = rnd(1, 9); } while (a + b > 99); return { a, b }; } },
    { name: '2けた ＋ 2けた', sub: 'こたえが 99まで（23＋45）', grade: '小2', gen: () => { const a = rnd(10, 89); return { a, b: rnd(10, 99 - a) }; } },
    { name: 'ぜんぶ ミックス', sub: 'レベル1〜4が まざるよ', grade: 'おさらい', gen: () => sumLevels[rnd(0, 3)].gen() }
  ];
  const subLevels = [
    { name: 'ひとけた − ひとけた', sub: '9までの ひきざん（7−3）', grade: '年長〜小1', gen: () => { const a = rnd(2, 9); return { a, b: rnd(1, a - 1) }; } },
    { name: 'くりさがり', sub: '11〜18から ひとけた（13−8）', grade: '小1', gen: () => { const a = rnd(11, 18); return { a, b: rnd(a - 10 + 1, 9) }; } },
    { name: '2けた − ひとけた', sub: '（25−3、42−7）', grade: '小1〜小2', gen: () => { const a = rnd(21, 99); return { a, b: rnd(1, 9) }; } },
    { name: '2けた − 2けた', sub: '（48−23、52−27）', grade: '小2', gen: () => { const a = rnd(30, 99); return { a, b: rnd(10, a - 1) }; } },
    { name: 'ぜんぶ ミックス', sub: 'レベル1〜4が まざるよ', grade: 'おさらい', gen: () => subLevels[rnd(0, 3)].gen() }
  ];
  const MATH = {
    sum: { key: 'sum', title: 'たしざん', op: '＋', fn: (a, b) => a + b, hint: hintSum, levels: sumLevels },
    sub: { key: 'sub', title: 'ひきざん', op: '−', fn: (a, b) => a - b, hint: hintSub, levels: subLevels }
  };

  /* ---------- ことば（絵あわせ） ---------- */
  // g: 同じグループの絵は まぎらわしいので、選択肢に いっしょに出さない
  const WORDS_H = [
    // 2もじ
    { w: 'いぬ', e: '🐶' }, { w: 'ねこ', e: '🐱' }, { w: 'うし', e: '🐮' }, { w: 'うま', e: '🐴' }, { w: 'さる', e: '🐵' },
    { w: 'かめ', e: '🐢' }, { w: 'くま', e: '🐻' }, { w: 'ぞう', e: '🐘' }, { w: 'とり', e: '🐦', g: 'bird' }, { w: 'ぶた', e: '🐷' },
    { w: 'やぎ', e: '🐐' }, { w: 'はち', e: '🐝' }, { w: 'あり', e: '🐜' }, { w: 'かば', e: '🦛' }, { w: 'さい', e: '🦏' },
    { w: 'へび', e: '🐍' }, { w: 'りす', e: '🐿️' }, { w: 'いか', e: '🦑', g: 'sea' }, { w: 'たこ', e: '🐙', g: 'sea' }, { w: 'かに', e: '🦀', g: 'sea' },
    { w: 'えび', e: '🦐', g: 'sea' }, { w: 'ほし', e: '⭐', g: 'sky' }, { w: 'つき', e: '🌙', g: 'sky' }, { w: 'くも', e: '☁️', g: 'wx' },
    { w: 'あめ', e: '🌧️', g: 'wx' }, { w: 'ゆき', e: '❄️', g: 'wx' }, { w: 'かさ', e: '☂️', g: 'wx' }, { w: 'はな', e: '🌸', g: 'flower' },
    { w: 'もも', e: '🍑' }, { w: 'なし', e: '🍐' }, { w: 'なす', e: '🍆' }, { w: 'すし', e: '🍣' }, { w: 'にじ', e: '🌈' },
    { w: 'やま', e: '⛰️' }, { w: 'うみ', e: '🌊' }, { w: 'ふね', e: '🚢' }, { w: 'かぎ', e: '🔑' }, { w: 'ほん', e: '📖' },
    { w: 'くつ', e: '👟' }, { w: 'いす', e: '🪑' },
    // 3もじ
    { w: 'さかな', e: '🐟', g: 'sea' }, { w: 'りんご', e: '🍎' }, { w: 'みかん', e: '🍊' }, { w: 'ひよこ', e: '🐥', g: 'bird' },
    { w: 'あひる', e: '🦆', g: 'bird' }, { w: 'うさぎ', e: '🐰' }, { w: 'すいか', e: '🍉' }, { w: 'いちご', e: '🍓' }, { w: 'ぶどう', e: '🍇' },
    { w: 'きのこ', e: '🍄' }, { w: 'たまご', e: '🥚' }, { w: 'ごはん', e: '🍚' }, { w: 'くるま', e: '🚗' }, { w: 'ねずみ', e: '🐭' },
    { w: 'きりん', e: '🦒' }, { w: 'かえる', e: '🐸' }, { w: 'とけい', e: '⏰' }, { w: 'たいこ', e: '🥁' }, { w: 'くじら', e: '🐳', g: 'sea' },
    { w: 'ひつじ', e: '🐑' }, { w: 'おばけ', e: '👻' }, { w: 'かばん', e: '🎒' }, { w: 'めがね', e: '👓' }, { w: 'ぼうし', e: '👒' },
    { w: 'おんぷ', e: '🎵' },
    // 4もじいじょう
    { w: 'ひこうき', e: '✈️' }, { w: 'でんしゃ', e: '🚃' }, { w: 'おにぎり', e: '🍙' }, { w: 'えんぴつ', e: '✏️' }, { w: 'ふうせん', e: '🎈' },
    { w: 'かぼちゃ', e: '🎃' }, { w: 'ひまわり', e: '🌻', g: 'flower' }, { w: 'ちょうちょ', e: '🦋' }, { w: 'じてんしゃ', e: '🚲' },
    { w: 'たいよう', e: '☀️', g: 'sky' }, { w: 'ふくろう', e: '🦉', g: 'bird' }, { w: 'にんじん', e: '🥕' }, { w: 'かたつむり', e: '🐌' },
    { w: 'てんとうむし', e: '🐞' }, { w: 'ぎゅうにゅう', e: '🥛' },
    // 頭文字そろえ用
    { w: 'わに', e: '🐊' }, { w: 'むし', e: '🐛' }, { w: 'しか', e: '🦌' }, { w: 'そば', e: '🍜' }, { w: 'よる', e: '🌃' },
    { w: 'れもん', e: '🍋' }, { w: 'まいく', e: '🎤' }, { w: 'らくだ', e: '🐪' }, { w: 'ばなな', e: '🍌' }, { w: 'ぷりん', e: '🍮' },
    { w: 'ろうそく', e: '🕯️' }, { w: 'がっこう', e: '🏫' }, { w: 'どんぐり', e: '🌰' }, { w: 'べんとう', e: '🍱' },
    { w: 'こいのぼり', e: '🎏' }, { w: 'ぬいぐるみ', e: '🧸' },
    { w: 'ちず', e: '🗺️' }, { w: 'だんご', e: '🍡' }, { w: 'ぱん', e: '🍞' }, { w: 'ぴあの', e: '🎹' }, { w: 'ぺんぎん', e: '🐧' }, { w: 'ぽすと', e: '📮' }
  ];
  const WORDS_K = [
    // 3もじまで
    { w: 'ワニ', e: '🐊' }, { w: 'トラ', e: '🐯' }, { w: 'ドア', e: '🚪' }, { w: 'パン', e: '🍞' }, { w: 'バス', e: '🚌' },
    { w: 'ベル', e: '🔔' }, { w: 'ペン', e: '🖊️' }, { w: 'サメ', e: '🦈' }, { w: 'ピザ', e: '🍕' }, { w: 'コアラ', e: '🐨' },
    { w: 'パンダ', e: '🐼' }, { w: 'バナナ', e: '🍌' }, { w: 'ケーキ', e: '🍰' }, { w: 'カレー', e: '🍛' }, { w: 'ピアノ', e: '🎹' },
    { w: 'ギター', e: '🎸' }, { w: 'カメラ', e: '📷' }, { w: 'テレビ', e: '📺' }, { w: 'チーズ', e: '🧀' }, { w: 'ミルク', e: '🥛' },
    { w: 'トマト', e: '🍅' }, { w: 'テント', e: '⛺' }, { w: 'ゴリラ', e: '🦍' }, { w: 'キリン', e: '🦒' }, { w: 'ラッコ', e: '🦦' },
    { w: 'イルカ', e: '🐬' }, { w: 'アイス', e: '🍦' }, { w: 'レモン', e: '🍋' }, { w: 'メロン', e: '🍈' }, { w: 'ベッド', e: '🛏️' },
    { w: 'プリン', e: '🍮' }, { w: 'テニス', e: '🎾' }, { w: 'ポテト', e: '🍟' }, { w: 'ラジオ', e: '📻' },
    // 4もじ
    { w: 'ライオン', e: '🦁' }, { w: 'ペンギン', e: '🐧' }, { w: 'ロケット', e: '🚀' }, { w: 'ジュース', e: '🧃' }, { w: 'コーヒー', e: '☕' },
    { w: 'クッキー', e: '🍪' }, { w: 'ラーメン', e: '🍜' }, { w: 'ピーマン', e: '🫑' }, { w: 'パソコン', e: '💻' }, { w: 'トラック', e: '🚚' },
    { w: 'タクシー', e: '🚕' }, { w: 'スプーン', e: '🥄' }, { w: 'ドーナツ', e: '🍩' }, { w: 'サッカー', e: '⚽' },
    // 5もじいじょう
    { w: 'ハンバーガー', e: '🍔' }, { w: 'サンドイッチ', e: '🥪' }, { w: 'チョコレート', e: '🍫' }, { w: 'ホットドッグ', e: '🌭' },
    { w: 'ヘリコプター', e: '🚁' }, { w: 'パイナップル', e: '🍍' }, { w: 'スパゲッティ', e: '🍝' }, { w: 'キャンディ', e: '🍬' },
    { w: 'ポップコーン', e: '🍿' }, { w: 'バイオリン', e: '🎻' }, { w: 'トランペット', e: '🎺' }, { w: 'ブロッコリー', e: '🥦' },
    // 頭文字そろえ用
    { w: 'オムレツ', e: '🍳' }, { w: 'ナイフ', e: '🔪' }, { w: 'ネクタイ', e: '👔' }, { w: 'ノート', e: '📓' }, { w: 'フォーク', e: '🍴' },
    { w: 'ヘルメット', e: '⛑️' }, { w: 'マスク', e: '😷' }, { w: 'ヨット', e: '⛵' }, { w: 'リボン', e: '🎀' }, { w: 'ロボット', e: '🤖' },
    { w: 'シャツ', e: '👕' }, { w: 'セーター', e: '🧥' }, { w: 'ソファ', e: '🛋️' }, { w: 'ツリー', e: '🎄' }, { w: 'ダンス', e: '💃' },
    { w: 'ビル', e: '🏢' }, { w: 'ボート', e: '🚤' }, { w: 'ヒーロー', e: '🦸' }, { w: 'デパート', e: '🏬' }
  ];
  const WORD = {
    kana: {
      key: 'kana', title: 'ひらがな よめるかな', script: 'hira', words: WORDS_H,
      levels: [
        { name: '2もじの ことば', sub: 'いぬ・ねこ・ほし など', grade: '入門', filter: (w) => w.w.length === 2 },
        { name: '3もじの ことば', sub: 'さかな・りんご・くるま など', grade: 'やさしい', filter: (w) => w.w.length === 3 },
        { name: '4もじいじょうの ことば', sub: 'ひこうき・おにぎり など', grade: 'ちょうせん', filter: (w) => w.w.length >= 4 },
        { name: 'ぜんぶ ミックス', sub: 'どんな ことばが でるかな？', grade: 'おさらい', filter: () => true }
      ]
    },
    kata: {
      key: 'kata', title: 'カタカナ よめるかな', script: 'kata', words: WORDS_K,
      levels: [
        { name: '3もじまでの ことば', sub: 'パン・バナナ・ケーキ など', grade: '入門', filter: (w) => w.w.length <= 3 },
        { name: '4もじの ことば', sub: 'ライオン・ジュース など', grade: 'やさしい', filter: (w) => w.w.length === 4 },
        { name: '5もじいじょうの ことば', sub: 'ハンバーガー・チョコレート など', grade: 'ちょうせん', filter: (w) => w.w.length >= 5 },
        { name: 'ぜんぶ ミックス', sub: 'どんな ことばが でるかな？', grade: 'おさらい', filter: () => true }
      ]
    }
  };
  function wordQs(words, filter, n) {
    return shuffle(words.filter(filter)).slice(0, n).map((w) => {
      const ds = shuffle(words.filter((d) => d.e !== w.e && !(w.g && d.g === w.g))).slice(0, 3);
      return { w: w.w, e: w.e, choices: shuffle([w].concat(ds)) };
    });
  }
  function mathQs(gen, n) {
    const qs = [], seen = new Set();
    let guard = 0;
    while (qs.length < n && guard++ < 3000) {
      const q = gen(), k = q.a + '|' + q.b;
      if (seen.has(k)) continue;
      seen.add(k); qs.push(q);
    }
    return qs;
  }

  /* ---------- ステップ練習（あ行から1行ずつ） ---------- */
  const SMALL = 'ゃゅょャュョ';
  // ことばの最初の「音」。ちょ・きゃ のような拗音は2文字で1つにする
  const firstUnit = (w) => (w.length > 1 && SMALL.indexOf(w[1]) >= 0 ? w.slice(0, 2) : w[0]);
  function examples(words, c, n) {
    return shuffle(words.filter((w) => firstUnit(w.w) === c)).slice(0, n);
  }
  // ステップ一覧：文字表の1行（5文字まで）が1ステップ。conv で文字の種類（ひらがな/カタカナ）を変える
  function steps(conv) {
    const out = [];
    ['seion', 'dakuon'].forEach((g) => {
      CHARTS[g].rows.forEach((r) => {
        const chars = r.filter(Boolean).map(conv);
        out.push({ group: g, name: chars[0] + '行', chars: chars });
      });
    });
    return out;
  }
  // rowChars: このステップの文字 / reviewChars: 前のステップまでの文字（ふくしゅう用に2問ぶん混ぜる）
  // pool: ひっかけに使う文字。奇数番目の問題は、ことばがある文字なら「その文字ではじまることば」を出す
  function stepQs(words, rowChars, reviewChars, pool, n) {
    const m = {};
    words.forEach((w) => { const u = firstUnit(w.w); (m[u] = m[u] || []).push(w); });
    const rev = Math.min(reviewChars.length, Math.floor(n / 5));
    const targets = [];
    let bag = [];
    while (targets.length < n - rev) { if (!bag.length) bag = shuffle(rowChars); targets.push(bag.pop()); }
    shuffle(reviewChars).slice(0, rev).forEach((c) => targets.push(c));
    const order = shuffle(targets);
    for (let i = 1; i < order.length; i++) {          // 同じ文字が続かないように入れかえる
      if (order[i] === order[i - 1]) {
        const j = order.findIndex((x, k) => k > i && x !== order[i]);
        if (j > 0) { const t = order[i]; order[i] = order[j]; order[j] = t; }
      }
    }
    return order.map((c, i) => {
      const cand = m[c] || [];
      if (i % 2 === 1 && cand.length) {
        const w = cand[rnd(0, cand.length - 1)];
        const ds = shuffle(words.filter((d) => firstUnit(d.w) !== c && d.e !== w.e)).slice(0, 3);
        return { type: 'B', c: c, w: w.w, e: w.e, choices: shuffle([w].concat(ds)) };
      }
      const ds = shuffle(pool.filter((x) => x !== c)).slice(0, 3);
      return { type: 'A', c: c, choices: shuffle([c].concat(ds)) };
    });
  }

  /* ---------- 文字表 ---------- */
  const CHARTS = {
    seion: { name: 'せいおん', cols: 5, rows: [
      ['あ', 'い', 'う', 'え', 'お'], ['か', 'き', 'く', 'け', 'こ'], ['さ', 'し', 'す', 'せ', 'そ'], ['た', 'ち', 'つ', 'て', 'と'],
      ['な', 'に', 'ぬ', 'ね', 'の'], ['は', 'ひ', 'ふ', 'へ', 'ほ'], ['ま', 'み', 'む', 'め', 'も'], ['や', '', 'ゆ', '', 'よ'],
      ['ら', 'り', 'る', 'れ', 'ろ'], ['わ', '', 'を', '', 'ん']] },
    dakuon: { name: 'だくおん・はんだくおん', cols: 5, rows: [
      ['が', 'ぎ', 'ぐ', 'げ', 'ご'], ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'], ['だ', 'ぢ', 'づ', 'で', 'ど'],
      ['ば', 'び', 'ぶ', 'べ', 'ぼ'], ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']] },
    youon: { name: 'ようおん', cols: 3, rows: [
      ['きゃ', 'きゅ', 'きょ'], ['しゃ', 'しゅ', 'しょ'], ['ちゃ', 'ちゅ', 'ちょ'], ['にゃ', 'にゅ', 'にょ'], ['ひゃ', 'ひゅ', 'ひょ'],
      ['みゃ', 'みゅ', 'みょ'], ['りゃ', 'りゅ', 'りょ'], ['ぎゃ', 'ぎゅ', 'ぎょ'], ['じゃ', 'じゅ', 'じょ'], ['びゃ', 'びゅ', 'びょ'], ['ぴゃ', 'ぴゅ', 'ぴょ']] }
  };
  const toKata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));

  return { rnd, shuffle, MATH, WORD, WORDS_H, WORDS_K, CHARTS, toKata, wordQs, mathQs, firstUnit, examples, stepQs, steps };
})();
if (typeof module !== 'undefined') module.exports = KD;

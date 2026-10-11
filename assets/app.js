/* こどもドリルらんど：ドリルのUIと進行（音声の読み上げは使いません。効果音だけです） */
(function () {
  'use strict';
  const root = document.getElementById('drill');
  if (!root || typeof KD === 'undefined') return;
  const kind = root.dataset.kind;
  const M = KD.MATH[kind], W = KD.WORD[kind];
  const C = M || W;
  const isMath = !!M;
  if (!C) return;

  /* ---------- 保存 ---------- */
  const KEY = 'kodomoDrill.v1';
  const S = (function () {
    let v = {};
    try { v = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { v = {}; }
    if (typeof v !== 'object') v = {};
    v.stars = v.stars || {};
    if (v.sound === undefined) v.sound = true;
    v.daily = v.daily || { d: '', n: 0 };
    v.pick = v.pick || {};
    return v;
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 保存できなくても遊べる */ } };
  const dayKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const todayN = () => (S.daily.d === dayKey() ? S.daily.n : 0);
  function bump() {
    if (S.daily.d !== dayKey()) S.daily = { d: dayKey(), n: 0 };
    S.daily.n++; save(); paintToday();
  }
  const starsOf = (i) => S.stars[C.key + i] || 0;
  function saveStars(i, n) { if (n > starsOf(i)) { S.stars[C.key + i] = n; save(); } }
  const calcStars = (s) => (s >= 10 ? 3 : s >= 8 ? 2 : s >= 5 ? 1 : 0);
  const starsStr = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

  /* ---------- 効果音（ピンポン音だけ。声は出しません） ---------- */
  let ac;
  function beep(freqs) {
    if (!S.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const d = 0.12; const t = ac.currentTime;
      freqs.forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.15, t + i * d);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * d + d);
        o.connect(g); g.connect(ac.destination);
        o.start(t + i * d); o.stop(t + i * d + d);
      });
    } catch (e) { /* 音が出なくても続行 */ }
  }

  /* ---------- 画面の骨組み ---------- */
  root.innerHTML =
    '<div class="tool-head"><h2 class="tool-title">' + C.title + '</h2>' +
    '<div class="tool-meta"><span class="today" id="today"></span>' +
    '<button type="button" class="snd" id="snd" aria-pressed="true"></button></div></div>' +
    '<div class="view" id="view"></div>';
  const V = document.getElementById('view');
  function paintToday() { document.getElementById('today').textContent = 'きょう ' + todayN() + 'もん'; }
  function paintSnd() {
    const b = document.getElementById('snd');
    b.textContent = S.sound ? '🔊 こうかおん あり' : '🔇 こうかおん なし';
    b.setAttribute('aria-pressed', S.sound ? 'true' : 'false');
  }
  paintToday(); paintSnd();

  let G = { playing: false };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tone = (n, msg, cls) => { const m = document.getElementById(n); if (m) { m.textContent = msg; m.className = 'msg ' + (cls || ''); } };
  const toneHTML = (n, html, cls) => { const m = document.getElementById(n); if (m) { m.innerHTML = html; m.className = 'msg ' + (cls || ''); } };
  const conv = (s) => (W && W.script === 'kata' ? KD.toKata(s) : s);
  const scriptName = () => (W && W.script === 'kata' ? 'カタカナ' : 'ひらがな');
  function dotsBar() {
    let h = '<ol class="prog" aria-label="しんちょく">';
    for (let i = 0; i < 10; i++) h += '<li class="' + (i < G.idx ? (G.res[i] ? 'ok' : 'ng') : i === G.idx ? 'now' : '') + '"></li>';
    return h + '</ol>';
  }
  function topbar() {
    return '<div class="bar"><button type="button" class="back" data-act="menu">もどる</button>' +
      '<span class="lvl">レベル' + (G.lvl + 1) + '</span><span class="cnt">' + (G.idx + 1) + ' / 10</span></div>';
  }

  /* ---------- メニュー ---------- */
  function menu() {
    G = { playing: false };
    const total = C.levels.length * 3;
    let got = 0; C.levels.forEach((_, i) => { got += starsOf(i); });
    let h = '';
    if (!isMath) {
      h += '<p class="pick">はじめかたを えらんでね</p>' +
        '<button type="button" class="pick-card" data-act="pickmenu"><span class="pk-big" lang="ja">' + conv('あ') + '</span>' +
        '<span><b>もじを えらんで れんしゅう</b><small>1もじだけでも できるよ</small></span></button>' +
        '<p class="pick">ことばを よめる ひとは こちら<span class="total">★ ' + got + ' / ' + total + '</span></p>';
    } else {
      h += '<p class="pick">レベルを えらんでね<span class="total">★ ' + got + ' / ' + total + '</span></p>';
    }
    h += '<div class="levels">';
    C.levels.forEach((l, i) => {
      h += '<div class="level"><button type="button" class="level-main" data-act="play" data-i="' + i + '">' +
        '<span class="lv-no">' + (i + 1) + '</span>' +
        '<span class="lv-text"><b>' + esc(l.name) + '</b><small>' + esc(l.sub) + '</small><em>' + esc(l.grade) + '</em></span>' +
        '<span class="lv-stars" aria-label="ほし ' + starsOf(i) + 'こ">' + starsStr(starsOf(i)) + '</span></button>';
      if (isMath) h += '<button type="button" class="level-print" data-act="print" data-i="' + i + '" aria-label="レベル' + (i + 1) + 'の プリントを つくる">プリント</button>';
      h += '</div>';
    });
    h += '</div>';
    if (!isMath) h += '<button type="button" class="chart-card" data-act="chart"><b>' + scriptName() + 'ひょう</b><small>おすと ことばが でるよ。プリントもできるよ</small></button>';
    V.innerHTML = h;
  }

  /* ---------- 結果 ---------- */
  function mark(n) {
    if (n === 0) return '<div class="mark none" aria-hidden="true">がんばろう</div>';
    const pt = (r, a) => (60 + r * Math.cos(a)).toFixed(1) + ' ' + (60 + r * Math.sin(a)).toFixed(1);
    let petals = '';
    if (n === 3) {
      const N = 8;
      petals = 'M' + pt(40, 0);
      for (let i = 1; i <= N; i++) petals += ' A16 16 0 0 1 ' + pt(40, (i / N) * Math.PI * 2);
      petals += 'Z';
    }
    let sp = '';
    for (let a = 0; a < 4 * Math.PI; a += 0.3) sp += (sp ? ' L' : 'M') + pt(3 + a * 2.1, a - 1.2);
    const rr = n === 3 ? 28 : 38;
    const ring = 'M' + pt(rr, 0) + ' A' + rr + ' ' + rr + ' 0 1 1 ' + pt(rr, Math.PI) + ' A' + rr + ' ' + rr + ' 0 1 1 ' + pt(rr, 0);
    return '<svg class="mark" viewBox="0 0 120 120" role="img" aria-label="' + (n === 3 ? 'はなまる' : 'まる') + '">' +
      (n === 3 ? '<path class="stroke s1" pathLength="1" d="' + petals + '"/><path class="stroke s2" pathLength="1" d="' + sp + '"/>' : '<path class="stroke s1" pathLength="1" d="' + ring + '"/>' + (n === 2 ? '<path class="stroke s2" pathLength="1" d="' + sp + '"/>' : '')) +
      '</svg>';
  }
  function result() {
    const n = calcStars(G.score);
    saveStars(G.lvl, n);
    const hasNext = G.score >= 8 && G.lvl < C.levels.length - 1;
    const text = n === 3 ? 'ぜんぶ よくできました！' : n === 2 ? 'よくできました！つぎも いけそう。' : n === 1 ? 'いいちょうし。もういちど やってみよう。' : 'だいじょうぶ。ヒントを みながら もういちど。';
    V.innerHTML = '<div class="result">' + mark(n) + '<h3>' + G.score + ' / 10 もん せいかい</h3>' +
      '<p class="rstars" aria-label="ほし ' + n + 'こ">' + starsStr(n) + '</p><p>' + text + '</p>' +
      '<div class="actions">' +
      (hasNext ? '<button type="button" class="btn go" data-act="play" data-i="' + (G.lvl + 1) + '">つぎの レベルへ</button>' : '') +
      '<button type="button" class="btn" data-act="play" data-i="' + G.lvl + '">もういちど</button>' +
      '<button type="button" class="btn sub" data-act="menu">レベルを えらぶ</button></div></div>';
    beep(n >= 2 ? [660, 880, 1100, 1320] : [660, 880]);
    G.playing = false;
  }

  /* ---------- 計算（たしざん・ひきざん） ---------- */
  function mathStart(i) {
    const L = C.levels[i];
    G = { playing: true, lvl: i, qs: KD.mathQs(L.gen, 10), idx: 0, score: 0, misses: 0, input: '', locked: false, res: [] };
    mathQ();
  }
  function mathQ() {
    const q = G.qs[G.idx];
    let pad = '';
    '123456789'.split('').forEach((n) => { pad += '<button type="button" data-act="key" data-k="' + n + '">' + n + '</button>'; });
    V.innerHTML = topbar() + dotsBar() +
      '<div class="note" id="qcard"><div class="eq"><span class="n">' + q.a + '</span><span class="o">' + C.op + '</span><span class="n">' + q.b + '</span><span class="o">＝</span><span class="ans" id="ans">？</span></div>' +
      '<p class="msg" id="msg" role="status"></p><div class="hint" id="hint"></div></div>' +
      '<div class="pad">' + pad +
      '<button type="button" class="fn" data-act="key" data-k="del" aria-label="けす">⌫</button>' +
      '<button type="button" data-act="key" data-k="0">0</button>' +
      '<button type="button" class="go" data-act="key" data-k="ok">こたえる</button></div>' +
      '<button type="button" class="hintbtn" data-act="hint">ヒントを みる</button>';
  }
  function mathKey(k) {
    if (!G.playing || G.locked) return;
    if (k === 'ok') return mathCheck();
    if (k === 'del') G.input = G.input.slice(0, -1);
    else if (G.input === '0') G.input = k;
    else if (G.input.length < 3) G.input += k;
    document.getElementById('ans').textContent = G.input || '？';
  }
  function mathHint() { if (G.playing) document.getElementById('hint').innerHTML = C.hint(G.qs[G.idx]); }
  function shake() { const c = document.getElementById('qcard'); if (c) { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); } }
  function mathCheck() {
    if (!G.input) return;
    const q = G.qs[G.idx], want = C.fn(q.a, q.b);
    if (Number(G.input) === want) {
      G.locked = true; G.res[G.idx] = true; if (G.misses === 0) G.score++;
      document.getElementById('ans').classList.add('good');
      tone('msg', 'せいかい！', 'good'); beep([660, 880, 1100]); bump();
      setTimeout(nextQ, 950);
    } else {
      G.misses++; G.input = ''; shake();
      document.getElementById('ans').textContent = '？'; beep([220, 170]);
      if (G.misses >= 3) {
        G.locked = true; G.res[G.idx] = false; bump();
        document.getElementById('ans').textContent = want;
        tone('msg', 'こたえは ' + want + ' だよ。つぎは できるよ。', 'bad');
        mathHint(); setTimeout(nextQ, 3300);
      } else {
        tone('msg', 'おしい！もういちど', 'bad');
        if (G.misses >= 2) mathHint();
      }
    }
  }
  function nextQ() {
    if (!G.playing) return;
    G.idx++; G.misses = 0; G.input = ''; G.locked = false;
    if (G.mode === 'pick') { if (G.idx >= 10) pickResult(); else pickQ(); return; }
    if (G.idx >= 10) result(); else (isMath ? mathQ() : wordQ());
  }

  /* ---------- ことば（絵あわせ） ---------- */
  function wordStart(i) {
    const L = C.levels[i];
    G = { playing: true, lvl: i, qs: KD.wordQs(C.words, L.filter, 10), idx: 0, score: 0, misses: 0, locked: false, res: [] };
    wordQ();
  }
  function wordQ() {
    const q = G.qs[G.idx];
    let ch = '';
    q.choices.forEach((c, i) => { ch += '<button type="button" class="choice" id="c' + i + '" data-act="pick" data-i="' + i + '">' + c.e + '</button>'; });
    V.innerHTML = topbar() + dotsBar() +
      '<div class="note word-note" id="qcard"><div class="word" lang="ja">' + q.w + '</div>' +
      '<p class="msg" id="kmsg" role="status">あう えは どれかな？</p></div><div class="choices">' + ch + '</div>';
  }
  function wordPick(i) {
    if (!G.playing || G.locked) return;
    const q = G.qs[G.idx], c = q.choices[i], b = document.getElementById('c' + i);
    if (c.w === q.w) {
      G.locked = true; G.res[G.idx] = true; if (G.misses === 0) G.score++;
      b.classList.add('ok');
      tone('kmsg', 'せいかい！「' + q.w + '」', 'good'); beep([660, 880, 1100]); bump();
      setTimeout(nextQ, 1700);
    } else {
      G.misses++; b.classList.add('ng'); b.disabled = true; shake();
      tone('kmsg', 'ちがうよ。もういちど', 'bad'); beep([220, 170]);
    }
  }

  /* ---------- もじを えらんで れんしゅう（1もじからOK） ---------- */
  const PICKTABS = ['seion', 'dakuon'];
  const PICKCHARS = {};
  PICKTABS.forEach((k) => { PICKCHARS[k] = [].concat.apply([], KD.CHARTS[k].rows).filter(Boolean).map(conv); });
  const ALLPICK = PICKCHARS.seion.concat(PICKCHARS.dakuon);
  const sel = new Set(((S.pick[kind]) || []).filter((c) => ALLPICK.indexOf(c) >= 0));
  function paintSel() {
    const cnt = document.getElementById('selcnt'); if (cnt) cnt.textContent = sel.size + ' もじ えらんだ';
    const st = document.getElementById('pstart'); if (st) st.disabled = sel.size === 0;
  }
  function pickMenu(tab) {
    tab = tab || (G && G.tab) || 'seion';
    G = { playing: false, tab: tab };
    let h = '<div class="bar"><button type="button" class="back" data-act="menu">もどる</button><span class="lvl">もじを えらぶ</span><span class="cnt" id="selcnt"></span></div>' +
      '<p class="pick-lead">れんしゅうしたい もじを おして えらぼう。<b>1つだけでも だいじょうぶ。</b></p><div class="ctabs" role="tablist">';
    PICKTABS.forEach((k) => {
      h += '<button type="button" role="tab" aria-selected="' + (k === tab) + '" class="' + (k === tab ? 'on' : '') + '" data-act="ptab" data-t="' + k + '">' + KD.CHARTS[k].name + '</button>';
    });
    h += '</div><div class="chart cols' + KD.CHARTS[tab].cols + '">';
    KD.CHARTS[tab].rows.forEach((r) => r.forEach((c0) => {
      const c = conv(c0);
      h += c0 ? '<button type="button" class="ch pk' + (sel.has(c) ? ' on' : '') + '" lang="ja" aria-pressed="' + sel.has(c) + '" data-act="ptoggle" data-c="' + c + '">' + c + '</button>' : '<span class="ch blank"></span>';
    }));
    h += '</div><div class="picker-actions"><button type="button" class="btn go" id="pstart" data-act="pstart">えらんだ もじで はじめる</button>' +
      '<button type="button" class="btn sub" data-act="pclear">ぜんぶ はずす</button></div>' +
      '<p class="chart-note">よみかたは、おうちのかたが こえに だして おしえてあげてね。</p>';
    V.innerHTML = h;
    paintSel();
  }
  function pickToggle(b) {
    const c = b.dataset.c;
    if (sel.has(c)) { sel.delete(c); b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }
    else { sel.add(c); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
    paintSel();
  }
  function pickStart() {
    if (!sel.size) return;
    S.pick[kind] = Array.from(sel); save();
    G = { playing: true, mode: 'pick', tab: G.tab || 'seion', qs: KD.pickQs(C.words, Array.from(sel), ALLPICK, 10), idx: 0, score: 0, misses: 0, locked: false, res: [] };
    pickQ();
  }
  function pickQ() {
    const q = G.qs[G.idx];
    let ch = '', ask;
    if (q.type === 'A') {
      ask = 'おなじ もじは どれかな？';
      q.choices.forEach((c, i) => { ch += '<button type="button" class="choice charc" lang="ja" id="c' + i + '" data-act="ppick" data-i="' + i + '">' + c + '</button>'; });
    } else {
      ask = '「' + q.c + '」から はじまる ことばは どれかな？';
      q.choices.forEach((c, i) => { ch += '<button type="button" class="choice" id="c' + i + '" data-act="ppick" data-i="' + i + '">' + c.e + '</button>'; });
    }
    V.innerHTML = '<div class="bar"><button type="button" class="back" data-act="pickmenu">もどる</button><span class="lvl">もじの れんしゅう</span><span class="cnt">' + (G.idx + 1) + ' / 10</span></div>' +
      dotsBar() +
      '<div class="note pick-note" id="qcard"><p class="ask">' + ask + '</p><div class="bigc" lang="ja">' + q.c + '</div>' +
      '<p class="msg" id="kmsg" role="status"></p></div><div class="choices">' + ch + '</div>';
  }
  function pickPick(i) {
    if (!G.playing || G.locked) return;
    const q = G.qs[G.idx], c = q.choices[i], b = document.getElementById('c' + i);
    const right = q.type === 'A' ? c === q.c : c.w === q.w;
    if (right) {
      G.locked = true; G.res[G.idx] = true; if (G.misses === 0) G.score++;
      b.classList.add('ok');
      if (q.type === 'B') toneHTML('kmsg', 'せいかい！ <span class="wd" lang="ja"><span class="hl">' + q.c + '</span>' + esc(q.w.slice(q.c.length)) + '</span>', 'good');
      else tone('kmsg', 'せいかい！', 'good');
      beep([660, 880, 1100]); bump();
      setTimeout(nextQ, q.type === 'B' ? 2000 : 1100);
    } else {
      G.misses++; b.classList.add('ng'); b.disabled = true; shake();
      tone('kmsg', 'ちがうよ。もういちど', 'bad'); beep([220, 170]);
    }
  }
  function pickResult() {
    const n = calcStars(G.score);
    const text = n === 3 ? 'ぜんぶ よくできました！' : n === 2 ? 'よくできました！' : 'いいちょうし。もういちど あそんでみよう。';
    V.innerHTML = '<div class="result">' + mark(n) + '<h3>' + G.score + ' / 10 もん せいかい</h3><p>' + text + '</p>' +
      '<div class="actions"><button type="button" class="btn go" data-act="pickagain">もういちど</button>' +
      '<button type="button" class="btn sub" data-act="pickmenu">もじを えらびなおす</button>' +
      '<button type="button" class="btn sub" data-act="menu">はじめに もどる</button></div></div>';
    beep(n >= 2 ? [660, 880, 1100, 1320] : [660, 880]);
    G.playing = false;
  }

  /* ---------- 文字表（おすと、その文字で はじまることばが 絵つきで出ます） ---------- */
  function chartView(tab) {
    tab = tab || 'seion';
    G = { playing: false, tab: tab };
    const t = KD.CHARTS[tab];
    let h = '<div class="bar"><button type="button" class="back" data-act="menu">もどる</button><span class="lvl">' + scriptName() + 'ひょう</span>' +
      '<button type="button" class="back" data-act="cprint">プリント</button></div><div class="ctabs" role="tablist">';
    Object.keys(KD.CHARTS).forEach((k) => {
      h += '<button type="button" role="tab" aria-selected="' + (k === tab) + '" class="' + (k === tab ? 'on' : '') + '" data-act="ctab" data-t="' + k + '">' + KD.CHARTS[k].name + '</button>';
    });
    h += '</div><div class="chart cols' + t.cols + '">';
    t.rows.forEach((r) => r.forEach((c) => {
      h += c ? '<button type="button" class="ch" lang="ja" data-act="chshow" data-t="' + conv(c) + '">' + conv(c) + '</button>' : '<span class="ch blank"></span>';
    }));
    V.innerHTML = h + '</div><div class="detail" id="chdetail" aria-live="polite">もじを おしてみよう。その もじで はじまる ことばが でるよ。</div>';
  }
  function chShow(b) {
    const c = b.dataset.t;
    root.querySelectorAll('.ch.hit').forEach((x) => x.classList.remove('hit'));
    b.classList.add('hit');
    const ex = KD.examples(C.words, c, 2);
    let h = '<span class="dc" lang="ja">' + c + '</span>';
    if (ex.length) {
      h += ex.map((w) => '<span class="dw"><span class="de">' + w.e + '</span><span lang="ja"><span class="hl">' + c + '</span>' + esc(w.w.slice(c.length)) + '</span></span>').join('');
    } else {
      h += '<span class="dn">この もじで はじまる ことばは まだ ないよ</span>';
    }
    const d = document.getElementById('chdetail'); if (d) d.innerHTML = h;
  }

  /* ---------- 印刷 ---------- */
  const pa = document.createElement('div');
  pa.id = 'print-area'; pa.setAttribute('aria-hidden', 'true');
  document.body.appendChild(pa);
  window.addEventListener('afterprint', () => { document.body.classList.remove('printing'); });
  function printDoc(html) {
    pa.innerHTML = html;
    document.body.classList.add('printing');
    window.print();
  }
  const siteLine = () => '<div class="ps-foot">こどもドリルらんど　' + esc(location.host + location.pathname.replace(/[^/]*$/, '')) + '</div>';
  function printMath(i) {
    const L = C.levels[i], qs = KD.mathQs(L.gen, 20);
    const head = '<div class="ps-meta">なまえ（　　　　　　　　　　）　　ひづけ（　　　月　　　日）</div>';
    let q = '', a = '';
    qs.forEach((x, k) => {
      q += '<div class="ps-q"><span class="no">' + (k + 1) + '</span><span class="fm">' + x.a + ' ' + C.op + ' ' + x.b + ' ＝</span><span class="bl"></span></div>';
      a += '<div class="ps-q"><span class="no">' + (k + 1) + '</span><span class="fm">' + x.a + ' ' + C.op + ' ' + x.b + ' ＝ <b>' + C.fn(x.a, x.b) + '</b></span></div>';
    });
    printDoc('<section class="ps"><h1>' + C.title + 'ドリル　レベル' + (i + 1) + '　' + esc(L.name) + '</h1>' + head + '<div class="ps-grid">' + q + '</div>' + siteLine() + '</section>' +
      '<section class="ps pb"><h1>こたえ　レベル' + (i + 1) + '</h1><div class="ps-grid">' + a + '</div>' + siteLine() + '</section>');
  }
  function printChart() {
    let h = '';
    Object.keys(KD.CHARTS).forEach((k, n) => {
      const t = KD.CHARTS[k];
      h += '<section class="ps' + (n ? ' pb' : '') + '"><h1>' + scriptName() + 'ひょう　' + t.name + '</h1><div class="ps-chart cols' + t.cols + '">';
      t.rows.forEach((r) => r.forEach((c) => { h += '<span class="' + (c ? '' : 'blank') + '">' + conv(c) + '</span>'; }));
      h += '</div>' + siteLine() + '</section>';
    });
    printDoc(h);
  }

  /* ---------- 操作の受け口 ---------- */
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act, i = Number(b.dataset.i);
    if (act === 'play') (isMath ? mathStart(i) : wordStart(i));
    else if (act === 'menu') menu();
    else if (act === 'key') mathKey(b.dataset.k);
    else if (act === 'hint') mathHint();
    else if (act === 'print') printMath(i);
    else if (act === 'pick') wordPick(i);
    else if (act === 'chart') chartView('seion');
    else if (act === 'ctab') chartView(b.dataset.t);
    else if (act === 'cprint') printChart();
    else if (act === 'chshow') chShow(b);
    else if (act === 'pickmenu') pickMenu();
    else if (act === 'ptab') pickMenu(b.dataset.t);
    else if (act === 'ptoggle') pickToggle(b);
    else if (act === 'pclear') { sel.clear(); pickMenu(G.tab); }
    else if (act === 'pstart' || act === 'pickagain') pickStart();
    else if (act === 'ppick') pickPick(i);
  });
  document.getElementById('snd').addEventListener('click', () => {
    S.sound = !S.sound; save(); paintSnd();
  });
  document.addEventListener('keydown', (e) => {
    if (!isMath || !G.playing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) mathKey(e.key);
    else if (e.key === 'Backspace') mathKey('del');
    else if (e.key === 'Enter') mathKey('ok');
  });

  menu();
})();

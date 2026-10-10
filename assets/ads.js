/* =====================================================================
   広告・おすすめ教材の設定ファイル（広告まわりはこのファイルだけ編集すればOK）
   ===================================================================== */
window.SITE_ADS = {
  /* 本文中の広告枠。ASPのタグ(HTML)をそのまま貼れます。<script>つきでも動きます。
     mid    : 「おうちでの進め方」のあと
     bottom : ページの一番下 */
  mid: ``,
  bottom: ``,

  /* 枠が空のとき、点線の仮枠を出すか。公開前に false にすると、空の枠は丸ごと消えます。 */
  showPlaceholder: true,

  /* おすすめ教材カード（テキストリンク型。バナーより読まれやすいので、まずはこちらがおすすめ）
     url には、ASPで発行したアフィリエイトURLを入れてください。
     例：
     { title: 'こどもちゃれんじ', desc: '年齢に合わせた教材が毎月届きます。', url: 'https://…', tag: '幼児〜小学生' }, */
  recs: [
  ]
};

/* ---- 以下は表示処理（編集不要） ---- */
(function () {
  'use strict';
  var A = window.SITE_ADS || {};

  function setHTML(el, html) {
    el.innerHTML = '';
    var t = document.createElement('template');
    t.innerHTML = html;
    t.content.querySelectorAll('script').forEach(function (old) {
      var s = document.createElement('script');
      for (var i = 0; i < old.attributes.length; i++) s.setAttribute(old.attributes[i].name, old.attributes[i].value);
      s.text = old.textContent;
      old.replaceWith(s);
    });
    el.appendChild(t.content);
  }

  function init() {
    document.querySelectorAll('[data-ad]').forEach(function (el) {
      var html = (A[el.dataset.ad] || '').trim();
      var wrap = el.closest('.ad-wrap');
      if (html) { setHTML(el, html); return; }
      if (A.showPlaceholder) {
        el.innerHTML = '<div class="ad-ph">ここに広告が入ります<br><small>assets/ads.js の mid / bottom にタグを貼ってください</small></div>';
      } else if (wrap) {
        wrap.hidden = true;
      }
    });

    var box = document.getElementById('recs');
    var sec = document.getElementById('recs-sec');
    if (box && sec) {
      var list = A.recs || [];
      if (list.length) {
        box.innerHTML = '';
        list.forEach(function (r) {
          var a = document.createElement('a');
          a.className = 'rec';
          a.href = r.url;
          a.target = '_blank';
          a.rel = 'sponsored noopener noreferrer';
          var tag = document.createElement('span'); tag.className = 'rec-tag'; tag.textContent = r.tag || '';
          var ti = document.createElement('b'); ti.textContent = r.title || '';
          var de = document.createElement('span'); de.className = 'rec-desc'; de.textContent = r.desc || '';
          var go = document.createElement('span'); go.className = 'rec-go'; go.textContent = '公式サイトで見る';
          if (r.tag) a.appendChild(tag);
          a.appendChild(ti); a.appendChild(de); a.appendChild(go);
          box.appendChild(a);
        });
      } else if (A.showPlaceholder) {
        box.innerHTML = '<div class="ad-ph">ここに おすすめ教材のカードが入ります<br><small>assets/ads.js の recs に追加してください</small></div>';
      } else {
        sec.hidden = true;
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

async function callApi() {
    const url =
        'https://script.google.com/macros/s/AKfycbyrCy6zydNo59xmisnkwkDsx4TIC6AY_LNhrzCpA-SZspYWe_cLwIWHEN0VmFnP5yls-w/exec'; // リクエスト先URL

    const res = await fetch(url);
    const list = await res.json();
    var sakana = [];
    var dango = [];
    var uokasi = [];
    var okiami = [];
    var other = [];
    var neriesa = [];
    var alive = [];
    var ebi = [];
    var sabiki = [];
    var honda = [];
    var fukuyoshi = [];
    list.forEach(function (e) {
        const url = e.url != '' ? e.url : e.img_url;
        const menu = `<div class="col-lg-3  col-md-4 col-sm-6 col-xs-6">
    <article class="product-card" itemscope itemtype="https://schema.org/Product" role="group" aria-label="${
        e.name
    }">
        <a href="${url}" class="product-link">
            <img src="${e.img_url}?w=300"
                srcset="${e.img_url}?w=300 1x, ${e.img_url}?w=600 2x"
                alt="${e.name}" loading="lazy">
            <h3 itemprop="name" class="product-name">${e.name}</h3>
            <h4 class="product-price">
                <meta itemprop="priceCurrency" content="JPY">
                <span itemprop="price">${e.price}</span>
            </h4>
            <h4 class="product-stock">
                ${
                    e.stock === 'あり'
                        ? `在庫 ${e.stock}`
                        : '<span style="color:#c00;font-weight:600;">在庫切れ</span>'
                }
            </h4>
        </a>
    </article>
    <!-- 複数 article を繰り返し配置 -->
</div>`;
        if (!e.hasOwnProperty('category')) {
            other.push(menu);
        } else if (e.category == '魚') {
            sakana.push(menu);
        } else if (e.category == '魚かし') {
            uokasi.push(menu);
        } else if (e.category == 'ダンゴ') {
            dango.push(menu);
        } else if (e.category == 'オキアミ') {
            okiami.push(menu);
        } else if (e.category == '練餌海道') {
            neriesa.push(menu);
        } else if (e.category == '活エサ') {
            alive.push(menu);
        } else if (e.category == 'エビ') {
            ebi.push(menu);
        } else if (e.category == 'サビキ') {
            sabiki.push(menu);
        } else if (e.category == '本多商店') {
            honda.push(menu);
        } else if (e.category == '福吉') {
            fukuyoshi.push(menu);
        } else {
            other.push(menu);
        }
    });

    document.getElementById('魚').innerHTML = sakana.join('');
    document.getElementById('魚かし').innerHTML = uokasi.join('');
    document.getElementById('ダンゴ').innerHTML = dango.join('');
    document.getElementById('オキアミ').innerHTML = okiami.join('');
    document.getElementById('活エサ').innerHTML = alive.join('');
    document.getElementById('練餌海道').innerHTML = neriesa.join('');
    document.getElementById('その他').innerHTML = other.join('');
    document.getElementById('エビ').innerHTML = ebi.join('');
    document.getElementById('サビキ').innerHTML = sabiki.join('');
    document.getElementById('本多商店').innerHTML = honda.join('');
    document.getElementById('福吉').innerHTML = fukuyoshi.join('');
}

callApi();

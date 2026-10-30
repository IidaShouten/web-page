const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Minimal DOM boundary: tests drive the same event handlers as the catalog controls.
function node() {
    return {
        textContent: '', innerHTML: '', value: '', checked: false, hidden: false,
        children: [], attributes: {}, events: {}, dataset: {},
        setAttribute(key, value) { this.attributes[key] = value; },
        addEventListener(type, handler) { this.events[type] = handler; },
        appendChild(child) { this.children.push(child); },
        focus() {},
    };
}

function catalog(fetch, cached) {
    const ids = ['product-filters', 'product-search', 'product-category', 'product-in-stock',
        'menus-status', 'menus-retry', 'product-results', 'product-empty', 'product-count',
        'menus-updated-at', 'product-reset'];
    const nodes = Object.fromEntries(ids.map((id) => [id, node()]));
    const emptyText = node();
    const emptyButton = node();
    nodes['product-empty'].querySelector = (selector) => selector === 'p' ? emptyText : emptyButton;
    nodes['product-filters'].reset = () => {
        nodes['product-search'].value = '';
        nodes['product-category'].value = '';
        nodes['product-in-stock'].checked = false;
    };
    const navigation = [];
    const window = { location: { href: 'https://example.com/', pathname: '/' }, localStorage: {
        getItem: (key) => key.includes('menus-v2') && cached ? JSON.stringify(cached) : null,
        setItem() {},
    } };
    const context = vm.createContext({
        window, document: {
            getElementById: (id) => nodes[id], createElement: node,
            querySelectorAll: () => navigation,
        }, navigator: {}, URL, AbortController, setTimeout, clearTimeout, console, fetch,
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/src/site-config.js'), 'utf8'), context);
    for (const category of window.SiteConfig.categories) {
        const section = node();
        nodes[category.id] = node();
        nodes[category.id].closest = () => section;
        const link = node();
        link.dataset.category = category.id;
        navigation.push(link);
    }
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/src/menus.js'), 'utf8'), context);
    return { nodes, navigation, emptyText, emptyButton };
}

const products = [
    { name: 'オキアミ Ｌ', category: 'オキアミ', stock: 'あり', price: '税込500円', img_url: 'https://example.com/a.jpg', url: 'https://example.com/detail' },
    { name: 'オキアミ Ｓ', category: 'オキアミ', stock: 'なし', price: '税込300円' },
    { name: 'ダンゴ', category: 'ダンゴ', stock: 'あり', img_url: 'javascript:alert(1)', url: 'javascript:alert(2)' },
    { name: '新しい商品', category: '未登録カテゴリ', stock: '' },
];
const response = (data) => async () => ({ ok: true, json: async () => data });
const settled = () => new Promise(setImmediate);

test('catalog combines normalized keyword, category and stock filters; clearing restores all', async () => {
    const { nodes, emptyText } = catalog(response(products));
    await settled();
    assert.equal(nodes['product-count'].textContent, '4点中 4点を表示');
    nodes['product-search'].value = 'おきあみ l';
    nodes['product-search'].events.input({ isComposing: false });
    assert.equal(nodes['product-count'].textContent, '4点中 1点を表示');
    nodes['product-category'].value = 'ダンゴ';
    nodes['product-category'].events.change();
    assert.equal(nodes['product-count'].textContent, '4点中 0点を表示');
    assert.equal(nodes['product-empty'].hidden, false);
    assert.match(emptyText.textContent, /条件に合う商品/);
    nodes['product-reset'].events.click();
    nodes['product-in-stock'].checked = true;
    nodes['product-in-stock'].events.change();
    assert.equal(nodes['product-count'].textContent, '4点中 2点を表示');
    nodes['product-reset'].events.click();
    assert.equal(nodes['product-count'].textContent, '4点中 4点を表示');
});

test('category navigation resets previous filters and image/detail actions stay separate', async () => {
    const { nodes, navigation } = catalog(response(products));
    await settled();
    assert.match(nodes['オキアミ'].innerHTML, /写真を拡大/);
    assert.match(nodes['オキアミ'].innerHTML, /商品説明/);
    assert.doesNotMatch(nodes['ダンゴ'].innerHTML, /javascript:/);
    assert.match(nodes['その他'].innerHTML, /在庫未確認/);
    nodes['product-search'].value = '見つからない商品';
    navigation.find((link) => link.dataset.category === 'オキアミ').events.click();
    assert.equal(nodes['product-search'].value, '');
    assert.equal(nodes['product-count'].textContent, '4点中 2点を表示');
});

test('cached catalog remains searchable after network failure without inventing a new timestamp', async () => {
    const { nodes } = catalog(async () => { throw new Error('Offline'); }, {
        payload: products, savedAt: '2026-07-01T00:00:00Z',
    });
    assert.equal(nodes['product-count'].textContent, '4点中 4点を表示');
    await settled();
    assert.equal(nodes['menus-retry'].hidden, false);
    assert.match(nodes['menus-status'].textContent, /前回保存した内容/);
    assert.match(nodes['menus-updated-at'].textContent, /2026\/07\/01/);
    nodes['product-search'].value = 'だんご';
    nodes['product-search'].events.input({ isComposing: false });
    assert.equal(nodes['product-count'].textContent, '4点中 1点を表示');
});

test('invalid API data offers retry, and a successful empty response is distinct from failure', async () => {
    let attempt = 0;
    const { nodes, emptyText, emptyButton } = catalog(async () => ({
        ok: true, json: async () => ++attempt === 1 ? { error: 'unavailable' } : [],
    }));
    await settled();
    assert.equal(nodes['menus-retry'].hidden, false);
    assert.equal(nodes['product-results'].attributes['aria-busy'], 'false');
    await nodes['menus-retry'].events.click();
    assert.equal(nodes['menus-status'].hidden, true);
    assert.equal(nodes['product-count'].textContent, '0点中 0点を表示');
    assert.match(emptyText.textContent, /現在掲載商品はありません/);
    assert.equal(emptyButton.hidden, true);
});

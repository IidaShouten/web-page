const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const configSource = fs.readFileSync(path.join(root, 'docs/src/site-config.js'), 'utf8');
const menuSource = fs.readFileSync(path.join(root, 'docs/src/menus.js'), 'utf8');
const oldCacheKey = 'miura-bait-shop-menus-cache';
const cacheKey = 'miura-bait-shop-menus-v2-cache';
const product = {
    category: 'その他', name: 'エサ', price: '100円', stock: 'あり',
    url: 'https://example.test/product', img_url: 'https://example.test/photo.png',
};

async function loadMenus({ list = [product], offline = false, cache = {}, standalone = false } = {}) {
    const storage = new Map(Object.entries(cache));
    const elements = new Map();
    const makeElement = () => ({
        innerHTML: '', textContent: '', value: '', checked: false, hidden: false,
        className: '', children: [],
        setAttribute() {}, addEventListener() {}, focus() {}, reset() {},
        appendChild(child) { this.children.push(child); },
        closest() { return this; },
        querySelector() { return makeElement(); },
    });
    const element = (id) => {
        if (!elements.has(id)) elements.set(id, makeElement());
        return elements.get(id);
    };
    const context = {
        window: {
            location: { href: 'https://example.test/', pathname: '/' },
            localStorage: {
                getItem: (key) => storage.get(key) ?? null,
                setItem: (key, value) => storage.set(key, value),
            },
        },
        document: { getElementById: element, createElement: makeElement, querySelectorAll: () => [] },
        navigator: {},
        console: { error() {}, warn() {} },
        URL,
        AbortController, setTimeout, clearTimeout,
        fetch: async () => {
            if (offline) throw new Error('Offline');
            return { ok: true, json: async () => list };
        },
    };
    vm.createContext(context);
    if (!standalone) vm.runInContext(configSource, context);
    vm.runInContext(menuSource, context);
    await new Promise(setImmediate);
    return { storage, html: element('その他').innerHTML, status: element('menus-status') };
}

test('preserves normal product links and saves product data instead of HTML', async () => {
    const { html, storage } = await loadMenus();
    assert.match(html, /href="https:\/\/example\.test\/product"/);
    assert.match(html, /src="https:\/\/example\.test\/photo\.png"/);
    assert.deepEqual(JSON.parse(storage.get(cacheKey)).payload, [product]);
    assert.equal(storage.has(oldCacheKey), false);
});

test('rejects executable URL schemes from both product and image URLs', async () => {
    const unsafeUrls = [
        'javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'java\nscript:alert(1)',
        'java\tscript:alert(1)', 'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)', 'file:///tmp/example',
    ];
    for (const url of unsafeUrls) {
        const { html } = await loadMenus({ list: [{ ...product, url, img_url: url }] });
        assert.match(html, /class="product-card"/);
        assert.doesNotMatch(html, /\b(?:href|src|srcset)\s*="/, url);
    }
});

test('uses a validated image URL as the fallback link', async () => {
    const { html } = await loadMenus({ list: [{ ...product, url: 'javascript:alert(1)' }] });
    assert.match(html, /href="https:\/\/example\.test\/photo\.png"/);
    assert.doesNotMatch(html, /javascript:/);
    const relative = await loadMenus({ list: [{ ...product, url: '/product' }] });
    assert.match(relative.html, /href="https:\/\/example\.test\/product"/);
});

test('escapes product text and preserves commas in a single image URL', async () => {
    const { html } = await loadMenus({ list: [{
        ...product, name: '<img src=x onerror=alert(1)>', price: '<script>alert(1)</script>',
        img_url: 'https://example.test/a,b.png',
    }] });
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.match(html, /src="https:\/\/example\.test\/a,b\.png"/);
    assert.doesNotMatch(html, /<script>|<img src=x/);
});

test('validates URLs and escapes text again when displaying cached products offline', async () => {
    const item = { ...product, name: '<img src=x onerror=alert(1)>', url: 'javascript:alert(1)', img_url: '' };
    const { html, status } = await loadMenus({ offline: true, cache: {
        [cacheKey]: JSON.stringify({ savedAt: '2026-10-30T00:00:00Z', payload: [item] }),
    } });
    assert.equal(status.className, 'fallback-message');
    assert.match(html, /class="product-card"/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(html, /\b(?:href|src|srcset)\s*="/);
});

test('does not restore legacy HTML caches or malformed cached records', async () => {
    const markup = '<img src=x onerror=alert(1)>';
    const legacy = await loadMenus({ offline: true, cache: {
        [oldCacheKey]: JSON.stringify({ payload: { その他: [markup] } }),
    } });
    assert.equal(legacy.status.className, 'error-message');
    assert.doesNotMatch(legacy.html, /<img/);
    for (const payload of [{ その他: [markup] }, [markup], [null], [{ ...product, name: { toString: markup } }]]) {
        const { html, status } = await loadMenus({ offline: true, cache: {
            [cacheKey]: JSON.stringify({ payload }),
        } });
        assert.equal(status.className, 'error-message');
        assert.doesNotMatch(html, /<img/);
    }
});

test('treats prototype property names as unknown categories', async () => {
    for (const category of ['__proto__', 'constructor', 'toString']) {
        const { html } = await loadMenus({ list: [{ ...product, category }] });
        assert.match(html, /class="product-card"/);
        assert.doesNotMatch(html, /error-message/);
    }
});

test('fails safely with a recovery message when the shared runtime is unavailable', async () => {
    const { html, status } = await loadMenus({ standalone: true,
        list: [{ ...product, url: 'javascript:alert(1)', img_url: 'javascript:alert(1)' }],
    });
    assert.equal(html, '');
    assert.equal(status.className, 'error-message');
    assert.match(status.textContent, /再読み込み/);
    assert.doesNotMatch(html, /\b(?:href|src|srcset)\s*="/);
});

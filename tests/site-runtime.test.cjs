const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../docs/src/site-config.js'), 'utf8');

function createRuntime(options = {}) {
    const values = new Map();
    const element = { textContent: '' };
    const storage = options.storage || {
        getItem: (key) => values.get(key) || null,
        setItem: (key, value) => values.set(key, value),
    };
    const window = {
        location: { href: 'https://example.com/shop/', pathname: '/shop/' },
        localStorage: storage,
    };
    const context = vm.createContext({
        window, document: { getElementById: () => element }, navigator: {},
        URL, AbortController, setTimeout, clearTimeout, console,
        fetch: options.fetch || (() => Promise.resolve({ ok: true, json: async () => [] })),
    });
    vm.runInContext(source, context);
    return { runtime: window.SiteRuntime, config: window.SiteConfig, element, values };
}

test('search accepts full-width, half-width, hiragana and katakana', () => {
    const { runtime } = createRuntime();
    assert.equal(runtime.normalizeSearchText('  ｵｷｱﾐ　ＡＢＣ  '), 'おきあみ abc');
    assert.equal(runtime.normalizeSearchText('オキアミ'), runtime.normalizeSearchText('おきあみ'));
});

test('product links allow web URLs and reject executable URL schemes', () => {
    const { runtime } = createRuntime();
    assert.equal(runtime.safeUrl('javascript:alert(1)'), '');
    assert.equal(runtime.safeUrl('data:text/html,test'), '');
    assert.equal(runtime.safeUrl(''), '');
    assert.equal(runtime.safeUrl('/image.jpg?size=600'), 'https://example.com/image.jpg?size=600');
});

test('timestamp labels describe retrieval and format in Japan time', () => {
    const { runtime, element } = createRuntime();
    runtime.updateTimestamp('menus-updated-at', '2026-10-30T07:00:00Z');
    assert.equal(element.textContent, '情報取得日時: 2026/10/30 16:00');
    runtime.updateTimestamp('menus-updated-at', null);
    assert.equal(element.textContent, '');
});

test('disabled storage does not stop content rendering or error recovery', () => {
    const storage = {
        getItem() { throw new Error('Storage disabled'); },
        setItem() { throw new Error('Quota exceeded'); },
    };
    const { runtime } = createRuntime({ storage });
    assert.equal(runtime.getCache('products'), null);
    assert.doesNotThrow(() => runtime.setCache('products', [{ name: 'エサ' }]));
    assert.doesNotThrow(() => runtime.recordClientEvent('menus_fetch_failed', {}));
});

test('cache persists raw data including empty results', () => {
    const { runtime, values } = createRuntime();
    runtime.setCache('products', []);
    assert.deepEqual(JSON.parse(values.get('products')).payload, []);
    values.set('products', '{broken');
    assert.equal(runtime.getCache('products'), null);
});

test('HTTP and invalid JSON errors remain recoverable by the caller', async () => {
    const badHttp = createRuntime({ fetch: async () => ({ ok: false, status: 503 }) });
    await assert.rejects(badHttp.runtime.fetchJson('/products'), /503/);
    const badJson = createRuntime({ fetch: async () => ({ ok: true, json: async () => { throw new Error('Invalid JSON'); } }) });
    await assert.rejects(badJson.runtime.fetchJson('/products'), /Invalid JSON/);
});

test('a stalled response is aborted so the UI can offer retry', async () => {
    let aborted = false;
    const { runtime } = createRuntime({ fetch: (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => { aborted = true; reject(new Error('Aborted')); });
    }) });
    await assert.rejects(runtime.fetchJson('/products', 5), /Aborted/);
    assert.equal(aborted, true);
});

function newsHarness(fetch) {
    const nodes = Object.fromEntries(['news', 'news-status', 'news-retry', 'news-updated-at'].map((id) => [id, {
        textContent: '', innerHTML: '', hidden: false, attributes: {},
        setAttribute(key, value) { this.attributes[key] = value; },
        addEventListener(type, handler) { this[type] = handler; },
    }]));
    const window = { location: { href: 'https://example.com', pathname: '/' }, localStorage: null };
    const context = vm.createContext({ window, document: { getElementById: (id) => nodes[id] }, navigator: {}, URL, AbortController, setTimeout, clearTimeout, console, fetch });
    vm.runInContext(source, context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/src/news.js'), 'utf8'), context);
    return nodes;
}

test('news preserves old notices in a dated archive and escapes content', async () => {
    const now = new Date();
    const nodes = newsHarness(async () => ({ ok: true, json: async () => [
        { year: 2020, month: 1, day: 1, message: '過去の案内' },
        { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), message: '<img onerror=alert(1)>' },
    ] }));
    await new Promise(setImmediate);
    assert.match(nodes.news.innerHTML, /<details class="news-archive">/);
    assert.match(nodes.news.innerHTML, /過去の案内/);
    assert.match(nodes.news.innerHTML, /&lt;img onerror=alert\(1\)&gt;/);
    assert.equal(nodes['news-status'].hidden, true);
    assert.equal(nodes.news.attributes['aria-busy'], 'false');
});

test('news retry recovers after failure and handles an empty response', async () => {
    let attempt = 0;
    const nodes = newsHarness(async () => {
        if (++attempt === 1) throw new Error('Offline');
        return { ok: true, json: async () => [] };
    });
    await new Promise(setImmediate);
    assert.equal(nodes['news-retry'].hidden, false);
    await nodes['news-retry'].click();
    assert.equal(nodes['news-retry'].hidden, true);
    assert.match(nodes.news.innerHTML, /現在お知らせはありません/);
    assert.equal(nodes['news-status'].hidden, true);
});

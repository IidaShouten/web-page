const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../docs');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
const graph = JSON.parse(html.match(/<script id="structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];

test('crawlable store, website and page data share one canonical identity and existing assets', () => {
    assert.equal(new URL(canonical).protocol, 'https:');
    assert.equal(new URL(canonical).pathname, '/');
    const ids = new Set(graph.map(entity => entity['@id']));
    assert.equal(ids.size, graph.length);
    for (const entity of graph) {
        assert.equal(entity.url, canonical);
        for (const key of ['publisher', 'about', 'isPartOf']) {
            if (entity[key]) assert.ok(ids.has(entity[key]['@id']));
        }
        for (const key of ['image', 'logo']) {
            if (entity[key]) {
                const asset = new URL(entity[key]);
                assert.equal(asset.origin, new URL(canonical).origin);
                assert.ok(existsSync(path.join(root, asset.pathname)));
            }
        }
    }
    const store = graph.find(entity => entity['@type'] === 'Store');
    assert.ok(store.address.streetAddress);
    assert.ok(store.openingHoursSpecification.every(hours => hours.opens < hours.closes));
    assert.equal(store.sameAs, undefined, 'the related fishing park is not this store');
    assert.equal(graph.find(entity => entity['@type'] === 'WebPage').name,
        html.match(/<title>(.*?)<\/title>/)[1]);
});

test('sitemap, robots and home links consolidate duplicates without blocking crawling', () => {
    const sitemap = readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), [canonical]);
    assert.match(readFileSync(path.join(root, 'robots.txt'), 'utf8'),
        new RegExp(`Sitemap: ${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}sitemap\\.xml`));
    assert.doesNotMatch(html, /href="(?:\.\/)?index\.html"/);
    assert.match(html, /name="robots" content="index, follow"/);
    const notFound = readFileSync(path.join(root, '404.html'), 'utf8');
    assert.match(notFound, /name="robots" content="noindex, follow"/);
    assert.match(notFound, /href="\/">トップページへ戻る/);
});

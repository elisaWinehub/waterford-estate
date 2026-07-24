/**
 * Seed PDP Details metafields from client screenshots (Jul 2026).
 * Store: waterford-estate-2.myshopify.com only.
 *
 * Usage: node scripts/seed-details-from-screenshots.mjs
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const STORE = 'waterford-estate-2.myshopify.com';

function shopifyBin() {
  const winCmd = join(homedir(), 'AppData', 'Roaming', 'npm', 'shopify.cmd');
  if (process.platform === 'win32' && existsSync(winCmd)) return winCmd;
  return 'shopify';
}

function run(query, variables = {}, mutate = false, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    const stamp = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const qFile = join(tmpdir(), `wf-det-q-${stamp}.graphql`);
    const vFile = join(tmpdir(), `wf-det-v-${stamp}.json`);
    const oFile = join(tmpdir(), `wf-det-o-${stamp}.json`);
    writeFileSync(qFile, query);
    writeFileSync(vFile, JSON.stringify(variables));
    const args = [
      'store', 'execute', '--store', STORE,
      '--query-file', qFile, '--variable-file', vFile,
      '--json', '--output-file', oFile,
    ];
    if (mutate) args.push('--allow-mutations');
    try {
      execFileSync(shopifyBin(), args, {
        encoding: 'utf8',
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 20e6,
      });
      const out = JSON.parse(readFileSync(oFile, 'utf8'));
      for (const f of [qFile, vFile, oFile]) try { unlinkSync(f); } catch {}
      return out;
    } catch (err) {
      lastErr = err;
      for (const f of [qFile, vFile, oFile]) try { unlinkSync(f); } catch {}
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1200 * (i + 1));
    }
  }
  throw lastErr;
}

function unwrap(payload, key) {
  return payload?.[key] ?? payload?.data?.[key] ?? payload;
}

const SHIPPING_DEFAULT =
  'Delivery is R170 per order for purchases under R1,200, with free shipping on orders over R1,200. Local deliveries are completed within 5 to 7 working days, and international shipping rates may apply. Contact shop@waterfordestate.co.za for speedy delivery.';

/** @type {Array<{handle:string, tagline?:string, details:Record<string,string>}>} */
const PRODUCTS = [
  {
    handle: 'cabernet-sauvignon',
    tagline:
      'Our Estate Cabernet Sauvignon, named among the Top 25 in the USA, shines with excellence, earning Best Cabernet Sauvignon at the African Excellence Awards 2024.',
    details: {
      fact_sheets: [
        '2019 Cabernet Sauvignon',
        '2018 Cabernet Sauvignon',
        '2017 Cabernet Sauvignon',
        '2016 Cabernet Sauvignon',
        '2015 Cabernet Sauvignon',
        '2014 Cabernet Sauvignon',
        '2013 Cabernet Sauvignon',
        '2012 Cabernet Sauvignon',
        '2011 Cabernet Sauvignon',
        '2010 Cabernet Sauvignon',
        '2009 Cabernet Sauvignon',
        '2008 Cabernet Sauvignon',
        '2007 Cabernet Sauvignon',
        '2006 Cabernet Sauvignon',
        '2005 Cabernet Sauvignon',
      ].join('\n'),
      tasting_notes:
        'This wine boasts dark fruit aromatics dominated by black currant, along with distinctive herbaceous notes of fynbos that reflect its Helderberg origin. The intricate minerality on display highlights the influence of the granite-based soils. On the palate, vibrant acidity complements well-integrated, classical tannins, imparting body and balance to the wine. It exhibits impressive richness and concentration, concluding with a robust finish underscored by firm tannins and lively fruit, promising graceful ageing for many years to come.',
      cultivars: '100% Cabernet Sauvignon',
      wine_analysis: ['Alc 13.5%', 'TA 5.0 g/L', 'RS 1.34 g/L', 'pH 3.67'].join('\n'),
      vinification:
        'The grapes are hand-harvested, destemmed but not crushed. After sorting, the whole berries ferment in vessels for about 16 days. Following fermentation, the wine is pressed and moved to select French oak barrels for malolactic fermentation and ageing. This blend is created during the first racking (at 6 months), with two more rackings during ageing to assess oak influence before bottling.',
      vineyard:
        'The Cabernet Sauvignon vineyards flourish in the loamy gravel soils of Waterford Estate. They are situated on the warmer, north-facing slopes at an altitude of approximately 300 m above sea level. This elevation takes full advantage of the ocean breeze, which significantly cools the vineyard canopy during the afternoon. Waterford Estate boasts 8 diverse clones of Cabernet Sauvignon, each cultivated across various sections of the estate. The predominant soil type comprises grey loamy soils with a substantial content of gravel and stone. The majority of these vineyards were planted between 1999 and 2002.',
      maturation: 'Aged in 300L French oak barrels for 21 months, 33% new oak.',
      ageing_potential: '5 - 20 years from production',
      shipping: SHIPPING_DEFAULT,
      vintage: '2019',
      alcohol: '13.5%',
      blend_summary: '100% Cabernet Sauvignon',
      new_oak: '33%',
    },
  },
  {
    handle: 'waterford-estate-grenache-noir-single-vineyard',
    tagline:
      'The Estate Grenache is a uniquely crafted summer red, aged in porcelain and French oak, with vibrant fruit, velvety tannins, and refreshing elegance.',
    details: {
      fact_sheets: [
        '2023 Grenache',
        '2022 Grenache',
        '2021 Grenache',
        '2020 Grenache',
        '2019 Grenache',
        '2018 Grenache',
        '2017 Grenache',
        '2016 Grenache',
        '2015 Grenache',
      ].join('\n'),
      tasting_notes:
        'The light ruby red colour already denotes a lighter style of wine. On the nose, spiced cinnamon, leather, and savory cherries all build on a base of red fruit. The palate is concentrated, following the nose with red fruit and rich texture, all underpinned with an integrated acidity serving to add to the wine’s balance and poise. The structure is bolder than previous vintages but elegant and soft with a lengthy mineral finish adding to the wine’s complexity.',
      cultivars: '100% Grenache',
      wine_analysis: ['Alc 14.01%', 'TA 4.47 g/L', 'RS 1.48 g/L', 'pH 3.74'].join('\n'),
      vinification:
        'The grapes are hand-harvested, destemmed but not crushed, and approximately 4% of the bunches are left whole. These whole berries and bunches are then placed in fermentation vessels and allowed to ferment for approximately 18 days. After fermentation, the grapes are pressed, and the wine is transferred to old 500L French oak barrels and porcelain jars for malolactic fermentation and ageing.',
      vineyard:
        'The single vineyard is planted on the rockiest sandstone slopes at Waterford estate. This location is the most arid and warm site on the farm, making it ideal for Grenache.',
      maturation:
        'Aged in 30% porcelain jars, 25% Foudre, and 45% old (10 years plus) 500L French oak barrels for 14 months.',
      ageing_potential: '3 - 8 years from production',
      shipping:
        'Delivery is R170 per order for purchases under R1,200, with free shipping on orders over R1,200. Local deliveries are completed within 5 to 7 working days, and international shipping rates may apply. Contact chris@waterfordestate.co.za for speedy delivery.',
      vintage: '2022',
      alcohol: '14.01%',
      blend_summary: '100% Grenache',
      new_oak: 'None (old oak / porcelain)',
    },
  },
  {
    handle: 'pecan-stream-pebble-hill',
    tagline:
      'Pecan Stream Pebble Hill Red Blend combines Italian and Spanish varietals, offering aromas of violets, cherries, and liquorice with a rich, smooth finish.',
    details: {
      fact_sheets: Array.from({ length: 16 }, (_, i) => `${2022 - i}_PH Pecan Stream`).join('\n'),
      tasting_notes:
        'True to the Pebble Hill signature, this vintage opens with a vibrant nose of sweet spice, red fruit, and a touch of vanilla. The palate is juicy and fruit-forward, smooth and inviting, making it an ideal fireside companion and a natural partner for red meats. Mediterranean varieties in the blend bring lifted acidity and brightness, enhancing the wine’s energy and freshness. Beneath the plush fruit lies a coating structure that adds texture and elegance. The finish is lingering, with notes of blackcurrant and vanilla.',
      cultivars: [
        '21% Shiraz',
        '18% Mourvedre',
        '12% Cabernet Franc',
        '12% Grenache',
        '9% Cabernet Sauvignon',
        '9% Sangiovese',
        '6% Petit Verdot',
        '5% Malbec',
        '3% Barbera',
        '3% Tempranillo',
        '2% Merlot',
      ].join('\n'),
      wine_analysis: ['Alc 13%', 'TA 5.35 g/L', 'RS 1.5 g/L', 'pH 3.6'].join('\n'),
      vinification:
        'The grapes are hand-harvested, destemmed but not crushed. After sorting, the whole berries ferment in vessels for about 18 days. Following fermentation, the wine is pressed and moved to selected French oak barrels for malolactic fermentation and ageing. The blend is created during the first racking (at 6 months), with two more rackings during ageing to assess oak influence before bottling.',
      vineyard: 'Western Cape, South Africa',
      maturation: 'Aged for 20 months in old French oak barrels (225L and 300L)',
      ageing_potential: '8 - 15 years from production',
      shipping:
        'Delivery is R120 per order for purchases under R1,200, with free shipping on orders over R1,200. Local deliveries are completed within 5 to 7 working days, and international shipping rates may apply. Contact chris@waterfordestate.co.za for speedy delivery.',
      vintage: '2022',
      alcohol: '13%',
      blend_summary: 'Shiraz-led Mediterranean blend',
      new_oak: 'Old French oak',
    },
  },
  {
    handle: 'kevin-arnold-shiraz',
    tagline:
      "Our Shiraz, named in honour of the legendary Kevin Arnold, the Estate's first winemaker, celebrates his deep passion for this exceptional cultivar.",
    details: {
      fact_sheets: Array.from({ length: 20 }, (_, i) => `${2021 - i} KA Shiraz`).join('\n'),
      tasting_notes:
        'The 2021 Kevin Arnold Shiraz adds to the acclaim of Helderberg-grown Shiraz. The nose is a captivating mix of savoury intensity and lifted aromatics, with smoky charcoal mingling with perfumed violet florals and vibrant fruit. The style borrows from classical Syrah, with fragrant elegance underscoring its bold character. On the palate the wine is smooth and richly layered, with velvety tannins that coat the mouth and balance a bright acidity. Fresh red and black fruit notes are complemented by a mineral edge and a subtle savoury character that carries through to a persistent, linear finish. Polished and structured, this vintage shows great promise to evolve beautifully over time, revealing further complexity and finesse.',
      cultivars: ['91% Shiraz', '9% Mourvèdre'].join('\n'),
      wine_analysis: ['Alc 14%', 'TA 5 g/L', 'RS 1.5 g/L', 'pH 3.60'].join('\n'),
      vinification:
        'The grapes are hand harvested, destemmed but not crushed. The whole berries are placed into fermentation vessels to ferment for approximately 14 days. After fermentation, the grapes are pressed, and the wine is transferred to old French oak barrels for malolactic fermentation and ageing. The blend is made during the first racking at 6 months, with two additional rackings taking place during ageing before bottling.',
      vineyard:
        'This wine is a true representation of the Helderberg in Stellenbosch, with mostly estate-sourced fruit since 2017.',
      maturation:
        'Aged in older French oak barrels, including 300L, 500L, and 2,400L Foudre for a total of 23 months.',
      ageing_potential: '5 - 20 years from production',
      shipping:
        'Delivery is R170 per order for purchases under R1,250, with free shipping on orders over R1,250. Local deliveries are completed within 5 to 7 working days, and international shipping rates may apply. Contact chris@waterfordestate.co.za for speedy delivery.',
      vintage: '2021',
      alcohol: '14%',
      blend_summary: '91% Shiraz / 9% Mourvèdre',
      new_oak: 'Older French oak',
    },
  },
  {
    handle: 'antigo',
    tagline:
      "Waterford Antigo, a Cabernet Sauvignon-dominant blend, proudly earned 4.5 stars in Platter's Wine Guide 2025 and is named for the vineyard's unique reddish brown soils.",
    details: {
      fact_sheets: ['2021 Antigo', '2020 Antigo', '2019 Antigo'].join('\n'),
      tasting_notes:
        'The Waterford Antigo is a tribute to the red clay-based soils on the estate. It boasts plush red currants, subtle tobacco, and creamy oak sweetness on the nose. The palate mirrors the generous nose, with acidity balancing the exceptional structure; a characteristic of all Helderberg-grown Cabernet Sauvignon. Gentle tannins provide a base for the decadent red fruit, leading to a lingering textured finish.',
      cultivars: ['88% Cabernet Sauvignon', '8% Petit Verdot', '4% Merlot'].join('\n'),
      wine_analysis: ['Alc 13.3%', 'TA 5.62 g/L', 'RS 2.05 g/L', 'pH 3.59'].join('\n'),
      vinification:
        'The grapes are hand-harvested, destemmed but not crushed. After sorting, the whole berries ferment in vessels for about 18 days. Following fermentation, the wine is pressed and moved to selected French oak barrels for malolactic fermentation and aging. The blend is created during the first racking (at 6 months), with two more rackings during ageing to assess oak influence before bottling.',
      vineyard:
        'The Cabernet Sauvignon is grown on the red clay soils on the eastern side of Waterford Estate. This site allows for comfortable growing conditions leading to fruit which is plush and fruit forward with soft gentle tannins.',
      maturation: '20 months, 100% French oak, of which 25% new',
      ageing_potential: '5 - 15 years from production',
      shipping:
        'Delivery is R170 per order for purchases under R1,200, with free shipping on orders over R1,200. Local deliveries are completed within 5 to 7 working days, and international shipping rates may apply. Contact chris@waterfordestate.co.za for speedy delivery.',
      vintage: '2021',
      alcohol: '13.3%',
      blend_summary: 'Cabernet-dominant blend',
      new_oak: '25%',
    },
  },
  {
    handle: 'waterford-estate-the-jem',
    tagline:
      "The Jem, Waterford's flagship wine, stands proudly among South Africa's finest and the world's top 1%.",
    details: {
      fact_sheets: [
        '2017_the_jem',
        '2016_the_jem',
        '2015_the_jem',
        '2014_the_jem',
        '2012_the_jem',
        '2011_the_jem',
        '2010_the_jem',
        '2009_the_jem',
        '2007_the_jem',
        '2006_the_jem',
        '2005_the_jem',
        '2004_the_jem',
      ].join('\n'),
      tasting_notes:
        "The nose is bold and expressive, with concentrated dark fruit, vanilla oak, and clove spice, supported by layers of herbaceous fynbos and a subtle savoury nuance that adds depth and complexity. The palate is luxurious and finely textured, unfolding with evolving fruit character that highlights the Cabernet Sauvignon core. Concentrated fruit from the vineyard shines through, bringing richness without overwhelming the wine's innate balance. The blend is seamless and harmonious, reflecting a quiet confidence and understated power that promises longevity in the bottle. The finish is both mineral and fruit-forward, with a velvety texture that draws you effortlessly to the next sip.",
      cultivars: [
        '44% Cabernet Sauvignon',
        '22% Shiraz',
        '8% Petit Verdot',
        '8% Cabernet Franc',
        '6% Merlot',
        '5% Sangiovese',
        '4% Mourvèdre',
        '3% Barbera',
      ].join('\n'),
      wine_analysis: ['Alc 13.5%', 'TA 5.16 g/L', 'RS 1.5 g/L', 'pH 3.6'].join('\n'),
      vinification:
        'All the components are vinified as individual batches. About 6 months after fermentation, the blend is made up and aged as a blend for 20 months in total with two rackings in between. The early blending gives the blend the most time to integrate and produce a coherent wine. This careful approach ensures a perfectly balanced and harmonious final product.',
      vineyard:
        'The rich diversity of soils across the expansive 120-hectare farm has provided Waterford Estate with an exceptional opportunity to cultivate 11 distinct red varietals that are well-suited to our diverse terroir. Embracing the influence of Italian, French, and Spanish varietals, we have carefully planted these cultivars to showcase the unique character of these influential varietals.',
      maturation: 'Aged in 225L and 300L French oak barrels, 19% new oak.',
      ageing_potential: '5 - 25 years from production',
      shipping: SHIPPING_DEFAULT,
      vintage: '2017',
      alcohol: '13.5%',
      blend_summary: 'Cabernet-led flagship blend',
      new_oak: '19%',
    },
  },
  {
    handle: 'waterford-rose-mary',
    tagline:
      'The blush colour of the Rose-Mary reflects the Blanc de Noir winemaking style, showcasing a unique blend of lesser-known red grape cultivars that stands in a class by itself.',
    details: {
      fact_sheets: Array.from({ length: 17 }, (_, i) => `${2025 - i} Rosemary`).join('\n'),
      tasting_notes:
        'The iconic blush hue of Rose-Mary is a testament to the Blanc de Noir style. Crafted from Mediterranean varietals, the wine shows aromas of delicate white peach and rose water, which seamlessly follow through to the palate. On the palate, layers of white peach, fresh strawberry and apricot unfold, supported by a refreshing mineral backbone that enhances both texture and balance. Impeccably poised, this wine finishes long and complex, with a purity and elegant finesse that define its character.',
      cultivars: [
        '25% Shiraz',
        '23% Tempranillo',
        '18% Malbec',
        '12% Grenache',
        '9% Merlot',
        '7% Cinsaut',
        '4% Mourvèdre',
        '1% Sangiovese',
        '1% Barbera',
      ].join('\n'),
      wine_analysis: ['Alc 12.5%', 'TA 6.18 g/L', 'RS 1.25 g/L', 'pH 3.41'].join('\n'),
      vinification:
        "Made in the traditional Provence style of winemaking, 'Blanc de Noir'. This is a winemaking style where red wine grapes are used in the production of the wine, with skin contact intentionally limited to only a three-hour period. Thereafter, the winemaking follows a more traditional white wine process. The skin contact occurs solely in the press, where the grapes are left on the skins in a process called whole bunch pressing. Whole bunch pressing is a gentle method utilised to create a soft and delicate feel in the wine, and it also minimises skin contact, which gives the Blanc de Noir its very attractive colour. Whole bunch pressing can impart a subtle herbal and spicy character to the wine, complementing the vibrant fruit notes from the Mediterranean varietals. This nuanced interplay of flavours and aromas creates a wine that is not only refreshing but also complex and engaging.",
      vineyard:
        'Mostly sourced from vineyards at Waterford Estate, with some grapes coming from vineyards in the Stellenbosch region.',
      maturation: 'Aged on fine lees for 4 months',
      ageing_potential: '0 - 3 years from production',
      shipping:
        'Delivery is R170 per order for purchases under R1,200, with free shipping on orders over R1,200. Local deliveries are completed within 3 to 7 working days, and international shipping rates may apply. Contact cellar@waterfordestate.co.za for speedy delivery.',
      vintage: '2025',
      alcohol: '12.5%',
      blend_summary: 'Mediterranean Blanc de Noir blend',
      new_oak: 'None',
    },
  },
];

const SINGLE_LINE = new Set(['ageing_potential', 'vintage', 'alcohol', 'blend_summary', 'new_oak', 'tagline']);

function setMetafields(ownerId, entries) {
  const metafields = entries.map(([key, value]) => ({
    ownerId,
    namespace: 'custom',
    key,
    type: SINGLE_LINE.has(key) || key === 'tagline' ? (key === 'tagline' ? 'multi_line_text_field' : 'single_line_text_field') : 'multi_line_text_field',
    value: String(value),
  }));
  // tagline is multi_line in setup script
  for (const m of metafields) {
    if (m.key === 'tagline') m.type = 'multi_line_text_field';
  }

  for (let i = 0; i < metafields.length; i += 20) {
    const chunk = metafields.slice(i, i + 20);
    const res = unwrap(
      run(
        `mutation ($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { key }
            userErrors { field message code }
          }
        }`,
        { metafields: chunk },
        true
      ),
      'metafieldsSet'
    );
    if (res?.userErrors?.length) {
      throw new Error(JSON.stringify(res.userErrors, null, 2));
    }
  }
}

for (const product of PRODUCTS) {
  const shop = unwrap(
    run(`query { productByHandle(handle: "${product.handle}") { id title handle } }`),
    'productByHandle'
  );
  if (!shop?.id) {
    console.warn('missing product', product.handle);
    continue;
  }
  console.log(`\n${shop.title}`);
  const entries = Object.entries(product.details);
  if (product.tagline) entries.push(['tagline', product.tagline]);
  try {
    setMetafields(shop.id, entries);
    console.log(`  set ${entries.length} metafields`);
  } catch (err) {
    console.error('  FAIL', err.message || err);
  }
}

console.log('\ndone');

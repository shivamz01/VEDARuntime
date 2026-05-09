import { PRODUCT_VERSION, HANDOFF_SCHEMA_VERSION } from '../packages/shared/dist/index.js';
import { getEditionFeatures } from '../packages/pro/dist/index.js';

console.log(JSON.stringify({
  product: 'VEDA Runtime Version 1',
  productVersion: PRODUCT_VERSION,
  handoffSchemaVersion: HANDOFF_SCHEMA_VERSION,
  freeFeatures: getEditionFeatures('free').features,
  paidFeatures: getEditionFeatures('paid').features,
  sourceRepoMutated: false
}, null, 2));

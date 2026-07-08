const { parseCurl } = require('./frontend/utils/curlParser');
try {
  console.log(parseCurl(`curl -X POST '{{mbtBaseUrl}}/post' -H 'Content-Type: application/json' -d '{"mbt": true}'`));
} catch(e) {
  console.log("ERROR:", e.message);
}

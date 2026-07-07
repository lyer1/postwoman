import { RequestState, KeyVal } from '../store/useStore';

export function parseCurl(curlString: string): Partial<RequestState> {
  const result: Partial<RequestState> = {
    method: 'GET',
    url: '',
    headers: [],
    params: [],
    bodyType: 'none',
    bodyRaw: '',
    bodyForm: []
  };

  if (!curlString || !curlString.trim().startsWith('curl')) {
    throw new Error('Invalid cURL string');
  }

  let argsStr = curlString.trim().replace(/^curl\s+/, '').replace(/\\\n/g, ' ');
  const argRegex = /(-[a-zA-Z-]*|"[^"]*"|'[^']*'|\S+)/g;
  const args = argsStr.match(argRegex) || [];

  for (let i = 0; i < args.length; i++) {
    let arg = args[i].trim();
    if (arg === '-X' || arg === '--request') {
      if (args[i + 1]) {
        result.method = args[i + 1].replace(/['"]/g, '').toUpperCase();
        i++;
      }
      continue;
    }
    if (arg === '-H' || arg === '--header') {
      if (args[i + 1]) {
        const headerStr = args[i + 1].replace(/^['"]|['"]$/g, '');
        const sepIndex = headerStr.indexOf(':');
        if (sepIndex > -1) {
          result.headers!.push({
            id: Date.now().toString() + i,
            key: headerStr.substring(0, sepIndex).trim(),
            value: headerStr.substring(sepIndex + 1).trim(),
            enabled: true
          });
        }
        i++;
      }
      continue;
    }
    if (arg === '-d' || arg === '--data' || arg === '--data-raw' || arg === '--data-binary') {
      if (args[i + 1]) {
        let bodyData = args[i + 1].replace(/^['"]|['"]$/g, '');
        bodyData = bodyData.replace(/\\"/g, '"');
        result.bodyType = 'raw';
        result.bodyRaw = bodyData;
        if (result.method === 'GET') result.method = 'POST';
        i++;
      }
      continue;
    }
    if (arg.startsWith('http') || arg.startsWith('"http') || arg.startsWith("'http")) {
      result.url = arg.replace(/^['"]|['"]$/g, '');
      continue;
    }
  }

  if (result.url) {
    try {
      const urlObj = new URL(result.url);
      urlObj.searchParams.forEach((val, key) => {
        result.params!.push({
          id: Date.now().toString() + key,
          key,
          value: val,
          enabled: true
        });
      });
      result.url = urlObj.origin + urlObj.pathname;
    } catch (e) {}
  }

  return result;
}

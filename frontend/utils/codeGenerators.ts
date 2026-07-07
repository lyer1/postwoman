import { RequestState } from '../store/useStore';

function getAuthHeader(req: RequestState): { key: string, value: string } | null {
  if (req.authType === 'basic') {
    const user = req.authData?.username || '';
    const pass = req.authData?.password || '';
    const btoaFn = typeof btoa !== 'undefined' ? btoa : (str: string) => Buffer.from(str).toString('base64');
    return { key: 'Authorization', value: 'Basic ' + btoaFn(`${user}:${pass}`) };
  } else if (req.authType === 'bearer') {
    return { key: 'Authorization', value: 'Bearer ' + (req.authData?.token || '') };
  }
  return null;
}

export function generateCurl(req: RequestState): string {
  let cmd = `curl -X ${req.method} '${req.url}'`;
  
  req.headers.forEach(h => {
    if (h.enabled && h.key) {
      cmd += ` \\\n  -H '${h.key}: ${h.value}'`;
    }
  });

  const auth = getAuthHeader(req);
  if (auth) {
    cmd += ` \\\n  -H '${auth.key}: ${auth.value}'`;
  }

  if (req.bodyType === 'raw' && req.bodyRaw) {
    const escapedBody = req.bodyRaw.replace(/'/g, "'\\''");
    cmd += ` \\\n  -d '${escapedBody}'`;
  } else if (req.bodyType === 'formdata') {
    req.bodyForm.forEach(f => {
      if (f.enabled && f.key) {
        cmd += ` \\\n  -F '${f.key}=${f.value}'`;
      }
    });
  } else if (req.bodyType === 'urlencoded') {
    req.bodyForm.forEach(f => {
      if (f.enabled && f.key) {
        cmd += ` \\\n  --data-urlencode '${f.key}=${f.value}'`;
      }
    });
  }

  return cmd;
}

export function generateFetch(req: RequestState): string {
  const headers: Record<string, string> = {};
  req.headers.forEach(h => {
    if (h.enabled && h.key) headers[h.key] = h.value;
  });
  
  const auth = getAuthHeader(req);
  if (auth) {
    headers[auth.key] = auth.value;
  }

  const options: any = {
    method: req.method,
    headers: headers
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.bodyType === 'raw') {
      options.body = req.bodyRaw;
    } else if (req.bodyType === 'formdata') {
      options.body = "new FormData() /* Add form data manually */";
    }
  }

  return `fetch('${req.url}', ${JSON.stringify(options, null, 2).replace(/"new FormData\(\) \/\* Add form data manually \*\/"/, 'new FormData()')})`;
}

export function generatePython(req: RequestState): string {
  let code = `import requests\n\nurl = "${req.url}"\n`;
  
  const headers: Record<string, string> = {};
  req.headers.forEach(h => {
    if (h.enabled && h.key) headers[h.key] = h.value;
  });
  const auth = getAuthHeader(req);
  if (auth) {
    headers[auth.key] = auth.value;
  }
  code += `headers = ${JSON.stringify(headers, null, 2)}\n\n`;

  if (req.bodyType === 'raw' && req.bodyRaw) {
    code += `data = ${JSON.stringify(req.bodyRaw)}\n`;
    code += `response = requests.${req.method.toLowerCase()}(url, headers=headers, data=data)\n`;
  } else if (req.bodyType === 'formdata' || req.bodyType === 'urlencoded') {
    const data: Record<string, string> = {};
    req.bodyForm.forEach(f => {
      if (f.enabled && f.key) data[f.key] = f.value;
    });
    code += `data = ${JSON.stringify(data, null, 2)}\n`;
    code += `response = requests.${req.method.toLowerCase()}(url, headers=headers, data=data)\n`;
  } else {
    code += `response = requests.${req.method.toLowerCase()}(url, headers=headers)\n`;
  }
  
  code += `print(response.text)\n`;
  return code;
}

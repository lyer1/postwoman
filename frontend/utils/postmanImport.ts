export async function importPostmanCollection(jsonString: string, refreshCollections: () => void) {
  let collectionData;
  try {
    collectionData = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Invalid JSON file');
  }

  if (!collectionData.info || !collectionData.item) {
    throw new Error('Invalid Postman Collection format');
  }

  // Create root collection
  const rootName = collectionData.info.name || 'Imported Collection';
  const rootRes = await fetch('http://127.0.0.1:8000/api/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: rootName, user_id: 1 })
  });

  if (!rootRes.ok) throw new Error('Failed to create root collection');
  const rootCol = await rootRes.json();

  // Recursively process items
  const processItems = async (items: any[], parentId: number) => {
    if (!Array.isArray(items)) return;
    
    for (const item of items) {
      if (item.item) {
        // It's a folder
        const folderRes = await fetch('http://127.0.0.1:8000/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: item.name || 'Folder', user_id: 1, parent_id: parentId })
        });
        if (folderRes.ok) {
          const folder = await folderRes.json();
          await processItems(item.item, folder.id);
        }
      } else if (item.request) {
        // It's a request
        const req = item.request;
        let url = '';
        if (typeof req.url === 'string') {
          url = req.url;
        } else if (req.url && req.url.raw) {
          url = req.url.raw;
        }
        
        let headers: any[] = [];
        if (Array.isArray(req.header)) {
          headers = req.header.map((h: any) => ({
            id: Date.now().toString() + Math.random().toString(),
            key: h.key,
            value: h.value,
            enabled: true
          }));
        }

        let queryParams: any[] = [];
        if (req.url && Array.isArray(req.url.query)) {
          queryParams = req.url.query.map((q: any) => ({
            id: Date.now().toString() + Math.random().toString(),
            key: q.key,
            value: q.value,
            enabled: true
          }));
        }

        let bodyType = 'none';
        let bodyRaw = '';
        let bodyForm: any[] = [];
        
        if (req.body) {
          if (req.body.mode === 'raw') {
            bodyType = 'raw';
            bodyRaw = req.body.raw || '';
          } else if (req.body.mode === 'formdata') {
            bodyType = 'formdata';
            bodyForm = Array.isArray(req.body.formdata) ? req.body.formdata.map((f: any) => ({
              id: Date.now().toString() + Math.random().toString(),
              key: f.key,
              value: f.value,
              enabled: true
            })) : [];
          } else if (req.body.mode === 'urlencoded') {
            bodyType = 'urlencoded';
            bodyForm = Array.isArray(req.body.urlencoded) ? req.body.urlencoded.map((f: any) => ({
              id: Date.now().toString() + Math.random().toString(),
              key: f.key,
              value: f.value,
              enabled: true
            })) : [];
          }
        }

        let authType = 'none';
        let authData = {};
        if (req.auth) {
          if (req.auth.type === 'bearer' && req.auth.bearer) {
            authType = 'bearer';
            const tokenItem = req.auth.bearer.find((b: any) => b.key === 'token');
            if (tokenItem) authData = { token: tokenItem.value };
          } else if (req.auth.type === 'basic' && req.auth.basic) {
            authType = 'basic';
            const userItem = req.auth.basic.find((b: any) => b.key === 'username');
            const passItem = req.auth.basic.find((b: any) => b.key === 'password');
            authData = { username: userItem?.value || '', password: passItem?.value || '' };
          }
        }

        let preReq = '';
        let postRes = '';
        if (Array.isArray(item.event)) {
          item.event.forEach((ev: any) => {
            if (ev.listen === 'prerequest' && ev.script && Array.isArray(ev.script.exec)) {
              preReq = ev.script.exec.join('\n');
            } else if (ev.listen === 'test' && ev.script && Array.isArray(ev.script.exec)) {
              postRes = ev.script.exec.join('\n');
            }
          });
        }

        await fetch('http://127.0.0.1:8000/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name || 'Untitled',
            method: req.method || 'GET',
            url: url,
            collection_id: parentId,
            headers: JSON.stringify(headers),
            query_params: JSON.stringify(queryParams),
            body_type: bodyType,
            body: bodyType === 'raw' ? bodyRaw : JSON.stringify(bodyForm),
            auth_type: authType,
            auth_data: JSON.stringify(authData),
            pre_request_script: preReq,
            post_response_script: postRes
          })
        });
      }
    }
  };

  await processItems(collectionData.item, rootCol.id);
  refreshCollections();
}

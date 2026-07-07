export function exportToPostman(collection: any, allCollections: any[]) {
  // Postman Collection v2.1.0 format
  
  const buildItems = (colId: number): any[] => {
    const col = allCollections.find(c => c.id === colId);
    if (!col) return [];

    const items: any[] = [];
    
    // Add sub-folders
    const children = allCollections.filter(c => c.parent_id === colId);
    children.forEach(child => {
      items.push({
        name: child.name,
        item: buildItems(child.id)
      });
    });

    // Add requests
    if (col.requests) {
      col.requests.forEach((req: any) => {
        let headers = [];
        try { headers = JSON.parse(req.headers || '[]'); } catch(e) {}
        let params = [];
        try { params = JSON.parse(req.query_params || '[]'); } catch(e) {}

        const postmanReq: any = {
          method: req.method,
          header: headers.filter((h: any) => h.enabled && h.key).map((h: any) => ({ key: h.key, value: h.value })),
          url: {
            raw: req.url,
            host: req.url.split('/')[2] ? [req.url.split('/')[2]] : [],
            path: req.url.split('/').slice(3),
            query: params.filter((p: any) => p.enabled && p.key).map((p: any) => ({ key: p.key, value: p.value }))
          }
        };

        if (req.body_type === 'raw' && req.body) {
          postmanReq.body = { mode: 'raw', raw: req.body };
        } else if (req.body_type === 'formdata') {
          let formData = [];
          try { formData = JSON.parse(req.body || '[]'); } catch(e) {}
          postmanReq.body = {
            mode: 'formdata',
            formdata: formData.filter((f: any) => f.enabled && f.key).map((f: any) => ({ key: f.key, value: f.value, type: 'text' }))
          };
        } else if (req.body_type === 'urlencoded') {
          let urlencoded = [];
          try { urlencoded = JSON.parse(req.body || '[]'); } catch(e) {}
          postmanReq.body = {
            mode: 'urlencoded',
            urlencoded: urlencoded.filter((f: any) => f.enabled && f.key).map((f: any) => ({ key: f.key, value: f.value, type: 'text' }))
          };
        }

        items.push({
          name: req.name,
          request: postmanReq
        });
      });
    }

    return items;
  };

  const collectionData = {
    info: {
      name: collection.name,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: buildItems(collection.id)
  };

  const blob = new Blob([JSON.stringify(collectionData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${collection.name}.postman_collection.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

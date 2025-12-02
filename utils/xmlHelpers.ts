// Robust XML Formatting
export const formatXml = (xml: string): string => {
  let formatted = '';
  // Remove existing newlines/spaces between tags to normalize
  const normalized = xml.replace(/>\s+</g, '><').trim();
  
  let pad = 0;
  // Regex to split into tags and content
  // Matches: <tag>, </tag>, <tag/>, text content
  const tokens: string[] = normalized.match(/<[^>]+>|[^<]+/g) || [];

  tokens.forEach(token => {
    let indent = 0;
    
    // Check token type
    if (token.match(/^<\/\w/)) {
      // Closing tag </tag>
      if (pad !== 0) pad -= 1;
    } else if (token.match(/^<\w[^>]*[^\/]>$/)) {
      // Opening tag <tag> (not self-closing)
      indent = 1;
    } else if (token.match(/^<\w[^>]*\/>$/)) {
      // Self-closing tag <tag/>
      indent = 0;
    } else {
      // Text content
      indent = 0;
    }

    const padding = '  '.repeat(pad);
    formatted += padding + token + '\r\n';
    pad += indent;
  });

  return formatted.trim();
};

export const minifyXml = (xml: string): string => {
  return xml.replace(/>\s+</g, '><').trim();
};

// Robust JSON to XML
export const jsonToXml = (json: any, rootName?: string): string => {
  if (typeof json !== 'object' || json === null) {
    return rootName ? `<${rootName}>${json}</${rootName}>` : String(json);
  }

  let attrs = '';
  let children = '';

  Object.keys(json).forEach(key => {
    if (key.startsWith('@')) {
      attrs += ` ${key.slice(1)}="${json[key]}"`;
    } else if (key === '#text') {
      children += json[key];
    } else {
      const value = json[key];
      if (Array.isArray(value)) {
        value.forEach(v => {
          children += jsonToXml(v, key);
        });
      } else {
        children += jsonToXml(value, key);
      }
    }
  });

  if (rootName) {
    return `<${rootName}${attrs}>${children}</${rootName}>`;
  }
  return children;
};

// Robust XML to JSON
export const xmlToJson = (xml: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error("Invalid XML structure");

  const parseNode = (node: Node): any => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.trim() || "";
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const obj: any = {};
      
      // 1. Handle Attributes
      if (element.hasAttributes()) {
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          obj[`@${attr.name}`] = attr.value;
        }
      }

      // 2. Handle Children
      if (element.hasChildNodes()) {
        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];
          
          if (child.nodeType === Node.TEXT_NODE) {
             const txt = child.textContent?.trim();
             if (txt) {
                 obj['#text'] = (obj['#text'] ? obj['#text'] + ' ' : '') + txt;
             }
             continue;
          }
          
          const childName = child.nodeName;
          const childValue = parseNode(child);

          if (obj[childName]) {
             if (!Array.isArray(obj[childName])) {
                 obj[childName] = [obj[childName]];
             }
             obj[childName].push(childValue);
          } else {
             obj[childName] = childValue;
          }
        }
      }

      const keys = Object.keys(obj);
      if (keys.length === 0) return ""; 
      
      // Simplify if only text content and no attributes
      if (keys.length === 1 && keys[0] === '#text') {
          return obj['#text'];
      }
      
      return obj;
    }
  };

  const root = doc.documentElement;
  const result: any = {};
  result[root.nodeName] = parseNode(root);
  return result;
};
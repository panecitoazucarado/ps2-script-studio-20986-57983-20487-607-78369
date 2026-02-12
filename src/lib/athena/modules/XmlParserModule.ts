// XML Parser Module for AthenaEnv
// Parses OSDXMB-style XML plugin files into JavaScript objects
// Supports: attributes, CDATA sections, nested elements, text content, i18n String arrays

export interface XmlNode {
  tag: string;
  attributes: Record<string, string>;
  children: XmlNode[];
  text: string;
  cdata: string;
  // Convenience accessors
  [key: string]: any;
}

/**
 * Parse an XML string into an XmlNode tree.
 * Uses the browser's DOMParser for robust parsing.
 */
function parseXmlString(xmlStr: string): XmlNode | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, 'application/xml');
    
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      return null;
    }
    
    return elementToNode(doc.documentElement);
  } catch (e) {
    return null;
  }
}

function elementToNode(el: Element): XmlNode {
  const node: XmlNode = {
    tag: el.tagName,
    attributes: {},
    children: [],
    text: '',
    cdata: '',
  };

  // Copy attributes
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    node.attributes[attr.name] = attr.value;
  }

  // Process child nodes
  let textParts: string[] = [];
  let cdataParts: string[] = [];

  for (let i = 0; i < el.childNodes.length; i++) {
    const child = el.childNodes[i];
    
    if (child.nodeType === Node.ELEMENT_NODE) {
      node.children.push(elementToNode(child as Element));
    } else if (child.nodeType === Node.TEXT_NODE) {
      const t = (child.textContent || '').trim();
      if (t) textParts.push(t);
    } else if (child.nodeType === Node.CDATA_SECTION_NODE) {
      cdataParts.push(child.textContent || '');
    }
  }

  node.text = textParts.join(' ');
  node.cdata = cdataParts.join('\n');

  return node;
}

/**
 * Create the XML module exposed to AthenaEnv scripts.
 */
export function createXmlModule(
  vfsReadFile: (path: string) => string | ArrayBuffer | null,
  vfsExists: (path: string) => boolean,
  onLog: (msg: string) => void
) {
  // Helper: find child nodes by tag
  function findChildren(node: XmlNode, tag: string): XmlNode[] {
    return node.children.filter(c => c.tag === tag);
  }

  // Helper: find first child by tag
  function findChild(node: XmlNode, tag: string): XmlNode | null {
    return node.children.find(c => c.tag === tag) || null;
  }

  // Helper: get attribute with default
  function getAttribute(node: XmlNode, name: string, defaultValue: string = ''): string {
    return node.attributes[name] ?? defaultValue;
  }

  // Helper: get CDATA content as executable JS string
  function getCDATA(node: XmlNode): string {
    return node.cdata || '';
  }

  // Helper: get localized string from <Name>/<Description> with <String str="..."/> children
  function getLocalizedString(node: XmlNode, langIndex: number = 0): string {
    const strings = findChildren(node, 'String');
    if (strings.length > 0) {
      const idx = Math.min(langIndex, strings.length - 1);
      return getAttribute(strings[idx], 'str');
    }
    return getAttribute(node, 'str', node.text);
  }

  // Parse an XML plugin file from VFS
  function parsePluginFile(path: string): XmlNode | null {
    if (!vfsExists(path)) {
      onLog(`[XML] File not found: ${path}`);
      return null;
    }

    const content = vfsReadFile(path);
    if (!content || typeof content !== 'string') {
      onLog(`[XML] Cannot read: ${path}`);
      return null;
    }

    const result = parseXmlString(content);
    if (!result) {
      onLog(`[XML] Parse error in: ${path}`);
      return null;
    }

    onLog(`[XML] Parsed: ${path} (${result.tag})`);
    return result;
  }

  // Build a component list from <Component> children (OSDXMB pattern)
  function buildComponentList(parentNode: XmlNode, langIndex: number = 0): any[] {
    const components = findChildren(parentNode, 'Component');
    return components.map((comp, index) => {
      const item: Record<string, any> = { index };

      // Name - can be attribute or child
      const nameAttr = getAttribute(comp, 'Name');
      if (nameAttr) {
        item.Name = nameAttr;
      } else {
        const nameChild = findChild(comp, 'Name');
        if (nameChild) {
          item.Name = getLocalizedString(nameChild, langIndex);
        }
      }

      // Icon
      const iconAttr = getAttribute(comp, 'Icon');
      if (iconAttr) item.Icon = iconAttr;

      // Description
      const descAttr = getAttribute(comp, 'Description');
      if (descAttr) {
        item.Description = descAttr;
      } else {
        const descChild = findChild(comp, 'Description');
        if (descChild) {
          item.Description = getLocalizedString(descChild, langIndex);
        }
      }

      // Any other attributes
      for (const [key, value] of Object.entries(comp.attributes)) {
        if (!['Name', 'Icon', 'Description'].includes(key)) {
          item[key] = value;
        }
      }

      // Nested elements (Confirm, Dialog, etc.)
      for (const child of comp.children) {
        if (child.cdata) {
          item[child.tag] = child.cdata;
        }
      }

      return item;
    });
  }

  // Parse an OSDXMB <Option> element into a structured object
  function parseOption(optionNode: XmlNode, langIndex: number = 0): Record<string, any> {
    const option: Record<string, any> = {
      Type: getAttribute(optionNode, 'Type'),
      Icon: getAttribute(optionNode, 'Icon'),
      Name: getAttribute(optionNode, 'Name'),
      Description: getAttribute(optionNode, 'Description'),
    };

    // Localized Name
    const nameChild = findChild(optionNode, 'Name');
    if (nameChild) {
      option.Name = getLocalizedString(nameChild, langIndex);
    }

    // Localized Description
    const descChild = findChild(optionNode, 'Description');
    if (descChild) {
      option.Description = getLocalizedString(descChild, langIndex);
    }

    // Components
    option.Components = buildComponentList(optionNode, langIndex);

    // Default
    const defaultNode = findChild(optionNode, 'Default');
    if (defaultNode) {
      const varAttr = getAttribute(defaultNode, 'Variable');
      if (varAttr) {
        option.DefaultVariable = varAttr;
      }
      if (defaultNode.cdata) {
        option.DefaultCode = defaultNode.cdata;
      }
    }

    // CDATA handlers: Confirm, Cancel, Preview
    for (const handler of ['Confirm', 'Cancel', 'Preview', 'Init', 'Components']) {
      const handlerNode = findChild(optionNode, handler);
      if (handlerNode && handlerNode.cdata) {
        option[`${handler}Code`] = handlerNode.cdata;
      }
    }

    // Dialog
    const dialogNode = findChild(optionNode, 'Dialog');
    if (dialogNode) {
      option.Dialog = parseDialogNode(dialogNode, langIndex);
    }

    return option;
  }

  // Parse a <Dialog> node
  function parseDialogNode(dialogNode: XmlNode, langIndex: number = 0): Record<string, any> {
    const dialog: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(dialogNode.attributes)) {
      dialog[key] = value;
    }

    // Localized Text
    const textChild = findChild(dialogNode, 'Text');
    if (textChild) {
      dialog.Text = getLocalizedString(textChild, langIndex);
    }

    // Task
    const taskNode = findChild(dialogNode, 'Task');
    if (taskNode && taskNode.cdata) {
      dialog.TaskCode = taskNode.cdata;
    }

    // Confirm handler
    const confirmNode = findChild(dialogNode, 'Confirm');
    if (confirmNode && confirmNode.cdata) {
      dialog.ConfirmCode = confirmNode.cdata;
    }

    // Events
    const events = findChildren(dialogNode, 'Event');
    dialog.Events = events.map(ev => ({ ...ev.attributes }));

    // Info items
    const infoNode = findChild(dialogNode, 'Info');
    if (infoNode) {
      dialog.Info = findChildren(infoNode, 'Item').map(item => ({ ...item.attributes }));
    }

    // Nested dialogs
    const nestedDialogs = findChildren(dialogNode, 'Dialog');
    if (nestedDialogs.length > 0) {
      dialog.SubDialogs = nestedDialogs.map(d => parseDialogNode(d, langIndex));
    }

    return dialog;
  }

  // Parse a full OSDXMB <App> plugin file
  function parseAppPlugin(path: string, langIndex: number = 0): Record<string, any> | null {
    const root = parsePluginFile(path);
    if (!root || root.tag !== 'App') {
      return null;
    }

    const app: Record<string, any> = {
      Type: getAttribute(root, 'Type'),
      Category: getAttribute(root, 'Category'),
      Icon: getAttribute(root, 'Icon'),
      Name: getAttribute(root, 'Name'),
      Description: getAttribute(root, 'Description'),
    };

    // Localized Name
    const nameChild = findChild(root, 'Name');
    if (nameChild) {
      app.Name = getLocalizedString(nameChild, langIndex);
    }

    // Localized Description
    const descChild = findChild(root, 'Description');
    if (descChild) {
      app.Description = getLocalizedString(descChild, langIndex);
    }

    // Init code
    const initNode = findChild(root, 'Init');
    if (initNode && initNode.cdata) {
      app.InitCode = initNode.cdata;
    }

    // Options (can be a list of <Option> or contain CDATA code)
    const optionsNode = findChild(root, 'Options');
    if (optionsNode) {
      if (optionsNode.cdata) {
        app.OptionsCode = optionsNode.cdata;
      }
      app.OptionsType = getAttribute(optionsNode, 'Type');
      app.HideEmpty = getAttribute(optionsNode, 'HideEmpty') === 'true';
      
      // Parse child <Option> elements
      const options = findChildren(root, 'Option');
      if (options.length > 0) {
        app.Options = options.map(opt => parseOption(opt, langIndex));
      }
    } else {
      // Options directly as children
      const options = findChildren(root, 'Option');
      if (options.length > 0) {
        app.Options = options.map(opt => parseOption(opt, langIndex));
      }
    }

    // Context menus
    const contextNode = findChild(root, 'Context');
    if (contextNode) {
      app.Context = {
        Name: getAttribute(contextNode, 'Name'),
        Type: getAttribute(contextNode, 'Type'),
        Filter: getAttribute(contextNode, 'Filter'),
        Components: buildComponentList(contextNode, langIndex),
      };
    }

    return app;
  }

  // The module object exposed to scripts
  const XmlParser = {
    // Low-level: parse any XML string
    parse: (xmlStr: string): XmlNode | null => parseXmlString(xmlStr),

    // Low-level: parse XML file from VFS
    parseFile: (path: string): XmlNode | null => parsePluginFile(path),

    // High-level: parse OSDXMB App plugin
    parseApp: (path: string, langIndex?: number): Record<string, any> | null => parseAppPlugin(path, langIndex),

    // Utility functions
    findChildren,
    findChild,
    getAttribute,
    getCDATA,
    getLocalizedString,
    buildComponentList,
    parseOption,
    parseDialog: parseDialogNode,

    // Stringify an XmlNode back to XML (for debugging)
    stringify: (node: XmlNode, indent: number = 0): string => {
      const pad = '  '.repeat(indent);
      let xml = `${pad}<${node.tag}`;
      
      for (const [key, value] of Object.entries(node.attributes)) {
        xml += ` ${key}="${value.replace(/"/g, '&quot;')}"`;
      }

      if (node.children.length === 0 && !node.text && !node.cdata) {
        return xml + ' />';
      }

      xml += '>';

      if (node.cdata) {
        xml += `<![CDATA[${node.cdata}]]>`;
      } else if (node.text) {
        xml += node.text;
      }

      if (node.children.length > 0) {
        xml += '\n';
        for (const child of node.children) {
          xml += XmlParser.stringify(child, indent + 1) + '\n';
        }
        xml += pad;
      }

      xml += `</${node.tag}>`;
      return xml;
    }
  };

  return XmlParser;
}

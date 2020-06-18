import { getMicroData, setMicroData } from './data';
import { MANIFEST_PREFIX } from './constant';

interface Appended {
  styleId: string;
  styleSrc: string;
  scriptId: string;
  scriptSrc: string;
}

export const getManifest = (microId: string, appName: string): Record<string, any> | undefined => {
  const manifests = getMicroData<Record<string, any> | undefined>(microId, MANIFEST_PREFIX);
  if (manifests) {
    return manifests[appName];
  }
};

export const cacheManifest = (microId: string, appName: string, manifest: Record<string, any>): void => {
  const manifests = getMicroData<Record<string, any> | undefined>(microId, MANIFEST_PREFIX);
  if (!manifests) {
    setMicroData(microId, MANIFEST_PREFIX, {
      [appName]: manifest,
    });
    return;
  }
  manifests[appName] = manifest;
};

export const generateAppName = (path: string): string => path.replace('/', '$');

// 获取manifest文件内容
export const fetchManifest = async (host: string): Promise<Record<string, any>> => {
  let manifest: Record<string, any>;
  const now = Date.now();
  try {
    const fetchUrl = `${host}/asset-manifest.json?${now}`;
    const resp = await fetch(fetchUrl);
    manifest = await resp.json();
  } catch (e) {
    console.log('获取manifest文件异常', e);
  }
  return manifest;
};

export const appendStylesAndScripts = ({ styleId, styleSrc, scriptId, scriptSrc }: Appended): Promise<void> =>
  new Promise(resolve => {
    // 创建style节点
    let style = document.createElement('link');
    style = Object.assign(style, {
      id: styleId,
      rel: 'stylesheet',
      type: 'text/css',
      href: styleSrc,
    });

    // 创建script节点
    let script = document.createElement('script');
    script = Object.assign(script, {
      id: scriptId,
      src: scriptSrc,
      defer: 'defer',
      onload: () => {
        resolve();
      },
    });

    // 插入
    const fragment = document.createDocumentFragment();
    fragment.appendChild(style);
    fragment.appendChild(script);
    document.head.appendChild(fragment);
  });

const removeSelf = (node: HTMLElement | undefined): any => node && node.parentNode.removeChild(node);

export const removeStylesAndScripts = (host: string, scriptId: string, styleId: string): void => {
  // 清除子应用的资源
  removeSelf(document.getElementById(scriptId));
  removeSelf(document.getElementById(styleId));

  // remove all relevant scripts and css
  try {
    // 移除 script
    Array.from(document.head.getElementsByTagName('script')).forEach(el => {
      const attr: Attr | null = el.attributes.getNamedItem('src');
      if (attr && attr.value.startsWith(host)) {
        removeSelf(el);
      }
    });
    // 移除 css
    Array.from(document.head.getElementsByTagName('link')).forEach(el => {
      const attr: Attr | null = el.attributes.getNamedItem('href');
      if (attr && attr.value.startsWith(host)) {
        removeSelf(el);
      }
    });
  } catch (error) {
    console.log('移除页面资源异常', error);
  }
};

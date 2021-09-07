import { useEffect, useState, useRef } from 'react';
import * as ReactDOM from 'react-dom';
import prismjs from 'prismjs';
// import CSS from 'prismjs/components/prism-css';
import 'prismjs/themes/prism-twilight.css';
import './tailwind.css';
import './ui.css';
import ExportWay, { SupportWays, supportWays } from './ExportWay';

const cssToCamelCase = (str: string) =>
  str
    .split('\n')
    .filter(Boolean)
    .flatMap((statement) =>
      statement
        .split(':')
        .map((property, index) => {
          // css 的属性名
          if (index % 2 == 0) {
            return property.replace(/(\-.)/g, (a) => a.slice(1).toUpperCase());
          } else {
            return `'${property.trim().replace(/;$/, "',")}`;
          }
        })
        .join(': '),
    )
    .join('\n');

const codeConvert: Record<SupportWays, (code: string) => string> = {
  css: (code) => code,
  emotion: (code) => {
    // 这里不使用 `` 是因为它会有烦人的空格
    const twoSpace = '  ';
    return (
      'style.div`' +
      '\n' +
      twoSpace +
      code.replace(/\n/g, (lf) => lf + twoSpace) +
      '\n' +
      '`'
    );
  },
  camelCase: cssToCamelCase,
  tailwind: (code) => `this is tailwind ��`,
};

const copyToClipboard = (str) => {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

const App = () => {
  const generateCode = useRef('');
  const convertedCode = useRef('');
  const [codeHTML, setCodeHTML] = useState('');
  const [exportWay, setExportWay] = useState<SupportWays | undefined>();

  const onShareButtonClick = () => {
    copyToClipboard(convertedCode.current);
    parent.postMessage({ pluginMessage: 'hide' }, '*');
  };

  useEffect(() => {
    onmessage = (event) => {
      const {
        css,
        type,
        exportWay = supportWays[0],
      } = event.data.pluginMessage;

      if (type === 'showcss' && css) {
        setExportWay(exportWay);
        generateCode.current = css;
      }
    };
  }, []);

  useEffect(() => {
    if (!generateCode.current) {
      return;
    }
    const code = codeConvert[exportWay](generateCode.current);
    convertedCode.current = code;
    // camelCase 一般用于 react，所以当作 css 读取就行了。
    if (exportWay === 'camelCase') {
      setCodeHTML(prismjs.highlight(code, prismjs.languages.javascript));
    } else {
      setCodeHTML(prismjs.highlight(code, prismjs.languages.css));
    }
  }, [exportWay]);

  const onExportWayChange = (val: SupportWays) => {
    setExportWay(val);
    parent.postMessage({ pluginMessage: { type: 'storage', val } }, '*');
  };

  if (!exportWay) {
    return null;
  }

  return (
    <div className="p-3 container mx-auto flex flex-col gap-3 font-mono w-full h-72">
      <ExportWay value={exportWay} onChange={onExportWayChange} />
      <div className="relative">
        <pre
          className="overflow-scroll language-css text-base w-4/5"
          dangerouslySetInnerHTML={{ __html: codeHTML }}
        />
        {codeHTML && (
          <button
            onClick={onShareButtonClick}
            className="w-9 h-9 rounded bg-gray-300 hover:bg-gray-500 absolute"
            style={{
              right: 0,
              top: 4,
            }}
            type="button"
          >
            <span aria-label="copy">💾</span>
          </button>
        )}
      </div>

      <button
        className="flex p-4 self-stretch items-center justify-center h-10 rounded bg-blue-400 hover:bg-blue-300 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
        onClick={() =>
          parent.postMessage({ pluginMessage: { type: 'hide' } }, '*')
        }
      >
        Hide
      </button>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('react-page'));

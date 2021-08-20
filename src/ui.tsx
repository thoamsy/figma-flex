import { useEffect, useState, useRef } from 'react';
import * as ReactDOM from 'react-dom';
import prismjs from 'prismjs';
// import CSS from 'prismjs/components/prism-css';
import 'prismjs/themes/prism-twilight.css';
import './ui.css';
import ExportWay, { SupportWays, supportWays } from './ExportWay';

const removeLF = (str: string, needTrim = false) =>
  str
    .split('\n')
    .map((str) => (needTrim ? str.trim() : str))
    .filter(Boolean)
    .join('\n');

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
  emotion: (code) => `
   style.div = \`
     ${code}
   \`
  `,
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
    <div className="container">
      <ExportWay value={exportWay} onChange={onExportWayChange} />
      <div style={{ position: 'relative' }}>
        <pre
          className="language-css"
          style={{
            fontSize: 14,
            width: 270,
            height: 'clamp(100px, 100%, 240px)',
            overflow: 'scroll',
          }}
          dangerouslySetInnerHTML={{ __html: codeHTML }}
        />
        {codeHTML && (
          <button
            onClick={onShareButtonClick}
            style={{
              borderRadius: 4,
              width: 36,
              height: 36,
              position: 'absolute',
              right: 0,
              top: 8,
            }}
            type="button"
          >
            <span aria-label="copy">💾</span>
          </button>
        )}
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('react-page'));

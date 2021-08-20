import { useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import prismjs from 'prismjs';
// import CSS from 'prismjs/components/prism-css';
import 'prismjs/themes/prism-twilight.css';
import './ui.css';

declare function require(path: string): any;

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
  const [codeHTML, setCodeHTML] = useState('');
  const onShareButtonClick = () => {
    copyToClipboard(codeHTML);
    parent.postMessage({ pluginMessage: 'hide' }, '*');
    // figma.ui.hide();
  };

  useEffect(() => {
    onmessage = (event) => {
      const { css, type } = event.data.pluginMessage;
      console.log(event.data.pluginMessage);

      if (type === 'showcss' && css) {
        const html = prismjs.highlight(css, prismjs.languages.css);
        setCodeHTML(html);
      }
    };
  }, []);

  return (
    <div className="container">
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
  );
};

ReactDOM.render(<App />, document.getElementById('react-page'));

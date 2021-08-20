// This plugin creates 5 rectangles on the screen.
const numberOfRectangles = 5;

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).

// const nodes: SceneNode[] = [];
// for (let i = 0; i < numberOfRectangles; i++) {
//   const rect = figma.createRectangle();
//   rect.x = i * 150;
//   rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
//   figma.currentPage.appendChild(rect);
//   nodes.push(rect);
// }
// figma.currentPage.selection = nodes;
// figma.viewport.scrollAndZoomIntoView(nodes);

// // Make sure to close the plugin when you're done. Otherwise the plugin will
// // keep running, which shows the cancel button at the bottom of the screen.
// figma.closePlugin();

const flexDirection: Record<
  Exclude<BaseFrameMixin['layoutMode'], 'NONE'>,
  'row' | 'column'
> = {
  HORIZONTAL: 'row',
  VERTICAL: 'column',
};
const flexJustify: Record<
  BaseFrameMixin['primaryAxisAlignItems'],
  'flex-start' | 'flex-end' | 'center' | 'space-between'
> = {
  CENTER: 'center',
  MAX: 'flex-end',
  MIN: 'flex-start',
  SPACE_BETWEEN: 'space-between',
};

const allSame = <T>(...args: T[]): boolean => {
  return args.every((arg) => arg === args[0]);
};

const domLayout = (node: AutoLayoutRecord) => {
  const {
    topLeftRadius,
    topRightRadius,
    bottomLeftRadius,
    bottomRightRadius,
    paddingLeft,
    paddingRight,
    paddingBottom,
    paddingTop,
  } = node;

  let borderRadius = '';
  let padding = '';

  if (
    allSame(topLeftRadius, topRightRadius, bottomLeftRadius, bottomRightRadius)
  ) {
    borderRadius = `${topLeftRadius}px`;
  } else {
    borderRadius = `${topLeftRadius}px ${topRightRadius}px ${bottomLeftRadius}px ${bottomRightRadius}px`;
  }

  if (allSame(paddingLeft, paddingRight, paddingBottom, paddingTop)) {
    padding = `${paddingLeft}px`;
  } else {
    padding = `${paddingLeft}px ${paddingRight}px ${paddingTop}px ${paddingBottom}`;
  }
  return `
    padding: ${padding};
    border-radius: ${borderRadius};
  `;
};

const layoutToFlexCSS = (record: AutoLayoutRecord): string => {
  const isVerticalStretch =
    record.layoutMode === 'VERTICAL' && record.layoutAlign === 'STRETCH';
  return `
    display: flex;
    flex-direction: ${flexDirection[record.layoutMode]};
    justify-content: ${flexJustify[record.primaryAxisAlignItems]};
    align-items: ${flexJustify[record.counterAxisAlignItems]};
    gap: ${record.itemSpacing}px;
    flex-grow: ${isVerticalStretch ? 0 : 1};
    align-self: ${isVerticalStretch ? 'stretch' : 'initial'};
    ${domLayout(record)}
  `;
};

const enableAutoLayout = (node: SceneNode): node is FrameNode => {
  if (!node) {
    return false;
  }
  return node.type === 'FRAME' && node.layoutMode !== 'NONE';
};

let hadMount = false;

const removeLF = (str: string, needTrim = false) =>
  str
    .split('\n')
    .map((str) => (needTrim ? str.trim() : str))
    .filter(Boolean)
    .join('\n');

figma.on('selectionchange', () => {
  const autoLayoutSet = new Set(autoLayoutAttributes as Readonly<string[]>);
  const selected = figma.currentPage.selection[0];

  if (enableAutoLayout(selected)) {
    const attributes: AutoLayoutRecord = {
      width: 0,
      height: 0,
      itemSpacing: 0,
      layoutGrow: 0,
      layoutAlign: 'MIN',
      layoutMode: 'NONE',
      primaryAxisSizingMode: 'AUTO',
      counterAxisSizingMode: 'AUTO',
      primaryAxisAlignItems: 'MIN',
      counterAxisAlignItems: 'MIN',
      paddingLeft: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingTop: 0,
      topLeftRadius: 0,
      topRightRadius: 0,
      bottomLeftRadius: 0,
      bottomRightRadius: 0,
    };

    for (let key in selected) {
      if (autoLayoutSet.has(key)) {
        attributes[key] = selected[key];
      }
    }
    const css = removeLF(layoutToFlexCSS(attributes), true);

    if (!hadMount) {
      figma.showUI(__html__, {
        title: 'Auto Layout CSS',
        height: 480,
        width: 320,
      });
    }
    figma.ui.postMessage({ css, type: 'showcss' });
  }
});

const autoLayoutAttributes = [
  'layoutAlign',
  'layoutGrow',
  'primaryAxisAlignItems',
  'counterAxisAlignItems',
  'primaryAxisSizingMode',
  'counterAxisSizingMode',
  'layoutMode',
  'itemSpacing',
  'width',
  'height',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'topLeftRadius',
  'topRightRadius',
  'bottomLeftRadius',
  'bottomRightRadius',
] as const;

type AutoLayoutAttributes = typeof autoLayoutAttributes[number];
type AutoLayoutRecord = Pick<FrameNode, AutoLayoutAttributes>;

figma.ui.onmessage = (message) => {
  if (message === 'hide') {
    figma.notify('CSS 复制成功', { timeout: 2000 });
    figma.ui.hide();
  }
};

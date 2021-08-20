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
    borderRadius = [
      topLeftRadius,
      topRightRadius,
      bottomLeftRadius,
      bottomRightRadius,
    ]
      .map((val) => val + 'px')
      .join(' ');
  }

  if (allSame(paddingLeft, paddingRight, paddingBottom, paddingTop)) {
    padding = `${paddingLeft}px`;
  } else {
    padding = [paddingLeft, paddingRight, paddingTop, paddingBottom]
      .map((val) => val + 'px')
      .join(' ');
  }
  return `
    padding: ${padding};
    border-radius: ${borderRadius};
  `;
};

const layoutToFlexCSS = (record: AutoLayoutRecord): string => {
  const isVerticalStretch =
    record.layoutMode === 'VERTICAL' && record.layoutAlign === 'STRETCH';

  const isFixed =
    record.layoutAlign !== 'STRETCH' &&
    record.counterAxisSizingMode === 'FIXED' &&
    record.primaryAxisSizingMode === 'FIXED';

  // FIXME: the align-self seems like wrong, I should read its parent to know the layoutMode
  return `
    display: flex;
    flex-direction: ${flexDirection[record.layoutMode]};
    justify-content: ${flexJustify[record.primaryAxisAlignItems]};
    align-items: ${flexJustify[record.counterAxisAlignItems]};
    gap: ${record.itemSpacing}px;
    flex-grow: ${isVerticalStretch ? 0 : 1};
    align-self: ${record.layoutAlign === 'STRETCH' ? 'stretch' : 'initial'};
    ${domLayout(record)}

    ${
      isFixed
        ? `
    /* for quick look the style, but in the responsive ui, you should delete the code */
    width: ${record.width}px;
    height: ${record.height}px;
    `
        : ''
    }
  `;
};

const enableAutoLayout = (node: SceneNode): node is FrameNode => {
  if (!node) {
    return false;
  }
  return node.type === 'FRAME' && node.layoutMode !== 'NONE';
};

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

    for (const key in selected) {
      // if (key === 'parent' && selected[key].type === 'FRAME') {
      //   console.log((selected[key] as FrameNode).layoutMode);
      // }
      if (autoLayoutSet.has(key)) {
        attributes[key] = selected[key];
      }
    }

    console.log(attributes, 'selected');
    const css = removeLF(layoutToFlexCSS(attributes), true);

    figma.clientStorage.getAsync('exportWay').then((val) => {
      figma.showUI(__html__, {
        title: 'Auto Layout CSS',
        height: 480,
        width: 320,
      });
      figma.ui.postMessage({ css, type: 'showcss', exportWay: val });
    });
  } else {
    figma.ui.hide();
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
  if (typeof message === 'object' && message !== null) {
    if (message.type === 'storage') {
      figma.clientStorage.setAsync('exportWay', message.val);
    }
    if (message.type === 'hide') {
      figma.ui.hide();
    }
  }
};

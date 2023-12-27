import { ColorTranslator } from 'colortranslator';

import './index.css';
import { useEffect, useRef } from 'react';

const Colors = () => {
  const colors = [
    '#4C3E26',
    '#354062',
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#10b981',
    '#14b8a6',
    '#06b6d4',
    '#0ea5e9',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#a855f7',
    '#d946ef',
    '#ec4899',
    '#f43f5e',
  ];
  return colors.map((color, index) => {
    return <Color color={color} key={index} />;
  });
};

interface IColor {
  color: string;
}

const Color = (props: IColor) => {
  const { color } = props;
  const divRef = useRef<HTMLDivElement>(null);
  console.log(new ColorTranslator(color).H);

  useEffect(() => {
    if (color) {
      console.log(new ColorTranslator(color).setS(32).setL(15).HSL);

      divRef.current!.style.setProperty(
        '--dark-bg-color',
        `${new ColorTranslator(color).setS(32).setL(15).HSL}`,
      );
      divRef.current!.style.setProperty(
        '--dark-rgba-bg-color',
        `${new ColorTranslator(color).setS(32).setL(15).RGBA}`,
      );
    }
  }, [color]);

  // const translatedColor = new ColorTranslator(color).setS(32).setL(15).HSL;

  return (
    <div ref={divRef} className="flex flex-row items-center w-[500px] my-1">
      <div className="mx-4 flex-1">{color}</div>
      <div className="w-24 h-24 flex-1" style={{ background: color }}></div>
      <div className="mx-4 flex-1">转换后</div>
      <div className="w-24 h-24 flex-1 bgColor"></div>

      <div className="mx-4 flex-1">RGBA</div>
      <div className="w-24 h-24 flex-1 bgRgbaColor"></div>
    </div>
  );
};

export default Colors;

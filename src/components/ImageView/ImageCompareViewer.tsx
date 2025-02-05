import React, { useEffect, useRef } from 'react';
// @ts-expect-error - There is no TS version available
import SlickImageCompare from 'slick-image-compare';
import 'slick-image-compare/dist/style.css';

export const ImageCompareViewer = ({ beforeImage='', afterImage='', options = {} }) => {
  const divRef = useRef(null);

  useEffect(() => {
    if (divRef.current) {
      const defaultOptions = {
        animateIn: true,
      };

      const instance = new SlickImageCompare(divRef.current, { ...defaultOptions, ...options });

      // 清理函数
      return () => {
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
      };
    }
  }, [options, beforeImage, afterImage]);

  return (
    <div className="image-compare-container h-full" ref={divRef}>
      <img src={beforeImage} className='!h-full' />
      <img src={afterImage} className='!h-full' />
    </div>
  );
};
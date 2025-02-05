import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function replaceDomain(input: string): string {
  try {
      // 首先尝试解析 JSON
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
          // 如果是数组，处理第一个元素
          return replaceDomain(parsed[0]);
      }
  } catch (e) {
      // 如果不是 JSON，直接处理为 URL
  }

  // 处理 URL
  const parts = input.split('/');
  if (parts[2] === 'file.302.ai') {
      // 如果已经是正确的域名，直接返回
      return input;
  }
  parts[2] = 'file.302.ai';
  return parts.join('/');
}

export async function imageToBase(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // 检查并修正 MIME 类型
        let result = reader.result as string;
        if (result.startsWith('data:application/octet-stream;base64,')) {
          result = result.replace('data:application/octet-stream;base64,', 'data:image/svg+xml;base64,');
        }
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return imageUrl;
  }
}

export async function urlToFile(url: string, filename: string): Promise<File> {
  // 获取图片数据
  const response = await fetch(url);
  const blob = await response.blob();

  // 确保文件名以 .svg 结尾
  const svgFilename = filename.endsWith('.svg') ? filename : `${filename}.svg`;

  // 从 blob 创建 File 对象，并强制设置 MIME 类型为 SVG
  return new File([blob], svgFilename, { type: 'image/svg+xml' });
}
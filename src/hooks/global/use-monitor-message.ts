import { saveAs } from "file-saver";
import { useCallback } from "react";

import ky from 'ky';
interface MonitorMessage {
  from: "monitor";
  eventType: "downloadFile" | "openNewWindow";
  target?: string;
  url: string;
  download?: string;
}

export const useMonitorMessage = () => {
  const sendMonitorMessage = useCallback(
    (message: Omit<MonitorMessage, "from">) => {
      console.log("sendMonitorMessage", message);
      window.parent.postMessage(
        {
          from: "monitor",
          ...message,
        },
        "*"
      );
    },
    []
  );

  // const handleDownload = useCallback(
  //   (url: string, filename?: string) => {
  //     sendMonitorMessage({
  //       eventType: "downloadFile",
  //       url,
  //       download: filename,
  //     });
  //     saveAs(url, filename);
  //   },
  //   [sendMonitorMessage]
  // );

  const handleNewWindow = useCallback(
    (url: string, target: string = "_blank") => {
      sendMonitorMessage({
        eventType: "openNewWindow",
        url,
        target,
      });
      window.open(url, target);
    },
    [sendMonitorMessage]
  );


  const handleDownload = useCallback(
    async (url: string, filename?: string) => {
      try {
        // 发送 GET 请求来获取文件内容
        const response = await ky.get(url, {
          // ky 默认不会自动解析响应，所以不需要设置 responseType
        });

        // 从响应头中获取文件名（如果服务器提供）
        const contentDisposition = response.headers.get('content-disposition');
        let serverFilename;
        if (contentDisposition) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            serverFilename = matches[1].replace(/['"]/g, '');
          }
        }

        // 使用提供的文件名，服务器提供的文件名，或者从 URL 生成的文件名
        const finalFilename = filename || serverFilename || url.split('/').pop() || 'download';

        // 获取 blob 数据
        const blob = await response.blob();

        sendMonitorMessage({
          eventType: "downloadFile",
          url,
          download: finalFilename,
        });

        // 使用 saveAs 函数下载文件
        saveAs(blob, `${finalFilename}`);
      } catch (error) {
        console.error('下载文件时出错:', error);
        // 如果下载失败，可以选择在新窗口中打开链接
        window.open(url, '_blank');
        sendMonitorMessage({
          eventType: "openNewWindow",
          url,
        });
      }
    },
    [sendMonitorMessage]
  );

  return {
    handleDownload,
    handleNewWindow,
    sendMonitorMessage,
  };
};

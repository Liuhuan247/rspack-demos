type IData = {
  audioData: Float32Array[];
  segments: { start: number; end: number }[];
  sampleRate: number;
};

self.onmessage = (e: MessageEvent<IData>) => {
  const { audioData, segments, sampleRate } = e.data;
  console.log('🚀 ~ file: audioProcessor.worker.ts:9 ~ audioData:', audioData);

  const croppedBuffers: Float32Array[] = [];

  // 首先，对segments进行排序
  segments.sort((a, b) => a.start - b.start);

  // 初始化当前处理的位置
  let currentPos = 0;

  segments.forEach(segment => {
    const startSample = Math.round(segment.start * sampleRate);
    const endSample = Math.round(segment.end * sampleRate);

    // 检查是否有需要保留的数据
    if (startSample > currentPos) {
      // 保留从currentPos到startSample的部分
      // 保留从currentPos到startSample的部分
      audioData.forEach((channel, index) => {
        if (!croppedBuffers[index]) {
          croppedBuffers[index] = new Float32Array();
        }
        const part = channel.slice(currentPos, startSample);
        croppedBuffers[index] = concatFloat32Arrays(
          croppedBuffers[index],
          part,
        );
      });
    }
    // 更新当前处理的位置
    currentPos = endSample;
  });

  // 检查并保留最后一个segment之后的部分
  audioData.forEach((channel, index) => {
    if (currentPos < channel.length) {
      if (!croppedBuffers[index]) {
        croppedBuffers[index] = new Float32Array();
      }
      const part = channel.slice(currentPos);
      croppedBuffers[index] = concatFloat32Arrays(croppedBuffers[index], part);
    }
  });
  // 将处理结果发送回主线程
  self.postMessage({ croppedBuffers });
};
// 辅助函数：连接两个Float32Array
function concatFloat32Arrays(a: Float32Array, b: Float32Array): Float32Array {
  const c = new Float32Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

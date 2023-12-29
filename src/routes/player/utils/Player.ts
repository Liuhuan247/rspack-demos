// 定义一个用于裁剪的片段的接口
interface AudioSegment {
  start: number;
  end: number;
}
type PlayingCallback = (currentTime: number) => void;
type PlaybackStateChangeCallback = (isPlaying: PlaybackState) => void;
export enum PlaybackState {
  Stopped = 'STOPPED',
  Loading = 'LOADING',
  Playing = 'PLAYING',
}

class Player {
  private audioContext: AudioContext;

  private audioWorker: Worker;

  private audioBuffer: AudioBuffer | null;

  private source: AudioBufferSourceNode | null;

  private isPlaying: boolean;

  private playbackState: PlaybackState;

  private isBufferLoaded: boolean;

  private isPlayRequested: boolean; // 新增标志，表示是否请求播放

  private startTime: number;

  private startOffset: number;

  private animationFrameRequest: number | null;

  private playingListeners: PlayingCallback[] = [];

  private timeOffsetChangeListeners: PlayingCallback[] = [];

  private playbackStateChangeListeners: PlaybackStateChangeCallback[] = [];

  constructor() {
    this.audioWorker = new Worker( // @ts-expect-error
      new URL('../worker/audioProcessor.worker.ts', import.meta.url),
    );
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    this.audioBuffer = null;
    this.source = null;
    this.isPlaying = false;
    this.playbackState = PlaybackState.Stopped;
    this.isBufferLoaded = false;
    this.isPlayRequested = false; // 初始化为false
    this.startTime = 0;
    this.startOffset = 0;
    this.animationFrameRequest = null;
    this.audioWorker.onmessage = (
      event: MessageEvent<{ croppedBuffers: Float32Array[] }>,
    ) => {
      const { croppedBuffers } = event.data;
      console.log(
        '🚀 ~ file: Player.ts:62 ~ Player ~ constructor ~ croppedBuffers:',
        croppedBuffers,
      );
      const buffers: AudioBuffer[] = [];
      croppedBuffers.forEach(v => {
        const newBuffer = this.audioContext.createBuffer(
          1,
          v.length,
          this.audioContext.sampleRate,
        );
        newBuffer.copyToChannel(v, 0);
        buffers.push(newBuffer);
      });
      console.log(
        '🚀 ~ file: Player.ts:77 ~ Player ~ constructor ~ buffers:',
        buffers,
      );
      this.audioBuffer = this.mergeMultipleAudioBuffers(buffers);
      // croppedBuffers.forEach((channel, index) => {
      //   newBuffer.copyToChannel(channel, index);
      // });
      // this.isBufferLoaded = true;
      // if (this.isPlayRequested) {
      //   this.play();
      // }
    };
  }

  onTimeOffsetChange(callback: PlayingCallback): void {
    this.timeOffsetChangeListeners.push(callback);
  }

  onPlaying(callback: PlayingCallback): void {
    this.playingListeners.push(callback);
  }

  // 注册播放状态变化事件的监听器
  onPlaybackStateChange(callback: PlaybackStateChangeCallback): void {
    this.playbackStateChangeListeners.push(callback);
  }

  private triggerPlaying(): void {
    const currentTime = this.getCurrentTime();
    this.playingListeners.forEach(callback => callback(currentTime));
  }

  // 触发播放状态变化事件
  private triggerPlaybackStateChange(): void {
    this.playbackStateChangeListeners.forEach(callback =>
      callback(this.playbackState),
    );
  }

  private updatePlaying(): void {
    if (this.isPlaying) {
      this.triggerPlaying();
      this.animationFrameRequest = requestAnimationFrame(
        this.updatePlaying.bind(this),
      );
    }
  }

  async loadArrayBuffer(arrayBuffer: ArrayBuffer): Promise<void> {
    this.playbackState = PlaybackState.Loading;
    this.isBufferLoaded = false;
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.playbackState = PlaybackState.Stopped; // Loaded but not playing yet
    this.isBufferLoaded = true;
    if (this.isPlayRequested) {
      this.play();
    }
  }

  async play(): Promise<PlaybackState> {
    if (this.audioBuffer && this.isBufferLoaded && !this.isPlaying) {
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = this.audioBuffer;
      this.source.connect(this.audioContext.destination);
      this.startTime = this.audioContext.currentTime;
      this.source.start(0, this.startOffset % this.audioBuffer.duration);
      this.isPlaying = true;
      this.playbackState = PlaybackState.Playing;
      this.triggerPlaybackStateChange();
      this.updatePlaying();
      return PlaybackState.Playing;
    } else if (!this.isBufferLoaded) {
      this.isPlayRequested = true; // 设置标志
      this.playbackState = PlaybackState.Loading;
      this.triggerPlaybackStateChange();
      return PlaybackState.Loading;
    }
    this.triggerPlaybackStateChange();
    this.playbackState = PlaybackState.Stopped;
    return PlaybackState.Stopped;
  }

  pause(): void {
    if (this.isPlaying && this.source) {
      this.source.stop(0);
      this.startOffset += this.audioContext.currentTime - this.startTime;
      this.isPlaying = false;
      this.playbackState = PlaybackState.Stopped;
      this.triggerPlaybackStateChange();
      if (this.animationFrameRequest !== null) {
        cancelAnimationFrame(this.animationFrameRequest);
        this.animationFrameRequest = null;
      }
    }
  }

  stop(): void {
    this.pause();
    this.startOffset = 0;
  }

  getCurrentTime(): number {
    if (this.isPlaying) {
      return (
        (this.audioContext.currentTime - this.startTime + this.startOffset) %
        (this.audioBuffer?.duration || 0)
      );
    } else {
      return this.startOffset;
    }
  }

  // 设置音频的当前播放时间
  setTime(time: number): void {
    if (!this.audioBuffer) {
      console.log('No audio loaded');
      return;
    }

    const wasPlaying = this.isPlaying;

    if (wasPlaying) {
      this.stop();
      this.startOffset = time;
      this.timeOffsetChangeListeners.forEach(callback => callback(time));
      this.play();
    }
  }

  getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  mergeMultipleAudioBuffers(buffers: AudioBuffer[]): AudioBuffer {
    console.log(
      '🚀 ~ file: Player.ts:211 ~ Player ~ mergeMultipleAudioBuffers ~ buffers:',
      buffers,
    );
    // 确定最大的通道数
    const numberOfChannels = Math.max(
      ...buffers.map(buffer => buffer.numberOfChannels),
    );

    // 计算所有buffers的总长度
    const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);

    // 创建新的AudioBuffer
    const newBuffer = this.audioContext.createBuffer(
      numberOfChannels,
      totalLength,
      buffers[0].sampleRate,
    );

    // 按顺序复制每个buffer的数据
    let offset = 0;
    buffers.forEach(buffer => {
      for (let i = 0; i < numberOfChannels; i++) {
        const channelData = newBuffer.getChannelData(i);
        if (i < buffer.numberOfChannels) {
          channelData.set(buffer.getChannelData(i), offset);
        }
      }
      offset += buffer.length;
    });

    return newBuffer;
  }

  // 批量裁剪音频，返回被裁剪掉的部分，同时保留未被裁剪的音频
  batchCropAudio(segments: AudioSegment[]): void {
    if (!this.audioBuffer) {
      console.log('No audio loaded');
      return;
    }
    if (this.playbackState === PlaybackState.Playing) {
      this.stop();
    }
    // 从AudioBuffer中提取原始音频数据
    const audioData = [];

    const { numberOfChannels } = this.audioBuffer;
    for (let i = 0; i < numberOfChannels; i++) {
      audioData.push(this.audioBuffer.getChannelData(i));
    }
    const { sampleRate } = this.audioContext;

    // 向Worker发送音频数据和裁剪信息
    this.audioWorker.postMessage({ audioData, segments, sampleRate });

    // const rate = this.audioBuffer.sampleRate;
    // const channels = this.audioBuffer.numberOfChannels;
    // const croppedBuffers: AudioBuffer[] = [];

    // // 对时间段进行排序
    // segments.sort((a, b) => a.start - b.start);

    // // 初始化裁剪起点
    // let previousEnd = 0;
    // for (const segment of segments) {
    //   // 处理每个裁剪段之前的音频
    //   if (segment.start > previousEnd) {
    //     const frameStart = Math.round(rate * previousEnd);
    //     const frameEnd = Math.round(rate * segment.start);
    //     const frameCount = frameEnd - frameStart;
    //     const buffer = this.audioContext.createBuffer(
    //       channels,
    //       frameCount,
    //       rate,
    //     );

    //     for (let channel = 0; channel < channels; channel++) {
    //       const nowBuffering = buffer.getChannelData(channel);
    //       const originalBuffer = this.audioBuffer.getChannelData(channel);
    //       for (let i = 0; i < frameCount; i++) {
    //         nowBuffering[i] = originalBuffer[i + frameStart];
    //       }
    //     }
    //     croppedBuffers.push(buffer);
    //   }
    //   previousEnd = Math.max(previousEnd, segment.end);
    // }

    // // 处理最后一个裁剪段结束后的音频
    // if (previousEnd < this.audioBuffer.duration) {
    //   const frameStart = Math.round(rate * previousEnd);
    //   const frameEnd = this.audioBuffer.length;
    //   const frameCount = frameEnd - frameStart;
    //   const buffer = this.audioContext.createBuffer(channels, frameCount, rate);

    //   for (let channel = 0; channel < channels; channel++) {
    //     const nowBuffering = buffer.getChannelData(channel);
    //     const originalBuffer = this.audioBuffer.getChannelData(channel);
    //     for (let i = 0; i < frameCount; i++) {
    //       nowBuffering[i] = originalBuffer[i + frameStart];
    //     }
    //   }
    //   croppedBuffers.push(buffer);
    // }

    // // 更新audioBuffer为最后保留的部分
    // this.audioBuffer = this.mergeMultipleAudioBuffers(croppedBuffers);

    // return croppedBuffers;
  }
}

export const player = new Player();

export default Player;

export const getPlayer = (): Player => player;

// export const batchCropAudio = (segments: AudioSegment[]): AudioBuffer[] => {
//   return player.batchCropAudio(segments);
// };

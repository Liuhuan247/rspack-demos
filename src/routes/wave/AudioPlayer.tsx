import React, { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import WaveSurfer from 'wavesurfer.js';

interface IAudioPlayer {
  audioSrc: string;
}

const AudioPlayer = ({ audioSrc }: IAudioPlayer) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [howl, setHowl] = useState<Howl | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // 初始化 Wavesurfer
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current!,
      //   waveColor: 'violet',
      //   progressColor: 'purple',
      //   cursorColor: 'navy',
      // 此属性设置为true将创建镂空效果
      fillParent: true,
      normalize: true,
      height: 200,
      //   pixelRatio: 1, // 依据你的显示需求调整
      // 以下是镂空效果的关键配置
      barWidth: 2, // 或者根据你的需要调整
      barGap: 2, // 波形之间的间隙，增大它会创建镂空效果
      //   waveColor: 'transparent',
      //   progressColor: 'transparent',
      //   renderFunction(peaks, ctx) {
      //     console.log(
      //       '🚀 ~ file: AudioPlayer.tsx:22 ~ renderFunction ~ peaks:',
      //       peaks,
      //     );
      //     ctx.fillStyle = 'rgba(16, 16, 20, 1)';
      //     ctx.fillRect(0, 0, 100, 256);
      //     ctx.beginPath();
      //     ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
      //     ctx.stroke();
      //     ctx.fill();
      //     ctx.closePath();
      //     // ctx.globalCompositeOperation = 'destination-out';
      //   },
    });

    // 加载音频
    wavesurferRef.current.load(audioSrc);

    // 初始化 Howler
    const sound = new Howl({
      src: [audioSrc],
    });

    setHowl(sound);

    // 清理
    return () => {
      wavesurferRef.current?.destroy();
      sound.unload();
    };
  }, [audioSrc]);

  const togglePlayPause = () => {
    if (playing) {
      howl?.pause();
      wavesurferRef.current?.pause();
    } else {
      howl?.play();
      wavesurferRef.current?.play();
    }
    setPlaying(!playing);
  };

  // 同步 Howler 和 Wavesurfer 的播放进度
  useEffect(() => {
    if (howl) {
      howl.on('play', () => {
        wavesurferRef.current?.seekTo(howl.seek() / howl.duration());
      });
    }
  }, [howl]);

  return (
    <div>
      <div id="waveform" ref={waveformRef}></div>
      <button onClick={togglePlayPause}>{playing ? 'Pause' : 'Play'}</button>
      {/* <div>
        <WaveformCanvas />
      </div> */}
    </div>
  );
};

export default AudioPlayer;

export const WaveformCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (audioFile) {
      processAudioFile(audioFile);
    }
  }, [audioFile]);

  const processAudioFile = (file: File) => {
    if (audioContextRef.current) {
      audioContextRef.current.close(); // Close the previous context if it exists
    }
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      if (reader.result) {
        audioContext.decodeAudioData(reader.result as ArrayBuffer, buffer => {
          drawWaveform(buffer);
        });
      }
    };
  };

  const drawWaveform = (audioBuffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      const channelData = audioBuffer.getChannelData(0); // Use the first channel
      const bufferLength = channelData.length;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Fill the canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Set the composite operation for hollow effect
      ctx.globalCompositeOperation = 'destination-out';

      // Set the line color and width
      ctx.strokeStyle = 'rgb(255, 255, 255)';
      ctx.lineWidth = 1;

      // Calculate the width of each segment of the waveform to be drawn
      const sliceWidth = WIDTH / bufferLength;

      // Start drawing the waveform
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        const x = i * sliceWidth;
        const y = (channelData[i] * HEIGHT) / 2 + HEIGHT / 2; // Center the waveform in the canvas

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Restore composite operation to default
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      setAudioFile(event.target.files[0]);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="audio/*" />
      <canvas ref={canvasRef} width={1120} height={240} />
    </div>
  );
};

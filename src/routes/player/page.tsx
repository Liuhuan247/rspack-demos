import { useEffect, useRef, useState } from 'react';
import forage from 'localforage';
import { Button, Space } from 'antd';
// import { createWorkerFactory } from '@shopify/web-worker';
import Player, { PlaybackState } from './utils/Player';

// const createWorker = createWorkerFactory(() => import('./utils/Player'));
// const worker = createWorker();

const PlayerComponent = () => {
  const [, setInputValue] = useState<FileList | null>(null);
  const durationRef = useRef<number>(0);
  const bufferRef = useRef<ArrayBuffer | null>(null);
  const playerRef = useRef<Player>(new Player());
  const [currentTime, setTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<PlaybackState>(
    PlaybackState.Stopped,
  );
  useEffect(() => {
    (async () => {
      playerRef.current?.onPlaybackStateChange(isPlaying => {
        console.log(
          '🚀 ~ file: page.tsx:15 ~ playerRef.current?.onPlaybackStateChange ~ isPlaying:',
          isPlaying,
        );
        setIsPlaying(isPlaying);
      });
      // console.log(
      //   '🚀 ~ file: page.tsx:20 ~ useEffect ~ worker.default;:',
      //   playerRef.current,
      // );
    })();
  }, []);
  // useEffect(() => {
  //   forage
  //     .getItem<ArrayBuffer>('inputBuffer')
  //     .then((buffer: ArrayBuffer | null) => {
  //       if (buffer) {
  //         console.log(
  //           '🚀 ~ file: page.tsx:15 ~ forage.getItem<ArrayBuffer> ~ buffer:',
  //           buffer,
  //         );
  //         bufferRef.current = buffer;
  //         playerRef.current?.loadArrayBuffer(buffer).then(() => {
  //           console.log(
  //             '🚀 ~ file: page.tsx:15 ~ playerRef.current?.loadArrayBuffer ~ playerRef.current?.duration',
  //             playerRef.current?.getDuration(),
  //           );
  //         });
  //       }
  //     });
  // }, []);
  return (
    <div className="container">
      <input
        type="file"
        accept="audio/*"
        onChange={e => {
          console.log('🚀 ~ file: page.tsx:18 ~ Player ~ e:', e.target.files);
          setInputValue(e.target.files);
          const file = e.target.files?.[0];
          console.log('🚀 ~ file: page.tsx:61 ~ file:', file);
          if (file) {
            const audio = new Audio(URL.createObjectURL(file));
            const reader = new FileReader();
            audio.addEventListener('loadedmetadata', () => {
              durationRef.current = audio.duration * 1000;
              console.log(
                '🚀 ~ file: page.tsx:25 ~ audio.addEventListener ~ audio.duration',
                audio.duration * 1000,
              );
            });
            reader.onload = async function (e) {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              console.log(
                '🚀 ~ file: page.tsx:25 ~ reader.onload ~ arrayBuffer:',
                arrayBuffer,
              );
              if (arrayBuffer) {
                bufferRef.current = arrayBuffer;
                forage.setItem(file.name, arrayBuffer.slice(0));
                await playerRef.current?.loadArrayBuffer(arrayBuffer.slice(0));
                console.log('loadArrayBuffer');
              }
            };
            reader.readAsArrayBuffer(file);
          }
        }}
      />
      <Space>
        <Button
          onClick={async () => {
            // const array = [];
            // for (let i = 0; i < 300; i++) {
            //   array.push({ start: i * 2, end: i * 2 + 1 });
            // }
            // console.log('🚀 ~ file: page.tsx:91 ~ onClick={ ~ array:', array);
            // playerRef.current?.batchCropAudio(array);
            // await worker.batchCropAudio(array);
            // await worker.batchCropAudio([
            //   { start: 0, end: 10 },
            //   { start: 15, end: 20 },
            // ]);
            playerRef.current?.batchCropAudio([{ start: 0, end: 10 }]);
            // playerRef.current?.playCroppedSegment(0);
          }}
        >
          裁剪
        </Button>
        <Button
          onClick={() => {
            if (isPlaying === PlaybackState.Playing) {
              playerRef.current?.pause();
            } else {
              playerRef.current?.play();
              playerRef.current?.onPlaying(time => {
                setTime(parseInt(`${time}`, 10));
              });
              playerRef.current?.onTimeOffsetChange(time => {
                // setTime(parseInt(`${time}`, 10));
                console.log(
                  '🚀 ~ file: page.tsx:96 ~ PlayerComponent ~ time:',
                  time,
                );
              });
            }
          }}
        >
          {isPlaying}
        </Button>
        <Button
          onClick={() => {
            playerRef.current?.setTime(20);
          }}
        >
          从20S开始播放
        </Button>
      </Space>
      <div>{currentTime}</div>
    </div>
  );
};
export default PlayerComponent;

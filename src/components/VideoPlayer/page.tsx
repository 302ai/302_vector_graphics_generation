import { useAtom } from 'jotai';
import { userAtom } from '@/stores';
import { Button } from '../ui/button';
import { AiOutlineDelete } from 'react-icons/ai';
import { IoDownloadOutline } from 'react-icons/io5';
import { MdOutlineFileDownload } from "react-icons/md";
import React, { useState, useRef, FC, useEffect } from 'react';
import { BiFullscreen, BiExitFullscreen } from 'react-icons/bi';
import { useMonitorMessage } from '@/hooks/global/use-monitor-message';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { deleteFinishedProductData, getFinishedProductLsit } from '@/api/indexDB/FinishedProductDB';

const VideoPlayer: FC<{ videoUrl?: string, id?: number }> = ({ videoUrl, id }) => {
  const [_, setConfig] = useAtom(userAtom);
  const { handleDownload } = useMonitorMessage();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [volume, setVolume] = useState<number>(1);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    await deleteFinishedProductData(id);
    const newData = await getFinishedProductLsit();
    setConfig((v) => ({ ...v, vectorGraphData: newData }));
  };

  const togglePlay = async () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        await videoRef.current.play();
      } else {
        await videoRef.current.pause();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const onHandleDownload = async () => {
    if (videoUrl) {
      await handleDownload(videoUrl);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full text-sm hover-trigger">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />
      {
        isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 actionBar">
            <div className="flex items-center justify-between gap-5 transition-all">
              <div className='flex items-center gap-2 flex-1'>
                <button onClick={togglePlay} className="">
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-grow"
                />
                <div className="w-max">{formatTime(currentTime)} / {formatTime(duration)}</div>
              </div>
              <div className='flex items-center gap-2'>
                <button onClick={toggleMute} className="relative group z-[2]">
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-[5px] pb-[25px] -z-[1] bg-black bg-opacity-75 p-2 rounded hidden group-hover:block">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-6 h-24 inputRange"
                    />
                  </div>
                </button>
                <MdOutlineFileDownload onClick={onHandleDownload} className='text-[20px] cursor-pointer' />
                <button onClick={toggleFullscreen} className="text-lg">
                  {isFullscreen ? <BiExitFullscreen /> : <BiFullscreen />}
                </button>
              </div>
            </div>
          </div>
        )
      }
      {!isPlaying && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <FaPlay className="text-6xl text-white" />
        </div>
      )}
      {!isPlaying && (
        <div className="absolute right-0 top-0 flex gap-2 p-2 justify-between w-full" >
          <Button variant="icon" size="sm" onClick={onHandleDownload}>
            <IoDownloadOutline className="text-xl text-[#8e47f0]" />
          </Button>
          <Button variant="icon" size="sm" onClick={onDelete}>
            <AiOutlineDelete className="text-xl text-red-600" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
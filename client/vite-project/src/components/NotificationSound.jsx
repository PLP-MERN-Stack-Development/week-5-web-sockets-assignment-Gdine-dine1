import React, { forwardRef, useImperativeHandle, useRef } from 'react';

const NotificationSound = forwardRef((props, ref) => {
  const audioRef = useRef();

  useImperativeHandle(ref, () => ({
    play: () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    },
  }));

  // Using a reliable, short notification sound from notificationsounds.com
  return (
    <audio ref={audioRef} src="https://notificationsounds.com/storage/sounds/file-sounds-1151-pristine.mp3" preload="auto" style={{ display: 'none' }} />
  );
});

export default NotificationSound; 
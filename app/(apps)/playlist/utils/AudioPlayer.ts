'use client';
import { IS_SERVER } from '@/constants';

class AudioPlayer {
    static audio: HTMLAudioElement = IS_SERVER ? null! : new Audio();

    get volume() {
        return AudioPlayer.audio.volume;
    }

    set volume(value: number) {
        AudioPlayer.audio.volume = value;
    }

    static shift(url: string, autoPlay: boolean) {
        AudioPlayer.audio.src = url;
        if (autoPlay) AudioPlayer.play();
    }

    static play() {
        AudioPlayer.audio.play();
    }

    static pause() {
        AudioPlayer.audio.pause();
    }

    static replay() {
        AudioPlayer.audio.currentTime = 0;
        AudioPlayer.play();
    }
}

export default AudioPlayer;

# Playlist 模块开发规范

本文档总结了 Playlist 模块的组件编写规范、CSS 使用规范和接口调用规范。

## 目录结构

```
app/(apps)/playlist/
├── layout.tsx              # 布局组件
├── page.tsx                # 首页
├── style.css               # 全局样式
├── [playlistId]/           # 播放列表详情页
│   ├── page.tsx
│   └── effect.ts           # 客户端副作用组件
├── components/             # 公共组件
│   ├── Cover/
│   ├── LyricToggle/
│   ├── LyricView/
│   ├── MusicPanel/
│   ├── PlayButton/
│   ├── control/
│   └── player/
├── contexts/               # 状态管理
│   └── usePlayerStore.ts
├── utils/                  # 工具函数
│   ├── index.ts
│   ├── AudioPlayer.ts
│   └── apple-music.ts
├── data/                   # 数据管理页面
│   ├── components/
│   ├── containers/
│   └── ...
└── song/                   # 歌曲详情页
```

---

## 一、组件编写规范

### 1.1 组件文件结构

每个组件采用**文件夹形式**组织，包含以下文件：

```
ComponentName/
├── index.tsx           # 组件主文件
├── style.module.css    # 组件样式（CSS Modules）
└── animation.ts        # 动画逻辑（可选）
```

### 1.2 组件导出规范

-   **单组件文件夹**：使用 `index.tsx` 作为入口，默认导出组件
-   **多组件文件夹**：使用 `index.ts` 统一导出

```typescript
// components/player/index.ts
export { default as PlayerControl } from './PlayerControl';
export { default as PlayButton } from './PlayButton';
export { default as Previous } from './Previous';
export { default as Next } from './Next';
export { default as Shuffle } from './Shuffle';
export { default as ModeSwitch } from './ModeSwitch';
```

### 1.3 组件 Props 规范

-   使用 TypeScript `interface` 定义 Props
-   组件通常接受 `className` 属性以支持外部样式覆盖
-   使用 `clsx` 库合并类名

```tsx
import clsx from 'clsx';
import styles from './style.module.css';

interface Props {
    className?: string;
    url?: string | null;
    size?: number;
}

const Cover = ({ className, url, size = 200 }: Props) => {
    return (
        <div className={clsx(styles.cover, className)}>
            {url && <img src={url} alt="cover" />}
        </div>
    );
};

export default Cover;
```

### 1.4 客户端组件标记

-   需要使用浏览器 API 或状态的组件，需在文件顶部添加 `'use client'` 指令

```tsx
'use client';
import { useState, useEffect } from 'react';
```

### 1.5 服务端/客户端分离

-   使用 `next/dynamic` 动态导入客户端组件
-   使用 Effect 组件模式处理服务端数据初始化

```tsx
// page.tsx - 服务端组件
import dynamic from 'next/dynamic';
import Effect from './effect';

const MusicPanel = dynamic(() => import('../components/MusicPanel'), {
    ssr: false,
});

export default async function Page({ params }: Props) {
    const playlist = await serverFetch(
        API.playlist.playlist(params.playlistId),
    );
    return (
        <>
            <MusicPanel />
            <Effect playlist={playlist} />
        </>
    );
}
```

```tsx
// effect.ts - 客户端副作用组件
'use client';
import { useEffect } from 'react';
import usePlayerStore from '../contexts/usePlayerStore';

interface Props {
    playlist: Playlist;
}

const Effect = ({ playlist }: Props) => {
    useEffect(() => {
        usePlayerStore.getState().setPlaylist(playlist);
    }, [playlist]);
    return null;
};

export default Effect;
```

### 1.6 SVG 图标处理

将 SVG 图标封装为组件内的对象：

```tsx
const Svg = {
    play: () => (
        <svg viewBox="0 0 32 28" xmlns="http://www.w3.org/2000/svg">
            <path d="..." fillRule="nonzero" />
        </svg>
    ),
    pause: () => (
        <svg viewBox="0 0 32 28" xmlns="http://www.w3.org/2000/svg">
            <path d="..." fillRule="nonzero" />
        </svg>
    ),
};
```

---

## 二、CSS 使用规范

### 2.1 CSS Modules

-   组件样式使用 CSS Modules，文件命名为 `style.module.css`
-   通过 `styles` 对象访问类名

```tsx
import styles from './style.module.css';

<div className={styles.container}>...</div>;
```

### 2.2 CSS 变量

-   使用 CSS 自定义属性（CSS Variables）实现动态样式
-   通过 `style` 属性设置变量值

```tsx
<div
    className={styles.container}
    style={{
        ['--progress' as string]: `${progress}%`,
    }}
>
    ...
</div>
```

```css
.progress {
    width: var(--progress);
}
```

### 2.3 样式组织

组件样式文件结构示例：

```css
/* 容器样式 */
.container {
    display: flex;
    align-items: center;
}

/* 子元素样式 */
.container > img {
    object-fit: fill;
}

/* 状态样式 */
.container.active {
    transform: scale(1.08);
}

/* 响应式样式 */
@media (min-width: 768px) {
    .container {
        font-size: 40px;
    }
}

/* 指针设备样式 */
@media (pointer: fine) {
    .container:hover {
        transform: scale(1.05);
    }
}
```

### 2.4 全局样式

-   全局样式放置在 `style.css` 文件中
-   在 `layout.tsx` 中导入

```tsx
// layout.tsx
import './style.css';

export default function Layout({ children }: Props) {
    return children;
}
```

### 2.5 常用样式技巧

#### 隐藏滚动条

```css
.container {
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
}
```

#### 文本溢出处理

```css
.text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
```

#### 渐变遮罩

```css
.container {
    mask-image: linear-gradient(
        180deg,
        transparent,
        #000 40px,
        #000 50%,
        transparent
    );
}
```

---

## 三、接口调用规范

### 3.1 API 定义

API 定义在 `app/api/playlist.ts` 中，使用 `Rocket` 对象封装请求：

```typescript
import { Rocket } from './fetch';
import { API_PREFIX } from './fetch/constants';

const PlaylistAPI = {
    // 获取播放列表
    playlist: (id: string) =>
        Rocket.get<Playlist>(`${API_PREFIX}/playlist/${id}`),

    // 获取歌曲
    song: (id: string) => Rocket.get<Song>(`${API_PREFIX}/playlist/song/${id}`),

    // 创建播放列表
    createPlaylist: (props: CreatePlaylistProps) =>
        Rocket.post<Playlist>(`${API_PREFIX}/playlist`, props),

    // 更新播放列表
    updatePlaylist: (id: string, props: UpdatePlaylistProps) =>
        Rocket.put<Playlist>(`${API_PREFIX}/playlist/${id}`, props),

    // 删除播放列表
    deletePlaylist: (id: string) =>
        Rocket.delete(`${API_PREFIX}/playlist/${id}`),
};

export default PlaylistAPI;
```

### 3.2 服务端调用

在服务端组件（如 `page.tsx`）中使用 `serverFetch`：

```typescript
import API from '@/api';
import { serverFetch } from '@/api/server';

export default async function Page({ params }: Props) {
    const playlist = await serverFetch(
        API.playlist.playlist(params.playlistId),
    );
    return <div>{playlist.name}</div>;
}
```

### 3.3 客户端调用

在客户端组件中使用 `clientFetch`：

```typescript
import API, { clientFetch } from '@/api';

const fetchSong = async (songId: string) => {
    const song = await clientFetch(API.playlist.song(songId));
    return song;
};
```

### 3.4 类型定义

类型定义在 `app/api/types/playlist.ts` 中：

```typescript
export interface Song {
    id: string;
    name: string;
    artist: string;
    album: string;
    duration: number; // 单位：毫秒
    albumImgUrl: string | null;
    tinyAlbumImgUrl: string | null;
    resources: Array<{
        label: string;
        path: string;
    }>;
    lyrics: object[];
    theme: string | object | null;
    updatedAt: number;
}

export interface Playlist {
    id: string;
    name: string;
    description: string;
    creator: string;
    category: string | null;
    coverImgUrl: string | null;
    songs: PlaylistSongItem[];
    duration: number;
    updatedAt: number;
}
```

---

## 四、状态管理规范

### 4.1 Zustand Store

使用 Zustand 进行状态管理，Store 定义在 `contexts/` 目录下：

```typescript
import { create } from 'zustand';

interface PlayerStore {
    song: Song | null;
    isPlaying: boolean;
    play: () => void;
    pause: () => void;
    // ...
}

const usePlayerStore = create<PlayerStore>()((set, get) => ({
    song: null,
    isPlaying: false,
    play: () => {
        AudioPlayer.play();
    },
    pause: () => {
        AudioPlayer.pause();
    },
    // ...
}));

export default usePlayerStore;
```

### 4.2 Store 使用

在组件中选择性订阅状态：

```typescript
// 单个状态
const isPlaying = usePlayerStore((state) => state.isPlaying);

// 多个状态
const song = usePlayerStore((state) => state.song);
const play = usePlayerStore((state) => state.play);
const pause = usePlayerStore((state) => state.pause);

// 在 Effect 组件中直接获取状态
usePlayerStore.getState().setPlaylist(playlist);
```

### 4.3 服务端兼容

使用 `IS_SERVER` 常量处理服务端渲染：

```typescript
import { IS_SERVER } from '@/constants';

const usePlayerStore = create<PlayerStore>()((set, get) => {
    if (IS_SERVER) return {} as PlayerStore;

    // 客户端逻辑
    return {
        // ...
    };
});
```

---

## 五、动画规范

### 5.1 GSAP 动画

使用 GSAP 库处理复杂动画：

```typescript
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/all';

gsap.registerPlugin(ScrollToPlugin);

class Animation {
    static initPosition(lyricOn: boolean) {
        gsap.set(`.${styles.cover}`, {
            top: cover.top,
            left: cover.left,
            width: cover.width,
            height: cover.height,
        });
    }

    static transition(lyricOn: boolean) {
        gsap.to(`.${styles.cover}`, {
            duration: 0.3,
            ease: 'power2.out',
            ...newPosition,
        });
    }
}
```

### 5.2 动画类封装

将动画逻辑封装为独立的 Class：

```typescript
// animation.ts
class Animation {
    static init(lyric: Lyric, time: number) {
        /* ... */
    }
    static seek(time: number) {
        /* ... */
    }
    static start(getTime: () => number) {
        /* ... */
    }
    static pause() {
        /* ... */
    }
    static destroy() {
        /* ... */
    }
}

export default Animation;
```

---

## 六、工具函数规范

### 6.1 工具函数组织

工具函数放置在 `utils/` 目录下：

```typescript
// utils/index.ts
export const msToDurationNumText = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
```

### 6.2 单例类

对于全局单例（如 AudioPlayer），使用静态类：

```typescript
class AudioPlayer {
    static audio: HTMLAudioElement = IS_SERVER ? null! : new Audio();

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
}

export default AudioPlayer;
```

---

## 七、最佳实践

1. **组件职责单一**：每个组件只负责一个功能
2. **样式隔离**：使用 CSS Modules 避免样式冲突
3. **类型安全**：所有 Props 和状态使用 TypeScript 类型定义
4. **服务端/客户端分离**：明确区分服务端组件和客户端组件
5. **状态最小化**：只在需要的地方订阅状态，避免不必要的重渲染
6. **动画分离**：将复杂动画逻辑抽取到独立文件
7. **API 规范化**：使用统一的 API 调用方式和类型定义

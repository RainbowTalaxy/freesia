'use client';
import API, { clientFetch } from '@/api';
import listStyle from '../styles/list.module.css';
import { PlaylistItem } from '@/api/playlist';
import { useRouter } from 'next/navigation';
import Cover from './Cover';

interface Props {
    playlist: PlaylistItem;
}

const PlaylistListItem = ({ playlist }: Props) => {
    const router = useRouter();

    return (
        <li
            className={listStyle.listItem}
            onClick={() =>
                router.push(`/playlist/data/playlist/${playlist.id}`)
            }
        >
            <Cover url={playlist.tinyCoverImgUrl} size={36} />
            <div className={listStyle.listItemName}>{playlist.name}</div>
            <div
                className={listStyle.listItemAction}
                onClick={async () => {
                    const granted = confirm(`确定删除 ${playlist.name} 吗？`);
                    if (!granted) return;
                    try {
                        await clientFetch(
                            API.playlist.deletePlaylist(playlist.id),
                        );
                        router.refresh();
                    } catch {
                        alert('删除失败');
                    }
                }}
            >
                删 除
            </div>
        </li>
    );
};

export default PlaylistListItem;

'use client';
import API, { clientFetch } from '@/api';
import style from './style.module.css';
import { PlaylistItem } from '@/api/playlist';
import { useRouter } from 'next/navigation';
import Cover from '../Cover';
import { ListItem } from '../List';

interface Props {
    playlist: PlaylistItem;
}

const PlaylistListItem = ({ playlist }: Props) => {
    const router = useRouter();

    return (
        <ListItem
            onClick={() =>
                router.push(`/playlist/data/playlist/${playlist.id}`)
            }
        >
            <Cover url={playlist.tinyCoverImgUrl} size={36} />
            <div className={style.listItemName}>{playlist.name}</div>
            <div
                className={style.listItemAction}
                onClick={async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
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
        </ListItem>
    );
};

export default PlaylistListItem;

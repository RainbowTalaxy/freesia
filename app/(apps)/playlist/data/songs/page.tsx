import API from '@/api';
import { serverFetch } from '@/api/server';
import dayjs from 'dayjs';
import SongActions from './containers/SongActions';
import List from '../components/List';
import SongListItem from '../components/SongListItem';

export default async function Page() {
    const library = await serverFetch(API.playlist.songs());

    return (
        <div className="page">
            <h1>曲库</h1>
            <p>
                上次更新：
                {dayjs(library.updatedAt).format('YYYY年M月D日 HH:mm:ss')}
            </p>
            <SongActions />
            <List>
                {library.songs.map((song) => (
                    <SongListItem key={song.id} song={song} />
                ))}
            </List>
        </div>
    );
}

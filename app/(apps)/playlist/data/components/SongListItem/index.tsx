import { msToDurationText } from '@/(apps)/playlist/utils';
import Cover from '../Cover';
import { ListItem } from '../List';
import style from './SongListItem.module.css';
import { SongItem } from '@/api/playlist';

interface Props {
    song: SongItem;
}

const SongListItem = ({ song }: Props) => {
    return (
        <ListItem>
            <Cover url={song.tinyAlbumImgUrl} size={36} />
            <div className={style.listItemName}>{song.name}</div>
            <div className={style.listItemArtist}>{song.artist}</div>
            <div className={style.listItemDuration}>
                {msToDurationText(song.duration)}
            </div>
        </ListItem>
    );
};

export default SongListItem;

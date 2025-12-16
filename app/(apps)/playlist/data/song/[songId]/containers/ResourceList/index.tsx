'use client';
import Placeholder from '../../../../components/Placeholder';
import List, { ListItem } from '../../../../components/List';
import styles from './style.module.css';
import { Config, Song } from '@/api/playlist';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import ResourceForm from '../ResourceForm';
import API, { clientFetch } from '@/api';
import { Logger } from '@/utils';

interface Props {
    song: Song;
    config: Config;
}

const ResourceList = ({ song, config }: Props) => {
    const router = useRouter();
    const [isResourceFormVisible, setResourceFormVisible] = useState(false);

    return (
        <List header="资源列表">
            {song.resources.length === 0 && (
                <ListItem>
                    <Placeholder>暂无资源</Placeholder>
                </ListItem>
            )}
            {song.resources.map((resource) => (
                <Fragment key={resource.label}>
                    <ListItem>
                        <span
                            className={styles.label}
                            onClick={() =>
                                window.open(
                                    `${config.resourcePrefix}${resource.path}`,
                                )
                            }
                        >
                            {resource.label}
                        </span>
                        <span
                            className={styles.edit}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setResourceFormVisible(true);
                            }}
                        >
                            修 改
                        </span>
                        <span
                            className={styles.delete}
                            onClick={async () => {
                                try {
                                    const granted = confirm(
                                        `确定删除 ${resource.label} ?`,
                                    );
                                    await clientFetch(
                                        API.playlist.removeResourceFromSong(
                                            song.id,
                                            resource.label,
                                        ),
                                    );
                                    router.refresh();
                                } catch (error: any) {
                                    alert(`删除失败：${error.message}`);
                                    Logger.error('删除资源失败', error);
                                }
                            }}
                        >
                            删 除
                        </span>
                    </ListItem>
                    {isResourceFormVisible && (
                        <ResourceForm
                            songId={song.id}
                            resource={resource}
                            onClose={async (newSong) => {
                                if (newSong) router.refresh();
                                setResourceFormVisible(false);
                            }}
                        />
                    )}
                </Fragment>
            ))}
        </List>
    );
};

export default ResourceList;

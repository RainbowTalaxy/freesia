'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import API, { clientFetch } from '@/api';
import { Doc, DocType, Scope, Workspace, WorkspaceItem } from '@/api/luoye';
import { formDate, time } from '@/utils';
import { Button, Input, Select, Toggle } from '@/components/form';
import styles from '../styles/form.module.css';
import Toast from '../components/Notification/Toast';
import Tag from '../components/Tag';
import AITagButton, { aiStyles } from '../components/AIButton';
import { DOCTYPE_OPTIONS, DOCTYPE_OPTIONS_NAME, workSpaceName } from '../configs';

interface Props {
    userId: string;
    workspace?: WorkspaceItem | Workspace | null;
    workspaceItems?: WorkspaceItem[];
    doc?: Doc;
    onClose: (newDoc?: Doc) => Promise<void>;
    onDelete?: () => void;
}

const DocForm = ({ userId, workspace, workspaceItems, doc, onClose, onDelete }: Props) => {
    const nameRef = useRef<HTMLInputElement>(null);
    const workspaceRef = useRef<HTMLSelectElement>(null);
    const scopeRef = useRef<HTMLInputElement>(null);
    const dateRef = useRef<HTMLInputElement>(null);
    const tagInputRef = useRef<HTMLInputElement>(null);
    const [docType, setDocType] = useState<DocType>(DocType.Text);
    const [tags, setTags] = useState<string[]>([]);
    const [aiTags, setAiTags] = useState<string[]>([]);
    const [aiLoading, setAiLoading] = useState(false);

    const handleAddTag = () => {
        const value = tagInputRef.current?.value.trim();
        if (!value) return;
        if (tags.includes(value) || aiTags.includes(value)) {
            Toast.notify('标签已存在');
            return;
        }
        setTags([...tags, value]);
        tagInputRef.current!.value = '';
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handleRemoveAiTag = (tag: string) => {
        setAiTags(aiTags.filter((t) => t !== tag));
    };

    const handleAIGenerate = async () => {
        if (!doc || aiLoading) return;
        setAiLoading(true);
        try {
            const result = await clientFetch(API.luoye.ai.doc.tags(doc.id));
            const newTags = (result.tags as string[]).filter((t) => !tags.includes(t) && !aiTags.includes(t));
            if (newTags.length === 0) {
                Toast.notify('没有生成新的标签');
                return;
            }
            setAiTags((prev) => [...newTags, ...prev]);
        } catch (error: any) {
            Toast.notify(error.message);
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = async () => {
        const props: {
            name: string;
            scope: Scope;
            date: number;
            docType?: DocType;
            workspaces?: string[];
            tags?: string[];
        } = {
            name: nameRef.current!.value,
            scope: scopeRef.current!.checked ? Scope.Public : Scope.Private,
            date: time(dateRef.current!.value),
            tags: [...aiTags, ...tags],
        };
        try {
            let newDoc: Doc;
            if (doc) {
                // 编辑文档：如果工作区选择器存在且值改变,则添加 workspaces 参数
                if (workspaceRef.current && workspaceRef.current.value !== workspace?.id) {
                    props.workspaces = [workspaceRef.current.value];
                }
                newDoc = await clientFetch(API.luoye.updateDoc(doc.id, props));
            } else {
                // 新建文档
                props.docType = docType;
                const workspaceId = workspaceRef.current?.value ?? workspace?.id;
                if (!workspaceId) return Toast.notify('请选择工作区');
                newDoc = await clientFetch(API.luoye.createDoc(workspaceId, props));
            }
            await onClose(newDoc);
        } catch (error: any) {
            Toast.notify(error.message);
        }
    };

    const handleDelete = async () => {
        if (!confirm('确定要删除吗？')) return;
        try {
            await clientFetch(API.luoye.deleteDoc(doc!.id));
            onDelete!();
        } catch (error: any) {
            Toast.notify(error.message);
        }
    };

    useEffect(() => {
        if (doc) {
            nameRef.current!.value = doc.name;
            scopeRef.current!.checked = doc.scope === Scope.Public;
            dateRef.current!.value = formDate(doc.date);
            setDocType(doc.docType);
            setTags(doc.tags ?? []);
        } else if (workspace) {
            scopeRef.current!.checked = workspace.scope === Scope.Public;
        }
    }, [doc, workspace]);

    return createPortal(
        <div className={styles.container}>
            <div className={styles.form}>
                <h2>{doc ? '文档属性' : '新建文档'}</h2>
                {workspaceItems && (
                    <div className={styles.formItem}>
                        <label>
                            <span>*</span>工作区：
                        </label>
                        <Select
                            raf={workspaceRef}
                            options={workspaceItems.map((w) => ({
                                label: workSpaceName(w, userId),
                                value: w.id,
                            }))}
                            defaultValue={workspace?.id ?? workspaceItems[0].id}
                        />
                    </div>
                )}
                <div className={styles.formItem}>
                    <label>标题：</label>
                    <Input raf={nameRef} />
                </div>
                <div className={styles.formItem}>
                    <label>日期：</label>
                    <Input raf={dateRef} type="date" defaultValue={formDate()} />
                </div>
                {!doc && (
                    <div className={styles.formItem}>
                        <label>类型：</label>
                        <div className={styles.options}>
                            {DOCTYPE_OPTIONS.map((t) => (
                                <div
                                    key={t}
                                    className={clsx(styles.option, t === docType && styles.selected)}
                                    onClick={() => setDocType(t)}
                                >
                                    {DOCTYPE_OPTIONS_NAME[t]}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className={styles.formItem}>
                    <label>标签：</label>
                    <div className={styles.tagFormItem}>
                        <div className={styles.tagInputRow}>
                            <Input raf={tagInputRef} placeholder="输入标签" />
                            <Button onClick={handleAddTag}>添加</Button>
                        </div>
                        {(doc || tags.length > 0 || aiTags.length > 0) && (
                            <div className={styles.tagList}>
                                {doc && <AITagButton loading={aiLoading} onClick={handleAIGenerate} />}
                                {aiTags.map((tag) => (
                                    <Tag
                                        key={`ai-${tag}`}
                                        onRemove={() => handleRemoveAiTag(tag)}
                                        className={aiStyles.aiTag}
                                    >
                                        {tag}
                                    </Tag>
                                ))}
                                {tags.map((tag) => (
                                    <Tag key={tag} onRemove={() => handleRemoveTag(tag)}>
                                        {tag}
                                    </Tag>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.formItem}>
                    <label>公开：</label>
                    <Toggle raf={scopeRef} />
                </div>
                <div className={styles.formItem}>
                    <label></label>
                    <div className={styles.options}>
                        <Button type="primary" onClick={handleSubmit}>
                            {doc ? '保 存' : '创 建'}
                        </Button>
                        <Button onClick={() => onClose()}>取 消</Button>
                        {doc && onDelete && (
                            <Button type="danger" onClick={handleDelete}>
                                删 除
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <div className={styles.mask} onClick={() => onClose()} />
        </div>,
        document.body,
    );
};

export default DocForm;

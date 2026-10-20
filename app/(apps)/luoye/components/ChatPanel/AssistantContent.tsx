import { AssistantChatMessage, ToolCallMessage } from '../../ai/chat/types';
import Typewriter from './Typewriter';
import ToolStatus from './ToolStatus';
import ReasoningContent, { type ReasoningControls } from './ReasoningContent';

const AssistantContent = ({
    content,
    sessionId,
    reasoningExpanded,
    onReasoningToggle,
}: {
    content: Array<AssistantChatMessage | ToolCallMessage>;
    sessionId: string | null;
} & ReasoningControls) => {
    return (
        <>
            {content.map((item) => {
                if (item.role === 'tool') {
                    return <ToolStatus key={item.run_id} tool={item} sessionId={sessionId} />;
                }
                return (
                    <div key={item.id}>
                        <ReasoningContent message={item} expanded={reasoningExpanded[item.id]} onToggle={onReasoningToggle} />
                        {!!item.content && <Typewriter content={item.content} />}
                    </div>
                );
            })}
        </>
    );
};

export default AssistantContent;

import { AssistantChatMessage, ToolCallMessage } from '../../ai/chat/types';
import Typewriter from './Typewriter';
import ToolStatus from './ToolStatus';

const AssistantContent = ({
    content,
    sessionId,
}: {
    content: Array<AssistantChatMessage | ToolCallMessage>;
    sessionId: string | null;
}) => {
    return (
        <>
            {content.map((item) => {
                if (item.role === 'tool') {
                    return <ToolStatus key={item.run_id} tool={item} sessionId={sessionId} />;
                }
                return <Typewriter key={item.id} content={item.content} />;
            })}
        </>
    );
};

export default AssistantContent;

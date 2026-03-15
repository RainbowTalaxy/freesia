import { AssistantChatMessage, ToolCallMessage } from '../../ai/chat/types';
import Typewriter from './Typewriter';
import ToolStatus from './ToolStatus';

const AssistantContent = ({ content }: { content: Array<AssistantChatMessage | ToolCallMessage> }) => {
    return (
        <>
            {content.map((item) => {
                if (item.role === 'tool') {
                    return <ToolStatus key={item.run_id} tool={item} />;
                }
                return <Typewriter key={item.id} content={item.content} />;
            })}
        </>
    );
};

export default AssistantContent;

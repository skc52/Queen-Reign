import React from 'react';
import moment from 'moment';
import { Separator } from "@/components/ui/separator"


interface MessageData {
    message: string;
    name: string;
    dateTime: Date;
}

interface MessageProps {
    isOwnMessage: boolean;
    data: MessageData;
}

const Message: React.FC<MessageProps> = ({ isOwnMessage, data }) => {
    console.log(isOwnMessage)
    return (
    <div className={`flex flex-row -gap-1 text-black dark:text-[#FFFFF0] `}>
        <span className='text-left font-bold px-3'>{data.name}</span>
        <p>
            {data.message}
            {/* <span>{data.name} {moment(data.dateTime).fromNow()}</span> */}
        </p>
    </div>


    );
};

export default Message;

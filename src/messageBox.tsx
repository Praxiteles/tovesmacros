import * as React from 'react';
import { IChatBoxState, IMessage } from './chatBox';

interface IMessageBoxState {
    messages: IMessage[];
}

export default class MessageBox extends React.Component<IChatBoxState, IMessageBoxState> {
    private el: HTMLDivElement | null;

    constructor(props: IChatBoxState) {
        super(props);

        this.state = {
            messages: props.messages,
        };
    }

    public componentDidUpdate(prevProps: IChatBoxState) {
        // Scroll to bottom with new message
        if (this.props.messages.length !== prevProps.messages.length) {
            this.scrollBottom();
        }
    }

    public scrollBottom = () => {
        if (this.el === null) {
            return;
        }

        this.el.scrollIntoView({ behavior: 'smooth' });
    }

    public render() {
        return (
            <div className='messages'>
                {this.props.messages.map((msg, i) => (
                    <span key={i}><b>{msg.author}:</b> {msg.content}</span>
                ))}

                {/* Empty div to scroll to */}
                <div ref={el => { this.el = el; }} />
            </div>
        );
    }
}

import * as React from 'react';
import Select from 'react-select';

import * as parse from 'csv-parse';
import 'whatwg-fetch';
import MessageBox from './messageBox';

import './chatBox.css';

/* tslint:disable:no-console */

// Async parse function
function aparse(csv: string): any {
    return new Promise<any>((resolve, reject) => {
        parse(csv, (err, res) => {
            if (err) {
                return reject(err);
            }

            resolve(res);
        });
    });
}

export interface IMessage {
    author: string;
    content: any;
}

export interface ISelectValue {
    label: string;
    value: any;
}

export interface IChatBoxState {
    inputValue: string;
    messages: IMessage[];
    options: any[];
    selectValue: ISelectValue | null;
}

export default class ChatBox extends React.Component<any, IChatBoxState> {
    private blurred: boolean;

    constructor(props: any) {
        super(props);

        this.blurred = false;

        this.state = {
            inputValue: '',
            messages: [],
            options: [],
            selectValue: null,
        };
    }

    public componentDidMount() {
        // Fetch macros
        this.readMacros().catch((e) => {
            console.error('Error reading macros: ' + e);
        });
    }

    public readMacros = async () => {
        // TODO: Temporary URL, will need to fetch from Google Drive
        const res = await fetch('https://cors-anywhere.herokuapp.com/https://transfer.sh/s6LbB/macros.csv',
            { headers: {'X-Requested-With': 'https://github.com/RobRendell/gTove'}
        });

        const csv = await res.text();
        const macros: string[][] = await aparse(csv);

        const options = macros.slice(1).map((spell, i) => {
            if (spell[1] !== 'url') {
                return;
            }

            return {
                label: spell[0],
                value: <a target='_blank' href={spell[3]}>{spell[0]}</a>,
            };
        });

        this.setState({
            options: options.filter((el) => el !== undefined),
        });

        console.log('Loaded macros!');
    }

    public handleChange = (value: any, action: any) => {
        if (!value || value.length === 0) {
            return;
        }

        const author = 'author'; // Test name
        const message: IMessage = {
            author,
            content: value.value,
        };

        // Add to array and clear input
        const messages = this.state.messages.concat(message);

        this.setState({
            inputValue: '',
            messages,
            selectValue: null,
        });
    }

    public handleInputChange = (value: string) => {
        // Keep value on blur
        if (this.blurred) {
            return;
        }

        this.setState({
            inputValue: value,
        });
    }

    public handleKeyDown = (e: React.KeyboardEvent<any>) => {
        const { inputValue, messages } = this.state;

        // Send chat
        if (e.key === 'Enter') {
            e.preventDefault();

            const author = 'author'; // Test name
            const message: IMessage = {
                author,
                content: inputValue,
            };

            // Add to array and clear input
            this.setState({
                inputValue: '',
                messages: messages.concat(message),
            });
        }
    }

    public handleBlur = () => {
        this.blurred = true;
    }

    public handleFocus = () => {
        this.blurred = false;
    }

    public render() {
        return (
            <div className='chatBox'>
                <MessageBox {...this.state} />

                <Select
                    placeholder='Say something'
                    options={this.state.options}
                    value={this.state.selectValue}
                    inputValue={this.state.inputValue}
                    className='chatSelect'
                    menuPlacement='top'
                    onChange={this.handleChange}
                    onKeyDown={this.handleKeyDown}
                    onInputChange={this.handleInputChange}
                    noOptionsMessage={() => null}
                    components={{ DropdownIndicator: null }}
                    onBlur={this.handleBlur}
                    onFocus={this.handleFocus}
                />
            </div>
        );
    }
}

import * as React from 'react';
import Select from 'react-select';

import 'whatwg-fetch';
import MessageBox from './messageBox';
import SheetsApi from './util/sheets';

import './chatBox.css';

/* tslint:disable:no-console */

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
    sheets: SheetsApi | null;
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
            sheets: null,
        };
    }

    public componentDidMount() {
        // Init google api
        (window as any).gapi.load('auth2', () => {
            this.setState({
                sheets: new SheetsApi(this.readMacros),
            });
        });
    }

    public readMacros = async (values: string[][]) => {
        const options = values.slice(1).map((spell, i) => {
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
        let handleAuthClick: (e: any) => void;

        if (!this.state.sheets) {
            handleAuthClick = (e) => null;
        } else {
            handleAuthClick = this.state.sheets.handleAuthClick;
        }

        return (
            <div className='chatBox'>
                <MessageBox {...this.state} />

                <div className='inputArea'>
                    <Select
                        className='chatSelect'
                        placeholder='Say something'
                        options={this.state.options}
                        value={this.state.selectValue}
                        inputValue={this.state.inputValue}
                        menuPlacement='top'
                        onChange={this.handleChange}
                        onKeyDown={this.handleKeyDown}
                        onInputChange={this.handleInputChange}
                        noOptionsMessage={() => null}
                        components={{ DropdownIndicator: null }}
                        onBlur={this.handleBlur}
                        onFocus={this.handleFocus}
                    />

                    <a className='gear' href='#' onClick={handleAuthClick} /*data-tip={true} data-event='click'*/>
                        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'>
                            <path fill='none' d='M0 0h20v20H0V0z'/>
                            <path d='M15.95 10.78c.03-.25.05-.51.05-.78s-.02-.53-.06-.78l1.69-1.32c.15-.12.19-.34.1-.51l-1.6-2.77c-.1-.18-.31-.24-.49-.18l-1.99.8c-.42-.32-.86-.58-1.35-.78L12 2.34c-.03-.2-.2-.34-.4-.34H8.4c-.2 0-.36.14-.39.34l-.3 2.12c-.49.2-.94.47-1.35.78l-1.99-.8c-.18-.07-.39 0-.49.18l-1.6 2.77c-.1.18-.06.39.1.51l1.69 1.32c-.04.25-.07.52-.07.78s.02.53.06.78L2.37 12.1c-.15.12-.19.34-.1.51l1.6 2.77c.1.18.31.24.49.18l1.99-.8c.42.32.86.58 1.35.78l.3 2.12c.04.2.2.34.4.34h3.2c.2 0 .37-.14.39-.34l.3-2.12c.49-.2.94-.47 1.35-.78l1.99.8c.18.07.39 0 .49-.18l1.6-2.77c.1-.18.06-.39-.1-.51l-1.67-1.32zM10 13c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z'/>
                        </svg>
                    </a>
                </div>
            </div>
        );
    }
}

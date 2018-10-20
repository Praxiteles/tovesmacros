import * as React from 'react';
import * as Modal from 'react-modal';
import Select from 'react-select';

import 'whatwg-fetch';
import MessageBox from './messageBox';
import SheetsApi from './util/sheets';

import './chatBox.css';

/* tslint:disable:no-console */
Modal.setAppElement('#root');

export interface IMessage {
    author: string;
    content: any;
}

export interface ISelectValue {
    label: string;
    value: any;
}

interface IMacro {
    sheetKey: number;
    values: string[][];
}

export interface IChatBoxState {
    emptySheets: number;
    inputValue: string;
    macros: IMacro[];
    messages: IMessage[];
    options: ISelectValue[];
    options_backup: ISelectValue[];
    selectValue: ISelectValue | null;
    settingsOpen: boolean,
    sheets: SheetsApi | null;
    spreadsheets: string[];
}

export default class ChatBox extends React.Component<any, IChatBoxState> {
    private blurred: boolean;

    constructor(props: any) {
        super(props);

        this.blurred = false;

        this.state = {
            emptySheets: 0,
            inputValue: '',
            macros: [],
            messages: [],
            options: [],
            options_backup: [],
            selectValue: null,
            settingsOpen: false,
            sheets: null,
            spreadsheets: [],
        };
    }

    public componentDidMount() {
        // Init google api
        (window as any).gapi.load('auth2', () => {
            this.setState({
                sheets: new SheetsApi(this.updateSheets),
            });
        });
    }

    public updateSheets = (url: string, values: string[][]) => {
        const { emptySheets, macros, spreadsheets } = this.state;

        const macro: IMacro = {
            sheetKey: spreadsheets.length,
            values,
        };

        this.setState({
            emptySheets: emptySheets - 1,
            macros: macros.concat(macro),
            spreadsheets: spreadsheets.concat(url),
        });
    }

    public readMacros = async (values: string[][]) => {
        const options = values.map((spell, i) => {
            if (spell[1] !== 'url') {
                return;
            }

            let label = spell[0];

            if (spell[3].includes('roll20')) {
                label += ' (Roll20)';
            } else {
                label += ' (DnD Beyond)';
            }

            return {
                label,
                value: <a target='_blank' href={spell[3]}>{label}</a>,
            };
        });

        const filtered = options.filter((el) => el !== undefined) as ISelectValue[];

        filtered.sort((a, b) => {
            if (a.label > b.label) {
                return 1;
            } else if (a.label < b.label) {
                return -1;
            } else {
                return 0;
            }
        });

        this.setState({
            options: filtered,
            options_backup: filtered,
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

    public openModal = () => {
        this.setState({
            settingsOpen: true,
        });
    }

    public closeModal = () => {
        this.setState({
            emptySheets: 0,
            settingsOpen: false,
        });
    }

    public toggleModal = () => {
        if (this.state.settingsOpen) {
            this.closeModal();
        } else {
            this.openModal();
        }
    }

    public addEmpty = () => {
        this.setState({
            emptySheets: this.state.emptySheets + 1,
        });
    }

    public saveSheets = () => {
        const { macros, spreadsheets } = this.state;

        let combinedMacros: string[][] = [];

        for (let i = 0; i < spreadsheets.length; i++) {
            let macro;

            for (const currMacro of macros) {
                if (currMacro.sheetKey === i) {
                    macro = currMacro;
                    break;
                }
            }

            if (!macro) {
                continue;
            }

            combinedMacros = combinedMacros.concat(macro.values);
        }

        if (combinedMacros.length > 0) {
            this.readMacros(combinedMacros);
        }

        this.closeModal();
    }

    public filterOptions = (candidate: any, input: string): boolean => {
        const { options, options_backup } = this.state;

        if (input === '') {
            this.setState({
                options: options_backup,
            });

            return true;
        }

        if (candidate.label.toLowerCase().includes(input.toLowerCase())) {
            const first: ISelectValue[] = [];
            const end: ISelectValue[] = [];

            for (const option of options_backup) {
                let exact = true;

                for (let i = 0; i < input.length; i++) {
                    if (input[i].toLowerCase() !== option.label[i].toLowerCase()) {
                        exact = false;
                        break;
                    }
                }

                if (exact) {
                    first.push(option);
                } else if (option.label.toLowerCase().includes(input.toLowerCase())) {
                    end.push(option);
                }
            }

            const newOptions = first.concat(end);

            // Check if options is already sorted like newOptions
            let equal = true;
            for (let i = 0; i < newOptions.length; i++) {
                if (newOptions[i].label !== options[i].label) {
                    equal = false;
                    break;
                }
            }

            // Only set state if necessary
            if (!equal) {
                this.setState({
                    options: newOptions,
                });
            }

            return true;
        }

        return false;
    }

    public render() {
        let handleAuthClick: (e: any) => void;

        if (!this.state.sheets) {
            handleAuthClick = (e) => null;
        } else {
            handleAuthClick = this.state.sheets.handleAuthClick;
        }

        const emptySheets = [];
        for (let i = 0; i < this.state.emptySheets; i++) {
            emptySheets.push(
                <div className='sheet' key={i}>
                    <input placeholder='Spreadsheet URL' />
                    <a href='#' onClick={handleAuthClick}>Import</a>
                </div>
            );
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
                        filterOption={this.filterOptions}
                    />

                    <a className='gear' href='#' onClick={this.toggleModal} /*data-tip={true} data-event='click'*/>
                        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'>
                            <path fill='none' d='M0 0h20v20H0V0z'/>
                            <path d='M15.95 10.78c.03-.25.05-.51.05-.78s-.02-.53-.06-.78l1.69-1.32c.15-.12.19-.34.1-.51l-1.6-2.77c-.1-.18-.31-.24-.49-.18l-1.99.8c-.42-.32-.86-.58-1.35-.78L12 2.34c-.03-.2-.2-.34-.4-.34H8.4c-.2 0-.36.14-.39.34l-.3 2.12c-.49.2-.94.47-1.35.78l-1.99-.8c-.18-.07-.39 0-.49.18l-1.6 2.77c-.1.18-.06.39.1.51l1.69 1.32c-.04.25-.07.52-.07.78s.02.53.06.78L2.37 12.1c-.15.12-.19.34-.1.51l1.6 2.77c.1.18.31.24.49.18l1.99-.8c.42.32.86.58 1.35.78l.3 2.12c.04.2.2.34.4.34h3.2c.2 0 .37-.14.39-.34l.3-2.12c.49-.2.94-.47 1.35-.78l1.99.8c.18.07.39 0 .49-.18l1.6-2.77c.1-.18.06-.39-.1-.51l-1.67-1.32zM10 13c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z'/>
                        </svg>
                    </a>
                </div>

                <Modal
                    className='modal'
                    overlayClassName='modalOverlay'
                    isOpen={this.state.settingsOpen}
                >
                    <h2>Spreadsheets</h2>

                    {this.state.spreadsheets.map((s, i) =>
                        <div className='sheet' key={i}>
                            <input defaultValue={s} />
                            <a href='#' onClick={handleAuthClick}>Import</a>
                        </div>
                    )}

                    {emptySheets}

                    <a className='addSheet' href='#' onClick={this.addEmpty}>+</a>
                    <button className='saveSheets' onClick={this.saveSheets}>Save</button>
                </Modal>
            </div>
        );
    }
}

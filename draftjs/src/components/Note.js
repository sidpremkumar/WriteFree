import React from 'react';
import {Editor as DraftEditor, EditorState, RichUtils, convertToRaw, convertFromRaw, } from "draft-js";
import {withRouter} from "react-router-dom";
import { Input, Button, Select} from 'antd';
import request from 'request';
import '../css/note.css';
import GoToDashboardButton from './GoToDashboardButton';
import Speech from "react-speech";

import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import Alert from 'react-s-alert';
import 'react-s-alert/dist/s-alert-default.css';
import 'react-s-alert/dist/s-alert-css-effects/jelly.css';

const Option = Select.Option;

class Note extends React.Component {

    constructor(props) {
        super(props);
        this.state = {isButtonLoading: false, editorState: EditorState.createEmpty(), noteCategory: this.props.location.state.noteData.category, noteHeader: this.props.location.state.noteData.title};
        this.focus = () => this.refs.editor.focus();
        this.onChange = (editorState) => this.setState({editorState});

        this.handleKeyCommand = (command) => this._handleKeyCommand(command);
        this.toggleBlockType = (type) => this._toggleBlockType(type);
        this.toggleInlineStyle = (style) => this._toggleInlineStyle(style);
    }

    _handleKeyCommand(command) {
        const {editorState} = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            this.onChange(newState);
            return true;
        }
        return false;
    }

    _toggleBlockType(blockType) {
        this.onChange(
            RichUtils.toggleBlockType(
                this.state.editorState,
                blockType
            )
        );
    }

    _toggleInlineStyle(inlineStyle) {
        this.onChange(
            RichUtils.toggleInlineStyle(
                this.state.editorState,
                inlineStyle
            )
        );
    }
    componentDidMount(){
        if (this.props.history.location.state.noteData.noteSettings){

            let contentState = this.props.history.location.state.noteData.noteSettings
            console.log("draft obj", contentState)
            this.setState({editorState: EditorState.createWithContent(convertFromRaw((contentState)))});
        }
        if (this.props.location.state.noteData.title){
            let contentState = this.props.location.state.noteData.content
            console.log('got title', contentState)
            this.setState({editorState: EditorState.createWithContent(convertFromRaw((contentState)))});
        }
    }
    saveNote(title, category, noteID, noteContent){
        if(!title){
            this.handleJelly()
        } else {
            const convertedNoteContent = convertToRaw(noteContent)
            const obj = {title, category, noteID, noteContent: convertedNoteContent}
            var saveNote = {
                method: 'POST',
                url: 'http://127.0.0.1:5000/save-note',
                body: JSON.stringify(obj),
                //qs: { title: title, category: category, noteID: noteID, content: convertedNoteContent},
                headers: {'Content-Type': 'application/x-www-form-urlencoded' }
            };
            request(saveNote, function (error, response, body) {
                if (error) throw new Error(error);
                if (response.statusCode === 401){
                    this.setState({errors: body})
                } else {
                }
            }.bind(this));
        }
    }

    speechNote(noteContent){
        var text = '';
        for (var line in noteContent.blocks){
            text = text + (noteContent.blocks[line].text) + ". "
        }
        return text
    }

    renderPDF(noteID){
        window.open("http://www.localhost:5000/renderPDF?noteID="+noteID);
    }
    handleJelly() {
        Alert.error('Please Enter a Note Header!', {
            position: 'top-right',
            effect: 'jelly'
        });
    }

    render() {
        const {editorState} = this.state;
        // let className = 'RichEditor-editor';
        // var contentState = editorState.getCurrentContent();
        // if (!contentState.hasText()) {
        //     if (contentState.getBlockMap().first().getType() !== 'unstyled') {
        //         className += ' RichEditor-hidePlaceholder';
        //     }
        // }
        console.log(convertToRaw(this.state.editorState.getCurrentContent()))
        return (
            <div>
                <Alert stack={true} timeout={3000} />
            <div className="RichEditor-root" id={"textEdiotr"}>
                <Input placeholder={"Note Header"} value={this.state.noteHeader} onChange={noteHeader => this.setState({noteHeader: noteHeader.target.value})}></Input>
                <Input placeholder={"Note Category"} value={this.state.noteCategory} onChange={noteCategory => {this.setState({noteCategory: noteCategory.target.value})}}></Input>
                <Editor
                    spellCheck={true}
                    editorState={editorState}
                    toolbarClassName="rdw-storybook-toolbar"
                    wrapperClassName="rdw-storybook-wrapper"
                    editorClassName="rdw-storybook-editor"
                    onEditorStateChange={this.onChange}

                />
                <Speech
                    text={this.speechNote(convertToRaw(editorState.getCurrentContent()))}
                    displayText={"Text to Speech"}
                    textAsButton={true}
                    voice="Google UK English Female" />

            </div>
                <p> State Representation of Note </p>
                <div>{JSON.stringify(convertToRaw(editorState.getCurrentContent()))}</div>
                <Button onClick={() => this.saveNote(this.state.noteHeader, this.state.noteCategory, this.props.location.state.noteData._id, editorState.getCurrentContent())}>Save Note</Button>
                <GoToDashboardButton/>
                <Button onClick={() => this.renderPDF(this.props.location.state.noteData._id)}>Convert to PDF</Button>

                <div>
                    <Select defaultValue="0.5px" style={{ width: 150 }} onChange={changeWordSpacing}>
                        <Option value="0.5px" disabled>Word Spacing</Option>
                        <Option value="1px">Default</Option>
                        <Option value="10px">10px</Option>
                        <Option value="20px">20px</Option>
                        <Option value="50px">50px</Option>
                    </Select>
                </div>
            </div>
        );
    }
}

// spacing methods
function changeWordSpacing(value) {
    console.log(`selected ${value}`);
    document.getElementById("textEdiotr").style.wordSpacing = value;
}
// value for selection
function changeLineSpacing(value) {
    console.log(`selected ${value}`);
    document.getElementById("textEdiotr").style.lineHeight = value;
}

// Custom overrides for "code" style.
const styleMap = {
    CODE: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
        fontSize: 60,
        padding: 2,
    },
};

function getBlockStyle(block) {
    switch (block.getType()) {
        case 'blockquote': return 'RichEditor-blockquote';
        default: return null;
    }
}

class StyleButton extends React.Component {
    constructor() {
        super();
        this.onToggle = (e) => {
            e.preventDefault();
            this.props.onToggle(this.props.style);
        };
    }

    render() {
        let className = 'RichEditor-styleButton';
        if (this.props.active) {
            className += ' RichEditor-activeButton';
        }

        return (
            <span className={className} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
        );
    }
}

const BLOCK_TYPES = [
    {label: 'H1', style: 'header-one'},
    {label: 'H2', style: 'header-two'},
    {label: 'H3', style: 'header-three'},
    {label: 'H4', style: 'header-four'},
    {label: 'H5', style: 'header-five'},
    {label: 'H6', style: 'header-six'},
    {label: 'Blockquote', style: 'blockquote'},
    {label: 'UL', style: 'unordered-list-item'},
    {label: 'OL', style: 'ordered-list-item'},
    {label: 'Code Block', style: 'code-block'},
];

const BlockStyleControls = (props) => {
    const {editorState} = props;
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();

    return (
        <div className="RichEditor-controls">
            {BLOCK_TYPES.map((type) =>
                <StyleButton
                    key={type.label}
                    active={type.style === blockType}
                    label={type.label}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            )}
        </div>
    );
};

var INLINE_STYLES = [
    {label: 'Bold', style: 'BOLD'},
    {label: 'Italic', style: 'ITALIC'},
    {label: 'Underline', style: 'UNDERLINE'},
    {label: 'Monospace', style: 'CODE'},
];

const InlineStyleControls = (props) => {
    var currentStyle = props.editorState.getCurrentInlineStyle();
    return (
        <div className="RichEditor-controls">
            {INLINE_STYLES.map(type =>
                <StyleButton
                    key={type.label}
                    active={currentStyle.has(type.style)}
                    label={type.label}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            )}
        </div>
    );
};

export default withRouter(Note);

import React from "react";
import {Card, Icon} from "antd";
import '../../css/cardnote.css';
import trash from '../../assets/trashcan.png';

class CardListItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            noteTitle: props.note.title,
            note: props.note,
        };
    }
    displayNoteData(note) {
        this.setState({
            moreNoteData:
                <div>
                    <div>
                        <Icon type="book" theme="filled" style={{'color': "#466fb5"}} />
                        {"  "}
                        {note.category}
                    </div>
                    <div>
                        {note.lastUpdated}
                    </div>
                </div>,
            noteDelete: <img height="40px" width="40px" src={trash} onClick={() => console.log("clicked") } />
        });
    }


    editNote(email, noteID) {
        this.props.history.push({
            pathname: `/note/${noteID}`,
            state: { noteID },
        });
    }

    render() {
        return (
            <div className={"card"}>
                <Card
                    extra={this.state.noteDelete}
                    onClick={() => this.editNote(localStorage.getItem('email'), this.state.note._id)}
                    onMouseEnter={() => this.displayNoteData(this.state.note)}
                    onMouseLeave={() => this.setState({ moreNoteData: undefined, noteDelete: undefined })}
                    style={{ backgroundColor: this.state.note.noteColor, "borderRadius": "10px", "boxShadow": "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)" }}
                >
                    {this.state.noteTitle} <br />
                    <div className={"note-data-below"}>
                        {this.state.moreNoteData}
                    </div>

                </Card>
            </div>
        );
    }
}

export default CardListItem;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const theme_1 = require("@joplin/lib/theme");
const DialogButtonRow_1 = require("../DialogButtonRow");
const locale_1 = require("@joplin/lib/locale");
class MainPwdDialogue extends React.Component {
    constructor(props) {
        super(props);
        this.okButton = React.createRef();
        this.okClicked = (event) => {
            const inputElement = document.getElementById('mainPwdTextField');
            if (event.buttonName === 'ok') {
                this.props.authentication(inputElement.value);
            }
        };
    }
    render() {
        const theme = (0, theme_1.themeStyle)(this.props.themeId);
        return (React.createElement("div", { style: theme.dialogModalLayer },
            React.createElement("div", { style: theme.dialogBox },
                React.createElement("div", { style: theme.dialogTitle }, (0, locale_1._)('Password prompt')),
                React.createElement("div", null,
                    React.createElement("input", { id: "mainPwdTextField", placeholder: (0, locale_1._)('Enter password'), type: "text", style: { width: 200, marginRight: 5, color: theme.color } })),
                React.createElement(DialogButtonRow_1.default, { themeId: this.props.themeId, okButtonRef: this.okButton, onClick: this.okClicked }))));
    }
}
exports.default = MainPwdDialogue;
//# sourceMappingURL=MainPwdDialogue.js.map
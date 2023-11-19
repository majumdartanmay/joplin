import * as React from 'react';
import { themeStyle } from '@joplin/lib/theme';
import DialogButtonRow, { ClickEvent, ClickEventHandler } from '../DialogButtonRow';
import { _ } from '@joplin/lib/locale';

interface MainPwdProps {
	themeId: number;
	authentication(pwd: string): void;
}

interface MainPwdState {
	pwd: string;
}

class MainPwdDialogue extends React.Component<MainPwdProps, MainPwdState> {

	private okButton: any;
	private okClicked: ClickEventHandler;

	public constructor(props: MainPwdProps) {
		super(props);
		this.okButton = React.createRef();
		this.okClicked = (event: ClickEvent) => {
			const inputElement: HTMLInputElement = document.getElementById('mainPwdTextField') as HTMLInputElement;

			if (event.buttonName === 'ok') { this.props.authentication(inputElement.value); }
		};
	}
	public render() {

		const theme = themeStyle(this.props.themeId);

		return (
			<div style={theme.dialogModalLayer}>
				<div style={theme.dialogBox}>
					<div style={theme.dialogTitle}>{_('Password prompt')}</div>
					<div>
						<input
							id = "mainPwdTextField"
							placeholder={_('Enter password')}
							type="text"
							style={{ width: 200, marginRight: 5, color: theme.color }}
						/>
					</div>
					<DialogButtonRow
						themeId={this.props.themeId}
						okButtonRef={this.okButton}
						onClick={this.okClicked}
					/>
				</div>
			</div>
		);
	}
}

export default MainPwdDialogue;

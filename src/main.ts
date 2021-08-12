import { IconPicker } from './ui/iconPicker';
import { App, ButtonComponent, Command, Modal, Notice, Platform, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { addFeatherIcons } from './ui/icons';
import CommandSuggester from './ui/commandSuggester';

interface Macro {
	commandID: string;
	name: string;
	mobileOnly: boolean;
	icon: string;
	delay: number;
	commands: string[];
	command?: Command;
}

interface MacroSettings {
	macros: Macro[];
}

const DEFAULT_SETTINGS: MacroSettings = {
	macros: [],
}

export default class MacroPlugin extends Plugin {
	settings: MacroSettings;
	iconList: string[] = ["any-key", "audio-file", "blocks", "bold-glyph", "bracket-glyph", "broken-link", "bullet-list", "bullet-list-glyph", "calendar-with-checkmark", "check-in-circle", "check-small", "checkbox-glyph", "checkmark", "clock", "cloud", "code-glyph", "create-new", "cross", "cross-in-box", "crossed-star", "csv", "deleteColumn", "deleteRow", "dice", "document", "documents", "dot-network", "double-down-arrow-glyph", "double-up-arrow-glyph", "down-arrow-with-tail", "down-chevron-glyph", "enter", "exit-fullscreen", "expand-vertically", "filled-pin", "folder", "formula", "forward-arrow", "fullscreen", "gear", "go-to-file", "hashtag", "heading-glyph", "help", "highlight-glyph", "horizontal-split", "image-file", "image-glyph", "indent-glyph", "info", "insertColumn", "insertRow", "install", "italic-glyph", "keyboard-glyph", "languages", "left-arrow", "left-arrow-with-tail", "left-chevron-glyph", "lines-of-text", "link", "link-glyph", "logo-crystal", "magnifying-glass", "microphone", "microphone-filled", "minus-with-circle", "moveColumnLeft", "moveColumnRight", "moveRowDown", "moveRowUp", "note-glyph", "number-list-glyph", "open-vault", "pane-layout", "paper-plane", "paused", "pdf-file", "pencil", "percent-sign-glyph", "pin", "plus-with-circle", "popup-open", "presentation", "price-tag-glyph", "quote-glyph", "redo-glyph", "reset", "right-arrow", "right-arrow-with-tail", "right-chevron-glyph", "right-triangle", "run-command", "search", "sheets-in-box", "sortAsc", "sortDesc", "spreadsheet", "stacked-levels", "star", "star-list", "strikethrough-glyph", "switch", "sync", "sync-small", "tag-glyph", "three-horizontal-bars", "trash", "undo-glyph", "unindent-glyph", "up-and-down-arrows", "up-arrow-with-tail", "up-chevron-glyph", "uppercase-lowercase-a", "vault", "vertical-split", "vertical-three-dots", "wrench-screwdriver-glyph"];

	async onload() {
		console.log('loading plugin');

		await this.loadSettings();

		addFeatherIcons(this.iconList);

		this.settings.macros.forEach(macro => {
			const command: Command = {
				id: macro.commandID,
				name: macro.name,
				callback: async () => {
					for (let i = 0; i < macro.commands.length; i++) {
						//@ts-ignore
						this.app.commands.executeCommandById(macro.commands[i]);
						await wait(macro.delay);
					}
				},
				icon: macro.icon,
			}
			this.addCommand(command);
		});

		this.addSettingTab(new MacroSettingsTab(this));
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class MacroSettingsTab extends PluginSettingTab {
	plugin: MacroPlugin;

	constructor(plugin: MacroPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
		addEventListener("M-macroAdded", async (e: CustomEvent) => {
			if (e.detail.wasEdited) {
				console.log("")
				const ids: string[] = [];
				e.detail.commands.forEach((element: string) => {
					ids.push(element);
				});
				let m = this.plugin.settings.macros.find((m) => m.name === e.detail.name.replace(/Macro Plugin: /g, ""));
				console.log(m);
				m = {
					icon: e.detail.icon,
					mobileOnly: e.detail.mobileOnly,
					commandID: e.detail.command.id,
					commands: ids,
					delay: e.detail.delay,
					name: e.detail.name,
				};
				await this.plugin.saveSettings();
				this.display();
			} else {
				const ids: string[] = [];
				e.detail.commands.forEach((element: string) => {
					ids.push(element);
				});
				this.plugin.settings.macros.push({
					mobileOnly: e.detail.mobileOnly,
					icon: e.detail.icon,
					commandID: e.detail.command.id,
					commands: ids,
					delay: e.detail.delay,
					name: e.detail.name,
				});
				await this.plugin.saveSettings();
				this.display();
			}
		});
	}


	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Macro Plugin Settings' });

		new Setting(containerEl)
			.setName("Add new Macro")
			.setDesc("Create a new Group of Commands to execute one after another.")
			.addButton(cb => {
				cb.setButtonText("+")
					.onClick(() => {
						new MacroCreatorModal(this.plugin).open();
					})
			})

		this.plugin.settings.macros.forEach(macro => {
			let dsc = "";
			macro.commands.forEach((c, i) => {
				//@ts-ignore
				dsc += this.app.commands.commands[c].name;
				if (i != macro.commands.length - 1) {
					dsc += ", "
				} else {
					dsc += " | "
				}
			});
			dsc += `(Delay: ${macro.delay})`
			new Setting(containerEl)
				.setName(macro.name)
				.setDesc(dsc)
				.addButton(bt => {
					bt.setButtonText("Edit");
					bt.onClick(() => {
						new MacroCreatorModal(this.plugin, macro).open();
					});
				})
				.addExtraButton(bt => {
					bt.setIcon("trash");
					bt.onClick(async () => {
						this.plugin.settings.macros.remove(macro);
						this.display();
						new Notice("You will need to restart Obsidian to fully remove the Macro.")
						await this.plugin.saveSettings();
					})
				});
		});

		new Setting(containerEl)
			.setName('Donate')
			.setDesc('If you like this Plugin, consider donating to support continued development:')
			.setClass("AT-extra")
			.addButton((bt) => {
				bt.buttonEl.outerHTML = `<a href="https://www.buymeacoffee.com/phibr0"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=phibr0&button_colour=5F7FFF&font_colour=ffffff&font_family=Inter&outline_colour=000000&coffee_colour=FFDD00"></a>`;
			});
	}
}

class MacroCreatorModal extends Modal {
	plugin: MacroPlugin;
	command: any;
	delay: number; //in ms
	name: string;
	coms: string[] = [];
	mobileOnly: boolean;
	editing: boolean;

	constructor(plugin: MacroPlugin, macro?: Macro) {
		super(plugin.app);
		this.plugin = plugin;
		this.command = macro?.command ?? {};
		this.delay = macro?.delay ?? 10;
		this.name = macro?.name;
		this.coms = macro?.commands ?? [];
		this.mobileOnly = macro?.mobileOnly ?? false;
		if (macro) {
			this.editing = true;
		} else {
			this.editing = false;
		}
		addEventListener("M-iconPicked", (e: CustomEvent) => {
			this.command.icon = e.detail.icon;
			this.display();
		});
		addEventListener("M-commandAdded", (e: CustomEvent) => {
			this.coms.push(e.detail.command);
			this.display();
		});
	}

	onOpen() {
		super.onOpen();
		this.display();
	}

	display() {
		const { contentEl: el } = this;
		const command = this.command as Command;
		el.empty();
		this.titleEl.setText("Add a new Macro")

		new Setting(el)
			.setName("Name")
			.setDesc("Specify the Name of your brand new Macro.")
			.addText(cb => {
				cb.setValue(command?.name?.replace(/Macro Plugin: /g, "") ?? "")
					.setPlaceholder("Super duper Macro")
					.setValue(this.name)
					.setDisabled(this.editing)
					.onChange(value => {
						this.name = value.trim().replace(/Macro Plugin: /g, "");
						command.name = value.trim().replace(/Macro Plugin: /g, "");
						command.id = value.trim().replace(/Macro Plugin: /g, "").replace(" ", "-").toLowerCase();
					});
			});

		new Setting(el)
			.setName("Icon")
			.setDesc("Pick an Icon for your Macro.")
			.addButton(bt => {
				bt.setDisabled(this.editing);
				if (command.icon) {
					bt.setIcon(command.icon);
				} else {
					bt.setButtonText("Pick Icon");
				}
				bt.onClick(() => {
					new IconPicker(this.plugin).open();
				});
			});

		if (Platform.isMobile) {
			new Setting(el)
				.setName("Mobile Only?")
				.setDesc("Is this Macro Mobile only?")
				.addToggle(cb => {
					cb.setDisabled(this.editing);
					cb.setValue(command.mobileOnly)
					cb.onChange((value) => {
						this.command.mobileOnly = value;
						this.mobileOnly = value;
					})
				});
		}

		new Setting(el)
			.setName("Delay")
			.setDesc("Specify a Delay between every Command.")
			.addSlider(cb => {
				cb.setDisabled(this.editing);
				cb.setDynamicTooltip()
					.setLimits(10, 2000, 10)
					.setValue(this.delay)
					.onChange(value => {
						this.delay = value;
					});
			});

		new Setting(el)
			.setName("Add Command")
			.setDesc("Add a Command to your Macro.")
			.addButton(cb => {
				cb.setButtonText("+")
					.onClick(() => {
						new CommandSuggester(this.plugin).open()
					})
			});

		const commandsEl = el.createDiv({ cls: "M-commands" })
		this.coms.forEach(c => {
			new Setting(commandsEl)
				//@ts-ignore
				.setName(this.app.commands.commands[c].name)
				.addButton(cb => {
					cb.setIcon("trash")
						.onClick(() => {
							this.coms.remove(c);
							this.display();
						})
				});
		});

		const btnDiv = el.createDiv({ cls: "M-flex-center" })
		if (this.editing) {
			const btn = createEl("button", { text: "Finish" })
			btnDiv.appendChild(btn);
			btn.addEventListener("click", () => {
				const c = this.command as Command;
				c.callback = async () => {
					for (let i = 0; i < this.coms.length; i++) {
						//@ts-ignore
						this.plugin.app.commands.executeCommandById(this.coms[i]);
						await wait(this.delay);
					}
				}
				dispatchEvent(new CustomEvent("M-macroAdded", {
					detail: {
						icon: this.command.icon,
						mobileOnly: this.mobileOnly,
						command: c,
						delay: this.delay,
						commands: this.coms,
						name: this.name,
						wasEdited: this.editing,
					}
				}));
				this.close();
			});
		} else {
			if (this.coms.length >= 2 && command.name && command.icon) {
				const cbtn = createEl("button", { text: "Create Macro" })
				btnDiv.appendChild(cbtn);
				cbtn.addEventListener("click", () => {
					this.addCommand();
				});
			}
			const btn = createEl("button", { text: "Cancel" })
			btnDiv.appendChild(btn);
			btn.addEventListener("click", () => {
				this.close();
			});
		}
	}

	addCommand() {
		const c = this.command as Command;
		c.callback = async () => {
			for (let i = 0; i < this.coms.length; i++) {
				//@ts-ignore
				this.plugin.app.commands.executeCommandById(this.coms[i]);
				await wait(this.delay);
			}
		}
		this.plugin.addCommand(c);
		dispatchEvent(new CustomEvent("M-macroAdded", {
			detail: {
				icon: this.command.icon,
				mobileOnly: this.mobileOnly,
				command: c,
				delay: this.delay,
				commands: this.coms,
				name: this.name,
				wasEdited: this.editing,
			}
		}));
		this.close();
	}

}

async function wait(delay: number) {
	return new Promise(resolve => setTimeout(resolve, delay));
}
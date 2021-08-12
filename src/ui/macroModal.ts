import { Modal, Command, Setting, Platform } from "obsidian";
import MacroPlugin from "src/main";
import { Macro } from "src/types";
import { wait } from "src/util";
import CommandSuggester from "./commandSuggester";
import { IconPicker } from "./iconPicker";

export default class MacroCreatorModal extends Modal {
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
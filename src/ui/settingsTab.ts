import { PluginSettingTab, Setting, Notice } from "obsidian";
import MacroPlugin from "src/main";
import MacroCreatorModal from "./macroModal";

export default class MacroSettingsTab extends PluginSettingTab {
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
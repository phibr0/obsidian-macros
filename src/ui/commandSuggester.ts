import { FuzzySuggestModal, Command } from "obsidian";
import CustomSidebarPlugin from "src/main";

export default class CommandSuggester extends FuzzySuggestModal<Command> {

	constructor(private plugin: CustomSidebarPlugin) {
		super(plugin.app);
	}

	getItems(): Command[] {
		//@ts-ignore
		return this.app.commands.listCommands();
	}

	getItemText(item: Command): string {
		return item.name;
	}

	async onChooseItem(item: Command, evt: MouseEvent | KeyboardEvent): Promise<void> {
		this.close();
        setTimeout(() => {
            dispatchEvent(new CustomEvent("M-commandAdded", {detail: {command: item.id}}));
        }, 100);
	}

}
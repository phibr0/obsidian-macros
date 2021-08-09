import { Command, FuzzyMatch, FuzzySuggestModal, setIcon } from "obsidian";
import MacroPlugin from "src/main";

export class IconPicker extends FuzzySuggestModal<string>{
    plugin: MacroPlugin;

    constructor(plugin: MacroPlugin) {
        super(plugin.app);
        this.plugin = plugin;
        this.setPlaceholder("Pick an Icon");
    }

    private cap(string: string): string {
        const words = string.split(" ");

        return words.map((word) => {
            return word[0].toUpperCase() + word.substring(1);
        }).join(" ");
    }

    getItems(): string[] {
        return this.plugin.iconList;
    }

    getItemText(item: string): string {
        return this.cap(item.replace("feather-", "").replace(/-/ig, " "));
    }

    renderSuggestion(item: FuzzyMatch<string>, el: HTMLElement): void {
        el.addClass("M-icon-container");
        const div = createDiv({ cls: "M-icon" });
        el.appendChild(div);
        setIcon(div, item.item);
        super.renderSuggestion(item, el);
    }

    async onChooseItem(item: string): Promise<void> {
        this.close();
        setTimeout(() => {
            dispatchEvent(new CustomEvent("M-iconPicked", {detail: {icon: item}}));
        }, 100);
    }

}

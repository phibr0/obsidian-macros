import { Command } from "obsidian";

export interface Macro {
	commandID: string;
	name: string;
	mobileOnly: boolean;
	icon: string;
	delay: number;
	commands: string[];
	command?: Command;
}

export interface MacroSettings {
	macros: Macro[];
}

export const DEFAULT_SETTINGS: MacroSettings = {
	macros: [],
}
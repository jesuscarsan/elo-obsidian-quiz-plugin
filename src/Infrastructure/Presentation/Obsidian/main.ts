import { Plugin, WorkspaceLeaf } from 'obsidian';
import { ChatView, VIEW_TYPE_CHAT } from './Views/Chat/ChatView';
import { GenerateHeaderMetadataCommand } from './Commands/GenerateHeaderMetadataCommand';
import { ObsidianSettingsAdapter } from '../../Adapters/Obsidian/ObsidianSettingsAdapter';
import { ObsidianNoteManager } from '@elo/obsidian-plugin';
import { IGeminiSessionAdapter, GoogleGeminiChatAdapter, GoogleGeminiAdapter } from '@elo/core';

interface QuizPluginSettings {
    geminiApiKey: string;
    geminiRolesFolder: string;
    geminiLiveRole: string;
    geminiLiveMode: 'gemini_live_voice_text' | 'gemini_live_voice_only' | 'local_voice_text' | 'local_voice_only' | 'text_only';
    geminiLiveUserMode: 'voice_text' | 'text_only' | 'voice_only';
    geminiLiveLocalVoice: string;
    userLanguage: string;
    toLearnLanguage: string;
}

const DEFAULT_SETTINGS: QuizPluginSettings = {
    geminiApiKey: '',
    geminiRolesFolder: '/',
    geminiLiveRole: '',
    geminiLiveMode: 'gemini_live_voice_text',
    geminiLiveUserMode: 'voice_text',
    geminiLiveLocalVoice: '',
    userLanguage: 'es',
    toLearnLanguage: 'en',
};

export default class QuizPlugin extends Plugin {
    settings: QuizPluginSettings = DEFAULT_SETTINGS;
    llm!: GoogleGeminiAdapter;

    async onload() {
        await this.loadSettings();
        this.llm = new GoogleGeminiAdapter(this.settings.geminiApiKey);

        this.registerView(
            VIEW_TYPE_CHAT,
            (leaf) => {
                const view = new ChatView(leaf);
                view.setPlugin(this);
                return view;
            }
        );

        this.addCommand({
            id: 'open-chat-quiz-view',
            name: 'Open Chat/Quiz View',
            callback: () => {
                this.activateView();
            },
        });

        // Register other commands
        const noteManager = new ObsidianNoteManager(this.app);
        // Commands can be registered here if they don't need view state
        new GenerateHeaderMetadataCommand(this.app).register(this);
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHAT);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: VIEW_TYPE_CHAT, active: true });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    onunload() {
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

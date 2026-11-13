<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="note == null" :class="$style.deleted">
	{{ i18n.ts.deletedNote }}
</div>
<div v-else-if="!muted" :class="[$style.root, { [$style.children]: depth > 1, [$style.replyItem]: detail }]" :data-note-connected="connected ? '' : undefined">
	<div :class="$style.main">
		<div v-if="note.channel" :class="$style.colorBar" :style="{ background: note.channel.color }"></div>
		<div :class="$style.avatarContainer">
			<MkAvatar :class="$style.avatar" :user="note.user" link preview/>
			<div v-if="replies.length > 0" :class="$style.threadLine" aria-hidden="true"></div>
		</div>
		<div :class="$style.body">
			<MkNoteHeader :class="$style.header" :note="note" :mini="true"/>
			<div>
				<p v-if="note.cw != null" :class="$style.cw">
					<Mfm v-if="note.cw != ''" style="margin-right: 8px;" :text="note.cw" :author="note.user" :nyaize="'respect'"/>
					<MkCwButton v-model="showContent" :text="note.text" :files="note.files" :poll="note.poll"/>
				</p>
				<div v-show="note.cw == null || showContent">
					<MkSubNoteContent :class="$style.text" :note="note"/>
				</div>
			</div>
		</div>
	</div>
	<template v-if="depth < 5">
		<MkNoteSub v-for="reply in replies" :key="reply.id" :note="reply" :class="[$style.reply, { [$style.single]: replies.length === 1 }]" :detail="true" :depth="depth + 1"/>
	</template>
	<div v-else :class="$style.more">
		<MkA class="_link" :to="notePage(note)">{{ i18n.ts.continueThread }} <i class="ti ti-chevron-double-right"></i></MkA>
	</div>
</div>
<div v-else :class="$style.muted" @click="muted = false">
	<I18n :src="i18n.ts.userSaysSomething" tag="small">
		<template #name>
			<MkA v-user-preview="note.userId" :to="userPage(note.user)">
				<MkUserName :user="note.user"/>
			</MkA>
		</template>
	</I18n>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkNoteHeader from '@/components/MkNoteHeader.vue';
import MkSubNoteContent from '@/components/MkSubNoteContent.vue';
import MkCwButton from '@/components/MkCwButton.vue';
import { notePage } from '@@/js/note.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import { userPage } from '@@/js/user.js';
import { checkWordMute } from '@/utility/check-word-mute.js';

const props = withDefaults(defineProps<{
	note: Misskey.entities.Note | null;
	detail?: boolean;
	connected?: boolean;

	// how many notes are in between this one and the note being viewed in detail
	depth?: number;
}>(), {
	depth: 1,
});

const muted = ref(props.note && $i ? checkWordMute(props.note, $i, $i.mutedWords) : false);

const showContent = ref(false);
const replies = ref<Misskey.entities.Note[]>([]);

if (props.detail && props.note) {
	misskeyApi('notes/children', {
		noteId: props.note.id,
		limit: 5,
	}).then(res => {
		replies.value = res;
	});
}
</script>

<style lang="scss" module>
.root {
	--MI-noteSubAvatar: 48px;
	--MI-noteSubInsetX: 32px;
	--MI-noteSubInsetY: 18px;
	--MI-noteSubAvatarGap: 14px;
	--MI-noteSubThread: var(--MI_THEME-thread, var(--MI_THEME-divider));
	padding: var(--MI-noteSubInsetY) var(--MI-noteSubInsetX);
	position: relative;

	&.children {
		padding: 10px 0 0 8px;
	}

	&.replyItem {
		// [custom] Sharkey uses smaller avatars for the detail-page reply list.
		--MI-noteSubAvatar: clamp(26px, -8.6154px + 7.6923cqi, 36px);
	}
}

.root[data-note-connected]::after {
	content: '';
	position: absolute;
	left: calc(var(--MI-noteSubInsetX) + .5 * var(--MI-noteSubAvatar));
	top: calc(var(--MI-noteSubInsetY) + var(--MI-noteSubAvatar));
	bottom: calc(-1 * var(--MI-noteSubConnectionGap, var(--MI-noteSubInsetY)));
	border-left: 2px solid var(--MI-noteSubThread);
	pointer-events: none;
}

.main {
	display: flex;
}

.avatarContainer {
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	margin-right: var(--MI-noteSubAvatarGap);
}

.threadLine {
	flex-grow: 1;
	margin-left: calc(.5 * var(--MI-noteSubAvatar));
	border-left: 2px solid var(--MI-noteSubThread);
}

.colorBar {
	position: absolute;
	top: 8px;
	left: 8px;
	width: 5px;
	height: calc(100% - 8px);
	border-radius: 999px;
	pointer-events: none;
}

.avatar {
	flex-shrink: 0;
	display: block;
	width: var(--MI-noteSubAvatar);
	height: var(--MI-noteSubAvatar);
	border-radius: var(--MI-noteQuoteRadius);
}

.body {
	flex: 1;
	min-width: 0;
}

.header {
	margin-bottom: 2px;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.text {
	margin: 0;
	padding: 0;
}

.reply, .more {
	margin-top: 10px;
}

.reply.root {
	margin-left: calc(.5 * var(--MI-noteSubAvatar));

	&:not(:last-child) {
		border-left: 2px solid var(--MI-noteSubThread);
	}

	&::before {
		content: '';
		position: absolute;
		left: -2px;
		top: -10px;
		height: calc(20px + .5 * var(--MI-noteSubAvatar));
		width: 15px;
		border-left: 2px solid var(--MI-noteSubThread);
		border-bottom: 2px solid var(--MI-noteSubThread);
		border-bottom-left-radius: 15px;
		pointer-events: none;
	}

	&.single {
		margin-left: 0;
		padding-left: 0;

		&::before {
			left: calc(.5 * var(--MI-noteSubAvatar));
			width: 0;
			border-bottom: 0;
		}
	}
}

.more {
	padding: 10px 0 0 16px;
}

@container (max-width: 580px) {
	.root {
		--MI-noteSubInsetX: 26px;
		--MI-noteSubAvatar: 46px;
	}
}

@container (max-width: 500px) {
	.root {
		--MI-noteSubInsetX: 22px;
	}
}

@container (max-width: 480px) {
	.root {
		--MI-noteSubInsetX: 16px;
		--MI-noteSubInsetY: 14px;
	}
}

@container (max-width: 450px) {
	.root {
		--MI-noteSubAvatar: 44px;
		--MI-noteSubAvatarGap: 10px;
	}
}

.muted {
	text-align: center;
	padding: 8px !important;
	border: 1px solid var(--MI_THEME-divider);
	margin: 8px 8px 0 8px;
	border-radius: 8px;
}

.deleted {
	text-align: center;
	padding: 8px !important;
	margin: 8px 8px 0 8px;
	--color: light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.15));
	background-size: auto auto;
	background-image: repeating-linear-gradient(135deg, transparent, transparent 10px, var(--color) 4px, var(--color) 14px);
	border-radius: 8px;
}
</style>

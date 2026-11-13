<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<header :class="[$style.root, { [$style.card]: card }]">
	<div v-if="mock" :class="$style.name">
		<MkUserName :user="note.user"/>
	</div>
	<MkA v-else v-user-preview="note.user.id" :class="$style.name" :to="userPage(note.user)">
		<MkUserName :user="note.user"/>
	</MkA>
	<div v-if="note.user.isBot" :class="$style.isBot">bot</div>
	<div :class="$style.username"><MkAcct :user="note.user"/></div>
	<div v-if="note.user.badgeRoles" :class="$style.badgeRoles">
		<img v-for="(role, i) in note.user.badgeRoles" :key="i" v-tooltip="role.name" :class="$style.badgeRole" :src="role.iconUrl!"/>
	</div>
	<div :class="$style.info">
		<div v-if="mock">
			<MkTime :time="note.createdAt" colored/>
		</div>
		<MkA v-else :to="notePage(note)">
			<MkTime :time="note.createdAt" colored/>
		</MkA>
		<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="i18n.ts._visibility[note.visibility]">
			<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
			<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
			<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
		</span>
		<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
		<span v-if="note.channel" style="margin-left: 0.5em;" :title="note.channel.name"><i class="ti ti-device-tv"></i></span>
	</div>
	<div v-if="card && $slots.metadata" :class="$style.metadata"><slot name="metadata"></slot></div>
</header>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import { notePage } from '@@/js/note.js';
import { userPage } from '@@/js/user.js';
import { DI } from '@/di.js';

defineProps<{
	note: Misskey.entities.Note;
	card?: boolean;
}>();

const mock = inject(DI.mock, false);
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: baseline;
	white-space: nowrap;
}

// [custom] Opt in only for timeline cards; reply summaries keep the upstream header.
.card {
	display: grid;
	grid-template-columns: minmax(0, max-content) auto auto minmax(0, 1fr) minmax(0, 40%);
	align-items: center;

	.name {
		grid-column: 1;
		grid-row: 1;
	}

	.isBot {
		grid-column: 2;
		grid-row: 1;
	}

	.badgeRoles {
		grid-column: 3;
		grid-row: 1;
		max-width: 3em;
		overflow: hidden;
	}

	.username {
		grid-column: 1 / 5;
		grid-row: 2;
		font-size: 0.95em;
	}

	.info {
		display: flex;
		align-items: center;
		grid-column: 5;
		grid-row: 1;
		padding-left: 10px;
		max-width: 100%;
		box-sizing: border-box;

		> :first-child {
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		> span {
			flex-shrink: 0;
		}
	}
}

.metadata {
	grid-column: 5;
	grid-row: 2;
	min-width: 0;
	justify-self: end;
	max-width: 100%;
}

.name {
	flex-shrink: 1;
	display: block;
	margin: 0 .5em 0 0;
	padding: 0;
	overflow: hidden;
	font-size: 1em;
	font-weight: bold;
	text-decoration: none;
	text-overflow: ellipsis;

	&:hover {
		text-decoration: underline;
	}
}

.isBot {
	flex-shrink: 0;
	align-self: center;
	margin: 0 .5em 0 0;
	padding: 1px 6px;
	font-size: 80%;
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: 3px;
}

.username {
	flex-shrink: 9999999;
	margin: 0 .5em 0 0;
	overflow: hidden;
	text-overflow: ellipsis;
}

.info {
	flex-shrink: 0;
	margin-left: auto;
	font-size: 0.9em;
}

.badgeRoles {
	margin: 0 .5em 0 0;
}

.badgeRole {
	height: 1.3em;
	vertical-align: -20%;

	& + .badgeRole {
		margin-left: 0.2em;
	}
}
</style>

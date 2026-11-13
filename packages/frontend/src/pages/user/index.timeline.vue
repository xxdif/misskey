<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkTab
			v-model="tab"
			:tabs="[
				{ key: 'pinned', label: i18n.ts.pinned },
				{ key: 'featured', label: i18n.ts.featured },
				{ key: 'notes', label: i18n.ts.notes },
				{ key: 'all', label: i18n.ts.all },
				{ key: 'files', label: i18n.ts.withFiles },
			]"
			:class="$style.tab"
		>
		</MkTab>
	</template>
	<div v-if="tab === 'pinned'" class="_panel" :class="[$style.tl, $style.pinnedPanel]">
		<MkResult v-if="user.pinnedNotes.length === 0" type="empty" :text="i18n.ts.noNotes"/>
		<MkNote v-for="note in user.pinnedNotes" :key="note.id" :note="note" pinned :class="$style.pinnedNote"/>
	</div>
	<MkNotesTimeline v-else-if="tab === 'featured'" :noGap="true" :paginator="featuredPaginator" :pullToRefresh="false" :class="$style.tl"/>
	<MkNotesTimeline v-else :noGap="true" :paginator="notesPaginator" :pullToRefresh="false" :class="$style.tl"/>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import MkNote from '@/components/MkNote.vue';
import MkTab from '@/components/MkTab.vue';
import { i18n } from '@/i18n.js';
import { Paginator } from '@/utility/paginator.js';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const tab = ref<'pinned' | 'featured' | 'notes' | 'all' | 'files'>(props.user.pinnedNotes.length > 0 ? 'pinned' : 'notes');
// [custom] Refreshing profile fields must not retrigger pagination for the same user.
const userId = computed(() => props.user.id);

const featuredPaginator = markRaw(new Paginator('users/featured-notes', {
	limit: 10,
	params: {
		userId: props.user.id,
	},
}));

const notesPaginator = markRaw(new Paginator('users/notes', {
	limit: 10,
	computedParams: computed(() => ({
		userId: userId.value,
		withRenotes: tab.value === 'all',
		withReplies: tab.value === 'all',
		withChannelNotes: tab.value === 'all',
		withFiles: tab.value === 'files',
	})),
}));

defineExpose({
	reload: async () => {
		// Pinned notes refresh with the parent user's profile.
		if (tab.value === 'pinned') return;
		await (tab.value === 'featured' ? featuredPaginator : notesPaginator).reload();
	},
});
</script>

<style lang="scss" module>
.tab {
	margin-bottom: 2.5px;
	padding: 2.5px 0;
	background: color-mix(in srgb, var(--MI_THEME-bg) 65%, transparent);
	backdrop-filter: var(--MI-blur, blur(15px));
	border-radius: var(--MI-radius);
	overflow-x: auto;

	> button {
		border-radius: var(--MI-radius);
		margin-inline: 0.4rem;
		white-space: nowrap;
	}
}

.tl {
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;
}

.pinnedPanel {
	background: var(--MI_THEME-panel);
}

.pinnedNote:not(:last-child) {
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}
</style>

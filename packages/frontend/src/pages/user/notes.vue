<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 800px;">
	<div>
		<MkStickyContainer>
			<template #header>
				<MkTab
					v-model="tab"
					:tabs="[
						{ key: 'featured', label: i18n.ts.featured },
						{ key: 'notes', label: i18n.ts.notes },
						{ key: 'all', label: i18n.ts.all },
						{ key: 'files', label: i18n.ts.withFiles },
					]"
					:class="$style.tab"
				>
				</MkTab>
			</template>
			<MkNotesTimeline v-if="tab === 'featured'" :noGap="true" :paginator="featuredPaginator" :class="$style.tl"/>
			<MkNotesTimeline v-else :noGap="true" :paginator="notesPaginator" :class="$style.tl"/>
		</MkStickyContainer>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import MkTab from '@/components/MkTab.vue';
import { i18n } from '@/i18n.js';
import { Paginator } from '@/utility/paginator.js';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const tab = ref<'featured' | 'notes' | 'all' | 'files'>('all');

const featuredPaginator = markRaw(new Paginator('users/featured-notes', {
	limit: 10,
	params: {
		userId: props.user.id,
	},
}));

const notesPaginator = markRaw(new Paginator('users/notes', {
	limit: 10,
	computedParams: computed(() => ({
		userId: props.user.id,
		withRenotes: tab.value === 'all',
		withReplies: tab.value === 'all',
		withChannelNotes: tab.value === 'all',
		withFiles: tab.value === 'files',
	})),
}));
</script>

<style lang="scss" module>
// [custom] Match the profile timeline tabs while retaining the standalone page's pagination.
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
</style>

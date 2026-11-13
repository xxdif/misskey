/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// [custom] Exercise profile replacement and explicit refresh through the real pagination component.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/vue';
import { defineComponent, h, nextTick, ref } from 'vue';
import type * as Misskey from 'misskey-js';
import Timeline from '@/pages/user/index.timeline.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { preferReactive } from '../setup.unit.js';

vi.mock('@/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@/os.js', () => ({ contextMenu: vi.fn() }));
vi.mock('@/events.js', () => ({ useGlobalEvent: vi.fn() }));
vi.mock('@/components/MkPaginationControl.vue', () => ({ default: { render: () => null } }));
vi.mock('@/components/MkNote.vue', () => ({
	default: defineComponent({
		props: ['note'],
		setup: props => () => h('article', { 'data-note-id': props.note.id }, props.note.id),
	}),
}));

function profile(pinnedNotes: Misskey.entities.Note[] = []): Misskey.entities.UserDetailed {
	return { id: 'self', pinnedNotes } as unknown as Misskey.entities.UserDetailed;
}

function renderTimeline(initialUser = profile()) {
	preferReactive.enableInfiniteScroll = ref(false);
	const user = ref(initialUser);
	const timeline = ref<{ reload: () => Promise<void> }>();
	const view = render(defineComponent({
		setup: () => () => h(Timeline, { user: user.value, ref: timeline }),
	}), {
		global: {
			components: {
				MkStickyContainer: { template: '<div><slot name="header"/><slot/></div>' },
				MkLoading: { template: '<div>Loading</div>' },
				MkResult: { template: '<div/>' },
			},
			directives: { appear: () => {} },
		},
	});
	return { ...view, user, timeline };
}

afterEach(() => {
	cleanup();
	vi.mocked(misskeyApi).mockReset();
});

describe('profile timeline refresh', () => {
	test('does not duplicate notes when profile data arrives during a pull refresh', async () => {
		const note = { id: 'note-1', createdAt: '2026-11-06T00:00:00.000Z' };
		const pending: ((notes: unknown) => void)[] = [];
		vi.mocked(misskeyApi).mockResolvedValueOnce([note] as never);
		vi.mocked(misskeyApi).mockImplementation(() => new Promise(resolve => pending.push(resolve)) as never);
		const view = renderTimeline();
		await waitFor(() => expect(view.container.querySelectorAll('[data-note-id]')).toHaveLength(1));
		const refresh = view.timeline.value!.reload();
		view.user.value = profile();
		await nextTick();
		for (const resolve of pending) resolve([{ ...note }]);
		await refresh;
		await nextTick();
		expect(view.container.querySelectorAll('[data-note-id]')).toHaveLength(1);
		expect(misskeyApi).toHaveBeenCalledTimes(2);
	});

	test('updates pinned notes from the refreshed profile without querying a timeline', async () => {
		const view = renderTimeline(profile([{ id: 'old-pin' } as Misskey.entities.Note]));
		expect(view.container.querySelector('[data-note-id="old-pin"]')).not.toBeNull();
		await view.timeline.value!.reload();
		view.user.value = profile([{ id: 'new-pin' } as Misskey.entities.Note]);
		await nextTick();
		expect(view.container.querySelector('[data-note-id="old-pin"]')).toBeNull();
		expect(view.container.querySelector('[data-note-id="new-pin"]')).not.toBeNull();
		expect(misskeyApi).not.toHaveBeenCalled();
	});

	test('reloads notes when switching all and files filters', async () => {
		vi.mocked(misskeyApi).mockResolvedValue([]);
		const view = renderTimeline();
		await waitFor(() => expect(misskeyApi).toHaveBeenCalledTimes(1));
		await fireEvent.click(view.getByRole('button', { name: i18n.ts.all }));
		await waitFor(() => expect(misskeyApi).toHaveBeenLastCalledWith('users/notes', expect.objectContaining({
			userId: 'self', withRenotes: true, withReplies: true, withChannelNotes: true, withFiles: false,
		})));
		await fireEvent.click(view.getByRole('button', { name: i18n.ts.withFiles }));
		await waitFor(() => expect(misskeyApi).toHaveBeenLastCalledWith('users/notes', expect.objectContaining({
			userId: 'self', withRenotes: false, withReplies: false, withChannelNotes: false, withFiles: true,
		})));
		expect(misskeyApi).toHaveBeenCalledTimes(3);
	});

	test('refreshes featured notes through the featured endpoint', async () => {
		vi.mocked(misskeyApi).mockResolvedValue([]);
		const view = renderTimeline();
		await waitFor(() => expect(misskeyApi).toHaveBeenCalledTimes(1));
		await fireEvent.click(view.getByRole('button', { name: i18n.ts.featured }));
		await waitFor(() => expect(misskeyApi).toHaveBeenCalledTimes(2));
		await view.timeline.value!.reload();
		expect(misskeyApi).toHaveBeenCalledTimes(3);
		expect(misskeyApi).toHaveBeenLastCalledWith('users/featured-notes', expect.objectContaining({ userId: 'self' }));
	});
});

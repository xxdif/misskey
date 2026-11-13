/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// [custom] Exercise real visibility and folding components without fetching hidden profile panels.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/vue';
import { defineComponent, h, nextTick, onMounted } from 'vue';
import type * as Misskey from 'misskey-js';
import Files from '@/pages/user/index.files.vue';
import Activity from '@/pages/user/index.activity.vue';
import MkLazy from '@/components/global/MkLazy.vue';
import { appearDirective } from '@/directives/appear.js';
import { misskeyApi } from '@/utility/misskey-api.js';

const { chartMounted } = vi.hoisted(() => ({ chartMounted: vi.fn() }));
vi.mock('@/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@/os.js', () => ({ popupMenu: vi.fn() }));
vi.mock('@/components/MkChart.vue', () => ({
	default: defineComponent({
		setup() {
			onMounted(chartMounted);
			return () => h('div', { 'data-testid': 'chart' });
		},
	}),
}));
vi.mock('@/components/MkNoteMediaGrid.vue', () => ({
	default: defineComponent({
		props: ['note'],
		setup: props => () => h('div', { 'data-note-id': props.note.id }),
	}),
}));
vi.mock('@/components/MkButton.vue', () => ({ default: { template: '<button><slot/></button>' } }));

// happy-dom has no layout; model the real ancestor v-show rather than hardcoding visibility.
class VisibilityObserver {
	static instances: VisibilityObserver[] = [];
	private targets = new Set<Element>();
	constructor(private callback: IntersectionObserverCallback) {
		VisibilityObserver.instances.push(this);
	}
	observe(target: Element) { this.targets.add(target); }
	disconnect() { this.targets.clear(); }
	notify() {
		const entries = [...this.targets].map(target => {
			let isIntersecting = true;
			for (let el: Element | null = target; el; el = el.parentElement) {
				if ((el as HTMLElement).style.display === 'none') isIntersecting = false;
			}
			return { target, isIntersecting } as IntersectionObserverEntry;
		});
		if (entries.length > 0) this.callback(entries, this as unknown as IntersectionObserver);
	}
}

const user = { id: 'self' } as Misskey.entities.UserDetailed;
const global = {
	components: { MkLazy, MkLoading: { template: '<div>Loading</div>' } },
	directives: { appear: appearDirective },
};

async function notifyVisibility() {
	await nextTick();
	for (const observer of VisibilityObserver.instances) observer.notify();
	await vi.advanceTimersByTimeAsync(501);
	await nextTick();
}

async function toggle(container: Element) {
	const button = container.querySelector('.ti-chevron-down, .ti-chevron-up')!.closest('button')!;
	await fireEvent.click(button);
	await notifyVisibility();
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.stubGlobal('IntersectionObserver', VisibilityObserver);
	VisibilityObserver.instances = [];
	vi.mocked(misskeyApi).mockReset();
	chartMounted.mockClear();
});

afterEach(() => {
	cleanup();
	vi.clearAllTimers();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('profile panel visibility', () => {
	test('loads files once on expansion, including repeated notifications during the request', async () => {
		let resolve!: (notes: Misskey.entities.Note[]) => void;
		vi.mocked(misskeyApi).mockImplementation(() => new Promise<Misskey.entities.Note[]>(done => { resolve = done; }) as never);
		const view = render(Files, { props: { user, collapsed: true }, global });
		await notifyVisibility();
		expect(misskeyApi).not.toHaveBeenCalled();
		await toggle(view.container);
		await notifyVisibility();
		expect(misskeyApi).toHaveBeenCalledExactlyOnceWith('users/notes', { userId: 'self', withFiles: true, limit: 10 });
		resolve([{ id: 'file-note' } as Misskey.entities.Note]);
		await nextTick();
		await nextTick();
		const media = view.container.querySelector('[data-note-id="file-note"]');
		expect(media).not.toBeNull();
		await toggle(view.container);
		await toggle(view.container);
		expect(view.container.querySelector('[data-note-id="file-note"]')).toBe(media);
		expect(misskeyApi).toHaveBeenCalledTimes(1);
	});

	test('mounts the chart only when expanded and preserves it across later folds', async () => {
		const view = render(Activity, { props: { user, collapsed: true }, global });
		await notifyVisibility();
		expect(chartMounted).not.toHaveBeenCalled();
		await toggle(view.container);
		const chart = view.getByTestId('chart');
		expect(chartMounted).toHaveBeenCalledTimes(1);
		await toggle(view.container);
		await toggle(view.container);
		expect(view.getByTestId('chart')).toBe(chart);
		expect(chartMounted).toHaveBeenCalledTimes(1);
	});

	test('loads visible panels that are expanded by default', async () => {
		vi.mocked(misskeyApi).mockResolvedValue([]);
		render(Files, { props: { user }, global });
		render(Activity, { props: { user }, global });
		await notifyVisibility();
		expect(misskeyApi).toHaveBeenCalledTimes(1);
		expect(chartMounted).toHaveBeenCalledTimes(1);
	});

	test('ignores a queued appearance callback after the files panel is unmounted', async () => {
		const view = render(Files, { props: { user, collapsed: true }, global });
		await nextTick();
		for (const observer of VisibilityObserver.instances) observer.notify();
		await fireEvent.click(view.container.querySelector('.ti-chevron-down')!.closest('button')!);
		for (const observer of VisibilityObserver.instances) observer.notify();
		view.unmount();
		await vi.advanceTimersByTimeAsync(501);
		expect(misskeyApi).not.toHaveBeenCalled();
	});
});

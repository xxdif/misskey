<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" :style="themeColorStyle">
	<img v-if="faviconUrl" :class="$style.icon" :src="faviconUrl"/>
	<div :class="$style.name">{{ instanceName }}</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { instanceName as localInstanceName } from '@@/js/config.js';
import type { CSSProperties } from 'vue';
import { instance as localInstance } from '@/instance.js';
import { getProxiedImageUrlNullable } from '@/utility/media-proxy.js';

const props = defineProps<{
	host: string | null;
	instance?: {
		faviconUrl?: string | null
		name?: string | null
		themeColor?: string | null
	}
}>();

// if no instance data is given, this is for the local instance
const instanceName = computed(() => props.host == null ? localInstanceName : props.instance?.name ?? props.host);

const faviconUrl = computed(() => {
	let imageSrc: string | null = null;
	if (props.host == null) {
		if (localInstance.iconUrl == null) {
			return '/favicon.ico';
		} else {
			imageSrc = localInstance.iconUrl;
		}
	} else {
		imageSrc = props.instance?.faviconUrl ?? null;
	}
	return getProxiedImageUrlNullable(imageSrc);
});

const themeColorStyle = computed<CSSProperties>(() => {
	const themeColor = (props.host == null ? localInstance.themeColor : props.instance?.themeColor) ?? '#777777';
	return {
		// [custom] Match Sharkey's solid instance badge while retaining the server's color.
		background: themeColor,
	};
});
</script>

<style lang="scss" module>
$height: 2ex;

.root {
	// [custom] Use the theme shadow hue at full opacity for Sharkey's dark text outline.
	--MI-instanceTickerShadow: rgb(from var(--MI_THEME-shadow) r g b / 1);
	// [custom] Adapt Sharkey's SkInstanceTicker capsule to Misskey's existing author header.
	display: inline-flex;
	align-items: center;
	box-sizing: border-box;
	// [custom] Keep the capsule content-sized inside the detail header's stretched flex column.
	width: fit-content;
	max-width: 100%;
	height: calc(1.5ex + 8px);
	// [custom] Match Sharkey's default rounded-rectangle badge.
	border-radius: 5px;
	padding: 4px;
	overflow: clip;
	color: #fff;
	text-shadow:
		1px 0 1px var(--MI-instanceTickerShadow, var(--MI_THEME-shadow)),
		.866px .5px 1px var(--MI-instanceTickerShadow, var(--MI_THEME-shadow)),
		.5px .866px 1px var(--MI-instanceTickerShadow, var(--MI_THEME-shadow)),
		0 1px 1px var(--MI-instanceTickerShadow, var(--MI_THEME-shadow)),
		-.5px .866px 1px var(--MI-instanceTickerShadow, var(--MI_THEME-shadow)),
		-.866px .5px 1px var(--MI-instanceTickerShadow, var(--MI_THEME-shadow)),
		-1px 0 1px var(--MI-instanceTickerShadow, var(--MI_THEME-shadow)),
		-.866px -.5px 1px var(--MI-instanceTickerShadow, var(--MI_THEME-shadow)),
		-.5px -.866px 1px var(--MI-instanceTickerShadow, var(--MI_THEME-shadow)),
		0 -1px 1px var(--MI-instanceTickerShadow, var(--MI_THEME-shadow)),
		.5px -.866px 1px var(--MI-instanceTickerShadow, var(--MI_THEME-shadow)),
		.866px -.5px 1px var(--MI-instanceTickerShadow, var(--MI_THEME-shadow));

	// [custom] Disable the upstream fade so the capsule has a solid rounded end.
	// mask-image: linear-gradient(90deg,
	// 	rgb(0,0,0),
	// 	rgb(0,0,0) calc(100% - 16px),
	// 	rgba(0,0,0,0) 100%
	// );
}

.icon {
	height: $height;
	flex-shrink: 0;
}

.name {
	// [custom] Preserve Sharkey's compact label sizing and ellipsis on narrow cards.
	padding: 0.5ex;
	margin: -0.5ex;
	margin-left: calc(4px - 0.5ex);
	min-width: 0;
	max-width: 300px;
	line-height: 1;
	font-size: 0.8em;
	font-weight: bold;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;

	// [custom] Disable the upstream panel-colored stroke in favor of the capsule's light text.
	// color: var(--MI_THEME-fg);
	// -webkit-text-stroke: var(--MI_THEME-panel) .225em;
	// paint-order: stroke fill;
}

// [custom] Slightly widen Sharkey's compact label while retaining the existing author-header layout.
@container (max-width: 400px) {
	.name {
		max-width: 60px;
	}
}
</style>

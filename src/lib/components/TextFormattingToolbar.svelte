<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Select from '$lib/components/ui/select';
	import {
		Bold,
		Italic,
		Underline,
		AlignLeft,
		AlignCenter,
		AlignRight,
		Minus,
		Plus
	} from 'lucide-svelte';
	import type { TextShape } from '$lib/types/shapes';

	interface Props {
		visible: boolean;
		position: { x: number; y: number };
		fontWeight?: 'normal' | 'bold';
		fontStyle?: 'normal' | 'italic';
		textDecoration?: string;
		align?: 'left' | 'center' | 'right';
		fontSize?: number;
		fontFamily?: string;
		toolbarWidth?: number;
		onFormatChange: (format: Partial<TextShape>) => void;
	}

	let {
		visible = $bindable(false),
		position = $bindable({ x: 0, y: 0 }),
		fontWeight = 'normal',
		fontStyle = 'normal',
		textDecoration = 'none',
		align = 'left',
		fontSize = 16,
		fontFamily = 'system-ui',
		toolbarWidth = $bindable(0),
		onFormatChange
	}: Props = $props();

	// Toggle functions
	function toggleBold() {
		onFormatChange({ fontWeight: fontWeight === 'bold' ? 'normal' : 'bold' });
	}

	function toggleItalic() {
		onFormatChange({ fontStyle: fontStyle === 'italic' ? 'normal' : 'italic' });
	}

	function toggleUnderline() {
		onFormatChange({
			textDecoration: textDecoration === 'underline' ? 'none' : 'underline'
		});
	}

	function setAlign(newAlign: 'left' | 'center' | 'right') {
		onFormatChange({ align: newAlign });
	}

	function changeFontSize(delta: number) {
		const newSize = Math.max(8, Math.min(72, fontSize + delta));
		onFormatChange({ fontSize: newSize });
	}

	function setFontFamily(family: string) {
		onFormatChange({ fontFamily: family });
	}

	let toolbarElement = $state<HTMLDivElement>();

	// Font family options
	const fontFamilies = [
		{ value: 'system-ui', label: 'System' },
		{ value: 'Arial', label: 'Arial' },
		{ value: 'Times New Roman', label: 'Times' },
		{ value: 'Courier New', label: 'Courier' },
		{ value: 'Georgia', label: 'Georgia' },
		{ value: 'Verdana', label: 'Verdana' },
		{ value: 'Comic Sans MS', label: 'Comic Sans' },
		{ value: 'Impact', label: 'Impact' }
	];

	// Derived label for the selected font
	const fontFamilyLabel = $derived(
		fontFamilies.find((f) => f.value === fontFamily)?.label ?? fontFamily
	);

	// Local state for select binding
	let selectedFontFamily = $state(fontFamily);

	// Sync selectedFontFamily with prop changes
	$effect(() => {
		selectedFontFamily = fontFamily;
	});

	// Update when selection changes
	$effect(() => {
		if (selectedFontFamily !== fontFamily) {
			setFontFamily(selectedFontFamily);
		}
	});

	// Update toolbar width when visible or element changes
	$effect(() => {
		if (visible && toolbarElement) {
			// Use requestAnimationFrame to ensure DOM is painted
			requestAnimationFrame(() => {
				if (toolbarElement) {
					toolbarWidth = toolbarElement.offsetWidth;
				}
			});
		}
	});
</script>

{#if visible}
	<div
		bind:this={toolbarElement}
		class="fixed z-50 flex items-center gap-1 rounded-xl border-2 border-violet-200 bg-gradient-to-r from-violet-500 to-indigo-600 px-3 py-2 shadow-xl shadow-violet-500/30 backdrop-blur-md transition-all"
		style="left: {position.x}px; top: {position.y}px;"
		role="toolbar"
		aria-label="Text formatting toolbar"
		tabindex="0"
	>
		<!-- Font Family -->
		<Select.Root type="single" bind:value={selectedFontFamily}>
			<Select.Trigger
				class="h-8 w-32 rounded-lg bg-white/10 px-2 text-sm text-white border border-white/20 hover:bg-white/20 data-[state=open]:bg-white/20"
			>
				<span class="text-white text-sm">{fontFamilyLabel}</span>
			</Select.Trigger>
			<Select.Content class="z-[9999] bg-white rounded-lg shadow-lg border border-gray-200">
				<Select.Group>
					{#each fontFamilies as font (font.value)}
						<Select.Item
							value={font.value}
							label={font.label}
							class="hover:bg-gray-100 cursor-pointer"
						>
							<span style="font-family: {font.value};">{font.label}</span>
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>

		<Separator orientation="vertical" class="mx-1 h-6 bg-white/20" />

		<!-- Bold, Italic, Underline -->
		<Button
			variant="ghost"
			size="icon"
			class="h-8 w-8 rounded-lg text-white hover:bg-white/20 {fontWeight === 'bold'
				? 'bg-white/30'
				: ''}"
			onclick={toggleBold}
			onmousedown={(e) => e.preventDefault()}
			title="Bold (⌘B)"
		>
			<Bold class="h-4 w-4" />
		</Button>

		<Button
			variant="ghost"
			size="icon"
			class="h-8 w-8 rounded-lg text-white hover:bg-white/20 {fontStyle === 'italic'
				? 'bg-white/30'
				: ''}"
			onclick={toggleItalic}
			onmousedown={(e) => e.preventDefault()}
			title="Italic (⌘I)"
		>
			<Italic class="h-4 w-4" />
		</Button>

		<Button
			variant="ghost"
			size="icon"
			class="h-8 w-8 rounded-lg text-white hover:bg-white/20 {textDecoration === 'underline'
				? 'bg-white/30'
				: ''}"
			onclick={toggleUnderline}
			onmousedown={(e) => e.preventDefault()}
			title="Underline (⌘U)"
		>
			<Underline class="h-4 w-4" />
		</Button>

		<Separator orientation="vertical" class="mx-1 h-6 bg-white/20" />

		<!-- Alignment -->
		<Button
			variant="ghost"
			size="icon"
			class="h-8 w-8 rounded-lg text-white hover:bg-white/20 {align === 'left'
				? 'bg-white/30'
				: ''}"
			onclick={() => setAlign('left')}
			onmousedown={(e) => e.preventDefault()}
			title="Align Left (⌘⇧L)"
		>
			<AlignLeft class="h-4 w-4" />
		</Button>

		<Button
			variant="ghost"
			size="icon"
			class="h-8 w-8 rounded-lg text-white hover:bg-white/20 {align === 'center'
				? 'bg-white/30'
				: ''}"
			onclick={() => setAlign('center')}
			onmousedown={(e) => e.preventDefault()}
			title="Align Center (⌘⇧E)"
		>
			<AlignCenter class="h-4 w-4" />
		</Button>

		<Button
			variant="ghost"
			size="icon"
			class="h-8 w-8 rounded-lg text-white hover:bg-white/20 {align === 'right'
				? 'bg-white/30'
				: ''}"
			onclick={() => setAlign('right')}
			onmousedown={(e) => e.preventDefault()}
			title="Align Right (⌘⇧R)"
		>
			<AlignRight class="h-4 w-4" />
		</Button>

		<Separator orientation="vertical" class="mx-1 h-6 bg-white/20" />

		<!-- Font Size -->
		<Button
			variant="ghost"
			size="icon"
			class="h-8 w-8 rounded-lg text-white hover:bg-white/20"
			onclick={() => changeFontSize(-2)}
			onmousedown={(e) => e.preventDefault()}
			title="Decrease Font Size"
		>
			<Minus class="h-4 w-4" />
		</Button>

		<div
			class="flex h-8 min-w-12 items-center justify-center rounded-lg bg-white/10 px-2 text-sm font-medium text-white"
		>
			{fontSize}
		</div>

		<Button
			variant="ghost"
			size="icon"
			class="h-8 w-8 rounded-lg text-white hover:bg-white/20"
			onclick={() => changeFontSize(2)}
			onmousedown={(e) => e.preventDefault()}
			title="Increase Font Size"
		>
			<Plus class="h-4 w-4" />
		</Button>
	</div>
{/if}

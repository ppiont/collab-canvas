<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
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
</script>

{#if visible}
	<div
		class="fixed z-50 flex items-center gap-1 rounded-xl border-2 border-violet-200 bg-gradient-to-r from-violet-500 to-indigo-600 px-3 py-2 shadow-xl shadow-violet-500/30 backdrop-blur-md transition-all"
		style="left: {position.x}px; top: {position.y}px;"
	>
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

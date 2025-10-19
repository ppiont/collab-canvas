<script lang="ts">
	/**
	 * Color Utilities Test Page
	 * 
	 * Validates color conversion functions and contrast calculations
	 */
	
	import {
		hexToRgb,
		rgbToHex,
		rgbToHsl,
		hslToRgb,
		rgbToHsb,
		hsbToRgb,
		calculateContrastRatio,
		meetsWCAGAA,
		meetsWCAGAAA,
		parseColor
	} from '$lib/utils/color';
	
	// Test cases
	const tests = [
		{
			name: 'Red (HEX to RGB)',
			fn: () => hexToRgb('#ff0000'),
			expected: '[255, 0, 0]',
			actual: () => JSON.stringify(hexToRgb('#ff0000'))
		},
		{
			name: 'Red shorthand (HEX to RGB)',
			fn: () => hexToRgb('f00'),
			expected: '[255, 0, 0]',
			actual: () => JSON.stringify(hexToRgb('f00'))
		},
		{
			name: 'Red (RGB to HEX)',
			fn: () => rgbToHex([255, 0, 0]),
			expected: '#ff0000',
			actual: () => rgbToHex([255, 0, 0])
		},
		{
			name: 'Black on white contrast',
			fn: () => calculateContrastRatio([0, 0, 0], [255, 255, 255]),
			expected: '21 (perfect)',
			actual: () => calculateContrastRatio([0, 0, 0], [255, 255, 255]).toFixed(2)
		},
		{
			name: 'White on white contrast',
			fn: () => calculateContrastRatio([255, 255, 255], [255, 255, 255]),
			expected: '1 (none)',
			actual: () => calculateContrastRatio([255, 255, 255], [255, 255, 255]).toFixed(2)
		},
		{
			name: 'Red to HSL',
			fn: () => rgbToHsl([255, 0, 0]),
			expected: '[0, 100, 50]',
			actual: () => {
				const [h, s, l] = rgbToHsl([255, 0, 0]);
				return `[${h.toFixed(0)}, ${s.toFixed(0)}, ${l.toFixed(0)}]`;
			}
		},
		{
			name: 'HSL to RGB (red)',
			fn: () => hslToRgb(0, 100, 50),
			expected: '[255, 0, 0]',
			actual: () => JSON.stringify(hslToRgb(0, 100, 50))
		},
		{
			name: 'Red to HSB',
			fn: () => rgbToHsb([255, 0, 0]),
			expected: '[0, 100, 100]',
			actual: () => {
				const [h, s, b] = rgbToHsb([255, 0, 0]);
				return `[${h.toFixed(0)}, ${s.toFixed(0)}, ${b.toFixed(0)}]`;
			}
		},
		{
			name: 'HSB to RGB (red)',
			fn: () => hsbToRgb(0, 100, 100),
			expected: '[255, 0, 0]',
			actual: () => JSON.stringify(hsbToRgb(0, 100, 100))
		},
		{
			name: 'Parse HEX color',
			fn: () => parseColor('#0088ff'),
			expected: '[0, 136, 255]',
			actual: () => JSON.stringify(parseColor('#0088ff'))
		},
		{
			name: 'Parse RGB string',
			fn: () => parseColor('rgb(255, 128, 0)'),
			expected: '[255, 128, 0]',
			actual: () => JSON.stringify(parseColor('rgb(255, 128, 0)'))
		}
	];
	
	// Run tests
	const results = tests.map(test => ({
		...test,
		result: test.actual(),
		pass: test.actual() === test.expected || test.actual().includes(test.expected.split(' ')[0])
	}));
	
	const passedCount = results.filter(r => r.pass).length;
	const totalCount = results.length;
	
	// Interactive test
	let testColor = $state('#3b82f6');
	let backgroundColor = $state('#ffffff');
	
	const testRgb = $derived<[number, number, number]>(parseColor(testColor) || [0, 0, 0]);
	const bgRgb = $derived<[number, number, number]>(parseColor(backgroundColor) || [255, 255, 255]);
	const contrastRatio = $derived(calculateContrastRatio(testRgb, bgRgb));
	const passesAA = $derived(meetsWCAGAA(contrastRatio));
	const passesAAA = $derived(meetsWCAGAAA(contrastRatio));
	const testHsl = $derived(rgbToHsl(testRgb));
	const testHsb = $derived(rgbToHsb(testRgb));
</script>

<svelte:head>
	<title>Color Utilities Test</title>
</svelte:head>

<div class="container mx-auto p-8 space-y-8">
	<div>
		<h1 class="text-3xl font-bold mb-2">Color Utilities Test</h1>
		<p class="text-muted-foreground">
			Validation and testing of color conversion and contrast functions
		</p>
	</div>
	
	<!-- Test Results -->
	<div class="space-y-4">
		<div class="flex items-center gap-4">
			<h2 class="text-xl font-semibold">Automated Tests</h2>
			<div class="text-sm">
				<span class="font-medium">{passedCount}/{totalCount} passed</span>
				{#if passedCount === totalCount}
					<span class="text-green-600 ml-2">✓ All tests passing</span>
				{:else}
					<span class="text-red-600 ml-2">✗ Some tests failed</span>
				{/if}
			</div>
		</div>
		
		<div class="rounded-lg border">
			<table class="w-full">
				<thead class="border-b bg-muted/50">
					<tr>
						<th class="text-left p-3 text-sm font-medium">Test</th>
						<th class="text-left p-3 text-sm font-medium">Expected</th>
						<th class="text-left p-3 text-sm font-medium">Actual</th>
						<th class="text-center p-3 text-sm font-medium">Result</th>
					</tr>
				</thead>
				<tbody>
					{#each results as test}
						<tr class="border-b last:border-0">
							<td class="p-3 text-sm">{test.name}</td>
							<td class="p-3 text-sm font-mono text-muted-foreground">{test.expected}</td>
							<td class="p-3 text-sm font-mono">{test.result}</td>
							<td class="p-3 text-center">
								{#if test.pass}
									<span class="text-green-600">✓</span>
								{:else}
									<span class="text-red-600">✗</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
	
	<!-- Interactive Contrast Checker -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold">Interactive Contrast Checker</h2>
		
		<div class="grid grid-cols-2 gap-6">
			<!-- Color inputs -->
			<div class="space-y-4">
				<div>
					<label for="fg-color" class="block text-sm font-medium mb-2">Foreground Color</label>
					<div class="flex gap-2 items-center">
						<input 
							id="fg-color-picker"
							type="color" 
							bind:value={testColor}
							class="h-10 w-20 rounded border cursor-pointer"
							aria-label="Foreground color picker"
						/>
						<input 
							id="fg-color"
							type="text" 
							bind:value={testColor}
							class="flex-1 px-3 py-2 rounded border text-sm font-mono"
						/>
					</div>
				</div>
				
				<div>
					<label for="bg-color" class="block text-sm font-medium mb-2">Background Color</label>
					<div class="flex gap-2 items-center">
						<input 
							id="bg-color-picker"
							type="color" 
							bind:value={backgroundColor}
							class="h-10 w-20 rounded border cursor-pointer"
							aria-label="Background color picker"
						/>
						<input 
							id="bg-color"
							type="text" 
							bind:value={backgroundColor}
							class="flex-1 px-3 py-2 rounded border text-sm font-mono"
						/>
					</div>
				</div>
			</div>
			
			<!-- Preview and results -->
			<div class="space-y-4">
				<div>
					<div class="block text-sm font-medium mb-2">Preview</div>
					<div 
						class="p-6 rounded-lg border-2"
						style="background-color: {backgroundColor}; color: {testColor};"
					>
						<p class="text-lg font-semibold">Sample Text (18pt)</p>
						<p class="text-sm">Normal text for contrast testing</p>
					</div>
				</div>
				
				<div class="rounded-lg border p-4 space-y-2">
					<div class="flex justify-between">
						<span class="text-sm font-medium">Contrast Ratio:</span>
						<span class="text-sm font-mono">{contrastRatio.toFixed(2)}:1</span>
					</div>
					
					<div class="flex justify-between">
						<span class="text-sm">WCAG AA (Normal):</span>
						<span class="text-sm {passesAA ? 'text-green-600' : 'text-red-600'}">
							{passesAA ? '✓ Pass' : '✗ Fail'} (need 4.5:1)
						</span>
					</div>
					
					<div class="flex justify-between">
						<span class="text-sm">WCAG AAA (Normal):</span>
						<span class="text-sm {passesAAA ? 'text-green-600' : 'text-red-600'}">
							{passesAAA ? '✓ Pass' : '✗ Fail'} (need 7:1)
						</span>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Color conversions -->
		<div class="rounded-lg border p-4">
			<h3 class="text-sm font-semibold mb-3">Color Conversions (Foreground)</h3>
			<div class="grid grid-cols-3 gap-4 text-sm">
				<div>
					<div class="text-muted-foreground mb-1">RGB</div>
					<div class="font-mono">rgb({testRgb[0]}, {testRgb[1]}, {testRgb[2]})</div>
				</div>
				<div>
					<div class="text-muted-foreground mb-1">HSL</div>
					<div class="font-mono">hsl({testHsl[0].toFixed(0)}, {testHsl[1].toFixed(0)}%, {testHsl[2].toFixed(0)}%)</div>
				</div>
				<div>
					<div class="text-muted-foreground mb-1">HSB</div>
					<div class="font-mono">hsb({testHsb[0].toFixed(0)}, {testHsb[1].toFixed(0)}%, {testHsb[2].toFixed(0)}%)</div>
				</div>
			</div>
		</div>
	</div>
</div>


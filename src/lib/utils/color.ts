/**
 * Color Utility Functions
 * 
 * Provides color format conversion and contrast ratio calculation
 * for the properties panel color picker and accessibility features.
 * 
 * Supported formats: HEX, RGB, HSL, HSB
 * WCAG contrast ratio calculation for accessibility compliance
 */

/**
 * Convert hex color to RGB array
 * @param hex - Hex color code (e.g., "#ff0000" or "f00")
 * @returns RGB values as [r, g, b] array
 * @example
 * hexToRgb("#ff0000") // [255, 0, 0]
 * hexToRgb("f00") // [255, 0, 0]
 */
export function hexToRgb(hex: string): [number, number, number] {
	hex = hex.replace(/^#/, '');

	// Expand shorthand (e.g., "03F" to "0033FF")
	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}

	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	return [r, g, b];
}

/**
 * Convert RGB values to hex color
 * @param rgb - RGB values as [r, g, b] array
 * @returns Hex color code with # prefix
 * @example
 * rgbToHex([255, 0, 0]) // "#ff0000"
 */
export function rgbToHex(rgb: [number, number, number]): string {
	const [r, g, b] = rgb;
	return (
		'#' +
		[r, g, b]
			.map((x) => {
				const hex = Math.round(x).toString(16);
				return hex.length === 1 ? '0' + hex : hex;
			})
			.join('')
	);
}

/**
 * Convert RGB to HSL
 * @param rgb - RGB values as [r, g, b] array (0-255 each)
 * @returns HSL values as [h, s, l] array (h: 0-360, s: 0-100, l: 0-100)
 * @example
 * rgbToHsl([255, 0, 0]) // [0, 100, 50] (pure red)
 */
export function rgbToHsl(rgb: [number, number, number]): [number, number, number] {
	let [r, g, b] = rgb.map((x) => x / 255);

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}

		h /= 6;
	}

	return [h * 360, s * 100, l * 100];
}

/**
 * Convert HSL to RGB
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @param a - Alpha (0-1), optional
 * @returns RGB values as [r, g, b] array (0-255 each)
 * @example
 * hslToRgb(0, 100, 50) // [255, 0, 0] (pure red)
 */
export function hslToRgb(
	h: number,
	s: number,
	l: number,
	a: number = 1
): [number, number, number] {
	h /= 360;
	s /= 100;
	l /= 100;

	let r: number, g: number, b: number;

	if (s === 0) {
		// Achromatic (gray)
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number): number => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;

		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Convert RGB to HSB (HSV)
 * @param rgb - RGB values as [r, g, b] array (0-255 each)
 * @returns HSB values as [h, s, b] array (h: 0-360, s: 0-100, b: 0-100)
 * @example
 * rgbToHsb([255, 0, 0]) // [0, 100, 100] (pure red)
 */
export function rgbToHsb(rgb: [number, number, number]): [number, number, number] {
	let [r, g, b] = rgb.map((x) => x / 255);

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	const s = max === 0 ? 0 : (max - min) / max;
	const v = max;

	if (max !== min) {
		const d = max - min;

		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}

		h /= 6;
	}

	return [h * 360, s * 100, v * 100];
}

/**
 * Convert HSB (HSV) to RGB
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param b - Brightness/Value (0-100)
 * @returns RGB values as [r, g, b] array (0-255 each)
 * @example
 * hsbToRgb(0, 100, 100) // [255, 0, 0] (pure red)
 */
export function hsbToRgb(h: number, s: number, b: number): [number, number, number] {
	h /= 360;
	s /= 100;
	b /= 100;

	const i = Math.floor(h * 6);
	const f = h * 6 - i;
	const p = b * (1 - s);
	const q = b * (1 - f * s);
	const t = b * (1 - (1 - f) * s);

	let r: number, g: number, bl: number;

	switch (i % 6) {
		case 0:
			[r, g, bl] = [b, t, p];
			break;
		case 1:
			[r, g, bl] = [q, b, p];
			break;
		case 2:
			[r, g, bl] = [p, b, t];
			break;
		case 3:
			[r, g, bl] = [p, q, b];
			break;
		case 4:
			[r, g, bl] = [t, p, b];
			break;
		case 5:
		default:
			[r, g, bl] = [b, p, q];
			break;
	}

	return [Math.round(r * 255), Math.round(g * 255), Math.round(bl * 255)];
}

/**
 * Calculate relative luminance of RGB color
 * Based on WCAG 2.1 formula
 * @param rgb - RGB values as [r, g, b] array
 * @returns Relative luminance (0-1)
 * @private
 */
function getLuminance(rgb: [number, number, number]): number {
	const [r, g, b] = rgb.map((val) => {
		val /= 255;
		return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
	});

	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 formula
 * @param rgb1 - First RGB color as [r, g, b] array
 * @param rgb2 - Second RGB color as [r, g, b] array
 * @returns Contrast ratio (1-21)
 * @example
 * calculateContrastRatio([0, 0, 0], [255, 255, 255]) // 21 (black on white)
 * calculateContrastRatio([255, 0, 0], [255, 255, 255]) // 3.998 (red on white)
 */
export function calculateContrastRatio(
	rgb1: [number, number, number],
	rgb2: [number, number, number]
): number {
	const lum1 = getLuminance(rgb1);
	const lum2 = getLuminance(rgb2);

	const brightest = Math.max(lum1, lum2);
	const darkest = Math.min(lum1, lum2);

	return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * @param contrastRatio - Contrast ratio value
 * @param largeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns True if meets WCAG AA standard
 * @example
 * meetsWCAGAA(4.5) // true (normal text)
 * meetsWCAGAA(3.5, true) // true (large text)
 */
export function meetsWCAGAA(contrastRatio: number, largeText: boolean = false): boolean {
	return largeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 * @param contrastRatio - Contrast ratio value
 * @param largeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns True if meets WCAG AAA standard
 * @example
 * meetsWCAGAAA(7.5) // true (normal text)
 * meetsWCAGAAA(4.8, true) // true (large text)
 */
export function meetsWCAGAAA(contrastRatio: number, largeText: boolean = false): boolean {
	return largeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
}

/**
 * Parse any color string to RGB
 * Supports hex, rgb(), rgba(), hsl(), hsla()
 * @param color - Color string in any supported format
 * @returns RGB values as [r, g, b] array, or null if invalid
 * @example
 * parseColor("#ff0000") // [255, 0, 0]
 * parseColor("rgb(255, 0, 0)") // [255, 0, 0]
 * parseColor("hsl(0, 100%, 50%)") // [255, 0, 0]
 */
export function parseColor(color: string): [number, number, number] | null {
	color = color.trim();

	// Hex color
	if (color.startsWith('#')) {
		try {
			return hexToRgb(color);
		} catch {
			return null;
		}
	}

	// RGB/RGBA
	const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
	if (rgbMatch) {
		return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
	}

	// HSL/HSLA
	const hslMatch = color.match(/hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%(?:,\s*[\d.]+)?\)/);
	if (hslMatch) {
		return hslToRgb(parseFloat(hslMatch[1]), parseFloat(hslMatch[2]), parseFloat(hslMatch[3]));
	}

	return null;
}


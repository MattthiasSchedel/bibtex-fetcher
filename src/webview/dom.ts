export function el<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	opts: { className?: string; text?: string } = {}
): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	if (opts.className) {
		node.className = opts.className;
	}
	if (opts.text !== undefined) {
		node.textContent = opts.text;
	}
	return node;
}

export function getRequired<T extends HTMLElement>(id: string): T {
	const node = document.getElementById(id);
	if (!node) {
		throw new Error(`Required element #${id} not found`);
	}
	return node as T;
}

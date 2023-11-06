'use strict';

export const Transformer = canvas => {
	const context = canvas.getContext("2d");

	let image_offset_x = 0;
	let image_offset_y = 0;
	let image_scale = 1;

	const set_dimensions = (width, height) => {
		canvas.width = width;
		canvas.height = height;
	};

	const get_image_offset = () => {
		return [image_offset_x, image_offset_y];
	};
	const reset_offset = (image_width, image_height) => {
		image_offset_x = (canvas.width - image_scale * image_width) / 2;
		image_offset_y = (canvas.height - image_scale * image_height) / 2;
	};
	const get_image_scale = () => {
		return image_scale;
	};
	const reset_scale = (image_width, image_height) => {
		const scale_x = canvas.width / image_width;
		const scale_y = canvas.height / image_height;
		image_scale = Math.min(scale_x, scale_y);
	};

	const viewport_to_window_position = position => {
		const rect = canvas.getBoundingClientRect();
		return {
			x: position.x - rect.left,
			y: position.y - rect.top,
		};
	};
	const window_to_canvas_position = position => {
		const {a, d, e: tx, f: ty} = context.getTransform();
		return {
			x: (position.x - tx) / a,
			y: (position.y - ty) / d,
		};
	};
	const canvas_to_image_position = position => {
		return {
			x: (position.x - image_offset_x) / image_scale,
			y: (position.y - image_offset_y) / image_scale,
		};
	};
	const image_to_canvas_position = position => {
		return {
			x: position.x * image_scale + image_offset_x,
			y: position.y * image_scale + image_offset_y,
		};
	};
	const image_to_canvas_box = box => {
		return {
			x: box.x * image_scale + image_offset_x,
			y: box.y * image_scale + image_offset_y,
			width: box.width * image_scale,
			height: box.height * image_scale,
		};
	};

	const clear = () => {
		const {a: sx, d: sy, e: tx, f: ty} = context.getTransform();
		context.clearRect(
			-tx / sx, -ty / sy , canvas.width / sx, canvas.height / sy);
	};
	const translate = delta => {
		context.translate(delta.x, delta.y);
	};
	const translate_to_box = box => {
		const canvas_box = image_to_canvas_box(box)
		const canvas_mid = window_to_canvas_position(
			{x: canvas.width / 2, y: canvas.height / 2});
		const canvas_delta = {
			x: canvas_mid.x - (canvas_box.x + canvas_box.width / 2),
			y: canvas_mid.y - (canvas_box.y + canvas_box.height / 2),
		};
		translate(canvas_delta);
	};
	const zoom = (position, factor) => {
		context.translate(position.x, position.y);
		context.scale(factor, factor);
		context.translate(-position.x, -position.y);
	};
	return {
		set_dimensions,
		get_image_offset,
		reset_offset,
		get_image_scale,
		reset_scale,
		viewport_to_window_position,
		window_to_canvas_position,
		canvas_to_image_position,
		image_to_canvas_position,
		image_to_canvas_box,
		clear,
		translate,
		translate_to_box,
		zoom,
	};
};

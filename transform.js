"use strict"

const Transformer = canvas => {
	const context = canvas.getContext("2d");
	let offset_x = 0;
	let offset_y = 0;
	let scale = 1;
	const get_offset = () => {
		return [offset_x, offset_y];
	};
	const set_offset = (x, y) => {
		offset_x = x;
		offset_y = y;
	};
	const get_scale = () => {
		return scale;
	};
	const set_scale = s => {
		scale = s;
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
			x: (position.x - offset_x) / scale,
			y: (position.y - offset_y) / scale,
		};
	};
	const image_to_canvas_position = position => {
		return {
			x: position.x * scale + offset_x,
			y: position.y * scale + offset_y,
		};
	};
	const image_to_canvas_box = box => {
		return {
			x: box.x * scale + offset_x,
			y: box.y * scale + offset_y,
			width: box.width * scale,
			height: box.height * scale,
		};
	};
	return {
		get_offset,
		set_offset,
		get_scale,
		set_scale,
		window_to_canvas_position,
		canvas_to_image_position,
		image_to_canvas_position,
		image_to_canvas_box,
	};
};


"use strict"

export const Mouse = transformer => {
	let mouse = {x: 0, y: 0};
	let last_mouse = {x: 0, y: 0};
	const set_mouse_viewport = (viewport_x, viewport_y) => {
		last_mouse = mouse;
		mouse = transformer.viewport_to_window_position(
			{x: viewport_x, y: viewport_y});
	};
	const get_mouse_canvas = () => {
		return transformer.window_to_canvas_position(mouse);
	};
	const get_mouse_image = () => {
		return transformer.canvas_to_image_position(get_mouse_canvas());
	};
	const get_delta_canvas = () => {
		const before = transformer.window_to_canvas_position(last_mouse);
		const after = transformer.window_to_canvas_position(mouse);
		return {
			x: after.x - before.x,
			y: after.y - before.y,
		};
	};
	const get_delta_image = () => {
		const before = transformer.canvas_to_image_position(
			transformer.window_to_canvas_position(last_mouse));
		const after = transformer.canvas_to_image_position(
			transformer.window_to_canvas_position(mouse));
		return {
			x: after.x - before.x,
			y: after.y - before.y,
		};
	};
	return {
		set_mouse_viewport,
		get_mouse_canvas,
		get_mouse_image,
		get_delta_canvas,
		get_delta_image,
	};
};

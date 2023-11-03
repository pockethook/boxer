"use strict"

const ImageDrawer = (canvas, transformer, image) => {
	const context = canvas.getContext("2d");
	const set_image = new_image => {
		image = new_image;
	};
	const draw_image = () => {
		const scale = transformer.get_scale()
		const [offset_x, offset_y] = transformer.get_offset()
		context.drawImage(
			image, 0, 0, image.width, image.height,
			offset_x, offset_y, image.width * scale, image.height * scale);
	};
	return {
		set_image,
		draw_image,
	};
};

const BoxDrawer = (canvas, transformer) => {
	const context = canvas.getContext("2d");

	const box_width = 1;
	const text_offset = 4;
	const box_colour = 'red'
	const box_edge_colour = 'red'

	const draw_box_top = box => {
		context.moveTo(box.x, box.y);
		context.lineTo(box.x + box.width, box.y);
	}

	const draw_box_right = box => {
		context.moveTo(box.x + box.width, box.y);
		context.lineTo(box.x + box.width, box.y + box.height);
	}

	const draw_box_bottom = box => {
		context.moveTo(box.x, box.y + box.height);
		context.lineTo(box.x + box.width, box.y + box.height);
	}

	const draw_box_left = box => {
		context.moveTo(box.x, box.y);
		context.lineTo(box.x, box.y + box.height);
	}

	const draw_box_edge = (box, edge) => {
		context.strokeStyle = box_edge_colour;
		context.beginPath();
		if (edge === 0) {
			draw_box_top(box);
		} else if (edge === 1) {
			draw_box_right(box);
		} else if (edge === 2) {
			draw_box_bottom(box);
		} else if (edge === 3) {
			draw_box_left(box);
		}
		context.stroke();
	}

	const draw_text = (box, colour) => {
		const canvas_box = transformer.image_to_canvas_box(box);
		context.fillStyle = colour;
		context.fillText(
			box.label + ' ' +
				Math.round(box.width) + 'x' + Math.round(box.height),
			canvas_box.x, canvas_box.y - text_offset);
	}

	const draw_box = (label_map, box, highlight, edge) => {
		const canvas_box = transformer.image_to_canvas_box(box);
		const label = box.label;
		const colour =
			label in label_map ? label_map[label]: box_colour;
		context.strokeStyle = colour;
		context.lineWidth = box_width;
		context.strokeRect(
			canvas_box.x, canvas_box.y, canvas_box.width, canvas_box.height);
		if (highlight) {
			draw_text(box, colour);
			if (edge != -1) {
				draw_box_edge(canvas_box, edge);
			}
		}
	};

	const draw_boxes = (
		label_map, annotations, annotations_index, edge, annotations_hide) => {

		if (!annotations_hide && annotations) {
			annotations.forEach((annotation, index) => draw_box(
				label_map,
				annotation,
				index === annotations_index,
				index === annotations_index ? edge : -1));
		}

		if (annotations_index >= 0 && annotations) {
			draw_box(label_map, annotations[annotations_index], true, edge);
		}
	};

	return {
		draw_boxes,
	};
};

const OverlayDrawer = (canvas, transformer) => {
	const context = canvas.getContext("2d");

	const lines_width = 1;

	const draw_point = (image_point, colour) => {
		const canvas_point = transformer.image_to_canvas_position(image_point);
		context.strokeStyle = colour;
		context.lineWidth = canvas_point;
		context.beginPath();
		context.moveTo(canvas_point.x - 1, canvas_point.y);
		context.lineTo(canvas_point.x + 1, canvas_point.y);
		context.stroke();
		context.beginPath();
		context.moveTo(canvas_point.x, canvas_point.y - 1);
		context.lineTo(canvas_point.x, canvas_point.y + 1);
		context.stroke();
	};

	const draw_points = (image_points, colour) => {
		image_points.forEach(image_point => draw_point(image_point, colour));
	};

	const draw_lines = (canvas_position, colour) => {
		const canvas_origin = transformer.window_to_canvas_position(
			{x: 0, y: 0});
		const canvas_end = transformer.window_to_canvas_position(
			{x: canvas.width, y: canvas.height});
		context.strokeStyle = colour;
		context.lineWidth = lines_width;
		context.beginPath();
		context.moveTo(canvas_position.x, canvas_origin.y);
		context.lineTo(canvas_position.x, canvas_end.y);
		context.stroke();
		context.beginPath();
		context.moveTo(canvas_origin.x, canvas_position.y);
		context.lineTo(canvas_end.x, canvas_position.y);
		context.stroke();
	};
	return {
		draw_points,
		draw_lines,
	};
};

const Drawer = (
	canvas, transformer, image, window_width, window_height) => {
	
	const update_canvas_dimensions = (window_width, window_height) => {
		canvas.width = window_width;
		canvas.height = window_height;
	};
	const update_scaling = () => {
		const scale_x = canvas.width / image.width;
		const scale_y = canvas.height / image.height;
		const scale = Math.min(scale_x, scale_y);
		transformer.set_scale(scale);

		const offset_x = (canvas.width - scale * image.width) / 2;
		const offset_y = (canvas.height - scale * image.height) / 2;
		transformer.set_offset(offset_x, offset_y);
	};

	const reset_scale = (window_width, window_height) => {
		update_canvas_dimensions(window_width, window_height);
		update_scaling();
	};

	const clear_canvas = () => {
		const {a: sx, d: sy, e: tx, f: ty} = context.getTransform();
		context.clearRect(
			-tx / sx, -ty / sy , canvas.width / sx, canvas.height / sy);
	};

	const translate = canvas_position_delta => {
		context.translate(canvas_position_delta.x, canvas_position_delta.y);
	};

	const context = canvas.getContext("2d");

	reset_scale(window_width, window_height);

	const image_drawer = ImageDrawer(canvas, transformer, image);
	const box_drawer = BoxDrawer(canvas, transformer);
	const overlay_drawer = OverlayDrawer(canvas, transformer);

	return {
		draw_all: (
			label_map, annotations, canvas_position, points,
			label_index, annotations_index, edge, annotations_hide) => {

			clear_canvas();

			image_drawer.draw_image();

			box_drawer.draw_boxes(
				label_map, annotations, annotations_index,
				edge, annotations_hide);

			const colour = label_colour(label_map, label_index);
			overlay_drawer.draw_lines(canvas_position, colour);
			overlay_drawer.draw_points(points, colour);

		},
		set_image: new_image => {
			image = new_image;
			image_drawer.set_image(image);
			update_scaling();
		},
		reset_scale,
		translate,
		translate_to_box: box => {
			const canvas_box = transformer.image_to_canvas_box(box)
			const canvas_mid = transformer.window_to_canvas_position(
				{x: window_width / 2, y: window_height / 2});
			const canvas_delta = {
				x: canvas_mid.x - (canvas_box.x + canvas_box.width / 2),
				y: canvas_mid.y - (canvas_box.y + canvas_box.height / 2),
			};
			translate(canvas_delta);
		},
		zoom: (canvas_position, factor) => {

			context.translate(canvas_position.x, canvas_position.y);
			context.scale(factor, factor);
			context.translate(-canvas_position.x, -canvas_position.y);
		}
	};
};

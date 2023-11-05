"use strict"

const ImageDrawer = (canvas, transformer) => {
	const context = canvas.getContext("2d");
	const draw_image = image => {
		const scale = transformer.get_image_scale();
		const [offset_x, offset_y] = transformer.get_image_offset();
		context.drawImage(
			image, 0, 0, image.width, image.height,
			offset_x, offset_y, image.width * scale, image.height * scale);
	};
	return {
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
		label_map, boxes, box_index, edge, annotations_hide) => {

		if (!annotations_hide && boxes) {
			boxes.forEach((annotation, index) => draw_box(
				label_map,
				annotation,
				index === box_index,
				index === box_index ? edge : -1));
		}

		if (box_index >= 0 && boxes) {
			draw_box(label_map, boxes[box_index], true, edge);
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

const Drawer = (canvas, transformer, boxes) => {
	
	const image_drawer = ImageDrawer(canvas, transformer);
	const box_drawer = BoxDrawer(canvas, transformer);
	const overlay_drawer = OverlayDrawer(canvas, transformer);

	return {
		draw: (
			image,
			boxes,
			box_index,
			label_index,
			edge,
			points,
			canvas_position,
			label_map,
			annotations_hide) => {

			transformer.clear();

			image_drawer.draw_image(image);

			box_drawer.draw_boxes(
				label_map, boxes, box_index,
				edge, annotations_hide);

			const colour = label_colour(label_map, label_index);
			overlay_drawer.draw_lines(canvas_position, colour);
			overlay_drawer.draw_points(points, colour);
		},
	};
};

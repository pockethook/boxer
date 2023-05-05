"use strict"

const Clicker = () => {
	let count = 0;
	let active = false;
	const points = [
		{x: 0, y: 0},
		{x: 0, y: 0},
		{x: 0, y: 0},
		{x: 0, y: 0},
	];
	const reset_count = () => {
		count = 0;
	};
	return {
		click: position => {
			points[count] = {
				x: position.x,
				y: position.y,
			};
			count++;
		},
		get_points: () => points.slice(0, count),
		box: label => {
			reset_count();
			const xs = points.map(point => point.x);
			const ys = points.map(point => point.y);
			const min_x = Math.min(...xs);
			const min_y = Math.min(...ys);
			const max_x = Math.max(...xs);
			const max_y = Math.max(...ys);
			return {
				label,
				x: min_x,
				y: min_y,
				width: max_x - min_x,
				height: max_y - min_y,
			};
		},
		is_complete: () => count == 4,
		decrease_count: () => {
			count = Math.max(0, count - 1);
		},
		get_active: () => active,
		activate: () => {
			reset_count();
			active = true;
		},
		deactivate: () => {
			reset_count();
			active = false;
		},
	};
};

const Drawer = (
	canvas_image, canvas_boxes,
	new_image, window_width, window_height) => {

	const update_canvas_dimensions = (window_width, window_height) => {
		canvas_image.width = window_width;
		canvas_image.height = window_height;
		canvas_boxes.width = window_width;
		canvas_boxes.height = window_height;
	};
	const update_scaling = () => {
		const scale_x = canvas_image.width / image.width;
		const scale_y = canvas_image.height / image.height;
		scale = Math.min(scale_x, scale_y);
		offset_x = (canvas_image.width - scale * image.width) / 2;
		offset_y = (canvas_image.height - scale * image.height) / 2;
	};

	const draw_image = () => {
		context_image.drawImage(
			image, 0, 0, image.width, image.height,
			offset_x, offset_y, image.width * scale, image.height * scale);
	};

	const draw_point = (image_point, colour) => {
		const canvas_point = transform_image_canvas(image_point);
		context_boxes.strokeStyle = colour;
		context_boxes.lineWidth = canvas_point;
		context_boxes.beginPath();
		context_boxes.moveTo(canvas_point.x - 1, canvas_point.y);
		context_boxes.lineTo(canvas_point.x + 1, canvas_point.y);
		context_boxes.stroke();
		context_boxes.beginPath();
		context_boxes.moveTo(canvas_point.x, canvas_point.y - 1);
		context_boxes.lineTo(canvas_point.x, canvas_point.y + 1);
		context_boxes.stroke();
	};

	const draw_points = (image_points, colour) => {
		image_points.forEach(
			image_point => draw_point(image_point, colour));
	};

	const draw_text = (box, colour) => {
		const canvas_box = transform_box_image_canvas(box);
		context_boxes.fillStyle = colour;
		context_boxes.fillText(
			box.label + ' ' +
				Math.round(box.width) + 'x' + Math.round(box.height),
			canvas_box.x, canvas_box.y - text_offset);
	}

	const draw_box_top = box => {
		context_boxes.moveTo(box.x, box.y);
		context_boxes.lineTo(box.x + box.width, box.y);
	}

	const draw_box_right = box => {
		context_boxes.moveTo(box.x + box.width, box.y);
		context_boxes.lineTo(box.x + box.width, box.y + box.height);
	}

	const draw_box_bottom = box => {
		context_boxes.moveTo(box.x, box.y + box.height);
		context_boxes.lineTo(box.x + box.width, box.y + box.height);
	}

	const draw_box_left = box => {
		context_boxes.moveTo(box.x, box.y);
		context_boxes.lineTo(box.x, box.y + box.height);
	}

	const draw_box_edge = (box, edge) => {
		context_boxes.strokeStyle = box_edge_colour;
		context_boxes.beginPath();
		if (edge == 0) {
			draw_box_top(box);
		} else if (edge == 1) {
			draw_box_right(box);
		} else if (edge == 2) {
			draw_box_bottom(box);
		} else if (edge == 3) {
			draw_box_left(box);
		}
		context_boxes.stroke();
	}

	const draw_box = (label_map, box, highlight, edge) => {
		const canvas_box = transform_box_image_canvas(box);
		const label = box.label;
		const colour =
			label in label_map ? label_map[label]: box_colour;
		context_boxes.strokeStyle = colour;
		context_boxes.lineWidth = box_width;
		context_boxes.strokeRect(
			canvas_box.x, canvas_box.y, canvas_box.width, canvas_box.height);
		if (highlight) {
			draw_text(box, colour);
			if (edge != -1) {
				draw_box_edge(canvas_box, edge);
			}
		}
	};

	const clear_boxes = () => {
		const canvas_origin = transform_window_canvas({x: 0, y: 0});
		const canvas_end = transform_window_canvas(
			{x: canvas_boxes.width, y: canvas_boxes.height});
		context_boxes.clearRect(
			canvas_origin.x, canvas_origin.y,
			canvas_end.x - canvas_origin.x, canvas_end.y - canvas_origin.y);
	};

	const draw_boxes = (label_map, annotations, annotations_index, edge) => {
		annotations.forEach((annotation, index) => draw_box(
			label_map,
			annotation,
			index == annotations_index,
			index == annotations_index ? edge : -1));

		if (annotations_index >= 0) {
			draw_box(label_map, annotations[annotations_index], true, edge);
		}
	};

	const draw_lines = (canvas_position, colour) => {
		const canvas_origin = transform_window_canvas({x: 0, y: 0});
		const canvas_end = transform_window_canvas(
			{x: canvas_boxes.width, y: canvas_boxes.height});
		context_boxes.strokeStyle = colour;
		context_boxes.lineWidth = lines_width;
		context_boxes.beginPath();
		context_boxes.moveTo(canvas_position.x, canvas_origin.y);
		context_boxes.lineTo(canvas_position.x, canvas_end.y);
		context_boxes.stroke();
		context_boxes.beginPath();
		context_boxes.moveTo(canvas_origin.x, canvas_position.y);
		context_boxes.lineTo(canvas_end.x, canvas_position.y);
		context_boxes.stroke();
	};

	const reset_scale = (window_width, window_height) => {
		update_canvas_dimensions(window_width, window_height);
		update_scaling();
	};

	const transform_window_canvas = position => {
		const {a, d, e: tx, f: ty} = context_image.getTransform();
		return {
			x: (position.x - tx) / a,
			y: (position.y - ty) / d,
		};
	};

	const transform_canvas_image = position => {
		return {
			x: (position.x - offset_x) / scale,
			y: (position.y - offset_y) / scale,
		};
	};

	const transform_image_canvas = position => {
		return {
			x: position.x * scale + offset_x,
			y: position.y * scale + offset_y,
		};
	};

	const transform_box_image_canvas = box => {
		return {
			x: box.x * scale + offset_x,
			y: box.y * scale + offset_y,
			width: box.width * scale,
			height: box.height * scale,
		};
	};

	const clear_canvas = () => {
		context_image.clearRect(
			0, 0, canvas_image.width, canvas_image.height);
		context_boxes.clearRect(
			0, 0, canvas_boxes.width, canvas_boxes.height);
	};

	const translate = canvas_position_delta => {
		clear_canvas();

		context_image.translate(
			canvas_position_delta.x, canvas_position_delta.y);
		context_boxes.translate(
			canvas_position_delta.x, canvas_position_delta.y);
	};

	let image = new_image;

	const context_image = canvas_image.getContext("2d");
	const context_boxes = canvas_boxes.getContext("2d");

	update_canvas_dimensions(window_width, window_height);

	image.src = canvas_image.toDataURL('image/png');

	let offset_x = 0;
	let offset_y = 0;
	let scale = 1;
	update_scaling()

	const box_width = 1;
	const lines_width = 1;
	const text_offset = 4;
	const box_edge_colour = 'red'

	return {
		draw_all: (
			label_map, annotations, canvas_position, points,
			label_index, annotations_index, edge, annotations_hide) => {

			draw_image();

			clear_boxes();
			if (!annotations_hide) {
				draw_boxes(label_map, annotations, annotations_index, edge);
			}

			const colour = label_colour(label_map, label_index);
			draw_lines(canvas_position, colour);
			draw_points(points, colour);

		},
		set_image: new_image => {
			image = new_image;
			update_scaling();
		},
		reset_scale,
		transform_window_canvas,
		transform_canvas_image,
		translate,
		translate_to_box: box => {
			const canvas_box = transform_box_image_canvas(box)
			const canvas_mid = transform_window_canvas(
				{x: window_width / 2, y: window_height / 2});
			const canvas_delta = {
				x: canvas_mid.x - (canvas_box.x + canvas_box.width / 2),
				y: canvas_mid.y - (canvas_box.y + canvas_box.height / 2),
			};
			translate(canvas_delta);
		},
		zoom: (canvas_position, factor) => {
			clear_canvas();

			context_image.translate(canvas_position.x, canvas_position.y);
			context_image.scale(factor, factor);
			context_image.translate(-canvas_position.x, -canvas_position.y);

			context_boxes.translate(canvas_position.x, canvas_position.y);
			context_boxes.scale(factor, factor);
			context_boxes.translate(-canvas_position.x, -canvas_position.y);
		}
	};
};

const label_colour = (label_map, index) =>
	label_map[Object.keys(label_map)[index]];

const point_in_box = (x, y, box) => 
	x >= box.x && x <= box.x + box.width &&
	y >= box.y && y <= box.y + box.height;

const box_area = box => box.width * box.height;

const find_best_annotations_index = (
	annotations, position) => {
	// Score inverse proportional to box area
	const scores = annotations.map(annotation =>
		point_in_box(position.x, position.y, annotation) *
		(1 / box_area(annotation)));
	const max_score = Math.max(...scores);
	return scores.findIndex(score => score && score === max_score);
};

const shift_left = (annotations, annotations_index, edge) => {
	const box = annotations[annotations_index];
	if (edge == 3) {
		box.x -= 1;
		box.width += 1;
	} else if (edge == 1) {
		box.width -= 1;
	} else {
		return false;
	}
	return true;
}

const shift_down = (annotations, annotations_index, edge) => {
	const box = annotations[annotations_index];
	if (edge == 2) {
		box.height += 1;
	} else if (edge == 0) {
		box.y += 1;
		box.height -= 1;
	} else {
		return false;
	}
	return true;
}

const shift_up = (annotations, annotations_index, edge) => {
	const box = annotations[annotations_index];
	if (edge == 0) {
		box.y -= 1;
		box.height += 1;
	} else if (edge == 2) {
		box.height -= 1;
	} else {
		return false;
	}
	return true;
}

const shift_right = (annotations, annotations_index, edge) => {
	const box = annotations[annotations_index];
	if (edge == 1) {
		box.width += 1;
	} else if (edge == 3) {
		box.x += 1;
		box.width -= 1;
	} else {
		return false;
	}
	return true;
}

document.addEventListener(
	"DOMContentLoaded",
	() => {
		const input = document.getElementById('file-image');
		const file_annotations = document.getElementById('file-annotations');
		const file_label_map = document.getElementById('file-label-map');

		const canvas_image = document.getElementById('canvas-image');
		const canvas_boxes = document.getElementById('canvas-boxes');

		const save = document.getElementById('save');
		const download = document.getElementById('download');

		let image = new Image();

		const drawer = Drawer(
			canvas_image, canvas_boxes, image,
			window.innerWidth, window.innerHeight);

		let annotations = [];
		let annotations_index = -1;
		let annotations_hide = false;

		let label_map = {
		  0: "#66ff66",
		  1: "#34d1b7",
		  2: "#33ddff",
		  3: "#2a7dd1",
		  4: "#f59331",
		  5: "#f5d578",
		  6: "#fafa37",
		  7: "#a0a022",
		  8: "#8c78f0",
		  9: "#32237c",
		  10: "#ffffff",
		  11: "#000000",
		};

		let label_index = 0;

		const clicker = Clicker();

		let position = {x: 0, y: 0};

		let moving = false;
		let move = {x: 0, y: 0};

		let edge = 0;

		const set_image = event => {
			image = new Image();
			image.onload = () => {
				drawer.set_image(image);
				position = mouse_position(event);
				drawer.draw_all(
					label_map, annotations,
					position, clicker.get_points(), label_index,
					annotations_index, edge, annotations_hide);
			};
			const file = event.target.files[0];
			image.name = file.name;
			image.src = window.URL.createObjectURL(file);
		};

		const load_annotations = event => {
			const reader = new FileReader();
			reader.onload = () => {
				annotations = JSON.parse(reader.result);
			};
			const file = event.target.files[0];
			reader.readAsText(file, 'utf-8');
		};

		const load_label_map = event => {
			const reader = new FileReader();
			reader.onload = () => {
				label_map = JSON.parse(reader.result);
			};
			const file = event.target.files[0];
			reader.readAsText(file, 'utf-8');
		};

		input.addEventListener('change', set_image);
		file_annotations.addEventListener('change', load_annotations);
		file_label_map.addEventListener('change', load_label_map);

		const mouse_position = event => {
			const rect = canvas_boxes.getBoundingClientRect();
			const position = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
			};
			return drawer.transform_window_canvas(position)
		};

		// Zoom
		canvas_boxes.addEventListener(
			'wheel',
			event => {
				position = mouse_position(event);
				if (event.deltaY < 0) {
					drawer.zoom(position, 1.2);
				} else {
					drawer.zoom(position, 1 / 1.2);
				}
				drawer.draw_all(
					label_map, annotations,
					position, clicker.get_points(), label_index,
					annotations_index, edge, annotations_hide);
			},
			{passive: true});

		canvas_boxes.addEventListener(
			'mousedown',
			event => {
				// Middle click
				if (event.which === 2 || event.button === 4) {
					// Remove last click
					if (clicker.get_active()) {
						clicker.decrease_count();
					// Delete box
					} else {
						position = mouse_position(event);
						const index = find_best_annotations_index(
							annotations,
							drawer.transform_canvas_image(position));
						if (index >= 0) {
							annotations.splice(index, 1);
							drawer.draw_all(
								label_map, annotations,
								position, clicker.get_points(), label_index,
								annotations_index, edge, annotations_hide);
						}
					}
				// Left button drag
				} else if (event.which === 1  || event.button === 0) {
					if (!clicker.get_active()) {
						moving = true;
						position = mouse_position(event);
						move = position;
					}
				}
			});

		canvas_boxes.addEventListener(
			'mouseup',
			event => {
				// Left button drag
				if (event.which === 1  || event.button === 0) {
					if (moving) {
						moving = false;
					}
				}
			});

		canvas_boxes.addEventListener(
			'mousemove',
			event => {
				position = mouse_position(event);
				// Left button drag
				if (event.which === 1  || event.button === 0) {
					if (moving) {
						const delta = {
							x: position.x - move.x,
							y: position.y - move.y,
						};
						drawer.translate(delta);
						position = mouse_position(event);
						move = position;
					}
				}
				// Also need to draw lines if not dragging
				drawer.draw_all(
					label_map, annotations,
					position, clicker.get_points(), label_index,
					annotations_index, edge, annotations_hide);
			});

		canvas_boxes.addEventListener(
			'click',
			event => {
				let redraw = false;
				// Add/remove point
				if (clicker.get_active()) {
					// Left button add point
					if (event.which === 1  || event.button === 0) {
						position = mouse_position(event);
						const point = drawer.transform_canvas_image(position);
						const image_box = {
							x: 0, y: 0,
							width: image.width, height: image.height
						};
						if (point_in_box(point.x, point.y, image_box)) {
							clicker.click(point);
							if (clicker.is_complete()) {
								const label =
									Object.keys(label_map)[label_index]
								annotations.push(clicker.box(label))
								clicker.deactivate();
							}
							redraw = true;
						}
					// Middle button remove point
					} else if (event.which === 2 || event.button === 4) {
						clicker.decrease_count();
						redraw = true;
					}
				// Middle button delete box
				} else if (event.which === 2 || event.button === 4) {
					position = mouse_position(event);
					const index = find_best_annotations_index(
						annotations,
						drawer.transform_canvas_image(position));
					if (index >= 0) {
						annotations.splice(index, 1);
						redraw = true;
					}
				// Left button select box for edit mode
				} else if (event.which === 1  || event.button === 0) {
						position = mouse_position(event);
					position = mouse_position(event);
					const index = find_best_annotations_index(
						annotations, drawer.transform_canvas_image(position));
					if (index >= 0) {
						edge = -1;
						annotations_index = index;
					} else {
						edge = -1;
						annotations_index = -1;
					}
					redraw = true;
				}

				if (redraw) {
					drawer.draw_all(
						label_map, annotations,
						position, clicker.get_points(), label_index,
						annotations_index, edge, annotations_hide);
				}
			});

		// Reset scale
		canvas_boxes.addEventListener(
			'dblclick',
			event => {
				annotations_index = -1 ;
				position = mouse_position(event);
				drawer.reset_scale(window.innerWidth, window.innerHeight);
				drawer.draw_all(
					label_map, annotations,
					position, clicker.get_points(), label_index,
					annotations_index, edge, annotations_hide);
			});

		// Save
		save.addEventListener(
			'click',
			() => {
				const data = 'data:text/json;charset=utf-8,' +
					encodeURIComponent(JSON.stringify(annotations));
				download.setAttribute('href', data);
				download.setAttribute(
					'download',
					image.name.split('.').slice(0, -1).join('.') + '.json');
				download.click();
			});

		window.addEventListener(
			'keydown',
			event => {

				let redraw = false;

				const index_keys = '1234567890-=!@#$%^&*()_+'.split('')
				if (index_keys.includes(event.key)) {
					label_index =
						index_keys.findIndex(key => key === event.key);
					if (annotations_index >= 0) {
						annotations[annotations_index].label =
							Object.keys(label_map)[label_index];
					}
					redraw = true;
				} else {
					switch (event.key) {
						// Normal mode
						case 'Escape':
							edge = -1;
							annotations_index = -1;
							clicker.deactivate();
							redraw = true;
							break;

						// Insert mode
						case 'r':
							edge = -1;
							annotations_index = -1;
							clicker.activate();
							redraw = true;
							break;

						// Toggle hide annotations
						case 'a':
							annotations_hide = !annotations_hide;
							redraw = true;
							break;

						case 's':
							if (annotations_index >= 0) {
								if (!shift_left(
									annotations, annotations_index, edge)) {

									edge = 3;
								}
								redraw = true;
							}
							break;
						case 'f':
							if (annotations_index >= 0) {
								if (!shift_down(
									annotations, annotations_index, edge)) {

									edge = 2;
								}
								redraw = true;
							}
							break;
						case 'd':
							if (annotations_index >= 0) {
								if (!shift_up(
									annotations, annotations_index, edge)) {

									edge = 0;
								}
								redraw = true;
							}
							break;
						case 'g':
							if (annotations_index >= 0) {
								if (!shift_right(
									annotations, annotations_index, edge)) {

									edge = 1;
								}
								redraw = true;
							}
							break;

						case 'F':
							if (annotations) {
								edge = -1;
								annotations_index = Math.min(
									annotations_index + 1,
									annotations.length - 1);
								drawer.translate_to_box(
									annotations[annotations_index])
								redraw = true;
							}
							break;
						case 'D':
							if (annotations) {
								edge = -1;
								annotations_index = Math.max(
									0, annotations_index - 1);
								drawer.translate_to_box(
									annotations[annotations_index])
								redraw = true;
							}
							break;

						case 'p':
							file_label_map.click();
							break;
						case 'o':
							input.click();
							break;
						case 'i':
							file_annotations.click();
							break;
						case 'u':
							save.click();
							break;
					}
				}

				if (redraw) {
					drawer.draw_all(
						label_map, annotations,
						position, clicker.get_points(), label_index,
						annotations_index, edge, annotations_hide);
				}
			});
	});

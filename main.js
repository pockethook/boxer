"use strict"

const Clicker = () => {
	let count = 0;
	let active = false;
	const points = [
		{ x: 0, y: 0},
		{ x: 0, y: 0},
		{ x: 0, y: 0},
		{ x: 0, y: 0},
	];
	const reset = () => {
		count = 0;
	};
	return {
		click: position => {
			points[count] = { x: position.x, y: position.y };
			count++;
		},
		get_points: () => points.slice(0, count),
		box: id => {
			reset();
			const xs = points.map(point => point.x);
			const ys = points.map(point => point.y);
			const min_x = Math.min(...xs);
			const min_y = Math.min(...ys);
			const max_x = Math.max(...xs);
			const max_y = Math.max(...ys);
			return {
				id,
				x: min_x,
				y: min_y,
				width: max_x - min_x,
				height: max_y - min_y,
			};
		},
		get_count: () => count,
		decrease_count: () => {
			count = Math.max(0, count - 1);
		},
		get_active: () => active,
		activate: () => {
			reset();
			active = true;
		},
		deactivate: () => {
			reset();
			active = false;
		},
	};
};

const Drawer = (canvas_image, canvas_boxes, new_image) => {
	let image = new_image;
	const context_image = canvas_image.getContext("2d");
	const context_boxes = canvas_boxes.getContext("2d");
	canvas_image.width = image.width;
	canvas_image.height = image.height;
	canvas_boxes.width = image.width;
	canvas_boxes.height = image.height;
	const point_colour = 'black'
	const point_width = 3;
	const box_colour = 'red';
	const box_width = 3;
	const lines_colour = 'blue';
	const lines_width = 2;
	const pixel_width = () => {
		return canvas_image.width / image.width;
	};
	const pixel_height = () => {
		return canvas_image.height / image.height;
	};
	const draw_image = () => {
		context_image.drawImage(
			image, 0, 0, image.width, image.height,
			0, 0, canvas_image.width, canvas_image.height);
	};
	const draw_point = position => {
		context_boxes.strokeStyle = point_colour;
		context_boxes.lineWidth = point_width;
		context_boxes.beginPath();
		context_boxes.moveTo(
			(position.x - 1) * pixel_width(),
			position.y * pixel_height());
		context_boxes.lineTo(
			(position.x + 1) * pixel_width(),
			position.y * pixel_height());
		context_boxes.stroke();
		context_boxes.beginPath();
		context_boxes.moveTo(
			position.x * pixel_width(),
			(position.y - 1) * pixel_height());
		context_boxes.lineTo(
			position.x * pixel_width(),
			(position.y + 1) * pixel_height());
		context_boxes.stroke();
	};
	const draw_points = positions => {
		positions.forEach(position => draw_point(position));
	};
	const draw_box = box => {
		context_boxes.strokeStyle = box_colour;
		context_boxes.lineWidth = box_width;
		context_boxes.strokeRect(
			box.x * pixel_width(),
			box.y * pixel_height(),
			box.width * pixel_width(),
			box.height * pixel_height());
	};
	const draw_boxes = annotations => {
		context_boxes.clearRect(
			0, 0, canvas_boxes.width, canvas_boxes.height);
		annotations.forEach(annotation => draw_box(annotation));
	};
	const draw_lines = position => {
		context_boxes.strokeStyle = lines_colour;
		context_boxes.lineWidth = lines_width;
		context_boxes.beginPath();
		context_boxes.moveTo(position.x * pixel_width(), 0);
		context_boxes.lineTo(
			position.x * pixel_width(), canvas_boxes.height);
		context_boxes.stroke();
		context_boxes.beginPath();
		context_boxes.moveTo(0, position.y * pixel_height());
		context_boxes.lineTo(
			canvas_boxes.width, position.y * pixel_height());
		context_boxes.stroke();
	};
	return {
		draw_all: (annotations, position, points) => {
			if (image.name) {
				draw_image();
			}
			draw_boxes(annotations);
			if (position) {
				draw_lines(position);
			}
			if (points) {
				draw_points(points);
			}
		},
		draw_image,
		draw_boxes,
		draw_box,
		draw_lines,
		draw_points,
		set_image: new_image => {
			image = new_image;
			canvas_image.width = image.width;
			canvas_image.height = image.height;
			canvas_boxes.width = image.width;
			canvas_boxes.height = image.height;
		},
		scale: factor => {
			canvas_image.width *= factor;
			canvas_image.height *= factor;
			canvas_boxes.width *= factor;
			canvas_boxes.height *= factor;
		}
	};
};

const point_in_box = (x, y, box) => 
	x >= box.x && x <= box.x + box.width &&
	y >= box.y && y <= box.y + box.height;

const box_area = box => box.width * box.height;

const find_best_annotation_index = (annotations, position) => {
	// Score inverse proportional to box area
	const scores = annotations.map(annotation =>
		point_in_box(position.x, position.y, annotation) *
		(1 / box_area(annotation)));
	const max_score = Math.max(...scores);
	return scores.findIndex(score => score && score == max_score);
};

const shift_annotations = (annotations, x, y) => {
	return annotations.map(annotation => ({
		...annotation,
		x: annotation.x + x,
		y: annotation.y + y,
	}));
};

document.addEventListener(
	"DOMContentLoaded",
	() => {
		const input = document.getElementById('file-image');
		const file_annotations = document.getElementById('file-annotations');

		const canvas_image = document.getElementById('canvas-image');
		const canvas_boxes = document.getElementById('canvas-boxes');

		const save = document.getElementById('save');
		const download = document.getElementById('download');

		let image = {
			width: window.innerWidth,
			height: window.innerHeight
		};

		const drawer = Drawer(canvas_image, canvas_boxes, image);
		let annotations = [];

		let clicking = false;
		const clicker = Clicker();

		let position = false;

		const set_image = event => {
			image = new Image();
			image.onload = () => {
				drawer.set_image(image);
				position = mouse_position(event);
				drawer.draw_all(annotations, position, clicker.get_points());
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

		input.addEventListener('change', set_image);
		file_annotations.addEventListener('change', load_annotations);

		const mouse_position = event => {
			const rect = canvas_boxes.getBoundingClientRect();
			const canvas_x = event.clientX - rect.left;
			const canvas_y = event.clientY - rect.top;
			return {
				x: Math.round(canvas_x * image.width / rect.width),
				y: Math.round(canvas_y * image.height / rect.height)
			};
		};


		canvas_boxes.addEventListener(
			'mousedown',
			event => {
				if (event.which == 2 || event.button == 4) {
					position = mouse_position(event);
					const index = find_best_annotation_index(
						annotations, position);
					// Delete box
					if (index >= 0) {
						annotations.splice(index, 1);
						drawer.draw_all(
							annotations, position, clicker.get_points());
					} else if (clicker.get_active()) {
						// Remove last click
						clicker.decrease_count();
					}
				}
			});

		canvas_boxes.addEventListener(
			'mousemove',
			event => {
				position = mouse_position(event);
				drawer.draw_all(
					annotations, position, clicker.get_points());
			});

		canvas_boxes.addEventListener(
			'click',
			event => {
				position = mouse_position(event);
				if (clicker.get_active()) {
					clicker.click(position);
					if (clicker.get_count() == 4) {
						annotations.push(clicker.box(0))
					}
					drawer.draw_all(
						annotations, position, clicker.get_points());
				}
			});

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
				switch (event.key) {
					case 'Escape':
						clicker.deactivate();
						break;
					case 'r':
						clicker.activate();
						break;
					case 'j':
						drawer.scale(1.1);
						drawer.draw_all(
							annotations, position, clicker.get_points());
						break;
					case 'k':
						drawer.scale(0.9);
						drawer.draw_all(
							annotations, position, clicker.get_points());
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
					case 'J':
						shift_annotations(annotations, 0, -1);
						drawer.draw_all(
							annotations, position, clicker.get_points());
						break;
					case 'K':
						shift_annotations(annotations, 0, 1);
						drawer.draw_all(
							annotations, position, clicker.get_points());
						break;
					case 'H':
						shift_annotations(annotations, -1, 0);
						drawer.draw_all(
							annotations, position, clicker.get_points());
						break;
					case 'L':
						shift_annotations(annotations, 1, 0);
						drawer.draw_all(
							annotations, position, clicker.get_points());
						break;
				}
			});
	});

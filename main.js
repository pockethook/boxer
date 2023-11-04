"use strict"

const label_colour = (label_map, index) =>
	label_map[Object.keys(label_map)[index]];

const point_in_box = (x, y, box) => 
	x >= box.x && x <= box.x + box.width &&
	y >= box.y && y <= box.y + box.height;

const box_area = box => box.width * box.height;

const find_best_annotations_indices = (annotations, position) => {
	return annotations
		.filter(annotation => point_in_box(position.x, position.y, annotation))
		.sort((x, y) => box_area(x) - box_area(y))
		.map(box => annotations.findIndex(annotation => annotation === box));
};

document.addEventListener(
	"DOMContentLoaded",
	() => {
		const file_images = document.getElementById('file-images');
		const file_annotations = document.getElementById('file-annotations');
		const file_label_map = document.getElementById('file-label-map');
		const file_gcs = document.getElementById('file-gcs');

		const canvas = document.getElementById('canvas');

		const save = document.getElementById('save');
		const download = document.getElementById('download');

		let image = new Image();
		image.src = canvas.toDataURL('image/png');
		image.width = window.innerWidth;
		image.height = window.innerHeight;

		const transformer = Transformer(canvas);
		const drawer = Drawer(canvas, transformer);

		transformer.set_dimensions(window.innerWidth, window.innerHeight);
		transformer.reset_scale(image.width, image.height);
		transformer.reset_offset(image.width, image.height);

		let annotator = Annotator(window.URL.createObjectURL);
		let annotations_hide = false;

		let last_overlap_indices = [];
		let overlap_indicies_index = -1;

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
		let moved = false;
		let move = {x: 0, y: 0};

		let shifting = false;
		let shifted = false;

		let cancel_click = true;

		const load_image = (url, boxes, box_index) => {
			image = new Image();
			image.onload = () => {
				transformer.reset_scale(image.width, image.height);
				transformer.reset_offset(image.width, image.height);
				drawer.draw(
					image, label_map, annotator.get_boxes(),
					position, clicker.get_points(),
					label_index, annotator.get_box_index(),
					annotator.get_box_edge(), annotations_hide);
				annotator.reset_box_index();
			};
			image.src = url;
		};

		const load_images = event => {
			const files = Array.from(event.target.files);
			annotator.load_images(files);

			load_image(
				annotator.get_url(),
				annotator.get_boxes(),
				annotator.get_box_index());
		};

		const load_annotations = async event => {
			const base_names = annotator.get_names().map(
				name => name.split('.').slice(0, -1).join('.'));

			// Zip file
			if (event.target.files[0].name.split('.').pop() === 'zip') {
				annotator.load_boxes_zip(event.target.files[0]);
			// JSON files
			} else {
				annotator.load_boxes_jsons(Array.from(event.target.files));
			}
		};

		const load_label_map = event => {
			const reader = new FileReader();
			reader.onload = () => {
				label_map = JSON.parse(reader.result);
			};
			const file = event.target.files[0];
			reader.readAsText(file, 'utf-8');
		};

		const load_gcs = async event => {
			if (event.target.files[0].name.split('.').pop() === 'json') {
				annotator.load_gcs(event.target.files[0]).then(() => {
					load_image(
						annotator.get_url(),
						annotator.get_boxes(),
						annotator.get_box_index());
				});
			}
		};

		file_images.addEventListener('change', load_images);
		file_annotations.addEventListener('change', load_annotations);
		file_label_map.addEventListener('change', load_label_map);
		file_gcs.addEventListener('change', load_gcs);

		const mouse_position = event => {
			const rect = canvas.getBoundingClientRect();
			const position = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
			};
			return transformer.window_to_canvas_position(position)
		};

		// Zoom
		canvas.addEventListener(
			'wheel',
			event => {
				position = mouse_position(event);
				const point = transformer.canvas_to_image_position(position);
				if (
					annotator.is_box_selected() &&
					point_in_box(point.x, point.y, annotator.get_box())) {
					const box = annotator.get_box();
					if (point_in_box(point.x, point.y, box)) {
						if (event.deltaY < 0) {
							box['x'] += 0.5;
							box['y'] += 0.5;
							box['width'] -= 1;
							box['height'] -= 1;
						} else {
							box['x'] -= 0.5;
							box['y'] -= 0.5;
							box['width'] += 1;
							box['height'] += 1;
						}
					}
				} else {
					if (event.deltaY < 0) {
						transformer.zoom(position, 1.2);
					} else {
						transformer.zoom(position, 1 / 1.2);
					}
				}
				drawer.draw(
					image, label_map, annotator.get_boxes(),
					position, clicker.get_points(),
					label_index, annotator.get_box_index(),
					annotator.get_box_edge(), annotations_hide);
			},
			{passive: true});

		canvas.addEventListener(
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
						const overlap_indices = find_best_annotations_indices(
							annotator.get_boxes(),
							transformer.canvas_to_image_position(position));
						if (
							JSON.stringify(overlap_indices) ==
							JSON.stringify(last_overlap_indices)) {
							annotator.get_boxes().splice(
								overlap_indices[overlap_indicies_index], 1);

							overlap_indicies_index +=
								overlap_indices.length - 1;
							overlap_indicies_index =
								(overlap_indicies_index - 1) %
								(overlap_indices.length - 1);

							last_overlap_indices =
								find_best_annotations_indices(
									annotator.get_boxes(),
									transformer.canvas_to_image_position(
										position));
							if (last_overlap_indices.length) {
								annotator.reset_box_edge();
								annotator.set_box_index(
									last_overlap_indices[
										overlap_indicies_index]);
							} else {
								annotator.reset_box_edge();
								annotator.reset_box_index();
								overlap_indicies_index = -1;
							}
						} else {
							annotator.get_boxes().splice(
								overlap_indices[0], 1);
						}
						drawer.draw(
							image, label_map, annotator.get_boxes(),
							position, clicker.get_points(),
							label_index, annotator.get_box_index(),
							annotator.get_box_edge(),
							annotations_hide);
					}
				// Left button drag
				} else if (event.which === 1  || event.button === 0) {
					if (!clicker.get_active()) {
						position = mouse_position(event);
						const point =
							transformer.canvas_to_image_position(position);
						move = position;
						if (
							annotator.is_box_selected() &&
							point_in_box(
								point.x, point.y, annotator.get_box())) {
							shifting = true;
						} else {
							moving = true;
						}
					}
				}
			});

		canvas.addEventListener(
			'mouseup',
			event => {
				// Left button drag
				if (event.which === 1  || event.button === 0) {
					if (moving) {
						moving = false;
						if (moved) {
							cancel_click = true;
						}
						moved = false;
					} else if (shifting) {
						shifting = false;
						if (shifted) {
							cancel_click = true;
						}
						shifted = false;
					}
				}
			});

		canvas.addEventListener(
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
						transformer.translate(delta);
						position = mouse_position(event);
						move = position;
						moved = true;
					} else if (shifting) {
						const point =
							transformer.canvas_to_image_position(position);
						const box = annotator.get_box();
						if (point_in_box(point.x, point.y, box)) {
							const before =
								transformer.canvas_to_image_position(move);
							const after =
								transformer.canvas_to_image_position(position);
							const delta = {
								x: after.x - before.x,
								y: after.y - before.y,
							};
							box['x'] += delta.x;
							box['y'] += delta.y;
							move = position;
							shifted = true;
						}
					}
				}
				// Also need to draw lines if not dragging
				drawer.draw(
					image, label_map, annotator.get_boxes(),
					position, clicker.get_points(),
					label_index, annotator.get_box_index(),
					annotator.get_box_edge(), annotations_hide);
			});

		canvas.addEventListener(
			'click',
			event => {
				let redraw = false;
				// Add/remove point
				if (clicker.get_active()) {
					// Left button add point
					if (event.which === 1  || event.button === 0) {
						position = mouse_position(event);
						const point =
							transformer.canvas_to_image_position(position);
						const image_box = {
							x: 0, y: 0,
							width: image.width, height: image.height
						};
						if (point_in_box(point.x, point.y, image_box)) {
							clicker.click(point);
							if (clicker.is_complete()) {
								const label =
									Object.keys(label_map)[label_index];
								annotator.push_box(clicker.box(label));
								clicker.deactivate();
							}
							redraw = true;
						}
					}
				// Left button select box for edit mode
				} else if (event.which === 1  || event.button === 0) {
					if (cancel_click) {
						cancel_click = false;
					} else {
						position = mouse_position(event);
						const overlap_indices = find_best_annotations_indices(
							annotator.get_boxes(),
							transformer.canvas_to_image_position(position));
						if (
							JSON.stringify(overlap_indices) !==
							JSON.stringify(last_overlap_indices)) {
							overlap_indicies_index = -1;
						}
						if (overlap_indices.length) {
							annotator.reset_box_edge();
							if (!event.shiftKey) {
								overlap_indicies_index =
									(overlap_indicies_index + 1) %
									overlap_indices.length;
							} else {
								overlap_indicies_index +=
									overlap_indices.length;
								overlap_indicies_index =
									(overlap_indicies_index - 1) %
									overlap_indices.length;
							}
							annotator.set_box_index(
								overlap_indices[overlap_indicies_index]);
						} else {
							annotator.reset_box_edge();
							annotator.reset_box_index();
							overlap_indicies_index = -1;
						}
						last_overlap_indices = overlap_indices;
						redraw = true;
					}
				}

				if (redraw) {
					drawer.draw(
						image, label_map, annotator.get_boxes(),
						position, clicker.get_points(),
						label_index, annotator.get_box_index(),
						annotator.get_box_edge(),
						annotations_hide);
				}
			});

		// Reset scale
		canvas.addEventListener(
			'dblclick',
			event => {
				position = mouse_position(event);
				const overlap_indices = find_best_annotations_indices(
					annotator.get_boxes(),
					transformer.canvas_to_image_position(position));
				if (overlap_indices.length) {
					annotator.set_box_index(overlap_indices[0]);
					transformer.translate_to_box(
						annotator.get_box());
				} else {
					annotator.reset_box_index();
					transformer.set_dimensions(
						window.innerWidth, window.innerHeight);
					transformer.reset_scale(image.width, image.height);
					transformer.reset_offset(image.width, image.height);
				}
				drawer.draw(
					image, label_map, annotator.get_boxes(),
					position, clicker.get_points(),
					label_index, annotator.get_box_index(),
					annotator.get_box_edge(),
					annotations_hide);
			});

		// Save
		save.addEventListener(
			'click',
			async () => {
				const zip = new JSZip();

				annotator.get_names().forEach((name, index) => {
					const json_data =
						JSON.stringify(annotator.get_boxes(index));
					const json_path =
						name.split('.').slice(0, -1).join('.') + '.json';
					zip.file(json_path, json_data);
				});

				const zip_blob = await zip.generateAsync({type: 'blob'});
				const zip_url = window.URL.createObjectURL(zip_blob);

				const date = new Date();
				download.setAttribute('href', zip_url);
				download.setAttribute('download', date.toISOString() + '.zip');
				download.click();
			});

		window.addEventListener(
			'keydown',
			event => {

				let redraw = false;

				// Change label
				const index_keys = '1234567890-=!@#$%^&*()_+'.split('')
				if (index_keys.includes(event.key)) {
					label_index =
						index_keys.findIndex(key => key === event.key);
					if (annotator.is_box_selected()) {
						annotator.get_box().label =
							Object.keys(label_map)[label_index];
					}
					redraw = true;
				} else {
					switch (event.key) {
						// Normal mode
						case 'Escape':
							annotator.reset_box_edge();
							annotator.reset_box_index();
							clicker.deactivate();
							redraw = true;
							break;

						// Insert mode
						case 'r':
							annotator.reset_box_edge();
							annotator.reset_box_index();
							clicker.activate();
							redraw = true;
							break;

						// Toggle hide annotations
						case 'a':
							annotations_hide = !annotations_hide;
							redraw = true;
							break;

						// Make square
						case 'x':
							if (annotator.is_box_selected()) {
								annotator.square_box();
								redraw = true;
							}
							break;

						// Grow left
						case 's':
							if (annotator.is_box_selected()) {
								annotator.shift_box_edge_left()
								redraw = true;
							}
							break;

						// Grow right
						// Next file
						case 'f':
							if (annotator.is_box_selected()) {
								annotator.shift_box_edge_down();
								redraw = true;
							} else {
								annotator.next_file();
								load_image(
									annotator.get_url(),
									annotator.get_boxes(),
									annotator.get_box_index());
							}
							break;

						// Grow up
						// Previous file
						case 'd':
							if (annotator.is_box_selected()) {
								annotator.shift_box_edge_up();
								redraw = true;
							} else {
								annotator.previous_file();
								load_image(
									annotator.get_url(),
									annotator.get_boxes(),
									annotator.get_box_index());
							}
							break;

						// Grow down
						case 'g':
							if (annotator.is_box_selected()) {
								annotator.shift_box_edge_right();
								redraw = true;
							}
							break;

						// Next box
						case 'F':
							if (annotator.get_boxes()) {
								annotator.reset_box_edge();
								annotator.next_box()
								transformer.translate_to_box(
									annotator.get_box());
								redraw = true;
							}
							break;

						// Previous box
						case 'D':
							if (annotator.get_boxes()) {
								annotator.reset_box_edge();
								annotator.previous_box()
								transformer.translate_to_box(
									annotator.get_box());
								redraw = true;
							}
							break;

						// Open label map
						case 'p':
							file_label_map.click();
							break;

						// Open images
						case 'o':
							file_images.click();
							break;

						// Open annotations
						case 'i':
							file_annotations.click();
							break;

						// Save annotations
						case 'u':
							save.click();
							break;

						// Open Google Cloud Storage manifest
						case 'y':
							file_gcs.click();
							break;
					}
				}

				if (redraw) {
					drawer.draw(
						image, label_map, annotator.get_boxes(),
						position, clicker.get_points(),
						label_index, annotator.get_box_index(),
						annotator.get_box_edge(), annotations_hide);
				}
			});
	});

"use strict"

const Annotator = (create_object_url) => {
	let files = [];
	let urls = [];
	let names = [];
	let annotations = [];

	let file_index = files.length > 0 ? 0 : -1;
	let box_index = -1;
	let box_edge = 0;

	const next_file = () => {
		file_index = (file_index + 1) % files.length;
	};
	const previous_file = () => {
		file_index = (file_index + files.length - 1) % files.length;
	};

	const get_names = () => {
		return names;
	};
	const get_boxes = index => {
		if (index === undefined) {
			return annotations[file_index];
		} else {
			return annotations[index];
		}
	};
	const set_boxes = (index, boxes) => {
		annotations[index] = boxes;
	};

	const get_url = () => {
		return urls[file_index];
	};
	const get_box = () => {
		const boxes = get_boxes();
		if (boxes) {
			return boxes[box_index];
		}
	};

	const get_box_index = () => {
		return box_index;
	};
	const set_box_index = index => {
		box_index = index;
	};
	const reset_box_index = () => {
		box_index = -1;
	};
	const is_box_selected = () => {
		return box_index !== -1;
	};

	const next_box = () => {
		const boxes = get_boxes();
		if (boxes) {
			box_index = (box_index + 1) % boxes.length;
		}
	};
	const previous_box = () => {
		const boxes = get_boxes();
		if (boxes) {
			box_index = (box_index + boxes.length - 1) % boxes.length;
		}
	};

	const push_box = box => {
		const boxes = get_boxes();
		if (boxes) {
			boxes.push(box);
		}
	};

	const get_box_edge = () => {
		return box_edge;
	};
	const reset_box_edge = () => {
		box_edge = -1;
	};
	const shift_box_edge_left = () => {
		const box = get_box();
		if (box_edge === 3) {
			box.x -= 1;
			box.width += 1;
		} else if (box_edge === 1) {
			box.width -= 1;
		} else {
			box_edge = 3;
		}
	};
	const shift_box_edge_down = () => {
		const box = get_box();
		if (box_edge === 2) {
			box.height += 1;
		} else if (box_edge === 0) {
			box.y += 1;
			box.height -= 1;
		} else {
			box_edge = 2;
		}
	}
	const shift_box_edge_up = () => {
		const box = get_box();
		if (box_edge === 0) {
			box.y -= 1;
			box.height += 1;
		} else if (box_edge === 2) {
			box.height -= 1;
		} else {
			box_edge = 0;
		}
	}
	const shift_box_edge_right = () => {
		const box = get_box();
		if (box_edge === 1) {
			box.width += 1;
		} else if (box_edge === 3) {
			box.x += 1;
			box.width -= 1;
		} else {
			box_edge = 1;
		}
	}
	const square_box = () => {
		const box = get_box();
		const cx = box.x + box.width / 2;
		const cy = box.y + box.height / 2;
		const side = Math.min(box.width, box.height);
		box.width = side;
		box.height = side;
		box.x = cx - side / 2;
		box.y = cy - side / 2;
	};

	const base_names = () => {
		return names.map(
			name => name
				.split('/').splice(-1)[0]
				.split('.').slice(0, -1).join('.'));
	}
	const load_boxes_jsons = async json_files => {
		json_files.forEach(json_file => {
			const base_name = json_file.name.split('.').slice(0, -1).join('.');
			const index = base_names().indexOf(base_name);
			if (index >= 0) {
				const reader = new FileReader();
				reader.onload = () => {
					annotations[index] = JSON.parse(reader.result);
				};
				reader.readAsText(json_file, 'utf-8');
			}
		})
	};
	const load_boxes_zip = async zip_file => {
		const zip = new JSZip();
		const data = await zip.loadAsync(zip_file);
		base_names().forEach((base_name, index) => {
			const json_path = base_name + '.json';
			if (json_path in data.files) {
				data.file(json_path).async('string').then(
					json_data => {
						annotations[index] = JSON.parse(json_data);
					});
			}
		});
	};
	const load_images = images => {
		files = Array.from(images);
		urls = files.map(file => create_object_url(file));
		names = files.map(file => file.name);
		annotations = files.map(() => []);
		file_index = files.length > 0 ? 0 : -1;
	};
	const load_images_gcs = async json_file => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = async () => {
				const data = JSON.parse(reader.result);
				const token = data['token'];
				const bucket = data['bucket'];
				const base_url =
					'https://storage.googleapis.com/storage/v1/b/' +
					bucket + '/o/';
				const image_paths = data['images'];
				let images = [];
				for (const image_path of image_paths) {
					const response = await fetch(
						base_url +
							encodeURIComponent(image_path) + '?alt=media',
						{headers: {'Authorization': 'Bearer ' + token}});
					if (response.ok) {
						const response_data = await response.blob();
						response_data.name = image_path;
						images.push(response_data);
					}
				}
				resolve(load_images(images));
			};
			reader.onerror = () => reject(reader.error);
			reader.readAsText(json_file);
		});
	};

	return {
		next_file,
		previous_file,
		get_names,
		get_boxes,
		set_boxes,
		get_url,
		get_box,
		get_box_index,
		set_box_index,
		reset_box_index,
		is_box_selected,
		next_box,
		previous_box,
		push_box,
		get_box_edge,
		reset_box_edge,
		shift_box_edge_left,
		shift_box_edge_down,
		shift_box_edge_up,
		shift_box_edge_right,
		square_box,
		load_boxes_jsons,
		load_boxes_zip,
		load_images,
		load_images_gcs,
	};
};


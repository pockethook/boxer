"use strict"

const Annotator = (files, create_object_url) => {
	files = Array.from(files);
	const urls = files.map(file => create_object_url(file));
	const names = files.map(file => file.name);
	const annotations = files.map(() => []);

	let file_index = files.length > 0 ? 0 : -1;
	let box_index = -1;

	const next_file = () => {
		file_index = (file_index + 1) % files.length;
	};
	const previous_file = () => {
		file_index = (file_index + files.length - 1) % files.length;
	};

	const get_names = () => {
		return names;
	};
	const get_boxes = () => {
		return annotations[file_index];
	};
	const set_boxes = index => {
		return annotations[index];
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
	};
};


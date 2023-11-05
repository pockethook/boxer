"use strict"

const Imager = (src, width, height) => {
	let image = new Image();
	image.src = src;
	image.width = width;
	image.height = height;
	const set_image = (src, onload) => {
		image = new Image();
		image.onload = onload;
		image.src = src;
	};
	const get_image = () => {
		return image;
	};
	const get_width = () => {
		return image.width;
	};
	const get_height = () => {
		return image.height;
	};
	return {
		set_image,
		get_image,
		get_width,
		get_height,
	};
};

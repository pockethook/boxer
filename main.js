"use strict"

function Mouse() {
	this.active = false;
	this.x0 = 0;
	this.y0 = 0;
	this.x1 = 0;
	this.y1 = 0;
	this.begin = function(position) {
		this.x0 = position.x;
		this.y0 = position.y;
	};
	this.end = function(position) {
		this.x1 = position.x;
		this.y1 = position.y;
	};
	this.box = function() {
		return {
			x: Math.min(this.x0, this.x1),
			y: Math.min(this.y0, this.y1),
			width: Math.abs(this.x1 - this.x0),
			height: Math.abs(this.y1 - this.y0)
		};
	};
}

function Drawer(canvas_image, canvas_boxes, image) {
	this.canvas_image = canvas_image;
	this.canvas_boxes = canvas_boxes;
	this.context_image = this.canvas_image.getContext("2d");
	this.context_boxes = this.canvas_boxes.getContext("2d");
	this.box_colour = 'red';
	this.box_width = 3;
	this.lines_colour = 'blue';
	this.lines_width = 2;
	this.image = image;
	this.canvas_image.width = this.image.width;
	this.canvas_image.height = this.image.height;
	this.canvas_boxes.width = this.image.width;
	this.canvas_boxes.height = this.image.height;
	this.set_image = function(image) {
		this.image = image;
		this.canvas_image.width = this.image.width;
		this.canvas_image.height = this.image.height;
		this.canvas_boxes.width = this.image.width;
		this.canvas_boxes.height = this.image.height;
	};
	this.pixel_width = function() {
		return this.canvas_image.width / this.image.width;
	};
	this.pixel_height = function() {
		return this.canvas_image.height / this.image.height;
	};
	this.draw_image = function() {
		this.context_image.drawImage(
			this.image, 0, 0, this.image.width, this.image.height,
			0, 0, this.canvas_image.width, this.canvas_image.height);
	};
	this.draw_box = function(box) {
		this.context_boxes.strokeStyle = this.box_colour;
		this.context_boxes.lineWidth = this.box_width;
		this.context_boxes.strokeRect(
			box.x * this.pixel_width(),
			box.y * this.pixel_height(),
			box.width * this.pixel_width(),
			box.height * this.pixel_height());
	};
	this.draw_boxes = function(annotations) {
		this.context_boxes.clearRect(
			0, 0, this.canvas_boxes.width, this.canvas_boxes.height);
		for (var annotation of annotations) {
			this.draw_box(annotation);
		}
	};
	this.draw_lines = function(position) {
		this.context_boxes.strokeStyle = this.lines_colour;
		this.context_boxes.lineWidth = this.lines_width;
		this.context_boxes.beginPath();
		this.context_boxes.moveTo(position.x * this.pixel_width(), 0);
		this.context_boxes.lineTo(
			position.x * this.pixel_width(), this.canvas_boxes.height);
		this.context_boxes.stroke();
		this.context_boxes.beginPath();
		this.context_boxes.moveTo(0, position.y * this.pixel_height());
		this.context_boxes.lineTo(
			this.canvas_boxes.width, position.y * this.pixel_height());
		this.context_boxes.stroke();
	};
	this.draw_all = function(annotations, position) {
		this.draw_image();
		if (position) {
			this.draw_lines(position);
		}
		this.draw_boxes(annotations);
	};
	this.scale = function(factor) {
		this.canvas_image.width *= factor;
		this.canvas_image.height *= factor;
		this.canvas_boxes.width *= factor;
		this.canvas_boxes.height *= factor;
	};
}

function point_in_box(x, y, box) {
	if (x > box.x + box.width || x < box.x ||
		y > box.y + box.height || y < box.y) {
		return false;
	} else { 
		return true;
	}
}

function find_annotation_index(annotations, position) {
	for (var i = annotations.length - 1; i >= 0; i--) {
		if (point_in_box(
			position.x, position.y, annotations[i])) {
			return i;
		}
	}
	return -1;
}

function shift_annotations(annotations, x, y) {
	for (var i = 0; i < annotations.length; i++) {
		annotations[i].x += x;
		annotations[i].y += y;
	}
}

document.addEventListener(
	"DOMContentLoaded",
	function() {
		var input = document.getElementById('file-image');
		var file_annotations = document.getElementById('file-annotations');

		var canvas_image = document.getElementById('canvas-image');
		var canvas_boxes = document.getElementById('canvas-boxes');

		var save = document.getElementById('save');
		var download = document.getElementById('download');

		var image = {
			name: 'image.jpg',
			width: window.innerWidth,
			height: window.innerHeight
		};

		var drawer = new Drawer(canvas_image, canvas_boxes, image);
		var annotations = [];

		function load_image(event) {
			image = new Image();
			image.onload = function() {
				drawer.set_image(image);
				var position = mouse_position(event);
				drawer.draw_all(annotations, position);
			};
			var file = this.files[0];
			image.name = file.name;
			image.src = window.URL.createObjectURL(file);
		}

		function load_annotations(event) {
			var reader = new FileReader();
			reader.onload = function(event) {
				annotations = JSON.parse(reader.result);
			};
			var file = this.files[0];
			reader.readAsText(file, 'utf-8');
		}

		input.addEventListener('change', load_image);
		file_annotations.addEventListener('change', load_annotations);

		var mouse = new Mouse();

		function mouse_position(event) {
			var rect = canvas_boxes.getBoundingClientRect();
			var canvas_x = event.clientX - rect.left;
			var canvas_y = event.clientY - rect.top;
			return {
				x: Math.round(canvas_x * image.width / rect.width),
				y: Math.round(canvas_y * image.height / rect.height)
			};
		}

		canvas_boxes.addEventListener(
			'mousedown',
			function(event) {
				if (!mouse.active) {
					if (event.which == 2 || event.button == 4) {
						var position = mouse_position(event);
						var index = find_annotation_index(
							annotations, position);
						if (index >= 0) {
							annotations.splice(index, 1);
							drawer.draw_lines(position);
							drawer.draw_boxes(annotations);
						}
					}
				}
			});

		canvas_boxes.addEventListener(
			'mousemove',
			function(event) {
				var position = mouse_position(event);
				drawer.draw_boxes(annotations);
				drawer.draw_lines(position);
				if (mouse.active) {
					mouse.end(position);
					var box = mouse.box();
					drawer.draw_box(box);
				}
				
			});

		canvas_boxes.addEventListener(
			'click',
			function(event) {
				var position = mouse_position(event);
				if (!mouse.active) {
					mouse.begin(position);
					mouse.active = true;
				} else {
					mouse.end(position);
					mouse.active = false;
					annotations.push(mouse.box());
					drawer.draw_lines(position);
					drawer.draw_boxes(annotations);
				}
			});

		save.addEventListener(
			'click',
			function(event) {
				var data = 'data:text/json;charset=utf-8,' +
					encodeURIComponent(JSON.stringify(annotations));
				download.setAttribute('href', data);
				download.setAttribute(
					'download',
					image.name.split('.').slice(0, -1).join('.') + '.json');
				download.click();
			});

		window.addEventListener(
			'keydown',
			function(event) {
				switch (event.key) {
					case 'j':
						drawer.scale(1.1);
						drawer.draw_all(annotations);
						break;
					case 'k':
						drawer.scale(0.9);
						drawer.draw_all(annotations);
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
						drawer.draw_all(annotations);
						break;
					case 'K':
						shift_annotations(annotations, 0, 1);
						drawer.draw_all(annotations);
						break;
					case 'H':
						shift_annotations(annotations, -1, 0);
						drawer.draw_all(annotations);
						break;
					case 'L':
						shift_annotations(annotations, 1, 0);
						drawer.draw_all(annotations);
						break;
				}
			});
	});

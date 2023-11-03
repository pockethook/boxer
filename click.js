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


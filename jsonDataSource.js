const _ = require("lodash");
const fs = require("fs");
const path = require("path");

let log;
let jsonFolder;

const getNewPosts = () => {
	const nodes = [];
	const files = fs.readdirSync(jsonFolder);
	_.each(files, file => {
		if (_.endsWith(file.toString(), ".json")) {
			const data = fs.readFileSync(path.join(jsonFolder, file), 'utf8');
			nodes.push(JSON.parse(data));
		}
	});
	return nodes;
};

const getDeletedPosts = (queryOptions, lastFetched) => {
	return null;
};

module.exports = function ({ path: jsonPath }, logger) {
	log = logger;
	jsonFolder = jsonPath;
	return {
		getNewPosts,
		getDeletedPosts
	};
};
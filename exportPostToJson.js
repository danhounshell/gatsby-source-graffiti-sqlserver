const fs = require("fs");
const path = require("path");

module.exports = (post, options) => {
	const postDate = new Date(post.publishedOn);
	const fileTitle = postDate.getFullYear() + "-" + ("0" + (postDate.getMonth() + 1)).slice(-2) + "-" + ("0" + postDate.getDate()).slice(-2) + "-" + _.kebabCase(post.slug) + ".json";
	const filePath = path.join(options.path, `/${fileTitle}`);
	const fileAlreadyExists = fs.existsSync(filePath);
	if (options.overwriteExisting || !fileAlreadyExists) {
		fs.writeFileSync(filePath, JSON.stringify(post, null, 4), "utf8");
	}
};
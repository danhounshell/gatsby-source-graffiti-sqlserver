const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const TurndownService = require("turndown");

const turndownService = new TurndownService();

const toList = ( arr ) => {
	let str = "";
	if ( arr && arr.length > 0 ) {
		_.each( arr, ( item ) => {
			if ( item && _.trim( item ).length > 0 ) {
				str += `\n    - "${ item }"`;
			}
		} )
	}
	return str;
};

module.exports = ( node, options ) => {
	const nodeDate = new Date( node.frontmatter.date );
	const fileTitle = nodeDate.getFullYear() + "-" + ( "0" + ( nodeDate.getMonth() + 1 ) ).slice( -2 ) + "-" + ( "0" + nodeDate.getDate() ).slice( -2 ) + "-" + _.kebabCase( node.slug ) + ".md";
	const filePath = path.join( options.path, `/${ fileTitle }` );
	const fileAlreadyExists = fs.existsSync( filePath );
	if ( options.overwriteExisting || !fileAlreadyExists ) {
		let nodePath = node.slug;
		if ( node.frontmatter.category.toLowerCase() !== "uncategorized" ) {
			nodePath = _.kebabCase( node.frontmatter.category ) + "/" + nodePath;
		}
		let markdown = `
---
path: "/${ nodePath }/"
date: "${ node.frontmatter.date }"
title: "${ node.frontmatter.title }"
slug: "${ node.slug }"
author: "${ node.frontmatter.author.name }"
description: "${ node.frontmatter.description }"
tags: ${ toList( node.frontmatter.tags ) }
layout: "${ node.frontmatter.layout }"
category: "${ node.frontmatter.category }"
images: ${ toList( node.frontmatter.images ) }
cover: "${ node.frontmatter.cover }"
draft: false
---

${ turndownService.turndown( node.html ) }
`;
		fs.writeFileSync( filePath, markdown, "utf8" );
	}
};
